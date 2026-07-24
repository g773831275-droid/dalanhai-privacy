const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SIZES = [
  { name: '6.5inch-1242x2688', w: 1242, h: 2688 },
  { name: '6.1inch-1284x2778', w: 1284, h: 2778 },
];
const DIR = path.join(__dirname, 'shots');
SIZES.forEach(s => fs.mkdirSync(path.join(DIR, s.name), { recursive: true }));
const fileUrl = 'file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/');
const iconUrl = 'file:///' + path.join(__dirname, 'icon.svg').split(path.sep).join('/');
const wait = ms => new Promise(r => setTimeout(r, ms));

function dates21() {
  const d = new Date(), a = [];
  for (let i = 20; i >= 0; i--) {
    const x = new Date(d); x.setDate(x.getDate() - i);
    a.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'));
  }
  return a;
}

// 每张截图的营销文案
const COPY = [
  { h: '自律，从登岛开始', s: '四座岛屿 · 等你征服' },
  { h: '每日打卡', s: '坚持，看得见' },
  { h: '连续 21 天', s: '征服属于你的岛屿' },
  { h: '征服证书', s: '分享你的成就' },
  { h: '记录每一次进步', s: '数据见证坚持' },
];

// 美化层：品牌渐变背景 + 顶部营销大标题 + 底部品牌 + App 圆角手机框
async function beautify(p, heading, sub, scale) {
  await p.evaluate((h, s, sc) => {
    document.body.style.background = 'linear-gradient(165deg, #0C447C 0%, #185FA5 45%, #378ADD 100%)';
    document.body.style.margin = '0';
    document.documentElement.style.background = '#0C447C';
    const app = document.getElementById('app');
    app.style.maxWidth = '440px';
    app.style.height = '72%';
    app.style.margin = '14% auto';
    app.style.borderRadius = '44px';
    app.style.overflow = 'hidden';
    app.style.boxShadow = '0 40px 90px rgba(0,0,0,0.45)';
    app.style.border = '10px solid rgba(255,255,255,0.18)';
    document.querySelectorAll('.mk-top,.mk-bot').forEach(e => e.remove());
    const fz = sc;
    const top = document.createElement('div');
    top.className = 'mk-top';
    top.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:' + (60 * fz) + 'px ' + (50 * fz) + 'px 0;text-align:center;color:#fff;z-index:9999;pointer-events:none;font-family:-apple-system,"PingFang SC",sans-serif';
    top.innerHTML = '<div style="font-size:' + (54 * fz) + 'px;font-weight:800;letter-spacing:-1px;line-height:1.12">' + h + '</div><div style="font-size:' + (25 * fz) + 'px;margin:' + (14 * fz) + 'px 0 0;opacity:0.92;font-weight:400">' + s + '</div>';
    document.body.appendChild(top);
    const bot = document.createElement('div');
    bot.className = 'mk-bot';
    bot.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:0 ' + (50 * fz) + 'px ' + (52 * fz) + 'px;text-align:center;color:#fff;z-index:9999;pointer-events:none;font-family:-apple-system,"PingFang SC",sans-serif';
    bot.innerHTML = '<div style="display:inline-flex;align-items:center;gap:' + (10 * fz) + 'px;justify-content:center"><span style="font-size:' + (28 * fz) + 'px">🌊</span><span style="font-size:' + (30 * fz) + 'px;font-weight:700;letter-spacing:1px">大蓝海</span></div><div style="font-size:' + (17 * fz) + 'px;margin:' + (6 * fz) + 'px 0 0;opacity:0.78">为每一次坚持，找到一片蓝海</div>';
    document.body.appendChild(bot);
  }, heading, sub, scale);
}

async function full(p) {
  await p.evaluate(() => {
    document.getElementById('app').style.maxWidth = '100%';
    document.querySelector('.statusbar').style.height = '60px';
  });
}

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  for (const size of SIZES) {
    const p = await b.newPage();
    await p.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 1 });
    const dir = path.join(DIR, size.name);
    const sc = size.w / 1242; // 字号缩放因子
    console.log('--- ' + size.name + ' ---');

    // 1. 首页
    await p.goto(fileUrl);
    await full(p);
    await wait(700);
    await beautify(p, COPY[0].h, COPY[0].s, sc);
    await wait(300);
    await p.screenshot({ path: path.join(dir, 'shot1_home.png') });
    console.log('shot1 home');

    // 2. 岛屿详情
    await p.goto(fileUrl);
    await full(p);
    await wait(500);
    await p.click('.island-card');
    await wait(500);
    await beautify(p, COPY[1].h, COPY[1].s, sc);
    await wait(300);
    await p.screenshot({ path: path.join(dir, 'shot2_island.png') });
    console.log('shot2 island');

    // 3. 21天满进度
    await p.evaluate(d => {
      localStorage.setItem('dalanhai', JSON.stringify({
        checkins: { qingxin: d, jieyan: d.slice(0, 6), jianshen: d.slice(0, 3) },
        certificates: [{ island: 'qingxin', date: '2026-07-24' }]
      }));
    }, dates21());
    await p.reload();
    await full(p);
    await wait(700);
    await p.click('.island-card');
    await wait(500);
    await beautify(p, COPY[2].h, COPY[2].s, sc);
    await wait(300);
    await p.screenshot({ path: path.join(dir, 'shot3_island_21.png') });
    console.log('shot3 island-21');

    // 4. 证书弹窗
    await p.evaluate(() => {
      document.getElementById('certTitle').textContent = '征服 清心岛';
      document.getElementById('certInfo').textContent = '清心岛 · 连续 21 天 · 2026-07-24';
      openMask('maskCert');
    });
    await wait(400);
    await beautify(p, COPY[3].h, COPY[3].s, sc);
    await wait(300);
    await p.screenshot({ path: path.join(dir, 'shot4_cert.png') });
    console.log('shot4 cert');

    // 5. 我的页
    await p.goto(fileUrl);
    await p.evaluate(d => {
      localStorage.setItem('dalanhai', JSON.stringify({
        checkins: { qingxin: d, jieyan: d.slice(0, 6), jianshen: d.slice(0, 3) },
        certificates: [{ island: 'qingxin', date: '2026-07-24' }]
      }));
    }, dates21());
    await p.reload();
    await full(p);
    await wait(700);
    await p.evaluate(() => switchTab('mine'));
    await wait(600);
    await beautify(p, COPY[4].h, COPY[4].s, sc);
    await wait(300);
    await p.screenshot({ path: path.join(dir, 'shot5_mine.png') });
    console.log('shot5 mine');
    await p.close();
  }

  const p2 = await b.newPage();
  await p2.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });
  await p2.goto(iconUrl);
  await wait(400);
  await p2.screenshot({ path: path.join(__dirname, 'icon-1024.png') });
  console.log('icon ok');

  await b.close();
  console.log('ALL DONE');
})().catch(e => { console.error('ERR', e); process.exit(1); });
