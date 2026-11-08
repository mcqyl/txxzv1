# 苔溪小镇 · 代码奇旅 —— 零依赖 Node 服务
# 构建：docker build -t mossbrook .
# 运行：docker run -d -p 8080:8080 -e SUB2API_API_KEY=sk-xxx -e MIMO_API_KEY=sk-xxx mossbrook
FROM node:22-alpine

WORKDIR /app

# 项目没有第三方依赖，直接复制源码即可
COPY . .

ENV PORT=5173
EXPOSE 5173

CMD ["node", "scripts/serve.mjs"]
