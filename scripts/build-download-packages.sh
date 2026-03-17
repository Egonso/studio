#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOWNLOAD_DIR="${ROOT_DIR}/public/downloads"
EXTENSION_DIR="${ROOT_DIR}/extensions/ki-register-quick-capture"
EXTENSION_ZIP="${DOWNLOAD_DIR}/ki-register-quick-capture-chrome.zip"
MAC_APP_BUILD_SCRIPT="${ROOT_DIR}/apps/ki-register-menubar-mac/scripts/build-release.sh"
MAC_APP_ZIP_SRC="${ROOT_DIR}/apps/ki-register-menubar-mac/dist/KI-Register-MenuBar-macOS.zip"
MAC_APP_ZIP_DST="${DOWNLOAD_DIR}/ki-register-menubar-macos.zip"
AGENT_KIT_SRC="${ROOT_DIR}/agent-kit"
AGENT_STAGE_DIR="${ROOT_DIR}/.tmp/ki-register-agent-kit"
AGENT_ZIP="${DOWNLOAD_DIR}/ki-register-agent-kit.zip"

mkdir -p "${DOWNLOAD_DIR}"

echo "==> Building Chrome extension zip"
if [[ ! -d "${EXTENSION_DIR}" ]]; then
  echo "Missing extension directory: ${EXTENSION_DIR}" >&2
  exit 1
fi

rm -f "${EXTENSION_ZIP}"
COPYFILE_DISABLE=1 ditto -c -k --norsrc --keepParent "${EXTENSION_DIR}" "${EXTENSION_ZIP}"

echo "==> Building macOS menu bar app zip"
"${MAC_APP_BUILD_SCRIPT}"
cp "${MAC_APP_ZIP_SRC}" "${MAC_APP_ZIP_DST}"

echo "==> Building agent kit zip"
if [[ ! -d "${AGENT_KIT_SRC}" ]]; then
  echo "Missing agent kit directory: ${AGENT_KIT_SRC}" >&2
  exit 1
fi

rm -rf "${AGENT_STAGE_DIR}"
cp -R "${AGENT_KIT_SRC}/." "${AGENT_STAGE_DIR}/"

rm -f "${AGENT_ZIP}"
COPYFILE_DISABLE=1 ditto -c -k --norsrc --keepParent "${AGENT_STAGE_DIR}" "${AGENT_ZIP}"

echo "==> Calculating checksums"
(
  cd "${DOWNLOAD_DIR}"
  shasum -a 256 \
    "$(basename "${EXTENSION_ZIP}")" \
    "$(basename "${MAC_APP_ZIP_DST}")" \
    "$(basename "${AGENT_ZIP}")" \
    > "SHA256SUMS.txt"
)

echo
echo "Download artifacts:"
ls -lh "${DOWNLOAD_DIR}"
