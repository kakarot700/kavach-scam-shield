#!/bin/sh
# Fails if the app code contains any way to send data off the device or store it.
cd "$(dirname "$0")/.."
if grep -nE "fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|document\.cookie" app.js feat.js index.html; then
  echo "network/storage API found"; exit 1; fi
echo "no network or storage APIs in app.js, feat.js, index.html"
