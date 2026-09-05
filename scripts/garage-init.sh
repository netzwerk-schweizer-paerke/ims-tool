#!/usr/bin/env bash
# Provision Garage S3 storage for local development and write the credentials to .env.
#
# Idempotent — safe to run on every `yarn services:start`.
#   fresh volumes    → creates layout, bucket and API key
#   existing volumes → reuses them, and rotates the API key only if .env has drifted
#
# Garage redacts an existing key's secret (it is only returned at creation time), so
# when .env no longer matches the live key the only recovery is to issue a new key.
# That is harmless here: rotating the key does not touch stored objects.

set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.dev.yml"
GARAGE="$COMPOSE exec -T garage /garage"
ENV_FILE=".env"

BUCKET="swiss-parcs-ims"
KEY_NAME="swiss-parcs-ims-dev"
S3_ENDPOINT="http://localhost:3900"
S3_REGION="garage" # must match s3_region in garage/garage.toml

# --- Wait for the node to accept commands ---

echo "Waiting for Garage to be ready..."
for i in $(seq 1 30); do
  if $GARAGE status >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Garage did not become ready in time" >&2
    exit 1
  fi
  sleep 1
done

# --- Cluster layout (single node) ---

# Capacity is a relative weight for spreading partitions across nodes, not a quota. With a
# single node it is nominal, but `garage status` reports usage against it, so keep it above the
# real dataset. The dev bucket held 1.2 GiB across 1777 objects in 2026-09.
CAPACITY="8G"

NODE_ID=$($GARAGE status 2>/dev/null | awk 'NR>2 && /^[a-f0-9]/{print $1; exit}')
if [ -z "$NODE_ID" ]; then
  echo "ERROR: Could not determine Garage node ID" >&2
  exit 1
fi

# Stage the capacity on every run. Garage discards a no-op, so an existing cluster converges
# when CAPACITY changes. The output of `layout assign` always claims a change is staged, so
# read `layout show` instead.
$GARAGE layout assign -z dc1 -c "$CAPACITY" "$NODE_ID" >/dev/null 2>&1

if $GARAGE layout show 2>/dev/null | grep -q "STAGED ROLE CHANGES"; then
  # `layout apply` takes the version it creates, which is the current one plus one.
  NEXT_VERSION=$(($($GARAGE layout show 2>/dev/null | awk '/layout version:/{print $NF}') + 1))
  echo "Applying layout version $NEXT_VERSION with capacity $CAPACITY..."
  $GARAGE layout apply --version "$NEXT_VERSION"
else
  echo "Layout already at capacity $CAPACITY for node $NODE_ID"
fi

# --- Bucket ---

if $GARAGE bucket info "$BUCKET" >/dev/null 2>&1; then
  echo "Bucket '$BUCKET' already exists"
else
  echo "Creating bucket '$BUCKET'..."
  $GARAGE bucket create "$BUCKET"
fi

# --- API key ---

read_env_var() {
  [ -f "$ENV_FILE" ] || return 0
  grep "^$1=" "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2-
}

CURRENT_KEY_ID=$(read_env_var S3_ACCESS_KEY_ID)
CURRENT_SECRET=$(read_env_var S3_SECRET_ACCESS_KEY)

LIVE_KEY_ID=""
if $GARAGE key info "$KEY_NAME" >/dev/null 2>&1; then
  LIVE_KEY_ID=$($GARAGE key info "$KEY_NAME" 2>/dev/null | awk '/Key ID:/{print $NF}')
fi

if [ -n "$LIVE_KEY_ID" ] && [ "$LIVE_KEY_ID" = "$CURRENT_KEY_ID" ] && [ -n "$CURRENT_SECRET" ]; then
  echo "Key '$KEY_NAME' already in $ENV_FILE — reusing"
  KEY_ID="$CURRENT_KEY_ID"
  KEY_SECRET="$CURRENT_SECRET"
else
  if [ -n "$LIVE_KEY_ID" ]; then
    echo "Key '$KEY_NAME' exists but its secret is not in $ENV_FILE — rotating..."
    $GARAGE key delete --yes "$KEY_NAME" >/dev/null
  fi
  echo "Creating API key '$KEY_NAME'..."
  KEY_INFO=$($GARAGE key create "$KEY_NAME")
  KEY_ID=$(echo "$KEY_INFO" | awk '/Key ID:/{print $NF}')
  KEY_SECRET=$(echo "$KEY_INFO" | awk '/Secret key:/{print $NF}')

  if [ -z "$KEY_ID" ] || [ -z "$KEY_SECRET" ]; then
    echo "ERROR: Could not parse the new key" >&2
    echo "$KEY_INFO" >&2
    exit 1
  fi
fi

echo "Ensuring bucket permissions..."
$GARAGE bucket allow --read --write --owner "$BUCKET" --key "$KEY_NAME" >/dev/null

# --- Write credentials to .env ---
# `sed -i` differs between BSD and GNU, so rewrite through a temp file instead.

update_env_var() {
  local var_line="$1"
  local var_name="${var_line%%=*}"
  if grep -q "^${var_name}=" "$ENV_FILE"; then
    sed "s|^${var_name}=.*|${var_line}|" "$ENV_FILE" >"${ENV_FILE}.tmp"
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
  else
    echo "$var_line" >>"$ENV_FILE"
  fi
}

if [ -f "$ENV_FILE" ]; then
  update_env_var "S3_ENDPOINT=$S3_ENDPOINT"
  update_env_var "S3_BUCKET=$BUCKET"
  update_env_var "S3_REGION=$S3_REGION"
  update_env_var "S3_ACCESS_KEY_ID=$KEY_ID"
  update_env_var "S3_SECRET_ACCESS_KEY=$KEY_SECRET"
  echo "Wrote Garage credentials to $ENV_FILE"
else
  echo "WARNING: $ENV_FILE not found — copy .env.example to .env and re-run" >&2
fi

echo ""
echo "Garage S3 ready:"
echo "  Endpoint: $S3_ENDPOINT"
echo "  Region:   $S3_REGION"
echo "  Bucket:   $BUCKET"
echo "  Key ID:   $KEY_ID"
echo ""
