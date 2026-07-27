import { ItemView, WorkspaceLeaf } from 'obsidian';
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
            
            card.addEventListener('click', () => {
                this.plugin.app.workspace.openLinkText(match.path, match.path, true);
            });
        }
    }
}
