#DEVELOPMENT

FROM node:18.7.0-bullseye-slim AS dev

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .

RUN yarn install --only=development

COPY . .

RUN yarn build

#PRODUCTION

FROM node:18.7.0-bullseye-slim AS prod

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src

COPY package.json ./app
COPY yarn.lock ./app

RUN yarn install --only-production

COPY . ./app

RUN npm run build && npm prune --production

CMD ["node", "dist/main"]
