FROM node

# Build app
RUN mkdir -p /usr/src/app  
WORKDIR /usr/src/app  
COPY . /usr/src/app

RUN npm install --production
# ENV NODE_ENV production

EXPOSE 3000

CMD [ "node","server/server.js"]  