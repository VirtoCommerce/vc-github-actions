# Get Associated PR Action

This GitHub Action finds the Pull Request number associated with a specific branch.

## Inputs

### `repo`
**Required** The repository in format `owner/repo` (e.g., `VirtoCommerce/vc-github-actions`)

### `branch`
**Required** The branch name to find the associated PR for

## Outputs

### `prNumber`
The PR number associated with the branch. Empty string if no PR is found.

## Usage

### Basic Example
```yaml
- name: Get Associated PR
  id: get-pr
  uses: ./.github/actions/get-pr-number
  with:
    repo: ${{ github.repository }}
    branch: ${{ github.head_ref }}

- name: Use PR Number
  run: |
    if [ "${{ steps.get-pr.outputs.prNumber }}" != "" ]; then
      echo "PR Number: ${{ steps.get-pr.outputs.prNumber }}"
    else
      echo "No PR found for this branch"
    fi
```

### In a Workflow
```yaml
name: Example Workflow

on:
  push:
    branches: [ main, develop ]

jobs:
  find-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Get Associated PR
        id: get-pr
        uses: ./.github/actions/get-pr-number
        with:
          repo: ${{ github.repository }}
          branch: ${{ github.head_ref }}

      - name: Process PR
        if: steps.get-pr.outputs.prNumber != ''
        run: |
          echo "Processing PR #${{ steps.get-pr.outputs.prNumber }}"
          # Your PR processing logic here
```

## What it does

1. Uses the GitHub CLI (`gh`) to list open PRs for the specified branch
2. Extracts the PR number from the first (and typically only) PR found
3. Sets the `prNumber` output variable
4. If no PR is found, sets an empty string as the output

## Requirements

- GitHub CLI (`gh`) must be available in the runner
- The action must have permissions to read PRs in the repository

## Notes

- This action only looks for **open** PRs
- If multiple PRs exist for the same branch, it returns the first one found
- The action will not fail if no PR is found - it will just return an empty string
