# Changelog

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
