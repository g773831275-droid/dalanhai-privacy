# AGENTS.md

本文件供 AI 编码代理（及协作者）快速理解「大蓝海」项目。改动代码前请先读完。

## 项目简介

**大蓝海（GRAND BLUE）** 是一款男性自律打卡 iOS App，大航海探险主题。核心玩法：4 座官方岛屿（清心岛 / 戒烟岛 / 健身岛 / 早睡岛）+ 自定义岛屿 + 每日打卡 + 21 天连续打卡达成「征服证书」+ 客服微信进官方自律群。

App 内四个主板块（底栏 Tab）：
- **岛屿** — 航海报 + 四座岛屿卡 + 打卡/21 天进度/征服证书
- **港口** — 瀑布流 UGC 社区（航海日志），支持发帖（文字+配图+岛屿标签）、点赞、筛选
- **消息** — 系统通知 / 互动 / 群组邀请等消息列表
- **船长** — 个人航海档案（军衔/统计/证书墙）；未登录时提供手机验证码 / 邮箱 / 账号密码三种注册登录

底栏「港口」与「消息」之间有一个常驻的**居中凸起金色「+」发布按钮**（小红书/抖音式排版），点击打开发帖弹窗。

- **定位**：习惯记录工具（App Store 12+ 分级）
- **开发者**：kaiteng guan（苹果**个人**开发者账号，非公司）
- **商业模式**：App 内零收费、无 IAP。盈利靠「看广告补签」（首版隐藏，开关 `AD_MAKEUP_ENABLED=false`）+ 客服微信引流进官方群（私域沉淀，远期变现）
- **后端**：无。所有数据存 localStorage，纯本地。账号注册/登录为**本地模拟**（无真实后端/短信服务），上线真实账号需另接后端。

## 技术栈

- 纯前端 H5（单文件 `index.html`，约 1000 行）+ **Capacitor 6.1.2** 打包 iOS
- 无前端框架、无构建步骤；原生 HTML/CSS/JS，`render()` 函数驱动视图
- 字体：Google Fonts 的 **Cinzel**（标题/数字）+ **Noto Serif SC**（中文标题）+ **Noto Sans SC**（正文），离线降级为系统字体
- 主题：深海蓝（`#04101F`/`#0A1F3D`/`#123A6B`）+ 帝国金（`#E8B84A`/`#F7D77A`）+ 羊皮纸（`#F1E4C6`），CSS 变量集中在 `:root`
- 截图生成用 **Puppeteer 25**（devDependency，本地渲染营销图）
- 图标处理用 **Python + Pillow**

## 仓库结构

```
dalanhai/                        # 构建源（Codemagic 从此目录构建）
├── index.html                   # H5 App 主体（GRAND BLUE V1.2，四 Tab 全功能）
├── capacitor.config.json        # appId=com.kaitengguan.dalanhai, webDir=www
├── package.json                 # Capacitor 6.1.2 (deps) + puppeteer (devDep)
├── codemagic.yaml               # CI/CD 构建配置（见下）
├── privacy-policy.html          # 隐私政策，GitHub Pages 托管
├── wechat-qr.jpg                # 客服微信二维码（App 内展示，真实图片）
├── icon.png                     # 1024×1024 应用图标源文件（CI 用 --assetPath . 读取）
├── make_icon.py                 # 图标处理脚本（裁正方形+去透明+缩放 1024）
├── marketing-shots.html         # iPhone 营销截图设计稿
├── marketing-screenshot.js      # iPhone 截图脚本 → shots/6.5inch-1242x2688/
├── ipad-shots.html              # iPad 13" 营销截图设计稿
├── ipad-screenshot.js           # iPad 截图脚本 → shots/ipad-13inch-2048x2732/
├── shots/                       # App Store 上架截图产物
├── assets/                      # @capacitor/assets 备用目录（当前用根目录 icon.png）
├── AGENTS.md                    # 本文件
└── 上架打包指南.md / 上架待办清单.md  # 流程笔记

dalanhai-deploy/                 # 预览用副本（index.html + wechat-qr.jpg）
                                 # 与 dalanhai/index.html 保持同步；改 UI 时两边都要更新
```

