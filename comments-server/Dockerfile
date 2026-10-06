FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN mkdir -p /data && chown node:node /data
COPY src ./src
USER node
CMD ["node", "src/main.mjs"]
