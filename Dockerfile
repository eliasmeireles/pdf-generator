FROM node:18-alpine AS builder
WORKDIR /app

COPY ./pdf-node/package.json ./pdf-node/yarn.lock ./app/
RUN yarn install
COPY ./pdf-node /app/
RUN yarn build


FROM pdf-server:latest

WORKDIR /opt/app

COPY supervisord.conf /etc/

ENV PORT 8080
ENV PDF_GENERATOR_SERVER_PORT 3100

EXPOSE $PORT
EXPOSE $3100

COPY --from=builder /app/lib/* /opt/app/
COPY ./pdf-node/yarn.lock /opt/app/
COPY ./pdf-node/package.json /opt/app/

RUN yarn install --production

#CMD node app.js

CMD java -jar /app.jar

#CMD ["/usr/bin/supervisord"]
