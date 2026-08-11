# Platform base image

Pre-baked base for the platform image built by `docker-env-full`'s two Dockerfile-build
branches (`customPackagesJsonUrl` / `installCustomModule`). See the comment at the top of
`Dockerfile` in this directory for why this exists — in short: `vc-docker`'s platform
Dockerfile installs `wkhtmltopdf` via `apt-get` *after* the always-changing `COPY publish`
layer, so it can never be a Docker layer-cache hit there. Baking it into its own image,
pulled via a plain `docker pull` instead of built, sidesteps that: pulls from `ghcr.io` are
fast (measured 3-8s for comparable images in this pipeline), and a plain `docker build`
against this base has no build-time cost of its own — it's already sitting in the local
image cache once pulled.

`docker-env-full/Dockerfile.platform` builds `FROM` this (via a `BASE_IMAGE` build-arg) —
it's a small, static Dockerfile owned in this repo, not downloaded from `vc-docker` and
patched. The only part of the platform image that actually varies per build is the
`COPY publish` content itself; everything else (that `COPY`, the runtimes `find`/`cp`,
`WORKDIR`/`EXPOSE`/`ENV`/`ENTRYPOINT`) is generic boilerplate, so it's simpler and more
robust to own a copy of it than to regex-patch someone else's file on every build.

## When to rebuild

Only when the `.NET` base image version (`mcr.microsoft.com/dotnet/aspnet:<version>`) or
the `wkhtmltopdf` version needs to change — both rare. Keep this in sync with whatever
`vc-docker`'s platform Dockerfile currently uses for those two things. If `vc-docker` ever
changes the boilerplate part (the `find`/`cp` logic, `WORKDIR`, etc.), update
`docker-env-full/Dockerfile.platform` to match — it's not automatically synced.

## Build and publish

`wait-for-it.sh` in this directory is checked into this repo — it's the file that actually
gets baked into the image, so if `vc-docker`'s copy has changed, update this tracked copy
deliberately (and re-review it) rather than re-fetching it at build time.

```sh
cd docker-env-full/base-image
docker build -t ghcr.io/virtocommerce/platform-base:10.0-wkhtmltopdf .
docker push ghcr.io/virtocommerce/platform-base:10.0-wkhtmltopdf
docker inspect --format='{{index .RepoDigests 0}}' ghcr.io/virtocommerce/platform-base:10.0-wkhtmltopdf
```

Requires push access to the `VirtoCommerce` GitHub Container Registry namespace. This is a
manual/occasional step for now, not wired into any CI workflow — automating it (e.g. a
scheduled or manually-triggered `workflow_dispatch` in this repo) is a reasonable follow-up
once this approach is confirmed to actually help on a real run.
Local push from developer's machine can use gh token: `echo $(gh auth token) | docker login ghcr.io -u <your-github-username> --password-stdin`, then change package visibility to `public` at https://github.com/orgs/VirtoCommerce/packages/container/package/platform-base.

After pushing, update every `platformBaseImage` default/usage to the digest printed above
(`ghcr.io/virtocommerce/platform-base@sha256:...`), not the floating `10.0-wkhtmltopdf` tag —
the tag can be overwritten by a later push, so consumers should pin to the digest for a
reproducible build.
