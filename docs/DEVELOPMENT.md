# Māori Words Battle 开发文档

## 1. 文档目的

本文档面向继续开发和验收本项目的开发者，说明实际工程位置、运行方式、代码结构、核心规则、数据边界与交付标准。已实现的界面和功能明细见 [`FEATURES.md`](./FEATURES.md)。

> 文档基线：2026-08-12。本项目当前是可单机演示的 Expo 原型，不是已完成云端联机、账号安全和上架验收的生产应用。

## 2. 工程位置

父目录 `Māori Words Battle/` 中同时存在两套工程：

| 位置 | 用途 | 是否继续开发游戏 |
| --- | --- | --- |
| 父目录下的 `app/`、`gradle/` | 初始的最小原生 Android 模板 | 否 |
| `maori-words-battle-demo/` | Expo + React Native + TypeScript 游戏演示 | 是 |

以下所有命令均在 `maori-words-battle-demo/` 目录执行。该目录也是实际 Git 仓库根目录。

## 3. 技术栈与运行环境

- Node.js 20+
- npm（仓库已提交 `package-lock.json`）
- Expo SDK 54
- React Native 0.81.5
- React 19.1
- TypeScript 5.9，开启 `strict`
- `expo-sqlite/kv-store`：单机资料持久化
- Supabase JS：仅完成可选客户端初始化和数据库草案，当前 UI 未接入云端数据

移动端调试可使用 Expo Go（SDK 54）、Android 模拟器或 iOS Simulator。iOS Simulator 需要 macOS 与 Xcode。

## 4. 本地启动

### 4.1 安装依赖

对全新工作区优先使用锁定文件进行可重复安装：

```bash
cd maori-words-battle-demo
npm ci
```

如果正在有意升级依赖并需要更新 `package-lock.json`，才使用 `npm install`。

### 4.2 启动 Metro

```bash
npm start
```

然后可以：

- 用 Expo Go 扫描终端中的二维码；
- 按 `a` 在 Android 模拟器中启动；
- 按 `i` 在 iOS Simulator 中启动。

也可直接运行：

```bash
npm run android
npm run ios
npm run web
```

Web 适合快速检查界面，不能替代 Android/iOS 真机验收。

### 4.3 USB Android 设备

手机无法访问电脑的局域网地址时，保持 Metro 运行并执行：

```bash
adb reverse tcp:8081 tcp:8081
npm run android -- --localhost
```

## 5. 配置与密钥

单机演示不需要任何账号或云端密钥。“Continue with Google/Facebook”只会在本地进入首页，不会调用 OAuth。

如需开发 Supabase 集成：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写：

```text
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

安全规则：

- 只能在移动端使用 Supabase 的 publishable key；
- 禁止将 service-role key、密码、token 或真实环境文件写入代码、文档、日志和 Git；
- `.env` 和 `.env*.local` 已被 `.gitignore` 忽略，提交前仍要检查 staged diff；
- `EXPO_PUBLIC_*` 会被打包进客户端，不能用于任何服务端秘密。

## 6. 目录和职责

```text
maori-words-battle-demo/
├── App.tsx                 # 当前所有页面、导航状态和游戏流程
├── index.ts                # Expo 入口，注册 App
├── src/
│   ├── gameData.ts         # 题库、模拟玩家和每日词汇
│   ├── rewards.ts          # Koru Points、商店商品和主题配置
│   ├── types.ts            # 界面、题目、房间和奖励类型
│   └── lib/supabase.ts      # 可选 Supabase 客户端初始化
├── supabase/schema.sql       # 表、RLS 和 Realtime 的起步草案
├── docs/FEATURES.md         # 当前功能和手工验收清单
├── app.json                 # Expo 应用元数据与平台标识
├── package.json             # npm 命令与依赖
└── tsconfig.json            # TypeScript 配置
```

`App.tsx` 当前是单文件原型架构。小范围的演示修改应尽量沿用当前风格；只有在引入真实认证、联机房间或可单测的领域逻辑时，再按页面、repository 和领域模块逐步拆分，不要为了“看起来规范”做一次性大重构。

## 7. 当前应用流程

```text
模拟登录
  → 首页
  → 创建房间 / 输入房间码
  → 大厅设置与准备
  → 15 秒答题
  → 即时学习反馈
  → 每 3 道题后的中场排行榜
  → 结果与 Koru Points
  → 生词复习 / 商店 / 返回首页
