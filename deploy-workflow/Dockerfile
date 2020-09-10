FROM debian:10.1

RUN apt update \
    && apt -y upgrade \
    && apt install -y hub \
    && apt install -y curl \
    && apt install -y jq \
    && apt autoremove \
    && apt autoclean \
    && apt clean

ADD entrypoint.sh /entrypoint.sh
ADD workflows /workflows
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]