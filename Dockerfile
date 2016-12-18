FROM node

# Build app
RUN mkdir -p /usr/src/app  
WORKDIR /usr/src/app  
COPY . /usr/src/app

RUN npm install --production
# ENV NODE_ENV production
RUN --name some-app --link some-mongo:mongo -d application-that-uses-mongo

RUN -it --link some-mongo:mongo --rm daocloud.io/mongo sh -c 'exec mongo "$MONGO_PORT_27017_TCP_ADDR:$MONGO_PORT_27017_TCP_PORT/Chat"'

EXPOSE 3000

CMD [ "node","server/server.js"]  