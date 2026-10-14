#!/usr/bin/env node
/* Bundles the site into one self-contained HTML fragment for publishing as a
   claude.ai artifact (the host supplies <html>, <head> and <body>).
   Usage: node tools/build-artifact.js  ->  dist/twelve-axes.html */
const fs = require('fs'), path = require('path');
const SITE = path.join(__dirname, '..', 'site');
const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(SITE, 'styles.css'), 'utf8');
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/)[0];
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map((m) => fs.readFileSync(path.join(SITE, m[1]), 'utf8'));
const out = [
  '<title>Twelve Axes</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  fonts,
  '<style>\n' + css + '\n</style>',
  '<div id="app" class="wrap"></div>',
  '<script>\n' + scripts.join('\n') + '\n</script>',
].join('\n');
fs.mkdirSync(path.join(__dirname, '..', 'dist'), { recursive: true });
const dest = path.join(__dirname, '..', 'dist', 'twelve-axes.html');
fs.writeFileSync(dest, out);
console.log('wrote', dest, (out.length / 1024).toFixed(0) + ' KB');
