import { createCommentsServer, readConfig } from "./server.mjs";

const config = readConfig();
const comments = createCommentsServer(config);
comments.server.listen(config.port, config.host, () => {
  console.log(`Hawks Comments listening on ${config.host}:${config.port}`);
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, async () => {
    await comments.close();
    process.exit(0);
  });
