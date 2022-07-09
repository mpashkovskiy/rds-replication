# FROM public.ecr.aws/lambda/nodejs:16
# COPY package.json package-lock.json ${LAMBDA_TASK_ROOT}/
# RUN npm install
# COPY resources/copy.js ${LAMBDA_TASK_ROOT}/

ARG FUNCTION_DIR="/function"

FROM node:14-buster

RUN apt-get update && \
    apt install -y \
    g++ \
    make \
    cmake \
    autoconf \
    libtool \
    wget \
    openssh-client \
    gnupg2

RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ buster-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && apt-get -y install postgresql-client-12


ARG FUNCTION_DIR

RUN mkdir -p ${FUNCTION_DIR} && chmod -R 755 ${FUNCTION_DIR}

WORKDIR ${FUNCTION_DIR}

COPY package.json package-lock.json ./
RUN npm install

COPY resources/*.js ./

ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]