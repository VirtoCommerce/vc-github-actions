# Deprecated

Retired composite actions and disabled CI workflows, kept for history/reference only.

- **Not maintained** — excluded from Dependabot (`!/deprecated/**` in [.github/dependabot.yml](../.github/dependabot.yml)), so no dependency-update PRs are raised for anything here.
- **Workflows here do not run** — GitHub only executes workflows under `.github/workflows/`. Files in `deprecated/workflows/` are inert.
- **Actions here are not callable** at their original `VirtoCommerce/vc-github-actions/<name>@ref` path anymore. They had no live (non-archived, non-commented) callers when retired.

To revive an item, move it back to its original location and re-add any needed Dependabot coverage.
