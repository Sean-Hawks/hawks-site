// eslint-disable-next-line @typescript-eslint/no-require-imports -- Next's plugin loads this adapter as CommonJS.
const { globSync: tinyGlobSync } = require("tinyglobby");

// Next's ESLint plugin only uses globSync to resolve root directories.
// Match fast-glob's literal-directory behavior instead of crawling its children.
function globSync(patterns, options) {
  return tinyGlobSync(patterns, { ...options, expandDirectories: false });
}

module.exports = { globSync };
