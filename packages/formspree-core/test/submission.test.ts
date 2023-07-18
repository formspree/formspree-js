import { SubmissionError } from '../src/submission';

describe('SubmissionError', () => {
  test('no server errors', () => {
    const err = new SubmissionError();
    expect(err.getFormErrors()).toEqual([]);
    expect(err.getFieldErrors('')).toEqual([]);
    expect(err.getFieldErrors('some-key')).toEqual([]);
    expect(err.getAllFieldErrors()).toEqual([]);
  });

  test('with one form error', () => {
    const err = new SubmissionError({ message: '(test) unknown error' });
    expect(err.getFormErrors()).toEqual([
      {
        code: 'UNSPECIFIED',
        message: '(test) unknown error',
      },
    ]);
    expect(err.getFieldErrors('')).toEqual([]);
    expect(err.getFieldErrors('some-key')).toEqual([]);
    expect(err.getAllFieldErrors()).toEqual([]);
  });

  test('with one form error, with code', () => {
    const err = new SubmissionError({
      code: 'EMPTY',
      message: '(test) empty form',
    });
    expect(err.getFormErrors()).toEqual([
      {
        code: 'EMPTY',
        message: '(test) empty form',
      },
    ]);
    expect(err.getFieldErrors('')).toEqual([]);
    expect(err.getFieldErrors('some-key')).toEqual([]);
    expect(err.getAllFieldErrors()).toEqual([]);
  });

  test('with one field error', () => {
    const err = new SubmissionError({
      field: 'some-key',
      message: '(test) the field is required',
    });
    expect(err.getFormErrors()).toEqual([]);
    expect(err.getFieldErrors('some-key')).toEqual([
      {
        code: 'UNSPECIFIED',
        message: '(test) the field is required',
      },
    ]);
    expect(err.getAllFieldErrors()).toEqual([
      [
        'some-key',
        [
          {
            code: 'UNSPECIFIED',
            message: '(test) the field is required',
          },
        ],
      ],
    ]);
  });

  test('with one field error, with code', () => {
    const err = new SubmissionError({
      code: 'REQUIRED_FIELD_EMPTY',
      field: 'some-key',
      message: '(test) the field is required',
    });
    expect(err.getFormErrors()).toEqual([]);
    expect(err.getFieldErrors('some-key')).toEqual([
      {
        code: 'REQUIRED_FIELD_EMPTY',
        message: '(test) the field is required',
      },
    ]);
    expect(err.getAllFieldErrors()).toEqual([
      [
        'some-key',
        [
          {
            code: 'REQUIRED_FIELD_EMPTY',
            message: '(test) the field is required',
          },
        ],
      ],
    ]);
  });

  test('with a mix of a form error and multiple field errors', () => {
    const err = new SubmissionError(
      {
        message: '(test) unknown form error',
      },
      {
        code: 'REQUIRED_FIELD_EMPTY',
        field: 'some-key',
        message: '(test) the field is required',
      },
      {
        code: 'EMPTY',
        message: '(test) empty form',
      },
      {
        code: 'TYPE_EMAIL',
        field: 'some-other-key',
        message: '(test) should be an email',
      },
      {
        code: 'TYPE_TEXT',
        field: 'some-key',
        message: '(test) should be a text',
      }
    );
    expect(err.getFormErrors()).toEqual([
      {
        code: 'UNSPECIFIED',
        message: '(test) unknown form error',
      },
      {
        code: 'EMPTY',
        message: '(test) empty form',
      },
    ]);
    expect(err.getFieldErrors('some-key')).toEqual([
      {
        code: 'REQUIRED_FIELD_EMPTY',
        message: '(test) the field is required',
      },
      {
        code: 'TYPE_TEXT',
        message: '(test) should be a text',
      },
    ]);
    expect(err.getFieldErrors('some-other-key')).toEqual([
      {
        code: 'TYPE_EMAIL',
        message: '(test) should be an email',
      },
    ]);
    expect(err.getAllFieldErrors()).toEqual([
      [
        'some-key',
        [
          {
            code: 'REQUIRED_FIELD_EMPTY',
            message: '(test) the field is required',
          },
          {
            code: 'TYPE_TEXT',
            message: '(test) should be a text',
          },
        ],
      ],
      [
        'some-other-key',
        [
          {
            code: 'TYPE_EMAIL',
            message: '(test) should be an email',
          },
        ],
      ],
    ]);
  });
});
