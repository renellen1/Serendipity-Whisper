# 🌌 Serendipity Whisper (灵感低语者)

> *“在知识的星空中，与过去的自己不期而遇。”* —— 纯本地、反重力 (Antigravity) 的 Obsidian 灵感引擎。

## 💡 核心理念 (The Vibe)

本项目遵循 **Vibe Coding** 的极简哲学开发：
- **反重力 (Antigravity)：** 拒绝臃肿的向量数据库，拒绝昂贵的云端大模型 API。
- **数据极简：** 100% 纯本地运行，数据不离 Vault。
- **安静陪伴：** 只有在你停下敲击键盘思考时，才会在侧边栏悄悄递上一片记忆的拼图。

## 🎯 痛点与解决方案

**痛点：** 记了无数笔记，但永远在“吃灰”。写新文章时，想不起曾经写过的绝妙灵感。
**解法：** 一个后台静默运行的 Obsidian 插件。通过极简的 TF-IDF 与 Bi-gram 算法，将你**当前正在书写的段落**与**全库历史笔记**进行相似度匹配，并在右侧边栏浮现最相关的一段历史上下文。

## ✨ 核心 MVP 功能

- [x] **防抖感知 (Debounced Listener):** 监听 `editor-change`，2 秒停顿后自动提取当前光标段落。
- [x] **极简大脑 (Local Matcher):** 纯 JS 实现的本地词频与相似度碰撞，毫秒级响应，不卡顿。
- [x] **侧边低语 (Sidebar Whisper):** 在右侧边栏 (ItemView) 优雅渲染匹配到的历史卡片，点击直达原文。
- [x] **智能排除 (Smart Exclude):** 提供专属设置页，支持配置排除大型文件夹，进一步提升索引效率。

## 🚀 快速启动 (Getting Started)

1. 将本项目克隆或复制到你的 Obsidian 插件目录：`YourVault/.obsidian/plugins/serendipity-whisper`
2. 安装依赖：`npm install`
3. 编译运行：执行 `npm run build` 进行打包（或 `npm run dev` 开启实时编译）
4. 在 Obsidian 设置中（第三方插件）开启该插件，点击侧边栏的 ✨ 图标或通过命令面板打开即可体验。

## 🛠️ 架构模块 (Architecture)

项目极致解耦，核心源码统一收纳于 `src/` 目录下，包含以下模块：
1. **`src/main.ts`** - 调度中心：负责插件生命周期、防抖监听与设置页面注册。
2. **`src/indexer.ts`** - 记忆引擎：插件启动时，在内存中过滤并扫描笔记，构建 TF-IDF 倒排索引。
3. **`src/matcher.ts`** - 碰撞算法：基于 Bi-gram 分词计算当前段落与历史索引的 Cosine 余弦相似度。
4. **`src/view.ts`** - 侧边栏 UI：原生的 Obsidian ItemView，极简 DOM 渲染生成交互式卡片。
5. **`styles.css`** - 提供卡片悬浮与淡入等微动画，遵循 Vibe Coding 视觉哲学。

## 宣言
*Code less, vibe more. Make it work, make it yours.*
