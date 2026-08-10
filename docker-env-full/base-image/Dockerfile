# Pre-baked base for the platform image built by docker-env-full's two Dockerfile-build
# branches (customPackagesJsonUrl / installCustomModule). Mirrors the static prefix of
# vc-docker's platform Dockerfile — the FROM image, wait-for-it.sh, and the wkhtmltopdf
# apt-get install — so every per-run build only has to do `COPY publish` + the runtimes
# find/cp, instead of re-running apt-get (~20s) on every single build.
#
# Rebuild only when the .NET base image version or the wkhtmltopdf version changes (rare) —
# see README.md in this directory for the build+push command.
FROM mcr.microsoft.com/dotnet/aspnet:10.0

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

RUN apt-get update && \
    apt-get install -y --no-install-recommends wkhtmltopdf && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    wkhtmltopdf --version
