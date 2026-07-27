#!/usr/bin/env sh
set -eu
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "${PI_NODE:-node}" "$DIR/agent-runner.mjs" "$@"
