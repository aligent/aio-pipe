FROM aligent/aio

RUN mkdir /pipe
WORKDIR /pipe

RUN apk add wget 
RUN wget -P / https://bitbucket.org/bitbucketpipelines/bitbucket-pipes-toolkit-bash/raw/0.4.0/common.sh

COPY tsconfig.json ./
COPY pack*.json ./
RUN npm ci
COPY entrypoint.sh ./
COPY pipe ./pipe
RUN chmod a+x ./pipe/*.ts entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
