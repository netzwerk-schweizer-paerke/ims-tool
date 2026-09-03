#!/usr/bin/env bash
#
# Install dependencies and set up the local development environment.
# Safe to run repeatedly — only reinstalls what's needed.

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# --- Help ---

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo "Usage: $(basename "$0") [options]"
  echo ""
  echo "Install dependencies and set up the development environment."
  echo ""
  echo "Options:"
  echo "  --clean    Remove node_modules and build caches before installing"
  echo "  --nuke     Also remove yarn.lock (dependencies fully re-resolved)"
  echo "  -h, --help Show this help message"
  exit 0
fi

# --- Flags ---

CLEAN=false
NUKE=false
for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=true ;;
    --nuke) NUKE=true ;;
    *)
      echo "Unknown option: $arg"
      echo "Run $(basename "$0") --help for usage"
      exit 1
      ;;
  esac
done

# --- Prerequisites ---

echo "=== Swiss Parcs IMS Installation ==="
echo ""
echo "Checking prerequisites..."

MISSING=false

if ! command -v node &>/dev/null; then
  echo "  ✗ Node.js not found — install Node.js >= 24"
  MISSING=true
else
  NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
  if [ "$NODE_MAJOR" -lt 24 ]; then
    echo "  ✗ Node.js $NODE_MAJOR found — version >= 24 required"
    MISSING=true
  else
    echo "  ✓ Node.js $(node --version)"
  fi
fi

if ! command -v corepack &>/dev/null; then
  echo "  ✗ corepack not found — run: npm install -g corepack && corepack enable"
  MISSING=true
else
  corepack enable 2>/dev/null || true
  echo "  ✓ corepack enabled"
fi

if ! command -v yarn &>/dev/null; then
  echo "  ✗ yarn not found — run: corepack enable"
  MISSING=true
else
  echo "  ✓ yarn $(yarn --version)"
fi

if ! command -v docker &>/dev/null; then
  echo "  ✗ Docker not found — install Docker Desktop or Docker Engine"
  MISSING=true
else
  echo "  ✓ Docker $(docker --version | sed 's/Docker version //' | sed 's/,.*//')"
fi

if ! command -v git &>/dev/null; then
  echo "  ✗ git not found"
  MISSING=true
else
  echo "  ✓ git $(git --version | sed 's/git version //')"
fi

if $MISSING; then
  echo ""
  echo "Install missing prerequisites and try again."
  exit 1
fi

echo ""

# --- Clean / nuke ---

if $NUKE; then
  CLEAN=true
  if [ -f "$REPO_ROOT/yarn.lock" ]; then
    echo "Removing yarn.lock (dependencies will be fully re-resolved)..."
    rm -f "$REPO_ROOT/yarn.lock"
  fi
fi

if $CLEAN; then
  echo "Cleaning build caches and node_modules..."
  rm -rf "$REPO_ROOT/node_modules" "$REPO_ROOT/.next"
  echo ""
fi

# --- Dependencies ---
# The Yarn version is pinned via packageManager in package.json — don't bump it here.

echo "=== Dependencies ==="
cd "$REPO_ROOT"
yarn install
echo ""

# --- Environment file ---

ENV_MISSING=false
if [ ! -f "$REPO_ROOT/.env" ]; then
  echo "=== Environment File ==="
  echo "  Creating .env from .env.example"
  cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
  echo "  ⚠ Fill in PAYLOAD_SECRET and DEEPL_API_KEY before starting the app."
  echo "    S3_* values are provisioned automatically by yarn services:start."
  echo ""
  ENV_MISSING=true
fi

# --- Done ---

echo "=== Installation complete ==="
echo ""
echo "Next steps:"
if $ENV_MISSING; then
  echo "  1. Fill in the secrets in .env (see above)"
  echo "  2. yarn services:start   # PostgreSQL, Mailpit, Garage S3"
  echo "  3. yarn dev              # http://localhost:3000/admin"
else
  echo "  1. yarn services:start   # PostgreSQL, Mailpit, Garage S3"
  echo "  2. yarn dev              # http://localhost:3000/admin"
fi
