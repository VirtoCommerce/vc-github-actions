FROM alpine:3.14

COPY argocd-linux-amd64 /

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x ./argocd-linux-amd64 \
    && mv /argocd-linux-amd64 /usr/local/bin/argocd

ENTRYPOINT ["/entrypoint.sh"]