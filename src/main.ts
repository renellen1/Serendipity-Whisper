import { Plugin, PluginSettingTab, App, Setting, WorkspaceLeaf } from 'obsidian';
import { Indexer } from './indexer';
import { WhisperView, WHISPER_VIEW_TYPE } from './view';

interface SerendipityWhisperSettings {
    excludedFolders: string;
}

const DEFAULT_SETTINGS: SerendipityWhisperSettings = {
    excludedFolders: ''
}

export default class SerendipityWhisperPlugin extends Plugin {
    settings: SerendipityWhisperSettings;
    indexer: Indexer;
    debounceTimer: NodeJS.Timeout | null = null;
    view: WhisperView | null = null;

    async onload() {
        await this.loadSettings();

        this.indexer = new Indexer(this.getExcludedFoldersArray());
        
        this.registerView(
            WHISPER_VIEW_TYPE,
            (leaf) => (this.view = new WhisperView(leaf, this))
        );

        this.addRibbonIcon('sparkles', 'Open Serendipity Whisper', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-serendipity-whisper',
            name: 'Open Serendipity Whisper View',
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
            this.app.workspace.on('editor-change', (editor) => {
                if (this.debounceTimer) {
                    clearTimeout(this.debounceTimer);
                }
                
                this.debounceTimer = setTimeout(() => {
                    const cursor = editor.getCursor();
                    const text = editor.getLine(cursor.line);
                    this.handleEditorChange(text);
                }, 2000);
            })
        );

        this.registerEvent(this.app.vault.on('modify', (file) => {
            if ((file as any).extension === 'md') this.indexer.updateFile(this.app.vault, file as any);
        }));
        this.registerEvent(this.app.vault.on('create', (file) => {
            if ((file as any).extension === 'md') this.indexer.updateFile(this.app.vault, file as any);
        }));
        this.registerEvent(this.app.vault.on('delete', (file) => {
            if ((file as any).extension === 'md') this.indexer.removeFile(file.path);
        }));
    }

    async handleEditorChange(text: string) {
        if (!this.view || text.trim().length < 10) return;
        
        const matches = this.indexer.findMatches(text);
        if (this.view.updateMatches) {
            this.view.updateMatches(matches);
        }
    }

    async activateView() {
        const { workspace } = this.app;
        
        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(WHISPER_VIEW_TYPE);
        
        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if(leaf) {
                await leaf.setViewState({ type: WHISPER_VIEW_TYPE, active: true });
            }
        }
        
        if(leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    getExcludedFoldersArray(): string[] {
        return this.settings.excludedFolders.split('\n').map(f => f.trim()).filter(f => f.length > 0);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.indexer.excludedFolders = this.getExcludedFoldersArray();
    }
}

class SerendipityWhisperSettingTab extends PluginSettingTab {
    plugin: SerendipityWhisperPlugin;

    constructor(app: App, plugin: SerendipityWhisperPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('排除的文件夹 (Excluded Folders)')
            .setDesc('每行一个文件夹路径，例如: "journal" 或 "daily/2023"')
            .addTextArea(text => text
                .setPlaceholder('folder1\nfolder2')
                .setValue(this.plugin.settings.excludedFolders)
                .onChange(async (value) => {
                    this.plugin.settings.excludedFolders = value;
                    await this.plugin.saveSettings();
                }));
    }
}
