#!/usr/bin/env node
'use strict';

// Smoke-load a built action bundle: is the BUNDLE broken, or is the action just
// refusing to run outside a real runner? Exit 0 = fine, 2 = broken.
//
// Not a try/catch around require(): every action here ends with
// `run().catch(core.setFailed)`, so the body runs inside a promise, require()
// returns before it settles, and a TypeError is swallowed by the action's own
// .catch -- never rethrown, never an unhandledRejection. So we let it run, tee
// its output, wait for quiet, and classify what it PRINTED.
//
// Not hermetic: the bundle runs far enough to hit real network calls and
// subprocesses (git, docker) before failing its preconditions.

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const bundle = path.resolve(process.argv[2] || 'dist/index.js');
const DRAIN_MS = Number(process.env.SMOKE_DRAIN_MS || 5000);
const QUIET_MS = Number(process.env.SMOKE_QUIET_MS || 500);

// Optional per-action fixture (KEY=VALUE): supplies INPUT_* values, or opts out
// of strict mode with SMOKE_STRICT=0. Precedence: real env > smoke.env > seeded.
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

// Minimal runner env. Without it, actions reading GITHUB_REF or the event
// payload throw "Cannot read properties of undefined", indistinguishable from
// real drift by message alone (7 of 24 bundles did). Existing values win.
function seedEnvironment() {
  const eventPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-')), 'event.json');
  fs.writeFileSync(
    eventPath,
    JSON.stringify({
      ref: 'refs/heads/master',
      // Present but empty: actions iterate these directly, and an absent key
      // is the property-read-on-undefined that strict mode flags.
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

// Calling into a dependency that no longer exposes what it expects is the
// signature of a version bump. Fatal unconditionally: a missing input yields a
// property read on undefined, essentially never a bad call target.
const DRIFT = [
  /is not a function/,
  /is not a constructor/,
  /is not iterable/,
  /Cannot destructure/,
];

// Real drift too, but also what a missing input looks like -- hence the
// SMOKE_STRICT=0 opt-out. Both spellings: V8's wording changed in Node 16.
const DRIFT_STRICT = [
  /Cannot read propert(?:y|ies) of (?:undefined|null)/,
  /Cannot read property '[^']*' of (?:undefined|null)/,
  /(?:undefined|null) is not an object/,
];

// The bundle's own ::error:: lines are expected here, but the runner turns each
// into a failure annotation -- a wall of red on a green PR. stop-commands makes
// them plain text; we still capture them for classification.
const stopToken = process.env.GITHUB_ACTIONS ? crypto.randomUUID() : null;
let resumed = false;
// Called before we emit our OWN ::error::, so a real finding still annotates.
function resumeCommands() {
  if (!stopToken || resumed) return;
  resumed = true;
  process.stdout.write(`::${stopToken}::\n`);
}
if (stopToken) {
  process.stdout.write(`::stop-commands::${stopToken}\n`);
  process.on('exit', resumeCommands);
}

loadFixture();
seedEnvironment();

// Strict by default: 23 of 24 bundles clear their preconditions under the
// seeded env. The one that cannot opts out in its smoke.env.
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
  resumeCommands();
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
    resumeCommands();
    console.error(`::error::Bundle load failure: dependency API drift (matched ${hit}).`);
    console.error('A dependency no longer exposes what the bundle calls. Captured output:');
    console.error(haystack);
    process.exitCode = 2;
    return;
  }

  // Clear the bundle's own exit code: setFailed over a missing input is expected.
  process.exitCode = 0;
}

// Covers a bundle that calls process.exit() during load.
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
  // Wait for run() to settle: quiet for QUIET_MS, capped at DRAIN_MS so a
  // bundle holding a socket can't hang CI.
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
