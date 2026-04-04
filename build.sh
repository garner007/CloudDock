#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# LocalStack Desktop — Build Script
# Usage: ./build.sh [mac|win|linux|all] [--skip-icons]
# ─────────────────────────────────────────────────────────────────────────────
set -e

PLATFORM="${1:-}"
SKIP_ICONS="${2:-}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}▸ $*${NC}"; }
success() { echo -e "${GREEN}✓ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $*${NC}"; }
err()     { echo -e "${RED}✗ $*${NC}"; exit 1; }

echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     LocalStack Desktop — Build         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# ── Prerequisites ──────────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || err "Node.js is required. Install from https://nodejs.org"
command -v npm  >/dev/null 2>&1 || err "npm is required."

NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
info "Node.js $NODE_VER"

# ── Install dependencies ───────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  info "Installing dependencies..."
  npm install --legacy-peer-deps
  success "Dependencies installed"
else
  info "Dependencies already installed (run 'npm install --legacy-peer-deps' to update)"
fi

# ── Generate icons ─────────────────────────────────────────────────────────────
if [ "$SKIP_ICONS" != "--skip-icons" ] && [ ! -f "assets/icon.png" ]; then
  info "Generating app icons..."
  node scripts/generate-icons.js || warn "Icon generation skipped (will use default)"
else
  [ -f "assets/icon.png" ] && success "Icons already exist" || warn "Skipping icon generation"
fi

# ── Build React app ────────────────────────────────────────────────────────────
info "Building React app..."
GENERATE_SOURCEMAP=false npx react-scripts build
success "React build complete — build/ contains index.html + electron.js + preload.js"

# ── Build Electron installer ───────────────────────────────────────────────────
case "$PLATFORM" in
  mac)
    info "Building macOS installer (.dmg)..."
    npx electron-builder --mac
    ;;
  win)
    info "Building Windows installer (.exe)..."
    npx electron-builder --win
    ;;
  linux)
    info "Building Linux packages (.AppImage, .deb)..."
    npx electron-builder --linux
    ;;
  all)
    info "Building for all platforms..."
    npx electron-builder -mwl
    ;;
  *)
    info "Building for current platform..."
    npx electron-builder
    ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Build Complete! 🚀              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Installers are in: ${CYAN}dist/${NC}"
echo ""
ls -lh dist/ 2>/dev/null | grep -v "^total" | grep -v "^d" || true
echo ""
