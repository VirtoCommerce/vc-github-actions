FROM nginx:alpine

RUN rm /usr/share/nginx/html/index.html \
    && mkdir -p /usr/share/nginx/html \
    && apk update && apk add -u gettext

# Copy versioned documentation (gh-pages branch content)
COPY ./vc-docs/site /usr/share/nginx/html

# Copy nginx configuration (selected by action based on deployment mode)
COPY ./nginx.default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
