const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const fileUrl = 'file:///' + path.join(__dirname, 'ipad-shots.html').split(path.sep).join('/');
const DIR = path.join(__dirname, 'shots', 'ipad-13inch-2048x2732');
fs.mkdirSync(DIR, { recursive: true });
const NAMES = ['ipad1_home', 'ipad2_checkin', 'ipad3_cert'];
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 2048, height: 2732, deviceScaleFactor: 1 });
  await p.goto(fileUrl);
  await wait(1200);
  for (let i = 0; i < 3; i++) {
    const el = await p.$('#s' + (i + 1));
    await el.screenshot({ path: path.join(DIR, NAMES[i] + '.png') });
    console.log(NAMES[i]);
  }
  await b.close();
  console.log('DONE');
})().catch(e => { console.error('ERR', e); process.exit(1); });
