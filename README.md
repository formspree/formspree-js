# Formspree JS

A monorepo containing libraries for seamless form integration with [Formspree](https://formspree.io/) via JavaScript and/or React.

## Packages

### [`@formspree/core`](./packages/formspree-core)

Core submission client and types.

```sh
npm install @formspree/core
# or
yarn add @formspree/core
# or
pnpm add @formspree/core
```

### [`@formspree/react`](./packages/formspree-react)

React hooks and components for Formspree. Supports React 16.8, 17, 18, and 19.

```sh
npm install @formspree/react
# or
yarn add @formspree/react
# or
pnpm add @formspree/react
```

### [`@formspree/ajax`](./packages/formspree-ajax)

Vanilla JavaScript library for declarative form handling. No framework required.

```sh
npm install @formspree/ajax
# or
yarn add @formspree/ajax
# or
pnpm add @formspree/ajax
```

_`@formspree/core` is included as a dependency of both `@formspree/react` and `@formspree/ajax`, so you don't need to install it separately._

## Help and Support

For help and support please see [the Formspree docs](https://help.formspree.io).

## Contributing

Please follow our [contributing guidelines](./CONTRIBUTING.md).

## License

MIT
