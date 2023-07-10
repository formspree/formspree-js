import {
  FieldErrorCodeEnum,
  FormErrorCodeEnum,
  SubmissionErrorResult,
} from '../src/submission';

describe('SubmissionErrorResult', () => {
  test('no server errors', () => {
    const err = new SubmissionErrorResult();
    expect(err.getFormErrors()).toEqual([]);
    expect(err.getFieldError('')).toBeUndefined();
    expect(err.getFieldError('some-key')).toBeUndefined();
    expect(err.getAllFieldErrors()).toEqual([]);
  });

  test('with one form error', () => {
    const err = new SubmissionErrorResult({ message: '(test) unknown error' });
    expect(err.getFormErrors()).toEqual([
      {
        code: 'UNSPECIFIED',
        message: '(test) unknown error',
      },
    ]);
    expect(err.getFieldError('')).toBeUndefined();
    expect(err.getFieldError('some-key')).toBeUndefined();
    expect(err.getAllFieldErrors()).toEqual([]);
  });

  test('with one form error, with code', () => {
    const err = new SubmissionErrorResult({
      code: FormErrorCodeEnum.EMPTY,
      message: '(test) empty form',
    });
    expect(err.getFormErrors()).toEqual([
      {
        code: FormErrorCodeEnum.EMPTY,
        message: '(test) empty form',
      },
    ]);
    expect(err.getFieldError('')).toBeUndefined();
    expect(err.getFieldError('some-key')).toBeUndefined();
    expect(err.getAllFieldErrors()).toEqual([]);
  });

  test('with one field error', () => {
    const err = new SubmissionErrorResult({
      field: 'some-key',
      message: '(test) the field is required',
    });
    expect(err.getFormErrors()).toEqual([]);
    expect(err.getFieldError('some-key')).toEqual({
      code: 'UNSPECIFIED',
      message: '(test) the field is required',
    });
    expect(err.getAllFieldErrors()).toEqual([
      [
        'some-key',
        {
          code: 'UNSPECIFIED',
          message: '(test) the field is required',
        },
      ],
    ]);
  });

  test('with one field error, with code', () => {
    const err = new SubmissionErrorResult({
      code: FieldErrorCodeEnum.REQUIRED_FIELD_EMPTY,
      field: 'some-key',
      message: '(test) the field is required',
    });
    expect(err.getFormErrors()).toEqual([]);
    expect(err.getFieldError('some-key')).toEqual({
      code: FieldErrorCodeEnum.REQUIRED_FIELD_EMPTY,
      message: '(test) the field is required',
    });
    expect(err.getAllFieldErrors()).toEqual([
      [
        'some-key',
        {
          code: FieldErrorCodeEnum.REQUIRED_FIELD_EMPTY,
          message: '(test) the field is required',
        },
      ],
    ]);
  });

  test('with a mix of a form error and multiple field errors', () => {
    const err = new SubmissionErrorResult(
      {
        message: '(test) unknown form error',
      },
      {
        code: FieldErrorCodeEnum.REQUIRED_FIELD_EMPTY,
        field: 'some-key',
        message: '(test) the field is required',
      },
      {
        code: FormErrorCodeEnum.EMPTY,
        message: '(test) empty form',
      },
      {
        code: FieldErrorCodeEnum.TYPE_EMAIL,
        field: 'some-other-key',
        message: '(test) should be an email',
      }
    );
    expect(err.getFormErrors()).toEqual([
      {
        code: 'UNSPECIFIED',
        message: '(test) unknown form error',
      },
      {
        code: FormErrorCodeEnum.EMPTY,
        message: '(test) empty form',
      },
    ]);
    expect(err.getFieldError('some-key')).toEqual({
      code: FieldErrorCodeEnum.REQUIRED_FIELD_EMPTY,
      message: '(test) the field is required',
    });
    expect(err.getFieldError('some-other-key')).toEqual({
      code: FieldErrorCodeEnum.TYPE_EMAIL,
      message: '(test) should be an email',
    });
    expect(err.getAllFieldErrors()).toEqual([
      [
        'some-key',
        {
          code: FieldErrorCodeEnum.REQUIRED_FIELD_EMPTY,
          message: '(test) the field is required',
        },
      ],
      [
        'some-other-key',
        {
          code: FieldErrorCodeEnum.TYPE_EMAIL,
          message: '(test) should be an email',
        },
      ],
    ]);
  });
});
