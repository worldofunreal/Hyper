#!/bin/bash
set -e
# Hyper web deploy — SPA to hyper.worldofunreal.com
cd "$(dirname "$0")"
echo "build renderer..."
./node_modules/.bin/electron-vite build
echo "rsync out/renderer -> ionos:/var/www/hyper.worldofunreal.com/dist/"
rsync -avz --delete out/renderer/ bizkit@74.208.246.177:/var/www/hyper.worldofunreal.com/dist/
echo "verify origin (Host header, Cloudflare cloak blocks plain IP)..."
ssh ionos 'curl -sk -H "Host: hyper.worldofunreal.com" https://127.0.0.1/ -o /dev/null -w "origin HTTP:%{http_code}\n"'
echo "done. Public https://hyper.worldofunreal.com needs Cloudflare DNS A record -> 74.208.246.177 (proxied)."
