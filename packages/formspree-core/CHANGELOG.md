# Changelog

## 3.0.4

### Patch Changes

- ceaae3d: Bump (patch) @formspree/core and @formspree/react to verify that the release pipeline is fixed

## 3.0.3

### Patch Changes

- 805aa4d: Bump (patch) @formspree/core and @formspree/react to fix the release pipeline

## 3.0.2

### Patch Changes

- 6c31cd1: (type) Support array as FieldValue

## 3.0.1

### Patch Changes

- 56a444b: remove unused package-specific yarn.lock

## 3.0.0

### Major Changes

- 49730d9: ## Improve error handling

  - `@formspree/core` `submitForm` function now will never rejects but always produces a type of `SubmissionResult`, different types of the result can be refined/narrowed down using the field `kind`.
  - Provide `SubmissionErrorResult` which can be used to get an array of form errors and/or field errors (by field name)
  - `Response` is no longer made available on the submission result
  - Update `@formspree/react` for the changes introduced to `@formspree/core`

- d025831: `@formspree/core`

  - rename client config `stripePromise` to `stripe` since it expects the resolved Stripe client not a promise

  `@formspree/react`

  - add a new hook: `useSubmit` which is suitable with code that uses other ways to manage submission state (e.g. with a library like react-hook-form)
  - update `useForm` to use `useSubmit` under the hood
  - fix: `FormspreeContext` updates the client when `props.project` change

### Minor Changes

- 4c40e1b: # Fix types in @formspree/core

  ## `@formspree/core`

  - fix `SubmissionData` has a type of `any` causing everything after it to opt-out typechecking
  - remove a no-op `teardown` method on `Client` and `Session`
  - remove `utils.now` and use `Date.now` instead
  - remove unused functions from `utils` module: `append`, `toCamel`, `camelizeTopKeys`
  - add tests for `utils.appendExtraData` and convert the test file to typescript
  - add tests for `session.data()`
  - no longer export `Session` type

  ## `@formspree/react`

  - update types as a result of `SubmissionData` is no longer `any`
  - fix `createPaymentMethod` does not properly map payload when the submission data is a type of `FormData`
  - fix the `Client` is not updated when project changes

## 2.8.3

### Patch Changes

- a359edd: Upgrade jest to v29 using centralized dependency, and run tests in CI

## 2.8.2

### Patch Changes

- Unify typescript version and enforce typechecking

  - Centralize typescript and its related `devDependencies` to project root for version consistency
  - Centralize `tsconfig` to root and have package-specific `tsconfig` extends it for consistency
  - Make typescript config more strict especially around detecting `null` and `undefined`
  - Run typecheck on test folders
  - Fix type errors
  - Add Turbo `typecheck` task which runs `tsc` in typechecking mode
  - Set up Github Action to run `typecheck` task

## 2.8.1

### Patch Changes

- Catch Formspree errors using legacy format
- Better error handling

## 2.8.0

### Minor Changes

- Conversion to monorepo. Path for type imports changed. Lazy loading stripe.

## 2.5.1

- Update dependencies for security.

## 2.5.0

- Low-level updates to session management.

## 2.4.0

- Bundle an IIFE version of the library, for in-browser use
- Auto-start browser session if `window` is present on init

## 2.3.0

- Move `fetch` and `Promise` polyfills to external `dependencies` (rather than bundled), which means `fetch` calls will be isomorphic (work in Node and browser environments)

## 2.2.0

- Update function failure types

## 2.1.0

- Add a `startBrowserSession` function to the client

Now, you can safely run `createClient` on the server-side, because instantiation
no longer relies on `window` being there 🎉

## 2.0.0

- Migrate to TypeScript
- Accept `site` option in factory
- Add `invokeFunction` method to client
- **Breaking change**: Export a `createClient` factory function (instead of as a default value)
- **Breaking change**: New argument structure for `submitForm` (using the form `key` is now required)

## 1.5.0

- Accept a `clientName` property to set in the `StaticKit-Client` header.
- Fix bug serializing JSON body payload.

## 1.4.0

- Accept `site` + `form` combo (in lieu of `id`) for identifying forms.

## 1.3.0

- Fix bugs affecting form data that is not an instance of `FormData`.
- Remove use of `async`/`await` in favor of promises, to reduce transpilating needs.
- Remove use of `class` to reduce transpiling needs.
- Bundle in [ponyfills](https://github.com/sindresorhus/ponyfill) for `window.fetch`, `Promise`, and `objectAssign`.
