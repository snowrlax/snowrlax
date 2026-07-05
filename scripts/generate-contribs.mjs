#!/usr/bin/env node
// Generates assets/contributions.svg — GitHub contribution calendar,
// dark theme (empty cells dark, green scale), Claude-terminal styling.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER = 'snowrlax';
const API = `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`;

// GitHub dark-theme green scale (level 0 = no contribution → dark cell)
const LEVELS = ['#161B22', '#0E4429', '#006D32', '#26A641', '#39D353'];
const LABEL = '#8B949E';

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 32;   // room for day labels
const TOP = 20;    // room for month labels

const res = await fetch(API);
if (!res.ok) {
  console.error(`API error: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const { contributions } = await res.json();

// Build week columns (GitHub weeks start on Sunday)
const weeks = [];
let week = [];
for (const day of contributions) {
  const dow = new Date(day.date + 'T00:00:00Z').getUTCDay();
  if (dow === 0 && week.length) {
    weeks.push(week);
    week = [];
  }
  week.push(day);
}
if (week.length) weeks.push(week);

const width = LEFT + weeks.length * STEP + 4;
const height = TOP + 7 * STEP + 4;

const cells = [];
const monthLabels = [];
let lastMonth = -1;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

weeks.forEach((wk, wi) => {
  wk.forEach((day) => {
    const d = new Date(day.date + 'T00:00:00Z');
    const dow = d.getUTCDay();
    const x = LEFT + wi * STEP;
    const y = TOP + dow * STEP;
    cells.push(
      `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${LEVELS[day.level]}"><title>${day.date}: ${day.count}</title></rect>`
    );
    // month label above the first week that contains the 1st–7th of a month
    const m = d.getUTCMonth();
    if (m !== lastMonth && d.getUTCDate() <= 7 && dow <= 3) {
      monthLabels.push(`<text x="${x}" y="12" fill="${LABEL}">${MONTHS[m]}</text>`);
      lastMonth = m;
    }
  });
});

const dayLabels = [
  `<text x="0" y="${TOP + 1 * STEP + 9}" fill="${LABEL}">Mon</text>`,
  `<text x="0" y="${TOP + 3 * STEP + 9}" fill="${LABEL}">Wed</text>`,
  `<text x="0" y="${TOP + 5 * STEP + 9}" fill="${LABEL}">Fri</text>`,
].join('\n  ');

const svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${USER}'s contribution graph">
  <style>text { font-family: 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace; font-size: 10px; }</style>
  ${monthLabels.join('\n  ')}
  ${dayLabels}
  ${cells.join('\n  ')}
</svg>
`;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(root, 'assets'), { recursive: true });
writeFileSync(join(root, 'assets', 'contributions.svg'), svg);
console.log(`assets/contributions.svg written — ${weeks.length} weeks, ${contributions.length} days`);
