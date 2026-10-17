#!/bin/zsh
# Baut EarthNow.app und verpackt sie als EarthNow-<version>.dmg (mit „In Programme ziehen“).
#
# Ohne weitere Angaben entsteht eine unsignierte DMG zum Testen.
# Für einen echten Release (Apple Developer Program nötig):
#
#   DEVELOPER_ID="Developer ID Application: Vorname Nachname (TEAMID)" \
#   NOTARY_PROFILE="earthnow-notary" \
#   ./release.sh 1.0
#
# NOTARY_PROFILE einmalig anlegen mit:
#   xcrun notarytool store-credentials earthnow-notary --apple-id <mail> --team-id <TEAMID>
set -e
cd "${0:A:h}"

VERSION=${1:-1.0}
APP=EarthNow.app
DMG=dist/EarthNow-$VERSION.dmg

./build.sh
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" $APP/Contents/Info.plist

if [[ -n "$DEVELOPER_ID" ]]; then
  echo "Signiere mit: $DEVELOPER_ID"
  codesign --force --deep --options runtime --timestamp --sign "$DEVELOPER_ID" $APP
  codesign --verify --strict --verbose=2 $APP
else
  codesign --force --sign - $APP   # nach PlistBuddy neu ad-hoc signieren
  echo "Hinweis: keine DEVELOPER_ID gesetzt – die DMG ist unsigniert und macOS warnt beim Öffnen."
fi

# DMG zusammenstellen
rm -rf dist/dmg && mkdir -p dist/dmg
cp -R $APP dist/dmg/
ln -s /Applications dist/dmg/Programme
rm -f $DMG
hdiutil create -volname "Earth Now" -srcfolder dist/dmg -ov -format UDZO -quiet $DMG
rm -rf dist/dmg

if [[ -n "$DEVELOPER_ID" ]]; then
  codesign --force --sign "$DEVELOPER_ID" --timestamp $DMG
  if [[ -n "$NOTARY_PROFILE" ]]; then
    echo "Notarisiere bei Apple (dauert meist 1–5 Minuten) …"
    xcrun notarytool submit $DMG --keychain-profile "$NOTARY_PROFILE" --wait
    xcrun stapler staple $DMG
    spctl --assess --type open --context context:primary-signature -v $DMG
  fi
fi

echo "Fertig: $PWD/$DMG ($(du -h $DMG | cut -f1))"
