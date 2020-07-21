#!/bin/bash
set -eou pipefail

baseBranch=$1

commitCount=''

baseBranchPath=$(git branch -r | grep "$baseBranch" | xargs)

commitCount=$(git rev-list --count "$baseBranchPath")

echo '{"commitCount": "'"$commitCount"'"}'
