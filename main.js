var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SerendipityWhisperPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/matcher.ts
var Matcher = class {
  static tokenize(text) {
    const cleanText = text.replace(/[\s\p{P}]+/gu, "").toLowerCase();
    const tokens = [];
    for (let i = 0; i < cleanText.length - 1; i++) {
      tokens.push(cleanText.substring(i, i + 2));
    }
    if (cleanText.length === 1)
      tokens.push(cleanText);
    return tokens;
  }
  static computeTF(tokens) {
    const tf = /* @__PURE__ */ new Map();
    if (tokens.length === 0)
      return tf;
    const totalTokens = tokens.length;
    tokens.forEach((t) => {
      tf.set(t, (tf.get(t) || 0) + 1);
    });
    for (const [key, count] of tf.entries()) {
      tf.set(key, count / totalTokens);
    }
    return tf;
  }
};

// src/indexer.ts
var Indexer = class {
  constructor(excludedFolders) {
    this.blocks = [];
    this.idf = /* @__PURE__ */ new Map();
    this.excludedFolders = [];
    this.excludedFolders = excludedFolders;
  }
  isExcluded(path) {
    return this.excludedFolders.some((f) => path.startsWith(f + "/") || path === f);
  }
  async buildIndex(vault) {
    this.blocks = [];
    const files = vault.getMarkdownFiles();
    let documentCount = 0;
    const df = /* @__PURE__ */ new Map();
    for (const file of files) {
      if (this.isExcluded(file.path))
        continue;
      const content = await vault.cachedRead(file);
      const paragraphs = content.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 20);
      for (const p of paragraphs) {
        const tokens = Matcher.tokenize(p);
        if (tokens.length === 0)
          continue;
        const tf = Matcher.computeTF(tokens);
        this.blocks.push({
          path: file.path,
          filename: file.basename,
          content: p,
          tf
        });
        documentCount++;
        const uniqueTokens = new Set(tokens);
        uniqueTokens.forEach((t) => {
          df.set(t, (df.get(t) || 0) + 1);
        });
      }
    }
    this.idf.clear();
    for (const [token, count] of df.entries()) {
      this.idf.set(token, Math.log((documentCount + 1) / (count + 1)) + 1);
    }
  }
  async updateFile(vault, file) {
    if (this.isExcluded(file.path))
      return;
    this.blocks = this.blocks.filter((b) => b.path !== file.path);
    const content = await vault.cachedRead(file);
    const paragraphs = content.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 20);
    for (const p of paragraphs) {
      const tokens = Matcher.tokenize(p);
      if (tokens.length === 0)
        continue;
      const tf = Matcher.computeTF(tokens);
      this.blocks.push({
        path: file.path,
        filename: file.basename,
        content: p,
        tf
      });
    }
  }
  removeFile(path) {
    this.blocks = this.blocks.filter((b) => b.path !== path);
  }
  findMatches(text, topN = 3) {
    const tokens = Matcher.tokenize(text);
    if (tokens.length === 0)
      return [];
    const queryTF = Matcher.computeTF(tokens);
    const getMag = (tf) => {
      let sum = 0;
      for (const [t, val] of tf.entries()) {
        const idf = this.idf.get(t) || 1;
        sum += Math.pow(val * idf, 2);
      }
      return Math.sqrt(sum);
    };
    const queryMag = getMag(queryTF);
    if (queryMag === 0)
      return [];
    const scores = [];
    for (const block of this.blocks) {
      let dotProduct = 0;
      for (const [t, qVal] of queryTF.entries()) {
        if (block.tf.has(t)) {
          const idf = this.idf.get(t) || 1;
          dotProduct += qVal * idf * (block.tf.get(t) * idf);
        }
      }
      if (dotProduct > 0) {
        const blockMag = getMag(block.tf);
        const score = dotProduct / (queryMag * blockMag);
        if (score > 0.01 && block.content !== text) {
          scores.push({ block, score });
        }
      }
    }
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topN).map((s) => ({
      file: s.block.filename,
      path: s.block.path,
      content: s.block.content,
      score: s.score
    }));
  }
};

