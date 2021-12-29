FROM nginx:alpine

RUN rm /usr/share/nginx/html/index.html \
    && mkdir -p /usr/share/nginx/html/docs \
    && mkdir -p /usr/share/nginx/html/docs/2.0 \
    && apk update && apk add -u gettext

COPY ./vc-platform/site /usr/share/nginx/html/docs
COPY ./2.0/site /usr/share/nginx/html/docs/2.0
COPY ./nginx.default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
