FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && mkdir -p /data && chown node:node /data
COPY --chown=node:node src ./src
USER node
ENV AGENT_DATA_DIR=/data
CMD ["node", "src/bot.mjs"]
