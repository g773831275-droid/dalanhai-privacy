const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const fileUrl = 'http://localhost:8080/marketing-shots.html';
const DIR = path.join(__dirname, 'shots', '6.5inch-1242x2688');
fs.mkdirSync(DIR, { recursive: true });
const NAMES = ['shot1_home', 'shot2_island', 'shot3_port', 'shot4_bazaar', 'shot5_cert'];
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  // iPhone 6.5" 物理规格: 414×896 pt @3x = 1242×2688 px
  await p.setViewport({ width: 414, height: 896, deviceScaleFactor: 3 });
  await p.goto(fileUrl, { waitUntil: 'networkidle0' });
  await wait(2500); // 等 5 个 iframe 加载 index.html + JS 切 tab + render
  for (let i = 0; i < 5; i++) {
    const el = await p.$('#s' + (i + 1));
    await el.screenshot({ path: path.join(DIR, NAMES[i] + '.png') });
    console.log(NAMES[i] + '.png');
  }
  await b.close();
  console.log('DONE → shots/6.5inch-1242x2688/');
})().catch(e => { console.error('ERR', e); process.exit(1); });
