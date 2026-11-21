#!/bin/bash
# Installs QNX SDP 8.0 into ~/qnx-docker/home/qnx/qnx800, using the
# Linux x86_64 container (QNX tools have no macOS host).
# Asks for your myQNX password privately; it is never saved in a file.
set -e

QNXD="$HOME/qnx-docker"
CLT=/qnxd/home/qnx/qnxsoftwarecenter/qnxsoftwarecenter/qnxsoftwarecenter_clt

QNX_USER="$1"
if [ -z "$QNX_USER" ]; then read -r -p "myQNX email: " QNX_USER; fi
echo "myQNX email: $QNX_USER"
read -r -s -p "myQNX password (hidden): " QNX_PASS
echo

# Fixed hostname and MAC: QNX ties the activated license to the machine.
docker run --rm -i --platform linux/amd64 \
  --hostname infusafe-qnx --mac-address 02:42:ac:11:00:42 \
  -v "$QNXD":/qnxd -v "$QNXD/dotqnx":/root/.qnx -e HOME=/root \
  -e QNX_USER="$QNX_USER" -e QNX_PASS="$QNX_PASS" \
  infusafe-qnx-host bash -c '
    set -e
    CLT='"$CLT"'
    echo "== Your license"
    $CLT -listLicenseKeys | grep -q Activated || {
      $CLT -myqnx.user "$QNX_USER" -myqnx.password "$QNX_PASS" -syncLicenseKeys
      $CLT -myqnx.user "$QNX_USER" -myqnx.password "$QNX_PASS" -activateAll
    }
    $CLT -listLicenseKeys
    echo "== Installing QNX SDP 8.0 (this takes a while)"
    $CLT -myqnx.user "$QNX_USER" -myqnx.password "$QNX_PASS" \
         -mirrorBaseline qnx800 -cleanInstall -installBaseline com.qnx.qnx800 \
         -destination /qnxd/home/qnx/qnx800
    echo "== Done"
    ls /qnxd/home/qnx/qnx800
  '
unset QNX_PASS
echo "QNX SDP 8.0 install finished. You can close this tab."
