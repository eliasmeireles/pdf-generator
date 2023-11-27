# First, update the build image to one that includes JDK 19:
FROM gradle:jdk19 AS builder
WORKDIR /app

COPY . /app/

RUN gradle clean shadowJar

# Then, in the final image, manually install JDK 19:
FROM centos:latest

ENV CHROME_VERSION="119.0.6045.159"
ENV JAVA_HOME="/usr/java/jdk-19/"

RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*
RUN sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*

RUN yum update -y

RUN yum install -y wget

RUN mkdir -p "$JAVA_HOME"
RUN wget https://download.java.net/java/GA/jdk19.0.1/afdd2e245b014143b62ccb916125e3ce/10/GPL/openjdk-19.0.1_linux-x64_bin.tar.gz
RUN tar xvf openjdk-19.0.1_linux-x64_bin.tar.gz
RUN mv jdk-19.0.1/* "$JAVA_HOME"
RUN rm -rf jdk-19.0.1

# Add Java to PATH
ENV PATH=$PATH:$JAVA_HOME/bin

RUN wget https://dl.google.com/linux/chrome/rpm/stable/x86_64/google-chrome-stable-${CHROME_VERSION}-1.x86_64.rpm
RUN yum localinstall -y google-chrome-stable-${CHROME_VERSION}-1.x86_64.rpm

RUN curl --version

RUN curl https://dl.google.com/linux/chrome/rpm/stable/x86_64/google-chrome-stable-${CHROME_VERSION}-1.x86_64.rpm --output chrome.rpm

COPY --from=builder /app/build/libs/pdf-generator-1.0.0-all.jar /app.jar

ENV PORT 8080

EXPOSE $PORT

CMD java -jar /app.jar
