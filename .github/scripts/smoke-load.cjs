#!/usr/bin/env node
'use strict';

// Smoke-load a built action bundle and decide whether the BUNDLE is broken or
// the action is merely refusing to run outside a real GitHub Actions runtime.
//
// Why this isn't a try/catch around require():
//   Every action in this repo ends with `run().catch(err => core.setFailed(...))`.
//   The whole body therefore executes inside a promise, require() returns before
//   it settles, and any TypeError thrown in run() is caught by the action's own
//   .catch and converted into a `::error::` line. It never propagates to the
//   caller and never becomes an unhandledRejection. A caught-exception check
//   sees a clean load no matter how badly a dependency bump broke things.
//
//   So we let the bundle run, tee its output, wait for it to go quiet, and
//   classify what it PRINTED.
//
// Exit codes: 0 = bundle is fine, 2 = bundle is broken.

const fs = require('fs');
const os = require('os');
const path = require('path');

const bundle = path.resolve(process.argv[2] || 'dist/index.js');
const DRAIN_MS = Number(process.env.SMOKE_DRAIN_MS || 5000);
const QUIET_MS = Number(process.env.SMOKE_QUIET_MS || 500);

// Optional per-action fixture: KEY=VALUE lines, blanks and #comments ignored.
// Two jobs -- supply INPUT_* values an action needs to get past its own
// preconditions, and let an action that cannot be satisfied offline opt out of
// strict mode with SMOKE_STRICT=0 (state the reason in a comment there).
// Applied before the defaults below and never over an already-set variable, so
// precedence runs: real environment > smoke.env > seeded defaults.
function loadFixture() {
  const file = path.join(path.dirname(bundle), '..', 'smoke.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}

// Minimal runner environment. Without it, actions that read GITHUB_REF or the
// event payload dereference undefined and throw "Cannot read properties of
// undefined", which is indistinguishable from real API drift by message alone.
// Measured: 7 of 24 bundles in this repo fail that way with a bare env, and
// all of them load cleanly once these are set. Existing values always win, so
// a caller (or a real runner) can override any of it.
function seedEnvironment() {
  const eventPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-')), 'event.json');
  fs.writeFileSync(
    eventPath,
    JSON.stringify({
      ref: 'refs/heads/master',
      // Present but empty: actions that walk push commits or read a PR number
      // iterate these directly, and an absent key is a property read on
      // undefined -- the very thing strict mode is meant to flag.
      commits: [],
      number: 1,
      repository: {
        name: 'smoke-test',
        full_name: 'VirtoCommerce/smoke-test',
        owner: { login: 'VirtoCommerce', name: 'VirtoCommerce' },
      },
    })
  );

  const defaults = {
    CI: 'true',
    GITHUB_ACTOR: 'smoke-test',
    GITHUB_EVENT_NAME: 'push',
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_REF: 'refs/heads/master',
    GITHUB_REPOSITORY: 'VirtoCommerce/smoke-test',
    GITHUB_RUN_NUMBER: '1',
    GITHUB_SHA: '0000000000000000000000000000000000000000',
    GITHUB_WORKSPACE: process.cwd(),
    RUNNER_TEMP: os.tmpdir(),
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

// A bundle that calls into a dependency which no longer exposes what it
// expects is the signature of API drift from a version bump -- exactly what a
// lockfile refresh can introduce.
//
// These are safe to treat as fatal unconditionally: a missing input yields a
// property read on undefined, essentially never a bad call target.
const DRIFT = [
  /is not a function/,
  /is not a constructor/,
  /is not iterable/,
  /Cannot destructure/,
];

// Real drift too, but also what an action does when an input it needs is
// absent -- so these are suppressed by SMOKE_STRICT=0, for actions whose
// preconditions cannot be met offline. V8's wording varies by Node version
// (>=16 says "Cannot read properties of undefined", older says "Cannot read
// property 'x' of undefined"), hence both spellings.
const DRIFT_STRICT = [
  /Cannot read propert(?:y|ies) of (?:undefined|null)/,
  /Cannot read property '[^']*' of (?:undefined|null)/,
  /(?:undefined|null) is not an object/,
];

// Anything else the action prints -- missing token, absent event payload,
// unset input -- means the bundle loaded and reached its own preconditions.
// That is a pass: we have no runner, no secrets and no event to give it.

loadFixture();
seedEnvironment();

// Strict is the default: with the seeded environment above, 23 of the 24
// bundles in this repo clear their own preconditions and load cleanly under
// it. An action that genuinely cannot (needs the network, needs real secrets)
// opts out in its smoke.env rather than weakening the check for everyone.
const STRICT = process.env.SMOKE_STRICT !== '0';

let captured = '';
for (const name of ['stdout', 'stderr']) {
  const stream = process[name];
  const original = stream.write.bind(stream);
  stream.write = (chunk, enc, cb) => {
    captured += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    return original(chunk, enc, cb);
  };
}

const asyncErrors = [];
process.on('unhandledRejection', (e) => asyncErrors.push(e));
process.on('uncaughtException', (e) => asyncErrors.push(e));

let settled = false;

function fail(reason, detail) {
  settled = true;
  console.error(`::error::Bundle load failure: ${reason}`);
  if (detail) console.error(detail);
  process.exit(2);
}

function classify() {
  if (settled) return;
  settled = true;

  const haystack = [captured, ...asyncErrors.map((e) => (e && e.stack) || String(e))].join('\n');
  const patterns = STRICT ? [...DRIFT, ...DRIFT_STRICT] : DRIFT;
  const hit = patterns.find((re) => re.test(haystack));

  if (hit) {
    console.error(`::error::Bundle load failure: dependency API drift (matched ${hit}).`);
    console.error('A dependency no longer exposes what the bundle calls. Captured output:');
    console.error(haystack);
    process.exitCode = 2;
    return;
  }

  // Deliberately clear whatever exit code the bundle set for itself: a
  // core.setFailed over a missing input is expected here, not a failure.
  process.exitCode = 0;
}

// Covers a bundle that calls process.exit() during load, which would otherwise
// skip the classification below.
process.on('exit', classify);

try {
  require(bundle);
} catch (e) {
  const broken =
    e instanceof SyntaxError ||
    e instanceof ReferenceError ||
    (e && e.code === 'MODULE_NOT_FOUND') ||
    /Cannot find module/i.test((e && e.message) || '');
  if (broken) fail('bundle is structurally broken.', (e && e.stack) || String(e));
  // Otherwise it threw synchronously on a runtime precondition; fold it into
  // the same classification path as the async output.
  asyncErrors.push(e);
}

(async () => {
  // Wait for run() to settle: poll until the bundle stops producing output for
  // QUIET_MS, capped at DRAIN_MS so a bundle that opens a socket can't hang CI.
  const deadline = Date.now() + DRAIN_MS;
  let lastLength = -1;
  let quietSince = Date.now();

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50));
    if (captured.length !== lastLength) {
      lastLength = captured.length;
      quietSince = Date.now();
    } else if (Date.now() - quietSince > QUIET_MS) {
      break;
    }
  }

  classify();
  // Explicit exit: the bundle may be holding the event loop open.
  process.exit(process.exitCode || 0);
})();