```

`Screen` 联合类型定义在 `src/types.ts`。`App.tsx` 使用 React state 切换页面，当前未引入独立导航库。

## 8. 核心业务规则

### 8.1 难度与出题

- Level 1 Kākano：根据英文或图片提示选择 Māori 词汇；
- Level 2 Tipu：根据 Māori 词汇/发音提示匹配英文含义；
- Level 3 Rākau：手动输入 Māori 词汇。

出题会选取“题目难度小于或等于房间难度”且符合分类的题目。候选题少于回合数时会循环使用，当前不随机打乱。Level 3 比较会去除首尾空格、转小写并移除长音符，因此例如 `kurī` 和 `kuri` 都可接受。

### 8.2 计分

正确答案的基础计分为：

```text
100 + 5 × 剩余秒数
```

额外奖励：

- 连续答对第 3 题：`+10`；
- 连续答对第 5 题：`+20`；
- 最后一回合答对：`+50`。

答错或超时得 `0` 分并重置 combo。模拟对手的正确率和分数包含本地随机数，不能用于公平竞技或自动化结果断言。

### 8.3 Koru Points 和商店

- 新本地资料初始为 `120` Koru Points；
- 对局结束时按 `floor(对局分数 / 20)` 发放；
- 每场对局只发放一次；
- 商品只能购买一次，当前仅保存“已拥有”状态，尚未实现装备和展示效果。

## 9. 状态与持久化

| 数据 | 当前存储 | 重启应用后 |
| --- | --- | --- |
| Koru Points | `expo-sqlite/kv-store` | 保留 |
| 已购买商品 ID | `expo-sqlite/kv-store` | 保留 |
| 主题 ID | `expo-sqlite/kv-store` | 保留 |
| 房间、对局、排行榜 | React 内存状态 | 丢失 |
| 生词列表 | React 内存状态 | 恢复为演示初始值 |

本地资料的 key 是 `maori-words-battle-profile-v1`。如果修改存储结构，需要考虑向后兼容或提升 key 版本，不要直接假设所有设备都没有旧数据。

## 10. 常见开发任务

### 10.1 新增词汇题

1. 在 `src/gameData.ts` 的 `QUESTIONS` 中新增完整 `Question`。
2. 使用唯一、稳定的 `id`，并确认 `level` 与 `category` 合法。
3. 保留 Māori 长音符，不要为了输入方便而删除正式拼写中的 macron。
4. 对 iwi、方言、发音和文化相关内容，在生产发布前获得教育者与相关 iwi 的审核；当前内容只是演示素材。
5. 执行类型检查，并手工走完相应难度与分类的对局。

### 10.2 新增页面

1. 先在 `src/types.ts` 的 `Screen` 中增加页面值。
2. 在 `App.tsx` 中添加页面的 render 函数和进入/返回路径。
3. 将 render 函数加入文件底部的 screen-to-renderer 映射。
4. 检查 Android 返回、小屏滚动、按钮禁用态和可访问性标签。

### 10.3 接入真实 Supabase 多人模式

`supabase/schema.sql` 只是起步草案，不应直接被视为生产数据模型。建议实施顺序：

1. 真实 OAuth 和 profile 创建；
2. 房间创建/加入、成员身份、准备状态和 Realtime 订阅；
3. 由服务端决定题序、计时、答案和分数，客户端不能自报可信成绩；
4. 云端资料、学习进度、生词和商店交易；
5. 滥用防护、速率限制、审计、隐私与内容审核。

在该里程碑内，应先为房间权限、计分幂等性、重连和并发提交写失败测试，再实现对应逻辑。RLS 策略也必须使用不同用户身份做实际验证。

## 11. 验证与交付

### 11.1 自动检查

```bash
npm run typecheck
```

验证 Android 导出链路时：

```bash
npx expo export --platform android --output-dir dist-android
```

`dist-android/` 是生成产物，已被 Git 忽略，不应提交。导出成功只能证明 JS bundle/静态资源可生成，不等于已在真机运行，也不等于已生成可上架 APK/AAB。

仓库当前没有自动化单元测试、端到端测试和 lint 命令，不要在交付说明中宣称这些检查已通过。引入关键领域逻辑时，应同步引入适合 Expo/TypeScript 的测试设置，先写失败用例再实现。

### 11.2 手工验收

按 [`FEATURES.md`](./FEATURES.md#manual-verification-checklist) 的清单在至少一个实际目标平台上走查。涉及的功能越小，验收路径也应越聚焦；但计分、持久化或大厅状态变更要检查完整对局。

### 11.3 提交前检查

```bash
git status --short
git diff --check
git diff
```

仅提交本任务相关文件，不格式化、回退或清理其他开发者的未提交修改。交付说明应分别列出：

- 本次改动的文件和行为；
- 实际执行的自动命令与结果；
- 实际完成的设备/手工验收；
- 未验证、受环境限制或仍属演示的部分。

## 12. 当前非目标与生产阻断项

下列项目尚未实现，不能在演示或文档中当作已完成能力：

- Google/Facebook/Apple 真实认证；
- 跨设备实时房间、邀请、在线状态和断线重连；
- 服务端权威题序、计时、答案与反作弊计分；
- 真实发音音频；
- 云端学习进度、生词、商店和主题同步；
- 商店物品装备与效果展示；
- 生产级隐私、审计、滥用防护和文化内容审核；
- Android/iOS 商店签名、构建、上架和发布运维。

## 13. 常见问题

### npm 安装出现 DNS 或 registry 错误

先检查：

```bash
npm config get registry
```

如果输出指向当前网络不可达的镜像，请切换到团队允许且可达的 registry 后重试。不要把包管理器认证 token 复制到 issue、聊天或日志中。

### Expo Go 连不上 Metro

- 确认电脑和手机在同一网络；
- 检查本机防火墙和 8081 端口；
- USB Android 可使用前文的 `adb reverse`；
- 排查缓存问题时可执行 `npx expo start --clear`。

### 修改配置后 Supabase 仍为空

确认变量名是 `EXPO_PUBLIC_SUPABASE_URL` 和 `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，然后完全重启 Metro。但要注意：“客户端初始化成功”仍不会让当前页面自动变成云端联机，需要另行实现认证、repository 和 Realtime 状态流。
