FROM node:18

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npx prisma generate

ENV SERVER_PORT=3000

EXPOSE $SERVER_PORT

CMD [ "node", "server.js" ]