export function stripMarkdown(value = "") {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, (match) => match.replace(/\((.*?)\)/, ""))
    .replace(/[#>*_`~\[\](){}/\\|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(value = "", length = 140) {
  const plain = stripMarkdown(value);
  if (plain.length <= length) return plain;
  return `${plain.slice(0, length).trim()}...`;
}
