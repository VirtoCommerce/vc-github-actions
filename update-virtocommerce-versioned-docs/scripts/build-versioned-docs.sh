#!/bin/bash

# Build script for versioned documentation using Mike
# This script follows Mike's best practices from official documentation

set -e  # Exit on any error

# Configuration
DOCS_REPO=${DOCS_REPO:-"https://github.com/VirtoCommerce/vc-docs"}
DOCS_BRANCH=${DOCS_BRANCH:-"feature/structure_redesign"}
GH_PAGES_BRANCH="gh-pages"
VERSION=${1:-"auto"}
ALIAS=${2:-""}  # Optional alias like "latest" or "dev"
PUSH_TO_REMOTE=${3:-"false"}  # Whether to push to remote

echo "=========================================="
echo "=== Versioned Documentation Build ==="
echo "=========================================="
echo "Repository: $DOCS_REPO"
echo "Source Branch: $DOCS_BRANCH"
echo "Version: $VERSION"
echo "Alias: $ALIAS"
echo "Push to Remote: $PUSH_TO_REMOTE"
echo "=========================================="

# Setup workspace
WORKSPACE="${GITHUB_WORKSPACE:-/tmp/docs-build-$$}"
echo "Workspace: $WORKSPACE"

# Clone documentation repository if not already present
if [ ! -d "$WORKSPACE/vc-docs" ]; then
    echo "Cloning documentation repository..."
    cd "$WORKSPACE"
    git clone "$DOCS_REPO" --branch "$DOCS_BRANCH" vc-docs
fi

cd "$WORKSPACE/vc-docs"

# Configure git for Mike (following Mike documentation)
# Use environment variables if available, otherwise configure directly
if [ -z "$GIT_COMMITTER_NAME" ]; then
    export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-GitHub Actions}"
    export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-actions@github.com}"
    git config user.name "$GIT_COMMITTER_NAME"
    git config user.email "$GIT_COMMITTER_EMAIL"
fi

# Auto-detect version and alias from version.json if needed
if [ "$VERSION" = "auto" ]; then
    if [ -f "version.json" ]; then
        VERSION=$(python3 -c "import json; data=json.load(open('version.json')); print(data.get('version', 'dev'))" 2>/dev/null)
        echo "Detected version from version.json: $VERSION"
        
        # Auto-detect alias if not provided
        if [ -z "$ALIAS" ] || [ "$ALIAS" = "auto" ]; then
            ALIAS=$(python3 -c "import json; data=json.load(open('version.json')); print(data.get('alias', ''))" 2>/dev/null)
            if [ -n "$ALIAS" ]; then
                echo "Detected alias from version.json: $ALIAS"
            fi
        fi
    elif [ -f "VERSION" ]; then
        VERSION=$(cat VERSION | tr -d '[:space:]')
        # Extract major.minor for Mike's recommended format
        VERSION=$(echo "$VERSION" | sed -E 's/^([0-9]+\.[0-9]+).*/\1/')
        echo "Detected version from VERSION file: $VERSION"
    else
        VERSION="dev"
        echo "Using development version: $VERSION"
    fi
fi

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Ensure Mike is installed
pip install mike

# Fetch gh-pages branch for version history (as per Mike docs for shallow clones)
echo "Fetching gh-pages branch..."
git fetch origin gh-pages --depth=1 || true

# Build and deploy unified documentation with Mike
echo "Building and deploying unified documentation with Mike..."

# Prepare Mike deploy command base
MIKE_BASE_CMD="mike deploy --branch $GH_PAGES_BRANCH"
if [ "$PUSH_TO_REMOTE" = "true" ]; then
    MIKE_BASE_CMD="$MIKE_BASE_CMD --push"
fi

# Deploy unified documentation site (includes all sections: marketplace, platform, storefront)
echo "  - Deploying unified documentation site..."
if [ -n "$ALIAS" ]; then
    $MIKE_BASE_CMD --update-aliases "$VERSION" "$ALIAS"
else
    $MIKE_BASE_CMD "$VERSION"
fi

echo "Unified documentation deployed successfully with Mike!"

# Set default version automatically
if [ -n "$ALIAS" ]; then
    echo "Setting $ALIAS as default version..."
    if [ "$PUSH_TO_REMOTE" = "true" ]; then
        mike set-default --branch $GH_PAGES_BRANCH --push "$ALIAS"
    else
        mike set-default --branch $GH_PAGES_BRANCH "$ALIAS"
    fi
else
    echo "Setting $VERSION as default version..."
    if [ "$PUSH_TO_REMOTE" = "true" ]; then
        mike set-default --branch $GH_PAGES_BRANCH --push "$VERSION"
    else
        mike set-default --branch $GH_PAGES_BRANCH "$VERSION"
    fi
fi

# List deployed versions
echo "Currently deployed versions:"
mike list --branch $GH_PAGES_BRANCH

# Prepare versioned content for Docker build
echo "Preparing versioned content for Docker..."
cd "$WORKSPACE"

# Clone or checkout gh-pages branch for Docker
if [ -d "vc-docs-versioned" ]; then
    rm -rf vc-docs-versioned
fi

# Clone gh-pages branch with versioned documentation
git clone "$DOCS_REPO" --branch "$GH_PAGES_BRANCH" --depth 1 vc-docs-versioned

echo "=========================================="
echo "Documentation build completed successfully!"
echo "Version $VERSION has been deployed"
if [ -n "$ALIAS" ]; then
    echo "Alias: $ALIAS"
fi
echo "Built files are in: $WORKSPACE/vc-docs-versioned"
echo "=========================================="