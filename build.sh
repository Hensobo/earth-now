#!/bin/zsh
# Builds EarthNow.app from app/main.swift and the web/ folder.
#
#   ./build.sh                  universal app (Apple Silicon + Intel)
#   ARCHS=arm64 ./build.sh      faster build for one architecture only
#
# Needs only the Xcode Command Line Tools (xcode-select --install), not Xcode.
set -e
cd "${0:A:h}"

APP=EarthNow.app
VERSION=${VERSION:-$(cat VERSION)}
BUILD_NUMBER=${BUILD_NUMBER:-1}
BUNDLE_ID=io.github.hensobo.earthnow
MIN_MACOS=13.0
ARCHS=(${=ARCHS:-arm64 x86_64})

rm -rf $APP build
mkdir -p $APP/Contents/MacOS $APP/Contents/Resources build

for arch in $ARCHS; do
  echo "Compiling for $arch …"
  swiftc -O -target $arch-apple-macos$MIN_MACOS -o build/EarthNow-$arch app/main.swift \
    -framework AppKit -framework WebKit -framework SwiftUI -framework MapKit -framework ServiceManagement
done
lipo -create build/EarthNow-* -output $APP/Contents/MacOS/EarthNow

cp -R web $APP/Contents/Resources/web
cp -R app/Localization/*.lproj $APP/Contents/Resources/

# App icon (.icns) from the PNG exports in design/icon/png
ICONSET=build/AppIcon.iconset
P=design/icon/png/earth-now
mkdir -p $ICONSET
for spec in 16:16x16 32:16x16@2x 32:32x32 64:32x32@2x 128:128x128 256:128x128@2x \
            256:256x256 512:256x256@2x 512:512x512 1024:512x512@2x; do
  cp $P-${spec%%:*}.png $ICONSET/icon_${spec#*:}.png
done
iconutil -c icns $ICONSET -o $APP/Contents/Resources/AppIcon.icns

cat > $APP/Contents/Info.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Earth Now</string>
  <key>CFBundleDisplayName</key><string>Earth Now</string>
  <key>CFBundleIdentifier</key><string>$BUNDLE_ID</string>
  <key>CFBundleExecutable</key><string>EarthNow</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$BUILD_NUMBER</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundleDevelopmentRegion</key><string>en</string>
  <key>CFBundleLocalizations</key><array><string>en</string><string>de</string></array>
  <key>LSApplicationCategoryType</key><string>public.app-category.utilities</string>
  <key>LSUIElement</key><true/>
  <key>LSMinimumSystemVersion</key><string>$MIN_MACOS</string>
  <key>NSHumanReadableCopyright</key><string>© $(date +%Y) Henning Sobota · MIT License</string>
</dict></plist>
PLIST

codesign --force --sign - $APP
rm -rf build
echo "Done: $PWD/$APP ($VERSION, $(lipo -archs $APP/Contents/MacOS/EarthNow))"
