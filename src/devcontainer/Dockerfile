FROM mcr.microsoft.com/vscode/devcontainers/cpp:0-bionic

# OpenJDK 8
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository --yes ppa:rpardini/adoptopenjdk
RUN apt-get install -y adoptopenjdk-8-installer

# UML-RTS
RUN apt-get install -y libzmqpp-dev
ENV UMLRTS_ROOT /umlrts
COPY ./umlrts /umlrts
WORKDIR /umlrts
RUN make