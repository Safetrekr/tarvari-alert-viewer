#!/bin/bash
# Adjusts pnpm workspace for CI where ../../tarva-ui-library is unavailable.

set -euo pipefail

if [ ! -d "../../tarva-ui-library" ]; then
  echo "[ci] Workspace link unavailable. Switching to vendored @tarva/ui."

  cat > pnpm-workspace.yaml << 'EOF'
packages:
  - '.'
  - 'vendor/@tarva-ui'
EOF

  echo "[ci] pnpm-workspace.yaml updated for CI."
fi

pnpm install --no-frozen-lockfile
