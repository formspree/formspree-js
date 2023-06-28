# Formspree Contribution Guide

Thanks for your interest in contributing to Formspree! Please take a moment to review this document **before submitting a pull request.**

If you want to contribute but aren't sure where to start, you can open a [new issue](https://github.com/formspree/formspree-react/issues).

## Prerequisites

This project uses [`yarn v1`](https://yarnpkg.com/) as a package manager.

## Setting up your local repo

Run the following commands from the root formspree-js directory:

```sh
yarn
yarn build # generate the artifact needed for depedendent packages
```

## Development environment

To play around with code while making changes, you can run the local development environment:

```sh
yarn dev
```

This will run an example app ([`examples/cra-demo`](../examples/cra-demo)) on [localhost:3000](http://localhost:3000) that uses create-react-app.

## Development commands

To run tests, typecheck on all packages:

```sh
yarn test
yarn typecheck
```

## Opening a Pull Request

When opening a pull request, include a changeset with your pull request:

```sh
yarn changeset
```

The changeset files will be committed to main with the pull request. They will later be used for releasing a new version of a package.

_Note: non-packages (examples/\*) do not need changesets._

## Releasing a new version

_Note: Only core maintainers can release new versions of formpree-js packages._

When pull requests are merged to `main`, a `release` Github Actions job will automatically generate a Version Package pull request, either creating a new one or updating an existing one.

When we are ready to publish a new version for one or more packages, simply approve the Version Package pull request and merge it to `main`.

Once the pull request is merged, the `release` GitHub Actions job will automatically tag and push the new versions of the affected packages and publish them to npm.
