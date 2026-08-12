# Pre-baked base for docker-env-full's Dockerfile-build branches. Mirrors vc-docker's
# platform Dockerfile static prefix (FROM image, wait-for-it.sh, wkhtmltopdf apt-get) so
# per-run builds only do `COPY publish` + find/cp, skipping the ~20s apt-get every time.
#
# Rebuild only when the .NET base image or wkhtmltopdf version changes — see README.md.
FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:f1126d438ccc359f51cc6d4701a8deae513856cf10f5fe645d29ea6403dcac6b

RUN apt-get update && \
    apt-get install -y --no-install-recommends wkhtmltopdf=0.12.6-2build2 && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    wkhtmltopdf --version

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
