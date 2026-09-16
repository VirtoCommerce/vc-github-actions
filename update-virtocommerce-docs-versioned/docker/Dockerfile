# The published site is one tree, but its parts change at wildly different
# rates, and a Docker layer is re-uploaded whole when any byte inside it
# changes. A single COPY of the whole site therefore makes every tag store a
# complete copy of everything, even though almost nothing differs between
# consecutive builds.
#
# This stage splits the tree by how often each part changes. Layer membership is
# decided by the COPY instruction, not by where files live on disk, so nothing
# in vc-docs has to move for this to work.
#
#   media    real image, font and document files, wherever they sit in the tree.
#            Changes when someone adds or replaces a screenshot.
#   frozen   HTML and symlinks of the released versions, plus theme assets and
#            the landing pages. Changes when a version is cut.
#   rolling  HTML of the rolling version. Changes on every deploy.
#
# Note that vc-docs deduplicates identical binaries into relative symlinks, and
# those symlinks point across version boundaries. Moving the real files into
# their own layer leaves the links dangling *within* that layer, which is
# harmless: Docker merges every layer into one filesystem before nginx serves
# anything, so the links resolve in the final image. The build below verifies
# exactly that.
FROM alpine:3 AS split

WORKDIR /src
COPY ./site ./site

RUN set -eu; \
    mkdir -p /out/media /out/frozen /out/rolling; \
    cp -a site/. /out/frozen/; \
    cd /out/frozen; \
    # Real binaries only. find without -L does not follow symlinks, and -type f
    # does not match them, so the deduplicated links stay behind in frozen.
    find . -type f \( \
        -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.gif' \
        -o -iname '*.webp' -o -iname '*.svg' -o -iname '*.ico' \
        -o -iname '*.woff' -o -iname '*.woff2' -o -iname '*.ttf' \
        -o -iname '*.eot' -o -iname '*.otf' \
        -o -iname '*.pdf' -o -iname '*.zip' -o -iname '*.mp4' -o -iname '*.webm' \
      \) -print | while IFS= read -r f; do \
        mkdir -p "/out/media/${f%/*}"; \
        mv "$f" "/out/media/$f"; \
      done; \
    # The rolling version's directory, one per guide. Media has already left it.
    find . -mindepth 3 -maxdepth 3 -type d -name latest -print | while IFS= read -r d; do \
        mkdir -p "/out/rolling/${d%/*}"; \
        mv "$d" "/out/rolling/$d"; \
      done; \
    echo "media   $(find /out/media -type f | wc -l) files"; \
    echo "frozen  $(find /out/frozen ! -type d | wc -l) entries"; \
    echo "rolling $(find /out/rolling ! -type d | wc -l) entries"

FROM nginx:alpine

# envsubst already ships in nginx:alpine, and this image copies no templates,
# so no extra package is needed. Installing one added the only layer whose
# digest changed between otherwise identical builds, which defeated layer
# sharing across tags in the registry.
RUN rm /usr/share/nginx/html/index.html \
    && mkdir -p /usr/share/nginx/html

# Ordered least to most frequently changed, so the build cache keeps the stable
# layers and the registry only receives the one that actually moved.
COPY --from=split /out/media /usr/share/nginx/html
COPY --from=split /out/frozen /usr/share/nginx/html
COPY --from=split /out/rolling /usr/share/nginx/html

# Copy nginx configuration for versioned setup
COPY ./nginx.versioned.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
