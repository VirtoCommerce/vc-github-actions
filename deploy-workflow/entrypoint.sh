#!/bin/bash

set -x

# Headers for curl requests
HEADER_AUTH_TOKEN="Authorization: token ${GITHUB_TOKEN}"
HEADER_SHA="Accept: application/vnd.github.v3.sha"

# Set default user
if [ -z "$USER" ]; then
    USER="VirtoCommerce"
fi

# Save current folder
CURRENT_REPO_FOLDER=${PWD##*/}

echo $CURRENT_REPO_FOLDER

# Github Credentials
git config --global user.email "ci@virtocommerce.com"
git config --global user.name "vc-ci"
if [ -z "$XDG_CONFIG_HOME" ] 
then
    export XDG_CONFIG_HOME="$HOME/.config"
fi
echo "$XDG_CONFIG_HOME"
mkdir $XDG_CONFIG_HOME/git -p
echo "https://$USER:$GITHUB_TOKEN@github.com" > $XDG_CONFIG_HOME/git/credentials

git config --global credential.helper store
git config --global --replace-all url.https://github.com/.insteadOf ssh://git@github.com/
git config --global --add url.https://github.com/.insteadOf git@github.com:

# Clone the repo to be updated
git clone https://${GITHUB_TOKEN}@github.com/${USER}/${REPOSITORY} ../${REPOSITORY}

cd ../${REPOSITORY}

if [ -z "$TARGET_BRANCH" ]
then
    export TARGET_BRANCH="dev"
fi

git checkout ${TARGET_BRANCH}

# Copy updated Github Action workflow files to the repo
#rm -rf .github/
cp -rf /workflows/${GHA_DEPLOYMENT_FOLDER}/.github .
ls .github/workflows -al
git add .github/*

if [ -z "$COMMIT_MESSAGE" ]; then
    COMMIT_MESSAGE="Updating Github Action workflows."
fi

git commit -m "${COMMIT_MESSAGE}"

git push origin ${TARGET_BRANCH}

set +x 