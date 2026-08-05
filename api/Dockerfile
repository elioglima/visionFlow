FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package.json ./
RUN npm install

COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 3333

CMD ["./docker-entrypoint.sh"]
