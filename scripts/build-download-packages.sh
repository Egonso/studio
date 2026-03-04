#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOWNLOAD_DIR="${ROOT_DIR}/public/downloads"
EXTENSION_DIR="${ROOT_DIR}/extensions/ki-register-quick-capture"
EXTENSION_ZIP="${DOWNLOAD_DIR}/ki-register-quick-capture-chrome.zip"
MAC_APP_BUILD_SCRIPT="${ROOT_DIR}/apps/ki-register-menubar-mac/scripts/build-release.sh"
MAC_APP_ZIP_SRC="${ROOT_DIR}/apps/ki-register-menubar-mac/dist/KI-Register-MenuBar-macOS.zip"
MAC_APP_ZIP_DST="${DOWNLOAD_DIR}/ki-register-menubar-macos.zip"

mkdir -p "${DOWNLOAD_DIR}"

echo "==> Building Chrome extension zip"
if [[ ! -d "${EXTENSION_DIR}" ]]; then
  echo "Missing extension directory: ${EXTENSION_DIR}" >&2
  exit 1
fi

rm -f "${EXTENSION_ZIP}"
ditto -c -k --sequesterRsrc --keepParent "${EXTENSION_DIR}" "${EXTENSION_ZIP}"

echo "==> Building macOS menu bar app zip"
"${MAC_APP_BUILD_SCRIPT}"
cp "${MAC_APP_ZIP_SRC}" "${MAC_APP_ZIP_DST}"

echo "==> Calculating checksums"
(
  cd "${DOWNLOAD_DIR}"
  shasum -a 256 "$(basename "${EXTENSION_ZIP}")" "$(basename "${MAC_APP_ZIP_DST}")" > "SHA256SUMS.txt"
)

echo
echo "Download artifacts:"
ls -lh "${DOWNLOAD_DIR}"
