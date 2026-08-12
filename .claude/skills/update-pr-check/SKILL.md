---
name: update-pr-check
description: >
  Review a dependency-update PR (Dependabot / Renovate — GitHub Actions bumps,
  npm/dotnet/etc. package bumps) and give a grounded "safe to merge" verdict.
  Verifies SHA pins against upstream tags and assesses breaking changes against
  how each dependency is ACTUALLY used, not just the changelog.
  Use when the user says "check this PR for safe to merge", "is this update PR
  safe", "review this dependabot PR", or invokes /update-pr-check with a PR URL/number.
---

Review a dependency-update PR and deliver a **safe-to-merge verdict backed by verification, not just the PR description**. The `$ARGUMENTS` is a PR URL or number (optionally `owner/repo#N`). If no PR is given, ask for one.

Use `gh` for GitHub PRs. Parse `owner/repo` and PR number from the URL; pass `--repo owner/repo` on every call. Default repo is the current one if only a number is given.

## Process — do all four steps, in order

### 1. Gather facts
Run these together:
- `gh pr view <N> --repo <R> --json title,author,state,mergeable,mergeStateStatus,reviewDecision,isDraft,baseRefName,headRefName,additions,deletions,changedFiles,url,body`
- `gh pr checks <N> --repo <R>` (exits non-zero if any check isn't passing — that's expected, read the output)
- `gh pr diff <N> --repo <R>`

Confirm it really is a mechanical dependency bump (only version strings / lockfile changed). If the diff touches logic, say so — this skill's shortcuts don't apply and it needs a normal review.

### 2. Verify the pins are authentic (don't trust the comment)
For **GitHub Actions pinned by SHA** (`uses: owner/action@<sha> # vX.Y.Z`), verify each new SHA actually is that tag upstream:
- `gh api repos/<owner>/<action>/git/ref/tags/<vX.Y.Z> --jq '.object.sha,.object.type'`
- The returned SHA must equal the pinned SHA in the diff. A mismatch is a **red flag** (possible tampering / wrong pin) — call it out loudly.
- If it resolves to an annotated tag (`type: tag`), dereference with `gh api repos/<owner>/<action>/git/tags/<sha> --jq '.object.sha'` to get the commit.

For package bumps (npm/nuget/etc.), confirm the version exists on the registry if anything looks off; lockfile hash integrity is generally enough.

### 3. Assess breaking changes AGAINST ACTUAL USAGE — the step people skip
Read the changelog/release notes (in the PR body, or fetch the upstream release) **and** read how the dependency is used in this repo. Then reason about whether any behavior change actually reaches this usage.

- Find every call site: `gh api repos/<R>/contents/<path> --jq .content | base64 -d`, or grep the checked-out repo for the action/package name and its `with:` / config block.
- For each notable changelog entry, decide: does it change a **default** that this repo relies on, or is it opt-in / scoped to a feature this repo doesn't use?
- State the conclusion per change, e.g. "v5.5.0 changes Maven `interactiveMode` default — N/A here, this workflow uses the JDK only for the Sonar scanner, not Maven."
- Major-version bumps: be extra careful; enumerate documented breaking changes and check each.

Don't hand-wave "minor bump, probably fine." Tie each judgment to a real call site.

### 4. Verdict
Lead with a clear ✅ / ⚠️ / ❌ **safe to merge** line. Then:
- **What changed** — compact table: dependency, from → to, files.
- **Verification** — pin-SHA checks (✓/✗), check statuses, merge state.
- **Breaking changes** — per-change assessment tied to usage, or "none apply."
- **Caveats** — anything not green and why (see below), plus the honest scope limit: you read changelogs + call sites, not full source diffs. Offer to go deeper if it's high-risk.

## Reading merge signals
- `mergeable: MERGEABLE` + `mergeStateStatus`: `CLEAN` = all good; `UNSTABLE` = mergeable but a non-required/pending check is off; `BLOCKED` = a required check/review is missing; `DIRTY` = conflicts.
- **Dependabot + pending CLA** is normal — bot accounts don't sign CLAs. Flag it as expected, not a blocker, but note it needs an allowlist or admin merge if the CLA is a required check.
- Report the verdict; don't merge or approve unless the user explicitly asks.

## Scale
Single small bump → quick pass through the four steps. A grouped PR with many bumps → verify each pin and assess each dependency; don't stop at the first.

## Voice — talk like a caveman
Write the final verdict (and any chat along the way) in **caveman style**: terse, smart-caveman. Drop articles (a/an/the), filler (just/really/basically), and pleasantries. Fragments OK. Pattern: `[thing] [action] [reason]. [next step].`

Keep ALL technical substance exact — only fluff dies. Verbatim, never caveman-ify: version numbers, SHAs, tag names, file paths, action/package names, CLI commands, check names, and the ✅/⚠️/❌ verdict line. Tables and code blocks stay normal. Don't announce the style or add a "normal" recap.

Example: "PR safe. 4 pins checked, all match upstream. setup-java v5.5.0 Maven changes no touch this repo — JDK only feed Sonar scanner. One block: review required, no code reason. Approve, merge."
