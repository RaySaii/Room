FROM node

# Build app
RUN mkdir -p /usr/src/app  
WORKDIR /usr/src/app  
COPY . /usr/src/app

RUN npm install --production
# ENV NODE_ENV production
RUN user$ mongo --host localhost --port 27017

EXPOSE 3000

CMD [ "node","server/server.js"]  