FROM node:18-alpine3.17

WORKDIR /usr/src/api
COPY package.json ./
COPY package-lock.json ./

ENV NODE_ENV=development

RUN npm i
RUN npm i nodemon -g

COPY . .

CMD ["npm" , "run" , "dev-prisma" , "&&" , "node" , "./index.mjs"]