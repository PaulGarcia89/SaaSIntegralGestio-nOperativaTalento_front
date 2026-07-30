FROM node:20-slim

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
RUN pnpm build

EXPOSE 3001

CMD ["pnpm", "start", "--hostname", "0.0.0.0", "--port", "3001"]
