# Formspree JS

Monorepo containing the @formspree/core and @formspree/react packages. Built with [turborepo](https://turbo.build/).

## Installation, building, testing and development

The core and react packages can be installed directly from NPM using your package manager of choice. For example to install formspree-react with yarn, run:

```
yarn add @formspree/react
```

To work on the formspree-js packages, clone this repo, install dependencies, and use `turbo` to build, test and develop:

```
yarn
turbo build
turbo test
turbo dev
```

## Publishing changes 

When developing you should include a changeset in your PR.

```
yarn changeset
```

Once approved you can convert the changeset into a changelog and bump the version.

```
yarn changeset version
```

Commit the changes, which will remove the changeset file and update the changelog in the relevant 
package(s). Push to the approved PR's branch. Now you can merge the PR to main.

After merging, you should publish to NPM. You can do that by running the github action 
`release`.


## Help and Support

For help and support please see [the Formspree React docs](https://help.formspree.io/hc/en-us/articles/360055613373).

## Contributing

Please follow our [contributing guidelines](./.github/CONTRIBUTING.md).
