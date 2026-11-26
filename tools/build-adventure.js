#!/usr/bin/env node
// Builds ITAP Adventure: joins adventure/src/ into adventure/index.html, the page players load.
//
//   node tools/build-adventure.js          write adventure/index.html
//   node tools/build-adventure.js --check  only check it is up to date (what CI runs); exits 1 if not
//
// The pieces:
//   adventure/src/page.html   the page around the game: head, the panels' markup, the import map.
//                             It holds two marker lines, /*@@style.css@@*/ and //@@js@@.
//   adventure/src/style.css   the page's styles, put where /*@@style.css@@*/ is.
//   adventure/src/js/*.js     the game script, joined in file-name order and put where //@@js@@ is.
//                             It is still ONE module with one shared scope: order matters, and a name
//                             defined in one file can be used in any other.
//
// Every build also checks that the script parses (node --check), and that no top-level name is
// defined twice, in the same file or in two files (the trap behind the old roomFor / SNOW clashes).
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'adventure/src'), OUT = path.join(ROOT, 'adventure/index.html');
const check = process.argv.includes('--check');
const fail = msg => { console.error('build-adventure: ' + msg); process.exit(1); };
const read = f => fs.readFileSync(f, 'utf8');

const page = read(path.join(SRC, 'page.html')), style = read(path.join(SRC, 'style.css'));
const files = fs.readdirSync(path.join(SRC, 'js')).filter(f => f.endsWith('.js')).sort();
if (!files.length) fail('no script files in adventure/src/js');
const parts = files.map(f => ({ f, text: read(path.join(SRC, 'js', f)) }));
for (const p of parts) if (!p.text.endsWith('\n')) fail(`adventure/src/js/${p.f} must end with a new line`);
const js = parts.map(p => p.text).join('');

/* the same top-level name defined twice is a clash, in one file or across two */
const seen = new Map(), clashes = [];
for (const p of parts) p.text.split('\n').forEach((line, i) => {
  const m = line.match(/^(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/);
  if (!m) return;
  const where = `${p.f}:${i + 1}`;
  if (seen.has(m[1])) clashes.push(`${m[1]} (${seen.get(m[1])} and ${where})`); else seen.set(m[1], where);
});
if (clashes.length) fail('top-level names defined twice:\n  ' + clashes.join('\n  '));

/* the script must parse */
const tmp = path.join(os.tmpdir(), `adventure-check-${process.pid}.mjs`);
fs.writeFileSync(tmp, js);
const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
fs.unlinkSync(tmp);
if (r.status !== 0) {
  /* point at the piece the error is in, not the joined temp file */
  const msg = (r.stderr || '').replace(new RegExp(tmp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':(\\d+)', 'g'), (_, n) => {
    let line = +n; for (const p of parts) { const c = p.text.split('\n').length - 1; if (line <= c) return `adventure/src/js/${p.f}:${line}`; line -= c; } return 'line ' + n; });
  fail('the script does not parse:\n' + msg);
}

/* the page: both markers must be there exactly once, each on a line of its own */
for (const mk of ['/*@@style.css@@*/\n', '//@@js@@\n']) if (page.split(mk).length !== 2) fail(`adventure/src/page.html must hold the line ${mk.trim()} exactly once`);
const html = page.replace('/*@@style.css@@*/\n', () => style).replace('//@@js@@\n', () => js);

if (check) {
  const cur = fs.existsSync(OUT) ? read(OUT) : '';
  if (cur !== html) fail('adventure/index.html does not match adventure/src/. Edit the files in adventure/src/ (never index.html itself), then run: node tools/build-adventure.js');
  console.log(`adventure/index.html is up to date (${files.length} script files, ${seen.size} top-level names).`);
} else {
  fs.writeFileSync(OUT, html);
  console.log(`built adventure/index.html from ${files.length} script files (${(html.length / 1024).toFixed(0)} KB).`);
}
