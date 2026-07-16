FROM node:20-slim

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json ./
RUN npm install --include=dev

COPY . .

ENV NODE_ENV=production
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3001"]
