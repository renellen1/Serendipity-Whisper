import { TFile, Vault } from 'obsidian';
import { Matcher } from './matcher';

export interface Block {
    path: string;
    filename: string;
    content: string;
    tf: Map<string, number>;
}

export class Indexer {
    blocks: Block[] = [];
    idf: Map<string, number> = new Map();
    excludedFolders: string[] = [];

    constructor(excludedFolders: string[]) {
        this.excludedFolders = excludedFolders;
    }

    isExcluded(path: string): boolean {
        return this.excludedFolders.some(f => path.startsWith(f + '/') || path === f);
    }

    async buildIndex(vault: Vault) {
        this.blocks = [];
        const files = vault.getMarkdownFiles();
        let documentCount = 0;
        const df = new Map<string, number>(); // document frequency

        for (const file of files) {
            if (this.isExcluded(file.path)) continue;
            const content = await vault.cachedRead(file);
            const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);
            
            for (const p of paragraphs) {
                const tokens = Matcher.tokenize(p);
                if (tokens.length === 0) continue;
                const tf = Matcher.computeTF(tokens);
                this.blocks.push({
                    path: file.path,
                    filename: file.basename,
                    content: p,
                    tf: tf
                });
                
                documentCount++;
                const uniqueTokens = new Set(tokens);
                uniqueTokens.forEach(t => {
                    df.set(t, (df.get(t) || 0) + 1);
                });
            }
        }

        // Calculate IDF
        this.idf.clear();
        for (const [token, count] of df.entries()) {
            this.idf.set(token, Math.log((documentCount + 1) / (count + 1)) + 1);
        }
    }

    async updateFile(vault: Vault, file: TFile) {
        if (this.isExcluded(file.path)) return;
        this.blocks = this.blocks.filter(b => b.path !== file.path);
        
        const content = await vault.cachedRead(file);
        const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);
        
        for (const p of paragraphs) {
            const tokens = Matcher.tokenize(p);
            if (tokens.length === 0) continue;
            const tf = Matcher.computeTF(tokens);
            this.blocks.push({
                path: file.path,
                filename: file.basename,
                content: p,
                tf: tf
            });
        }
    }

    removeFile(path: string) {
        this.blocks = this.blocks.filter(b => b.path !== path);
    }

    findMatches(text: string, topN: number = 3) {
        const tokens = Matcher.tokenize(text);
        if (tokens.length === 0) return [];
        const queryTF = Matcher.computeTF(tokens);

        const getMag = (tf: Map<string, number>) => {
            let sum = 0;
            for (const [t, val] of tf.entries()) {
                const idf = this.idf.get(t) || 1;
                sum += Math.pow(val * idf, 2);
            }
            return Math.sqrt(sum);
        };

        const queryMag = getMag(queryTF);
        if (queryMag === 0) return [];

        const scores: { block: Block, score: number }[] = [];

        for (const block of this.blocks) {
            let dotProduct = 0;
            for (const [t, qVal] of queryTF.entries()) {
                if (block.tf.has(t)) {
                    const idf = this.idf.get(t) || 1;
                    dotProduct += (qVal * idf) * (block.tf.get(t)! * idf);
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
        return scores.slice(0, topN).map(s => ({
            file: s.block.filename,
            path: s.block.path,
            content: s.block.content,
            score: s.score
        }));
    }
}
