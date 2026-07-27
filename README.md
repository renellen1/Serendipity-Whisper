# 🌌 Serendipity Whisper (灵感低语者)

> *“在知识的星空中，与过去的自己不期而遇。”* —— 纯本地的 Obsidian 灵感引擎。

## 💡 核心理念 (The Vibe)

本项目遵循 **Vibe Coding** 的极简哲学开发：
- **数据极简：** 100% 纯本地运行，数据不离 Vault。
- **安静陪伴：** 只有在你停下敲击键盘思考时，才会在侧边栏悄悄递上一片记忆的拼图。

## 🚀 快速启动 (Getting Started)

1. 将本项目克隆到你的 Obsidian 插件目录：`YourVault/.obsidian/plugins/serendipity-whisper`
2. 安装依赖：`npm install`
3. 编译运行：`npm run dev`
4. 在 Obsidian 设置中开启插件，打开右侧边栏即可体验。

## 🛠️ 架构模块 (Architecture)

项目极致解耦，仅包含 4 个核心模块：
1. **`main.ts`** - 调度中心：负责插件生命周期与视图注册。
2. **`indexer.ts`** - 记忆引擎：插件启动时，在内存中构建倒排索引。
3. **`matcher.ts`** - 碰撞算法：计算当前段落与历史索引的 Cosine / Jaccard 相似度。
4. **`view.ts`** - 侧边栏 UI：极简 DOM 渲染，零 UI 框架依赖。


