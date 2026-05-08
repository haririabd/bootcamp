#!/bin/bash
set -euo pipefail

# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================
if [ -f .env ]; then
  echo "📂 Loading variables from .env file..."
  # Automatically export all variables defined in .env
  set -a
  source .env
  set +a
else
  echo "⚠️  No .env file found. Proceeding with existing environment variables..."
fi

# ==========================================
# CONFIGURATION
# ==========================================
export GH_USERNAME="allaboutevemirolive"
export GH_ORG="devopsmalaysia"
export GH_REPO="bootcamp"
export VERSION="latest"

# ==========================================
# LOGIN
# ==========================================
if [ -z "${CR_PAT:-}" ]; then
  echo "❌ Error: CR_PAT not set in .env or environment."
  echo "Please add CR_PAT=ghp_your_token_here to your .env file."
  exit 1
fi

echo "🔑 Logging into GHCR..."
echo "$CR_PAT" | docker login ghcr.io -u "$GH_USERNAME" --password-stdin

# Ensure buildx is ready
docker buildx use default 2>/dev/null || docker buildx create --use

# ==========================================
# BUILD (via mprocs)
# ==========================================
if ! command -v mprocs &>/dev/null; then
  echo "❌ mprocs not found. Install: brew install mprocs"
  exit 1
fi

echo "🚀 Building PRODUCTION images (tag: $VERSION)..."
mprocs -c mprocs-deploy.yaml