// src/view.ts
var import_obsidian = require("obsidian");
var WHISPER_VIEW_TYPE = "serendipity-whisper-view";
var WhisperView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return WHISPER_VIEW_TYPE;
  }
  getDisplayText() {
    return "Serendipity Whisper";
  }
  getIcon() {
    return "sparkles";
  }
  async onOpen() {
    this.containerEl = this.contentEl;
    this.containerEl.empty();
    this.containerEl.addClass("serendipity-whisper-container");
    this.renderEmpty();
  }
  async onClose() {
  }
  renderEmpty() {
    this.containerEl.empty();
    this.containerEl.createEl("div", { cls: "whisper-empty", text: "\u6C89\u6D78\u4E66\u5199\uFF0C\u7075\u611F\u81EA\u6765..." });
  }
  updateMatches(matches) {
    this.containerEl.empty();
    if (matches.length === 0) {
      this.renderEmpty();
      return;
    }
    for (const match of matches) {
      const card = this.containerEl.createEl("div", { cls: "whisper-card" });
      const header = card.createEl("div", { cls: "whisper-card-header" });
      header.createEl("span", { cls: "whisper-card-title", text: match.file });
      header.createEl("span", { cls: "whisper-card-score", text: `${(match.score * 100).toFixed(0)}%` });
      card.createEl("div", { cls: "whisper-card-content", text: match.content });
      card.addEventListener("click", async () => {
        await this.plugin.app.workspace.openLinkText(match.path, match.path, true);
        setTimeout(() => {
          const view = this.plugin.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
          if (view && view.file && view.file.path === match.path) {
            const text = view.getViewData();
            const idx = text.indexOf(match.content);
            if (idx !== -1) {
              const line = text.substring(0, idx).split("\n").length - 1;
              view.setEphemeralState({ line });
            }
          }
        }, 100);
      });
    }
  }
};

// src/main.ts
var DEFAULT_SETTINGS = {
  excludedFolders: ""
};
var SerendipityWhisperPlugin = class extends import_obsidian2.Plugin {
  constructor() {
    super(...arguments);
    this.debounceTimer = null;
    this.view = null;
  }
  async onload() {
    await this.loadSettings();
    this.indexer = new Indexer(this.getExcludedFoldersArray());
    this.registerView(
      WHISPER_VIEW_TYPE,
      (leaf) => this.view = new WhisperView(leaf, this)
    );
    this.addRibbonIcon("sparkles", "Open Serendipity Whisper", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-serendipity-whisper",
      name: "Open Serendipity Whisper View",
      callback: () => {
        this.activateView();
      }
    });
    this.addSettingTab(new SerendipityWhisperSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(async () => {
      await this.indexer.buildIndex(this.app.vault);
      this.registerEvents();
    });
  }
  registerEvents() {
    this.registerEvent(
      this.app.workspace.on("editor-change", (editor) => {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
          const cursor = editor.getCursor();
          const text = editor.getLine(cursor.line);
          this.handleEditorChange(text);
        }, 2e3);
      })
    );
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file.extension === "md")
        this.indexer.updateFile(this.app.vault, file);
    }));
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (file.extension === "md")
        this.indexer.updateFile(this.app.vault, file);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (file.extension === "md")
        this.indexer.removeFile(file.path);
    }));
  }
  async handleEditorChange(text) {
    if (!this.view || text.trim().length < 10)
      return;
    const matches = this.indexer.findMatches(text);
    if (this.view.updateMatches) {
      this.view.updateMatches(matches);
    }
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = null;
    const leaves = workspace.getLeavesOfType(WHISPER_VIEW_TYPE);
    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: WHISPER_VIEW_TYPE, active: true });
      }
    }
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
  getExcludedFoldersArray() {
    return this.settings.excludedFolders.split("\n").map((f) => f.trim()).filter((f) => f.length > 0);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.indexer.excludedFolders = this.getExcludedFoldersArray();
  }
};
var SerendipityWhisperSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("\u6392\u9664\u7684\u6587\u4EF6\u5939 (Excluded Folders)").setDesc('\u6BCF\u884C\u4E00\u4E2A\u6587\u4EF6\u5939\u8DEF\u5F84\uFF0C\u4F8B\u5982: "journal" \u6216 "daily/2023"').addTextArea((text) => text.setPlaceholder("folder1\nfolder2").setValue(this.plugin.settings.excludedFolders).onChange(async (value) => {
      this.plugin.settings.excludedFolders = value;
      await this.plugin.saveSettings();
    }));
  }
};
