#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# LocalStack Desktop — Test Runner
# Usage:
#   ./test.sh           → unit tests only
#   ./test.sh --unit    → unit tests only
#   ./test.sh --int     → integration tests (requires LocalStack)
#   ./test.sh --all     → unit + integration
#   ./test.sh --watch   → unit tests in watch mode
#   ./test.sh --cover   → unit tests with coverage report
# ─────────────────────────────────────────────────────────────────────────────
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

MODE="${1:---unit}"

header() {
  echo ""
  echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║  LocalStack Desktop — $1${NC}"
  echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
  echo ""
}

check_localstack() {
  local endpoint="${LS_ENDPOINT:-http://localhost:4566}"
  echo -e "${CYAN}▸ Checking LocalStack at ${endpoint}...${NC}"
  if ! curl -sf "${endpoint}/_localstack/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ LocalStack is not running at ${endpoint}${NC}"
    echo ""
    echo "  Start LocalStack with one of:"
    echo "    localstack start"
    echo "    docker run --rm -it -p 4566:4566 localstack/localstack"
    echo ""
    exit 1
  fi
  echo -e "${GREEN}✓ LocalStack is reachable${NC}"
  echo ""
}

run_unit() {
  header "Unit Tests"
  if [ "$1" = "watch" ]; then
    npx react-scripts test
  elif [ "$1" = "cover" ]; then
    npx react-scripts test --watchAll=false --coverage \
      --coverageReporters=text --coverageReporters=lcov \
      --coverageDirectory=coverage
    echo ""
    echo -e "${GREEN}Coverage report: ${CYAN}coverage/lcov-report/index.html${NC}"
  else
    CI=true npx react-scripts test --watchAll=false
  fi
}

run_integration() {
  header "Integration Tests"
  check_localstack
  npx jest --config jest.integration.config.js --forceExit "$@"
}

case "$MODE" in
  --unit)    run_unit ;;
  --watch)   run_unit watch ;;
  --cover)   run_unit cover ;;
  --int)     run_integration ;;
  --all)
    header "All Tests"
    run_unit
    echo ""
    run_integration
    ;;
  *)
    echo "Usage: $0 [--unit|--watch|--cover|--int|--all]"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}${BOLD}✓ Done!${NC}"
