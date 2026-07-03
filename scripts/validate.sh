#!/usr/bin/env bash
set -euo pipefail
npm test
npm run check
npm run build
npm run smoke >/dev/null
printf 'validation ok\n'
