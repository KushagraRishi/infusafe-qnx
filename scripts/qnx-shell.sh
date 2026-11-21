#!/bin/bash
# Run a command inside the QNX SDP 8.0 build container, with the SDP
# environment loaded and this repo mounted at /work.
# Usage: scripts/qnx-shell.sh "make qnx"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
QNXD="$HOME/qnx-docker"
docker run --rm -i --platform linux/amd64 \
  --hostname infusafe-qnx --mac-address 02:42:ac:11:00:42 \
  -v "$QNXD":/qnxd -v "$QNXD/dotqnx":/root/.qnx -e HOME=/root \
  -v "$REPO":/work -w /work \
  infusafe-qnx-host bash -c "source /qnxd/home/qnx/qnx800/qnxsdp-env.sh >/dev/null && $*"
