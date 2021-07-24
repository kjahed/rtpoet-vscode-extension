FROM mcr.microsoft.com/vscode/devcontainers/cpp:0-bionic

# OpenJDK 8
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository --yes ppa:rpardini/adoptopenjdk
RUN apt-get install -y adoptopenjdk-8-installer

# Node.js
RUN curl -sL https://deb.nodesource.com/setup_15.x -o nodesource_setup.sh
RUN chmod +x nodesource_setup.sh
RUN ./nodesource_setup.sh
RUN apt-get install -y nodejs

# UML-RTS
ENV UMLRTS_ROOT /umlrts
COPY ./umlrts /umlrts
WORKDIR /umlrts
RUN make