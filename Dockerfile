FROM node:12.9.0-alpine

COPY . /app

WORKDIR /app

RUN yarn && yarn build

ENV NODE_ENV=production

ENTRYPOINT yarn start

EXPOSE 3000
