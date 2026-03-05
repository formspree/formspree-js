# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```sh
yarn                  # Install dependencies
yarn build            # Build all packages (required before dev)
yarn dev              # Run dev server with cra-demo example on localhost:3000
yarn test             # Run tests across all packages
yarn typecheck        # Type check all packages
yarn lint             # Lint all packages
yarn format           # Format code with Prettier
yarn changeset        # Create a changeset for PRs
```

### Package-specific commands

Run from package directory (e.g., `packages/formspree-core`):

```sh
yarn test             # Run tests for this package
yarn build            # Build this package only
yarn lint             # Lint this package
```

For the ajax package specifically:

```sh
yarn demo             # Build and run ajax-demo example (from packages/formspree-ajax)
```

## Architecture

This is a Yarn workspaces monorepo managed by Turborepo with three packages:

- **@formspree/core** - Core submission client and types. Provides `createClient`, `getDefaultClient`, `SubmissionError`, and submission types.
- **@formspree/react** - React hooks (`useForm`, `useSubmit`) built on top of core. Depends on core.
- **@formspree/ajax** - Vanilla JS library for declarative form handling. Recreation of [statickit-html](https://github.com/formspree/statickit-html) using core.

All packages use `tsup` for building and output to `dist/`.

## @formspree/ajax Package Guidelines

Reference API from statickit-html:

- `onSubmit(config)` - called before submission
- `onSuccess(config, response)` - called on successful submission
- `onError(config, errors)` - called on validation errors
- `onFailure(config, exception)` - called on unexpected errors
- `onInit(config)` - called when form is initialized

The `config` object contains: form element, form identifiers, data, debug flag, fields config, and client.

## Documentation

- Add JSDoc comments to all TypeScript types, interfaces, and their properties
- Include `@template` tags for generic types
- Include `@param` tags for callback parameters
