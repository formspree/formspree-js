# Formspree JS Development Guidelines

## @formspree/ajax Package

This package is a recreation of [statickit-html](https://github.com/formspree/statickit-html) using `@formspree/core` as the base.

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
