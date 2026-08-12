---
name: bulk-dependabot-review
description: >
  Triage every open Dependabot/Renovate PR in a repo at once: classify each as
  safe patch/minor, confirmed-blocked major, or needs-manual-review, using real
  spot-verification (install + build/typecheck a sample, or diff release notes
  against actual usage) rather than trusting semver alone. Reports the
  categorized batch and waits for approval before squash-merging the safe set.
  Invoked explicitly via /bulk-dependabot-review [owner/repo] — not intended to
  auto-trigger on casual phrasing about PRs.
---

Bulk-triage every open dependency-bump PR in a repo, verify the ones that need it, then merge the confirmed-safe batch on approval. `$ARGUMENTS` is an optional `owner/repo` — default to the current repo if omitted.

Use `gh` for everything; pass `--repo <owner/repo>` on every call.

## Invocation — run as a spawned Agent, not inline

**Whoever is dispatching this skill (the assistant handling `/bulk-dependabot-review`): don't load this file into the main conversation loop via the Skill tool.** Instead spawn it with the `Agent` tool (`subagent_type: general-purpose`), with a prompt telling the agent to read this file and carry out the process below for the given repo. Run it synchronously (`run_in_background: false`) if the user is waiting on the categorized report; run it in the background if they're not.

Why: this is the only way to get an honest, isolated token count for the run. Loaded inline, this skill's work is indistinguishable from the rest of the conversation's token spend — there's no tool exposed to the main loop that reports "tokens used by just this skill." Run as a spawned Agent, the completion carries an exact `<usage><subagent_tokens>N</subagent_tokens></usage>` figure scoped to only this run — report that number back to the user (see step 7). This is a deliberate exception to any general "invoke skills via the Skill tool" guidance — it's specific to this skill's token-reporting requirement.

## 0. Set up

- Resolve the default branch: `gh repo view <R> --json defaultBranchRef -q .defaultBranchRef.name`.
- Check branch protection once, cache the result for this whole run: `gh api repos/<R>/branches/<default>/protection` (404 = unprotected).
- List every open PR: `gh pr list --repo <R> --state open --limit 300 --json number,title,author,headRefName,mergeable,mergeStateStatus,statusCheckRollup,body,files`.

## 1. Partition by author

Dependency-bot logins (`app/dependabot`, `app/renovate`, etc.) go into the classification pipeline below. Every other PR (human authors, unrelated bots — e.g. an automated "CVE-XXXX patch" PR with no maintainer behind it) is **listed separately by number/title/author and never classified, spot-checked, or touched**. Don't guess at intent for these; they're out of scope for this skill.

**Record which bot authored each PR** (`dependabot[bot]` vs `renovate[bot]`) — needed later for step 4 and step 6, since the two bots don't share a rebase/recovery mechanism.

## 2. Parse each dependency-bot PR

Don't assume npm. Use `files` from the PR (or `gh pr diff <n> --repo <R> --stat`) to detect the ecosystem: `package.json`/`package-lock.json` → npm, a workflow `uses:` line → github-actions, `*.csproj`/`packages.config` → nuget, `requirements*.txt`/`poetry.lock` → pip, `Dockerfile` `FROM` → docker, etc. The classification and verification steps below are ecosystem-generic in intent; the concrete "how do I build/typecheck this" step is npm-flavored here because that's what this skill has been run against so far — adapt the actual verification command to whatever the ecosystem's real build/check step is.

Extract `package`, `from`, `to`, `path` per PR:
- Standard title: `Bump X from A to B in /path` (root-level PRs may omit the `in /path` clause).
- Grouped/ancestor-linked title: `Bump X and Y in /path` — the title omits real versions; read the PR body's `Updates \`X\` from A to B` line(s) instead. There may be more than one such line (multiple packages bumped together) — capture all of them.
- GitHub Actions bump: `Bump owner/action in /path from A to B` — same idea, different ecosystem, no `@` scoping.
- If a title still can't be parsed confidently after checking the body, don't force it — drop that PR into **needs manual review** with "unparseable" as the reason.

## 3. Classify

For each parsed bump, compare major versions when both sides are valid semver:

- **Same major (patch/minor)** → safe candidate, no spot-check needed. A same-major bump has no documented-breaking-change surface by definition of semver; don't second-guess it further.
- **Major version jump, or non-semver / can't tell** → needs verification. Group all PRs bumping the *same package to the same target version* — verify the group once, apply the verdict to every PR in it (that's what made 25 `@actions/core` PRs a five-minute check instead of 25).

### Verifying a major-jump group

Never trust a cached "this package/major is known-bad" list from memory or a prior run — re-derive it fresh, because the repo's own code (a tsconfig, a build step) can change out from under a stale verdict just as easily as upstream can fix the thing that broke it last time.

