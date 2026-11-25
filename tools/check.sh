#!/bin/bash
# Syntax-check the game's module script (catches typos and duplicate names at the same level). Run from the repo root.
python3 -c "
import re;s=open('adventure/index.html').read();m=re.findall(r'<script type=\"module\">(.*?)</script>',s,re.S);open('/tmp/itap-check.mjs','w').write(max(m,key=len))" && node --check /tmp/itap-check.mjs && echo "adventure/index.html: syntax OK"