> `ios/` 与 `www/` 目录由 CI 在构建时动态生成，**不提交到仓库**（见 `.gitignore`）。
> 修改 `index.html` 后，务必同步到 `dalanhai/`（构建源）和 `dalanhai-deploy/`（预览）两处。

## App 架构与功能模块

单文件 `index.html`，无路由库。`currentView={tab,island}` 状态 + `render()` 重渲染。

| Tab | 渲染函数 | 功能 |
|---|---|---|
| 岛屿 `islands` | `renderIslands()` / `renderIsland(id)` | 航海报（已征服 X 次 · 最长连续 Y 天）、四岛卡、岛屿详情（21 天进度格、扬帆打卡、看广告补签） |
| 港口 `port` | `renderPort()` | 2 列瀑布流 UGC（`SEED_POSTS` 种子 + 用户发布），筛选标签，点赞；发帖走 `openComposer()` |
| 消息 `msg` | `renderMsg()` | 消息列表（系统/互动/群组），红点 badge |
| 船长 `captain` | `renderCaptain()` | 未登录→登录注册卡（手机/邮箱/账号三方式，登录/注册切换）；已登录→船长档案+军衔+统计+证书墙+设置 |

**数据 / 存储（localStorage）：**
- `dalanhai_v2` — 主数据对象：`{checkins:{岛屿id:[日期]}, certificates:[{island,date}], posts:[...], user:{name,avatar,method}}`
- 旧键 `dalanhai` / `dalanhai_user` / `dalanhai_posts`（V1.1）已弃用
- 打卡逻辑：`streak(id)` 连续天数、`doCheckin(id)` 打卡并检测 21 天达成发证书
- `AD_MAKEUP_ENABLED=false`：隐藏「看广告补签」按钮；接入真实广告 SDK 后改 `true`

**登录为本地模拟**：手机方式演示验证码 `123456`（60s 倒计时），任意合法输入即创建本地 user。真实账号需后端 + 短信服务商。

## 本地开发

```bash
npm install
# 预览 App（推荐起静态服务器，避免 file:// 下图片/字体跨域）
python -m http.server 8080 --directory dalanhai-deploy   # 访问 http://localhost:8080
# 生成上架截图（需先 npm install 装 puppeteer）
node marketing-screenshot.js     # iPhone 6.5" 5 张
node ipad-screenshot.js          # iPad 13" 3 张
# 处理图标（需 Pillow，venv 在 ~/.workbuddy/binaries/python/envs/default）
python make_icon.py
```

> 原生 iOS 工程（`npx cap add ios` / `cap sync`）需要 Mac + Xcode，本机无 Mac，故原生部分全部在 Codemagic 云端完成。

## CI/CD（Codemagic）

构建配置在 `codemagic.yaml`，由 Codemagic 从 GitHub 仓库拉取并执行。关键步骤与注意事项：

1. **Prepare web assets**：把 `index.html`、`wechat-qr.jpg` 复制进 `www/`
2. **Add iOS platform**：首次构建 `npx cap add ios` 生成 `ios/`
3. **Sync**：`npx cap sync ios`
4. **Generate app icons**：`npx --yes @capacitor/assets generate --ios --assetPath .`（从仓库根目录读 `icon.png`，生成全套 iOS 图标）
5. **Set build number**：用 Codemagic 内置 `$BUILD_NUMBER` 写入 `CFBundleVersion`——**每次上传构建号必须递增**，否则苹果以「构建号重复」拒绝
6. **Declare no encryption**：`ITSAppUsesNonExemptEncryption=false`，免每次手动回答加密合规
7. **Set up code signing**：`xcode-project use-profiles` 自动关联上传到 Codemagic 的分发证书 + Provisioning Profile
8. **Build IPA**：动态读取 `PROVISIONING_PROFILE_SPECIFIER` 写入 `export_options.plist` 再 `xcode-project build-ipa`
9. **Publishing**：`app_store_connect`（`auth: integration`，集成名 **大蓝海**）自动上传到 App Store Connect；`submit_to_testflight: false`（上架不走外部测试）

