FROM nginx:alpine

RUN rm /usr/share/nginx/html/index.html \
    && mkdir -p /usr/share/nginx/html \
    && apk update && apk add -u gettext

# Copy versioned documentation from gh-pages branch
# This includes all versions, version selector, and mike assets
COPY ./vc-docs-versioned /usr/share/nginx/html

# Copy nginx configuration 
# The action.yml will have already copied the correct config to nginx.default.conf
COPY ./nginx.default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
