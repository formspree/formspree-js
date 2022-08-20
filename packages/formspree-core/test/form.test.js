import { hasErrors, isFieldError, isKnownError } from '../src/forms';

describe('handleErrors', () => {
  it('recognizes errors', () => {
    expect(hasErrors({ errors: [{ message: 'doh!' }] })).toBe(true);
  });

  it('recognizes Field errors', () => {
    expect(
      isFieldError({
        field: 'email',
        code: 'TYPE_EMAIL',
        message: 'should be an email'
      })
    ).toBe(true);
    expect(
      isFieldError({
        code: 'INACTIVE',
        message: 'form is inactive'
      })
    ).toBe(false);
    expect(
      isFieldError({
        code: 'TYPE_EMAIL',
        message: 'something should be an email'
      })
    ).toBe(false);
  });

  it('recognizes known and unknown errors', () => {
    for (const code of [
      'INACTIVE',
      'FORM_NOT_FOUND',
      'REQUIRED_FIELD_EMPTY',
      'TYPE_EMAIL'
    ]) {
      expect(isKnownError({ code, message: 'doh!' })).toBe(true);
    }
    expect(isKnownError({ code: 'UNKNOWN', message: 'doh!' })).toBe(false);
  });
});
