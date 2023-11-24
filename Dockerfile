# First, update the build image to one that includes JDK 19:
FROM gradle:jdk19 AS builder
WORKDIR /app

COPY . /app/

RUN gradle clean shadowJar

FROM centos:latest

WORKDIR pdf-server

ENV JAVA_HOME="/usr/java/jdk-19/"

RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*
RUN sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*

RUN yum update -y

RUN yum install -y wget

# Add Java to PATH
ENV PATH=$PATH:$JAVA_HOME/bin

RUN mkdir -p "$JAVA_HOME"
RUN wget https://download.java.net/java/GA/jdk19.0.1/afdd2e245b014143b62ccb916125e3ce/10/GPL/openjdk-19.0.1_linux-x64_bin.tar.gz
RUN tar xvf openjdk-19.0.1_linux-x64_bin.tar.gz
RUN mv jdk-19.0.1/* "$JAVA_HOME"

RUN curl -sL https://rpm.nodesource.com/setup_20.x | bash -
RUN yum install -y nodejs
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum install -y yarn

COPY --from=builder /app/build/libs/pdf-generator-1.0.0-all.jar /app.jar
COPY ./pdf-node/lib/ /pdf-server
COPY ./pdf-node/package.json /pdf-server/
COPY ./boot /pdf-server/

ENV PORT 8080

EXPOSE $PORT
EXPOSE $3100

RUN yarn install --production

CMD sh ./boot
