#!/bin/zsh
# Baut EarthNow.app aus app/main.swift und dem web/-Ordner.
set -e
cd "${0:A:h}"
APP=EarthNow.app
rm -rf $APP
mkdir -p $APP/Contents/MacOS $APP/Contents/Resources
swiftc -O -o $APP/Contents/MacOS/EarthNow app/main.swift -framework AppKit -framework WebKit -framework SwiftUI -framework MapKit
cp -R web $APP/Contents/Resources/web
cat > $APP/Contents/Info.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Earth Now</string>
  <key>CFBundleDisplayName</key><string>Earth Now</string>
  <key>CFBundleIdentifier</key><string>local.earthnow</string>
  <key>CFBundleExecutable</key><string>EarthNow</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>LSUIElement</key><true/>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
</dict></plist>
PLIST
codesign --force --sign - $APP
echo "Fertig: $PWD/$APP"
