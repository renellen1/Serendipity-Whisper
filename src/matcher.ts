export interface MatchResult {
    file: string;
    path: string;
    content: string;
    score: number;
}

export class Matcher {
    static tokenize(text: string): string[] {
        // Remove whitespace and punctuation, convert to lowercase
        const cleanText = text.replace(/[\s\p{P}]+/gu, '').toLowerCase();
        const tokens: string[] = [];
        for (let i = 0; i < cleanText.length - 1; i++) {
            tokens.push(cleanText.substring(i, i + 2));
        }
        if (cleanText.length === 1) tokens.push(cleanText);
        return tokens;
    }

    static computeTF(tokens: string[]): Map<string, number> {
        const tf = new Map<string, number>();
        if (tokens.length === 0) return tf;
        const totalTokens = tokens.length;
        tokens.forEach(t => {
            tf.set(t, (tf.get(t) || 0) + 1);
        });
        for (const [key, count] of tf.entries()) {
            tf.set(key, count / totalTokens);
        }
        return tf;
    }
}