1. Pick a small sample — **up to 3 directories** from the group, preferring ones that look structurally different (different `tsconfig.json` target, different build script, different existing dependency set) over 3 near-identical copies. If the group only has 1–2 PRs, sample all of them.
2. In each sampled directory: install the target version — `npm install <pkg>@<version> --no-audit --no-fund` (no `--save`/`--save-dev` flag needed or wanted: the package is already declared in `package.json`, in whichever of `dependencies`/`devDependencies` it's currently in, and plain `npm install <pkg>@<version>` updates that existing entry in place without moving it between the two) — then run the real check:
   - If the package is a type-only/dev dependency (`@types/*`, or anything only referenced in `devDependencies` with no runtime import), `npx tsc --noEmit` is sufficient.
   - Otherwise run the action's actual build (`npm run build`, typically `ncc build ...`) since a runtime dependency bump can break bundling in ways a type-check alone won't catch.
   - Capture the real output (error text, or clean exit) — the verdict must cite it, not just say "checked."
   - **Don't shortcut this with `grep` for a direct import of the package in `src/`.** A directory can show zero direct imports and still break, because a shared internal wrapper lib (e.g. an org-internal `@scope/actions-lib` that several actions depend on) pulls the real dependency in transitively — `ncc`'s bundler traces the whole require graph, not just the entry file's own imports. "Not directly imported" is not evidence of safety; only the actual build/install result is. (Caught exactly this: a package looked unused by grep in 7 of 12 directories in one run, but the real build failed in all of them once actually tried — the grep signal would have wrongly cleared 7 PRs as safe.)
3. **Always revert** afterward regardless of outcome — `npm run build` rewrites `dist/` too, not just the manifest, so restore that as well: `git checkout -- package.json package-lock.json dist/ && npm install`. Confirm with `git status --short` that nothing is left dirty before moving to the next sample or to the merge step.
4. For github-actions-ecosystem major bumps, there's no local build to run — instead fetch the upstream release notes between the two versions (PR body, or `gh api repos/<owner>/<action>/releases`), scan for removed/renamed inputs, outputs, or changed defaults, then grep this repo's workflows for actual usage of anything flagged. State the conclusion against the real call site, the same way `update-pr-check` does for single-PR reviews — "removed X input, grepped this repo, unused → safe" is a verdict; "migrated to ESM, probably fine" is not.

Verdict per group is **safe** (cite the passing command/output) or **blocked** (cite the actual error or the actual affected call site) — never a guess.

## 4. This repo's specific gate: `dist/` staleness (read before trusting any local build)

`vc-github-actions` ships compiled Node actions — each `action.yml` runs `dist/index.js`, the bundled output, not `src/`. A dependency bump only changes what actually runs once `dist/` is rebuilt to match. Two workflows enforce this:

- **`.github/workflows/check-dist.yml`** (`detect` / `build-and-diff` checks) — rebuilds `dist/` from the PR's `src/` + lockfile and fails if it doesn't byte-match what's committed.
- **`.github/workflows/dependabot-rebuild.yml`** (`rebuild` check) — on `dependabot[bot]`-authored PRs, automatically rebuilds `dist/` and pushes it back to the PR branch so `check-dist` has something current to diff against. Without this, *every* Dependabot npm PR would fail `check-dist` by construction.

**Consequence for this skill's step 3 verification**: a clean local `npm install <version> && npm run build` proves the dependency bump itself is safe (no ESM/type/bundling break) — it does **not** prove the PR's committed `dist/` matches. That's a *separate* concern gated by these two checks. Do not treat "I built it locally and it worked" as equivalent to "this PR's checks are green." Always pull the PR's own live `statusCheckRollup` before merging (step 6 already requires this — this section is why it's non-negotiable here specifically, not just generic caution).

If `rebuild` and/or `build-and-diff` are red on a PR whose dependency bump you've otherwise verified safe:
- It usually means `dependabot-rebuild.yml` failed to push a fresh `dist/` for that PR (stale branch, or the automation itself broke — e.g. a missing/expired `REPO_TOKEN` secret, since that job needs a non-default token to push a commit that re-triggers `check-dist`).
- Don't merge on the strength of your local build alone. Move the PR to Blocked with the real reason ("checks red: rebuild/build-and-diff failing — dist/ stale, not a dependency-safety issue"), and separately flag that `dependabot-rebuild.yml` may need investigating if this is happening broadly across PRs rather than on one stale outlier.
- For a `dependabot[bot]` PR, commenting `@dependabot rebase` (same mechanism as the same-directory-conflict handling in step 6) re-triggers both the rebuild and the checks — worth trying before writing a PR off as unfixable. **`dependabot-rebuild.yml` itself is Dependabot-only** (gated on `github.event.pull_request.user.login == 'dependabot[bot]'`), so this whole recovery path doesn't exist for a Renovate PR showing the same red checks — see step 6 for how to recover those instead.

(Discovered 2026-08-12 on PR #346 in `VirtoCommerce/vc-github-actions`: a dependency bump verified safe by a clean local build was almost merged despite live `rebuild`/`build-and-diff` failures, because the merge step skipped re-checking `statusCheckRollup` immediately before merging. The rule was already in step 6 — this section exists so the reasoning behind it isn't skipped over as generic boilerplate.)

## 5. Report and stop

Present the categorized batch and **stop — do not merge anything yet**:

- ✅ **Safe to merge now** — table: PR#, package, from→to, reason (same-major, or which group verification it inherited).
- 🚫 **Blocked** — PR#, package, from→to, concrete reason (the real error/affected usage, or a red `rebuild`/`build-and-diff` check per section 4 — not "major bump, risky").
- 🟡 **Needs manual review** — unparseable titles, logic-touching diffs, anything the classification couldn't resolve cleanly.
- ℹ️ **Other open PRs** (non-bot) — number/title/author only, explicitly untouched.
- Call out **any newly-discovered blocker pattern** this run found (e.g. a shared tsconfig target that a new compiler major breaks) plainly, and suggest the user `/remember` it if it seems durable — don't write memory yourself.

Ask explicitly whether to proceed with merging the safe batch. Wait for a real answer.

## 6. Merge the approved safe batch

For each PR in the approved safe set:

- Check its `statusCheckRollup` **immediately before merging that specific PR, not once at the start of the run** — state can change between classification and merge, and (per section 4) a locally-clean build does not substitute for this. Every check must be terminal (not pending/in-progress/null) and green (`SUCCESS`/`NEUTRAL`/`SKIPPED`). If something's still running, wait for it (bounded — a few minutes) rather than merging on stale state; if it finishes red, pull that PR out into Blocked in the final summary instead of merging it.
- If branch protection requires reviews/checks (from step 0), use `gh pr merge <n> --repo <R> --squash --auto --delete-branch --body "<note>"` — this queues the merge instead of forcing it. Say in the final summary which PRs were queued vs. merged immediately. Never use `--admin` to bypass required reviews/checks — that defeats the point of verifying first.
- Otherwise, merge directly: `gh pr merge <n> --repo <R> --squash --delete-branch --body "<note>"`.
- Commit body template — keep it concrete, not generic:
  `Verified safe: <one-line reason>. <evidence — e.g. "tsc --noEmit clean in <dir>" or "same-major patch/minor bump">. CI: <status>.`
- **Conflicts from same-directory merges**: merging one PR can make another still-open PR in the same directory go `CONFLICTING` (shared lockfile). When that happens, the recovery command depends on which bot opened it (from the note you took in step 1) — `@dependabot rebase` is Dependabot-specific and is silently ignored on a Renovate PR, so using the wrong one leaves it stuck with no error to notice:
  - `dependabot[bot]`: comment `@dependabot rebase`.
  - `renovate[bot]`: Renovate doesn't act on PR comments by default — it watches a checkbox in its own PR body (something like "If you want to rebase/retry this PR, check this box"). Toggle that checkbox on via `gh pr edit <n> --repo <R> --body "<body with the box checked>"` (read the current body first, flip `- [ ]` to `- [x]` on that specific line, don't touch anything else). Only fall back to commenting `@renovatebot rebase` if you've separately confirmed this org's Renovate config has comment-commands enabled — don't assume it does.
  - Either way: poll `mergeable` until `MERGEABLE` (bounded wait, e.g. up to ~10 minutes), then merge with the same note plus `(rebased after #<n> touched the same lockfile)`. If it never clears in time, leave the rebase request in place and report it as deferred rather than blocking on it indefinitely.

## 7. Final summary

Report: merged count (split immediate vs. queued-via-auto), blocked count with reasons, needs-review count, deferred/conflict count (with the rebase already requested), and other-PRs-untouched count. Repeat any newly-discovered blocker pattern once more so it doesn't get lost at the end of a long run.

## 8. Report token usage

This only applies to whoever spawned this run as an Agent (see "Invocation" above), not to the agent executing the steps itself — the agent has no visibility into its own running total.

After the spawned Agent completes (foreground return, or the background completion notification), read the `<usage><subagent_tokens>N</subagent_tokens></usage>` figure the harness attaches to that completion and relay it verbatim to the user, e.g. "This bulk-review run used ~N tokens." If this skill was, despite the note above, loaded inline into the main conversation instead of spawned as an Agent, there is no isolated figure to report — say so plainly and point at `/cost` for the session-wide total instead of fabricating a number.
