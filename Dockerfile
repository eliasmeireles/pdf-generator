# First, update the build image to one that includes JDK 19:
FROM gradle:jdk17 AS builder
WORKDIR /app

COPY . /app/

RUN gradle clean shadowJar

# Then, in the final image, manually install JDK 19:
FROM centos:latest

ENV CHROME_VERSION="119.0.6045.105"
ENV JAVA_HOME="/usr/java/jdk-19/"

RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*
RUN sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*

RUN yum update -y

RUN yum install -y wget  java-17-openjdk

# Downloading JDK 19 (replace the URL with the correct one when it becomes available)
# RUN wget --no-cookies --no-check-certificate "https://rpmfind.net/linux/openmandriva/cooker/repository/x86_64/main/release/java-19-openjdk-19.0.2.7-1-omv2390.x86_64.rpm" -O /tmp/jdk19.rpm

# Install Java 19 and remove the downloaded file to clean up
# RUN yum install -y /tmp/jdk19.rpm && rm /tmp/jdk19.rpm

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
