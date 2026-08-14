import fs from "node:fs";
import path from "node:path";

const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}).formatToParts(new Date());

const value = (type) => parts.find((part) => part.type === type)?.value ?? "";
const date = `${value("year")}-${value("month")}-${value("day")}`;
const time = `${value("hour")}${value("minute")}`;
const note = process.argv.slice(2).join(" ").trim();
const directory = path.join(process.cwd(), "content", "talks");
const basePath = path.join(directory, `${date}.md`);
const filePath = fs.existsSync(basePath)
  ? path.join(directory, `${date}-${time}.md`)
  : basePath;
const status = note ? "published" : "draft";
const contents = `---\ndate: ${date}\nstatus: ${status}\n---\n\n${note}\n`;

fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(filePath, contents, { flag: "wx" });

console.log(path.relative(process.cwd(), filePath));
