import { Marked } from 'marked';
export const markdownParser = new Marked({ extensions: [{
  name: 'admonition', level: 'block',
  start(src) { return src.indexOf(':::'); },
  tokenizer(src) {
    const match = /^:::(info|tip|warning|danger|error|success)\s*\n([\s\S]*?)\n:::[ \t]*(?:\n|$)/.exec(src);
    if (match) return { type: 'admonition', raw: match[0], kind: match[1], tokens: this.lexer.blockTokens(match[2]) };
  },
  renderer(token) { return `<aside class="admonition admonition-${token.kind}">${this.parser.parse(token.tokens)}</aside>`; }
}] });
