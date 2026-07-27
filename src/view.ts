import { ItemView, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { MatchResult } from './matcher';
import SerendipityWhisperPlugin from './main';

export const WHISPER_VIEW_TYPE = "serendipity-whisper-view";

export class WhisperView extends ItemView {
    plugin: SerendipityWhisperPlugin;
    containerEl: HTMLElement;

    constructor(leaf: WorkspaceLeaf, plugin: SerendipityWhisperPlugin) {
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
        this.containerEl.addClass('serendipity-whisper-container');
        this.renderEmpty();
    }

    async onClose() {
        // cleanup if needed
    }

    renderEmpty() {
        this.containerEl.empty();
        this.containerEl.createEl('div', { cls: 'whisper-empty', text: "沉浸书写，灵感自来..." });
    }

    updateMatches(matches: MatchResult[]) {
        this.containerEl.empty();
        
        if (matches.length === 0) {
            this.renderEmpty();
            return;
        }

        for (const match of matches) {
            const card = this.containerEl.createEl('div', { cls: 'whisper-card' });
            
            const header = card.createEl('div', { cls: 'whisper-card-header' });
            header.createEl('span', { cls: 'whisper-card-title', text: match.file });
            header.createEl('span', { cls: 'whisper-card-score', text: `${(match.score * 100).toFixed(0)}%` });
            
            card.createEl('div', { cls: 'whisper-card-content', text: match.content });
            
            card.addEventListener('click', async () => {
                await this.plugin.app.workspace.openLinkText(match.path, match.path, true);
                
                // 给一点点时间让视图加载完成
                setTimeout(() => {
                    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                    if (view && view.file && view.file.path === match.path) {
                        const text = view.getViewData();
                        const idx = text.indexOf(match.content);
                        if (idx !== -1) {
                            // 计算段落所在的行号
                            const line = text.substring(0, idx).split('\n').length - 1;
                            // 使用 Obsidian 原生的状态切换来滚动并高亮该行
                            view.setEphemeralState({ line: line });
                        }
                    }
                }, 100);
            });
        }
    }
}
