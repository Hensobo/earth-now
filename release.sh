#!/bin/zsh
# Builds EarthNow.app and packages it as dist/EarthNow-<version>.dmg
# (with a drag-to-Applications shortcut).
#
#   ./release.sh            version from the VERSION file
#   ./release.sh 1.2.0      explicit version
#
# Without further settings you get an ad-hoc signed DMG: it works, but macOS asks
# users to confirm under System Settings › Privacy & Security › "Open Anyway".
#
# Signed and notarized release (needs the Apple Developer Program):
#
#   DEVELOPER_ID="Developer ID Application: Firstname Lastname (TEAMID)" \
#   NOTARY_PROFILE="earthnow-notary" \
#   ./release.sh
#
# Create NOTARY_PROFILE once with:
#   xcrun notarytool store-credentials earthnow-notary --apple-id <mail> --team-id <TEAMID>
set -e
cd "${0:A:h}"

export VERSION=${1:-$(cat VERSION)}
APP=EarthNow.app
DMG=dist/EarthNow-$VERSION.dmg

./build.sh

if [[ -n "$DEVELOPER_ID" ]]; then
  echo "Signing with: $DEVELOPER_ID"
  codesign --force --deep --options runtime --timestamp --sign "$DEVELOPER_ID" $APP
  codesign --verify --strict --verbose=2 $APP
else
  echo "Note: DEVELOPER_ID not set – the app is ad-hoc signed and not notarized."
fi

# Assemble the DMG
rm -rf dist/dmg && mkdir -p dist/dmg
cp -R $APP dist/dmg/
ln -s /Applications dist/dmg/Applications
rm -f $DMG
hdiutil create -volname "Earth Now" -srcfolder dist/dmg -ov -format UDZO -quiet $DMG
rm -rf dist/dmg

if [[ -n "$DEVELOPER_ID" ]]; then
  codesign --force --sign "$DEVELOPER_ID" --timestamp $DMG
  if [[ -n "$NOTARY_PROFILE" ]]; then
    echo "Notarizing with Apple (usually 1–5 minutes) …"
    xcrun notarytool submit $DMG --keychain-profile "$NOTARY_PROFILE" --wait
    xcrun stapler staple $DMG
    spctl --assess --type open --context context:primary-signature -v $DMG
  fi
fi

echo "Done: $PWD/$DMG ($(du -h $DMG | cut -f1))"
