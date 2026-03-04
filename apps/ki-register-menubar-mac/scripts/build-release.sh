#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${ROOT_DIR}/../.." && pwd)"

PRODUCT_NAME="KIRegisterMenuBar"
APP_NAME="KI-Register-MenuBar"
APP_BUNDLE="${ROOT_DIR}/dist/${APP_NAME}.app"
ZIP_PATH="${ROOT_DIR}/dist/${APP_NAME}-macOS.zip"
BIN_PATH="${ROOT_DIR}/.build/release/${PRODUCT_NAME}"
ICONSET_DIR="${ROOT_DIR}/.build/AppIcon.iconset"
ICON_SRC="${REPO_ROOT}/public/register-logo.png"
ICNS_PATH="${APP_BUNDLE}/Contents/Resources/AppIcon.icns"

echo "==> Building Swift binary (${PRODUCT_NAME})"
swift build -c release --package-path "${ROOT_DIR}" --product "${PRODUCT_NAME}"

if [[ ! -f "${BIN_PATH}" ]]; then
  echo "Binary not found at ${BIN_PATH}" >&2
  exit 1
fi

echo "==> Creating app bundle (${APP_BUNDLE})"
mkdir -p "${ROOT_DIR}/dist"
rm -rf "${APP_BUNDLE}"
mkdir -p "${APP_BUNDLE}/Contents/MacOS" "${APP_BUNDLE}/Contents/Resources"

cp "${BIN_PATH}" "${APP_BUNDLE}/Contents/MacOS/${PRODUCT_NAME}"
chmod +x "${APP_BUNDLE}/Contents/MacOS/${PRODUCT_NAME}"

cat > "${APP_BUNDLE}/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>de</string>
  <key>CFBundleExecutable</key>
  <string>KIRegisterMenuBar</string>
  <key>CFBundleIdentifier</key>
  <string>com.eukigesetz.kiregister.menubar</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>KI-Register MenuBar</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

if [[ -f "${ICON_SRC}" ]]; then
  echo "==> Generating app icon"
  rm -rf "${ICONSET_DIR}"
  mkdir -p "${ICONSET_DIR}"
  for size in 16 32 128 256 512; do
    sips -z "${size}" "${size}" "${ICON_SRC}" --out "${ICONSET_DIR}/icon_${size}x${size}.png" >/dev/null
    size2=$((size * 2))
    sips -z "${size2}" "${size2}" "${ICON_SRC}" --out "${ICONSET_DIR}/icon_${size}x${size}@2x.png" >/dev/null
  done
  iconutil -c icns "${ICONSET_DIR}" -o "${ICNS_PATH}"
  /usr/libexec/PlistBuddy -c "Add :CFBundleIconFile string AppIcon" "${APP_BUNDLE}/Contents/Info.plist" >/dev/null
fi

echo "==> Ad-hoc signing app bundle"
codesign --force --deep --sign - "${APP_BUNDLE}" >/dev/null 2>&1 || true

echo "==> Creating zip (${ZIP_PATH})"
rm -f "${ZIP_PATH}"
ditto -c -k --sequesterRsrc --keepParent "${APP_BUNDLE}" "${ZIP_PATH}"

echo "Done: ${ZIP_PATH}"
