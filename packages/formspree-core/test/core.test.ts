import { version } from '../package.json';
import { createClient, type Client, type Config } from '../src/core';
import {
  FormErrorCodeEnum,
  SubmissionError,
  SubmissionSuccess,
  type FieldError,
  type FormError,
  type ServerErrorResponse,
  FieldErrorCodeEnum,
} from '../src/submission';

describe('Client.submitForm', () => {
  const mockedFetch: jest.MockedFn<typeof global.fetch> = jest.fn();

  function createTestClient(config?: Omit<Config, 'fetch'>): Client {
    return createClient({ ...config, fetch: mockedFetch });
  }

  beforeEach(() => {
    mockedFetch.mockReset();
  });

  const now = new Date('2023-07-07T04:41:09.936Z').getTime();

  beforeEach(() => {
    jest.useFakeTimers({ now });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('given submission data as a FormData', () => {
    it('makes the request to the submission url', async () => {
      const testCases = [
        {
          client: createTestClient(),
          expectedUrl: 'https://formspree.io/f/test-form-id',
        },
        {
          client: createTestClient({ project: 'test-project-id' }),
          expectedUrl: 'https://formspree.io/p/test-project-id/f/test-form-id',
        },
      ];

      for (const { client, expectedUrl } of testCases) {
        mockedFetch.mockClear();

        const data = new FormData();
        data.set('email', 'test@example.com');
        data.set('message', 'Hello!');
        // support files
        data.set(
          'attachment',
          new Blob(['fake-image-content'], { type: 'image/jpeg' })
        );
        await client.submitForm('test-form-id', data);

        expect(mockedFetch).toHaveBeenCalledTimes(1);
        expect(mockedFetch).toHaveBeenLastCalledWith(expectedUrl, {
          body: data,
          headers: {
            Accept: 'application/json',
            'Formspree-Client': `@formspree/core@${version}`,
            'Formspree-Session-Data':
              'eyJsb2FkZWRBdCI6MTY4ODcwNDg2OTkzNiwid2ViZHJpdmVyIjpmYWxzZX0=',
          },
          method: 'POST',
          mode: 'cors',
        });
      }
    });
  });

  describe('given submission data as a plain object', () => {
    it('makes the request to the submission url', async () => {
      const testCases = [
        {
          client: createTestClient(),
          expectedUrl: 'https://formspree.io/f/test-form-id',
        },
        {
          client: createTestClient({ project: 'test-project-id' }),
          expectedUrl: 'https://formspree.io/p/test-project-id/f/test-form-id',
        },
      ];

      for (const { client, expectedUrl } of testCases) {
        mockedFetch.mockClear();

        const data = { email: 'test@example.com', message: 'Hello!' };
        await client.submitForm('test-form-id', data);

        expect(mockedFetch).toHaveBeenCalledTimes(1);
        expect(mockedFetch).toHaveBeenLastCalledWith(expectedUrl, {
          body: JSON.stringify(data),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Formspree-Client': `@formspree/core@${version}`,
            'Formspree-Session-Data':
              'eyJsb2FkZWRBdCI6MTY4ODcwNDg2OTkzNiwid2ViZHJpdmVyIjpmYWxzZX0=',
          },
          method: 'POST',
          mode: 'cors',
        });
      }
    });
  });

  describe('when the server returns an error response', () => {
    type TestCase = {
      name: string;
      response: {
        body: ServerErrorResponse;
        status: number;
      };
      expected: {
        formError: FormError | undefined;
        fieldErrors: [string, FieldError][];
      };
    };

    const testCases: TestCase[] = [
      {
        name: 'uses legacy error message in the absence of the errors array',
        response: {
          body: { error: 'not authorized (legacy)' },
          status: 403,
        },
        expected: {
          formError: {
            code: 'UNSPECIFIED',
            message: 'not authorized (legacy)',
          },
          fieldErrors: [],
        },
      },
      {
        name: 'ignores legacy error message in the presence of the errors array',
        response: {
          body: {
            error: '(legacy error message)',
            errors: [{ message: 'bad submission' }],
          },
          status: 400,
        },
        expected: {
          formError: { code: 'UNSPECIFIED', message: 'bad submission' },
          fieldErrors: [],
        },
      },
      {
        name: 'produces FormError and FieldError(s) given the errors array',
        response: {
          body: {
            error: '(legacy error message)',
            errors: [
              {
                code: FieldErrorCodeEnum.TYPE_EMAIL,
                field: 'some-field',
                message: 'must be an email',
              },
              {
                code: FormErrorCodeEnum.EMPTY,
                message: 'empty form',
              },
              {
                code: FieldErrorCodeEnum.REQUIRED_FIELD_MISSING,
                field: 'some-other-field',
                message: 'field missing',
              },
            ],
          },
          status: 400,
        },
        expected: {
          formError: { code: FormErrorCodeEnum.EMPTY, message: 'empty form' },
          fieldErrors: [
            [
              'some-field',
              {
                code: FieldErrorCodeEnum.TYPE_EMAIL,
                message: 'must be an email',
              },
            ],
            [
              'some-other-field',
              {
                code: FieldErrorCodeEnum.REQUIRED_FIELD_MISSING,
                message: 'field missing',
              },
            ],
          ],
        },
      },
    ];

    it.each(testCases)('$name', async ({ response, expected }) => {
      mockedFetch.mockResolvedValue(
        new Response(JSON.stringify(response.body), {
          headers: { 'Content-Type': 'application/json' },
          status: response.status,
        })
      );

      const client = createTestClient();
      const data = {};
      const result = await client.submitForm('test-form-id', data);

      expect(result).toBeInstanceOf(SubmissionError);
      const errorResult = result as SubmissionError<typeof data>;
      expect(errorResult.getFormError()).toEqual(expected.formError);
      expect(errorResult.getAllFieldErrors()).toEqual(expected.fieldErrors);
    });
  });

  describe('when the server returns an unregonized response', () => {
    it('resolves to a SubmissionError result', async () => {
      mockedFetch.mockResolvedValue(
        new Response(JSON.stringify({ something: '-' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        })
      );

      const client = createTestClient();
      const data = { email: 'test@example.com' };
      const result = await client.submitForm('test-form-id', data);

      expect(result).toBeInstanceOf(SubmissionError);
      const errorResult = result as SubmissionError<typeof data>;
      expect(errorResult.getFormError()).toEqual({
        code: 'UNSPECIFIED',
        message: 'Unexpected error',
      });
      expect(errorResult.getAllFieldErrors()).toEqual([]);
    });
  });

  describe('when fetch rejects', () => {
    describe('with an error', () => {
      it('resolves to a SubmissionError result', async () => {
        const errMessage = '(test) network error with an unknown reason';
        mockedFetch.mockRejectedValue(new Error(errMessage));

        const client = createTestClient();
        const data = { email: 'test@example.com' };
        const result = await client.submitForm('test-form-id', {});

        expect(result).toBeInstanceOf(SubmissionError);
        const errorResult = result as SubmissionError<typeof data>;
        expect(errorResult.getFormError()).toEqual({
          code: 'UNSPECIFIED',
          message: errMessage,
        });
        expect(errorResult.getAllFieldErrors()).toEqual([]);
      });
    });

    describe('with an unknown value', () => {
      it('resolves to a SubmissionError result', async () => {
        mockedFetch.mockRejectedValue({ someKey: 'some unknown value' });

        const client = createTestClient();
        const data = { email: 'test@example.com' };
        const result = await client.submitForm('test-form-id', {});

        expect(result).toBeInstanceOf(SubmissionError);
        const errorResult = result as SubmissionError<typeof data>;
        expect(errorResult.getFormError()).toEqual({
          code: 'UNSPECIFIED',
          message:
            'Unknown error while posting to Formspree: {"someKey":"some unknown value"}',
        });
        expect(errorResult.getAllFieldErrors()).toEqual([]);
      });
    });
  });

  describe('when the server returns a success (redirect) response', () => {
    const responseBody = { next: 'test-redirect-url' };

    beforeEach(() => {
      mockedFetch.mockResolvedValue(
        new Response(JSON.stringify(responseBody), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('resolves to a SubmissionSuccess result', async () => {
      const client = createTestClient();
      const data = { email: 'test@example.com' };
      const result = await client.submitForm('test-form-id', data);

      expect(result).toBeInstanceOf(SubmissionSuccess);
      const successResult = result as SubmissionSuccess;
      expect(successResult.ok).toBe(true);
      expect(successResult.next).toEqual(responseBody.next);
    });
  });
});
