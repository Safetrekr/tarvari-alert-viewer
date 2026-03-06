#!/bin/bash
# Build and vendor @tarva/ui for CI environments where the workspace
# link to ../../tarva-ui-library is unavailable.

set -euo pipefail

TARVA_UI_SOURCE="../../tarva-ui-library"
VENDOR_DIR="vendor/@tarva-ui"

if [ ! -d "$TARVA_UI_SOURCE" ]; then
  echo "[vendor] @tarva/ui source not found at $TARVA_UI_SOURCE"
  echo "[vendor] Using existing vendored copy at $VENDOR_DIR"
  if [ ! -d "$VENDOR_DIR" ]; then
    echo "[vendor] ERROR: No vendored copy exists. Run this script locally first."
    exit 1
  fi
  exit 0
fi

echo "[vendor] Building @tarva/ui from source..."
(cd "$TARVA_UI_SOURCE" && pnpm install && pnpm build)

echo "[vendor] Copying built output to $VENDOR_DIR..."
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"
cp -r "$TARVA_UI_SOURCE/dist/"* "$VENDOR_DIR/"
cp "$TARVA_UI_SOURCE/package.json" "$VENDOR_DIR/package.json"

echo "[vendor] @tarva/ui vendored successfully."
