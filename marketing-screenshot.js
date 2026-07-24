const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const fileUrl = 'file:///' + path.join(__dirname, 'marketing-shots.html').split(path.sep).join('/');
const DIR = path.join(__dirname, 'shots', '6.5inch-1242x2688');
fs.mkdirSync(DIR, { recursive: true });
const NAMES = ['shot1_home', 'shot2_island', 'shot3_island_21', 'shot4_cert', 'shot5_mine'];
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1242, height: 2688, deviceScaleFactor: 1 });
  await p.goto(fileUrl);
  await wait(1200);
  for (let i = 0; i < 5; i++) {
    const el = await p.$('#s' + (i + 1));
    await el.screenshot({ path: path.join(DIR, NAMES[i] + '.png') });
    console.log(NAMES[i]);
  }
  await b.close();
  console.log('DONE');
})().catch(e => { console.error('ERR', e); process.exit(1); });
