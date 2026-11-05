# Security policy

## Supported versions

Only the [latest release](https://github.com/Hensobo/earth-now/releases/latest) receives fixes.

## Reporting a vulnerability

Please **do not** open a public issue. Instead use GitHub's private reporting:
[Report a vulnerability](https://github.com/Hensobo/earth-now/security/advisories/new).

You'll get a first answer within a week. Once a fix is released, the report is published as a
security advisory and you're credited if you like.

## What Earth Now does on your Mac

To make reviews easier, here is everything the app touches:

- **Network:** only downloads public data – cloud images from `clouds.matteason.co.uk` (every three
  hours), the ISS orbit from `celestrak.org` (twice a day, while the ISS is shown) and the aurora
  activity from `services.swpc.noaa.gov` (every three hours, while auroras are on). When you search
  for a place, the search text goes to Apple Maps. Nothing else – no analytics, no accounts, no
  update pings.
- **Files:** reads its own app bundle; stores settings in `~/Library/Preferences/io.github.hensobo.earthnow.plist`.
- **Permissions:** none (no location, camera, screen recording or accessibility access).
