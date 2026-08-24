FROM nginx:alpine

# envsubst already ships in nginx:alpine, and this image copies no templates,
# so no extra package is needed. Installing one added the only layer whose
# digest changed between otherwise identical builds, which defeated layer
# sharing across tags in the registry.
RUN rm /usr/share/nginx/html/index.html \
    && mkdir -p /usr/share/nginx/html

# Copy versioned documentation (from gh-pages + root/intermediate sites)
COPY ./site /usr/share/nginx/html

# Copy nginx configuration for versioned setup
COPY ./nginx.versioned.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

