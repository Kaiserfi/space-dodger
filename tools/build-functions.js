#!/usr/bin/env node
// Copies the arcade's name rules into the server code, so the server judges names exactly as the page does:
//   - from index.html: BAD_SUB, BAD_WORD, LEET, _badName and nameKey (the leaderboard key for a name)
//   - word-filter.js (the shared filter ITAP uses too)
// into functions/filter.js. Run `node tools/build-functions.js` after changing either, and commit the result.
// `node tools/build-functions.js --check` fails if functions/filter.js is out of date (the build workflow runs it).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'functions', 'filter.js');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), shared = fs.readFileSync(path.join(root, 'word-filter.js'), 'utf8');
const line = start => { const l = html.split('\n').find(s => s.startsWith(start)); if (!l) throw new Error('index.html: no line starting ' + start); return l; };
const block = start => { const i = html.indexOf(start); if (i < 0) throw new Error('index.html: no ' + start); const j = html.indexOf('\n}\n', i); return html.slice(i, j + 2); };
const text = `// Made by tools/build-functions.js from index.html and word-filter.js. Don't edit by hand.
'use strict';
const window = {};
${shared}
${line('const BAD_SUB')}
${line('const BAD_WORD')}
${line('const LEET')}
${block('function _badName(name)')}
${line('const nameKey')}
const badName = name => _badName(name) || window.isBadName(name);
module.exports = { badName, nameKey };
`;
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur !== text) { console.error('functions/filter.js is out of date: run node tools/build-functions.js'); process.exit(1); }
  console.log('functions/filter.js is up to date.');
} else { fs.writeFileSync(out, text); console.log('wrote functions/filter.js'); }
