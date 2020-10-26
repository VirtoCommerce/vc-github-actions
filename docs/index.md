# Virto Commerce Continuous Integration

## Overview

Virto Commerce continuous integration based on GitHub Actions feature. It contain:

* yaml workflows, placed in Platform, Modules, Storefront repositories;
* special actions, placed in [VirtoCommerce/vc-github-actions](https://github.com/VirtoCommerce/vc-github-actions) repository;
* shared library, with common used in special actions components, placed in [@virtocommerce/vc-actions-lib](https://www.npmjs.com/package/@virtocommerce/vc-actions-lib)

![VC CI Comonents](media/GitHub-Actions-flows-VC-CI-Components.png)

## Workflows

Two type of workflows have been implemented main workflows and release alpha workflows.

### Main workflows

Main workflows implement base Virto Commerce CI:

* Module CI;
* Platform CI;
* Storefront CI;
* Theme CI.

Workflows triggers automatically on Pull Request or on Push to Master or Dev branches.

On Pull Request event workflows force only code checks
![Checks](media/GitHub-Actions-flows-Checks-Flow.png)

On Push to Dev branch event workflows force code checks, creates artifacts for alpha version (pre-release) and publish artifacts to GtHub packages (images for Platform and Storefront) or to Azure Blob Storage (zipped binaries for Modules or Themes).

![PreRelease Flow](media/GitHub-Actions-flows-PreRelease-Flow.png)

On Push to Master branch event workflows force code checks, creates artifacts for release version and publish artifacts to GtHub releases (zipped binaries for Platform, Storefront, Modules and Themes) to GtHub packages and Docker hub (images for Platform and Storefront). Also Nuget packages publish to [Virto Commerce Nuget Gallery](https://www.nuget.org/profiles/VirtoCommerce).

![Release flow](media/GitHub-Actions-flows-Release-Flow.png)

### Release alpha version workflows

Release alpha workflows allow to crete artifacts for alpha version (pre-release).

Release alpha version workflows:

* Release alpha Module CI;
* Release alpha Platform CI;
* Release alpha Storefront CI;
* Release alpha Theme CI.

Workflows triggers manually from specified branch, create alpha version artifacts and publish it to GtHub packages (images for Platform and Storefront) or to Azure Blob Storage (zipped binaries for Modules or Themes).

## Secrets

Create GitHub organization level secrets:

* REPO_TOKEN - Github user token, with access to organization repositories;
* BLOB_TOKEN - connection string to Azure Blob Storage;
* DOCKER_USERNAME - DockerHub user name,  with publish images privileges;
* DOCKER_TOKEN - DockerHub user token,  with publish images privileges;
* NUGET_KEY - Nuget repository key;
* SONAR_TOKEN - SonarCloud access token, with Execute Analysis and Create Project privileges.

## How to enable workflows in a new repository

1. Enable Github Actions feature.