**签名物料**（已上传到 Codemagic 的 Code signing）：App Store 分发证书 + Provisioning Profile，均命名为 `dalanhai`。

## 代码签名 / 上架关键参数

| 项 | 值 |
|---|---|
| Bundle ID | `com.kaitengguan.dalanhai` |
| Team ID | `5QLTMB4JGC` |
| App Store Connect 集成名 | `大蓝海`（中文名可用，yaml 里直接写） |
| App ID (ASC) | 6794131987 |
| 隐私政策 URL | GitHub Pages（仓库 `g773831275-droid/dalanhai-privacy`） |
| 版权字段 | `© 2026 kaiteng guan` |

## 关键约束（改代码/文案时务必遵守）

### iOS 合规（个人开发者 + 12+ 分级）
- **「戒色岛」必须叫「清心岛」**——原命名有 Adult Content 审核风险，已在全项目改名
- 整体定位统一为「习惯记录工具」，不得出现性暗示/色情擦边内容
- 无 IAP、无退款逻辑；首版不接入广告 SDK（`AD_MAKEUP_ENABLED=false`，提交前务必确认仍为 false）
- 账号系统当前为**本地模拟**，未接后端。若上线真实账号：需后端 + 短信服务，并满足 App Store 5.1.1(v) 账号删除要求（现有「注销账号」入口保留）
- 港口 UGC 当前为**本地种子数据**，无服务器。若上线真实 UGC：需接入内容审核机制 + 举报/拉黑用户功能 + 联系方式（App Store 4.0 最小可行性要求）
- 客服入口仅展示微信二维码图片，**不接入在线客服 SDK**；App 内不直接拉起微信群
- 所有用户数据仅存本地 localStorage，不上传任何服务器（隐私政策已据此声明；接后端后需同步更新隐私政策）
- 联系方式：客服微信 `abccba978`，邮箱 `gktvipyx@163.com`，开发者姓名 `kaiteng guan`——三处需与隐私政策、App Store Connect 资料一致

### 文案红线
- 描述/关键词/截图**不得出现「戒色」字样**，用「清心」「自律」替代
- 不得承诺疗效、不得渲染焦虑

### 构建
- 改 `codemagic.yaml` 后通过 GitHub 网页提交，再在 Codemagic 触发 Start build
- `icon.png` 必须是 1024×1024、无透明通道（`make_icon.py` 已处理）；文件名全小写
- 上传新构建前确认构建号会自动递增（依赖 `$BUILD_NUMBER`），不要手写固定值
- 改 `index.html` 后同步到 `dalanhai/` 与 `dalanhai-deploy/` 两处

## 截图规格

| 设备 | 尺寸 (px) | 数量 | 脚本 |
|---|---|---|---|
| iPhone 6.5" | 1242×2688 | 5 | `marketing-screenshot.js` |
| iPhone 6.1" | 1284×2778 | 5 | `marketing-screenshot.js`（改 viewport） |
| iPad 13" | 2048×2732 | 3 | `ipad-screenshot.js` |

视觉体系：深海蓝渐变 + 玻璃拟态卡片 + 帝国金成就点缀，主色 `#04101F`/`#0A1F3D`/`#123A6B`/`#E8B84A`（与 App 主题一致）。

## 相关文档

- `大蓝海PRD.md`（仓库上层）—— PRD 主文档 V1.2（免费化改造版，含第十二章 iOS 合规适配方案）
- `privacy-policy.html` —— 隐私政策全文
- `上架打包指南.md` / `上架待办清单.md` —— 上架流程笔记
- `dalanhai-deploy/index.html` —— 预览副本（与构建源同步）
