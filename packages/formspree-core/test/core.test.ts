import type {
  PaymentIntentResult,
  PaymentMethodResult,
  Stripe,
} from '@stripe/stripe-js';
import { version } from '../package.json';
import { createClient, type Client, type Config } from '../src/core';
import {
  FieldErrorCodeEnum,
  FormErrorCodeEnum,
  SubmissionErrorResult,
  SubmissionRedirectResult,
  type FieldError,
  type FormError,
  type ServerErrorResponse,
  type ServerStripePluginPendingResponse,
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
  const expectedSessionData =
    'eyJsb2FkZWRBdCI6MTY4ODcwNDg2OTkzNiwid2ViZHJpdmVyIjpmYWxzZX0=';

  beforeEach(() => {
    jest.useFakeTimers({ now });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when submitting with a FormData', () => {
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
            'Formspree-Session-Data': expectedSessionData,
          },
          method: 'POST',
          mode: 'cors',
        });
      }
    });
  });

  describe('when submitting with a plain object', () => {
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
            'Formspree-Session-Data': expectedSessionData,
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
        formErrors: FormError[];
        fieldErrors: [string, FieldError[]][];
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
          formErrors: [
            {
              code: 'UNSPECIFIED',
              message: 'not authorized (legacy)',
            },
          ],
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
          formErrors: [{ code: 'UNSPECIFIED', message: 'bad submission' }],
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
          formErrors: [
            { code: FormErrorCodeEnum.EMPTY, message: 'empty form' },
          ],
          fieldErrors: [
            [
              'some-field',
              [
                {
                  code: FieldErrorCodeEnum.TYPE_EMAIL,
                  message: 'must be an email',
                },
              ],
            ],
            [
              'some-other-field',
              [
                {
                  code: FieldErrorCodeEnum.REQUIRED_FIELD_MISSING,
                  message: 'field missing',
                },
              ],
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

      expect(result).toBeInstanceOf(SubmissionErrorResult);
      const errorResult = result as SubmissionErrorResult<typeof data>;
      expect(errorResult.getFormErrors()).toEqual(expected.formErrors);
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

      expect(result).toBeInstanceOf(SubmissionErrorResult);
      const errorResult = result as SubmissionErrorResult<typeof data>;
      expect(errorResult.getFormErrors()).toEqual([
        {
          code: 'UNSPECIFIED',
          message: 'Unexpected response format',
        },
      ]);
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

        expect(result).toBeInstanceOf(SubmissionErrorResult);
        const errorResult = result as SubmissionErrorResult<typeof data>;
        expect(errorResult.getFormErrors()).toEqual([
          {
            code: 'UNSPECIFIED',
            message: errMessage,
          },
        ]);
        expect(errorResult.getAllFieldErrors()).toEqual([]);
      });
    });

    describe('with an unknown value', () => {
      it('resolves to a SubmissionError result', async () => {
        mockedFetch.mockRejectedValue({ someKey: 'some unknown value' });

        const client = createTestClient();
        const data = { email: 'test@example.com' };
        const result = await client.submitForm('test-form-id', {});

        expect(result).toBeInstanceOf(SubmissionErrorResult);
        const errorResult = result as SubmissionErrorResult<typeof data>;
        expect(errorResult.getFormErrors()).toEqual([
          {
            code: 'UNSPECIFIED',
            message:
              'Unknown error while posting to Formspree: {"someKey":"some unknown value"}',
          },
        ]);
        expect(errorResult.getAllFieldErrors()).toEqual([]);
      });
    });
  });

  describe('when the server returns a redirect response', () => {
    const responseBody = { next: 'test-redirect-url' };

    beforeEach(() => {
      mockedFetch.mockResolvedValue(
        new Response(JSON.stringify(responseBody), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('resolves to a SubmissionRedirectResult', async () => {
      const client = createTestClient();
      const data = { email: 'test@example.com' };
      const result = await client.submitForm('test-form-id', data);

      expect(result).toBeInstanceOf(SubmissionRedirectResult);
      const redirectResult = result as SubmissionRedirectResult;
      expect(redirectResult.kind).toBe('redirect');
      expect(redirectResult.next).toEqual(responseBody.next);
    });
  });

  describe('with Stripe', () => {
    function createTestClientWithStripe(
      handleCardAction?: Stripe['handleCardAction']
    ): Client {
      const stripe = { handleCardAction } as Stripe;
      return createTestClient({ stripePromise: stripe });
    }

    describe('when payment method creation fails', () => {
      async function createPaymentMethod(): Promise<PaymentMethodResult> {
        return { error: { type: 'card_error' as const } };
      }

      it('returns an error result', async () => {
        const client = createTestClientWithStripe();
        const data = { email: 'test@example.com' };
        const result = await client.submitForm('test-form-id', data, {
          createPaymentMethod,
        });

        expect(result).toBeInstanceOf(SubmissionErrorResult);
        const errorResult = result as SubmissionErrorResult<typeof data>;
        expect(errorResult.getFormErrors()).toEqual([]);
        expect(errorResult.getAllFieldErrors()).toEqual([
          [
            'paymentMethod',
            [
              {
                code: 'STRIPE_CLIENT_ERROR',
                message: 'Error creating payment method',
              },
            ],
          ],
        ]);
      });
    });

    describe('when payment method creation succeeds', () => {
      async function createPaymentMethod(): Promise<PaymentMethodResult> {
        return {
          paymentMethod: { id: 'test-payment-method-id' },
        } as PaymentMethodResult;
      }

      describe('and payment submission fails', () => {
        it('returns SubmissionErrorResult', async () => {
          mockedFetch.mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                error: '(legacy error message)',
                errors: [{ message: 'bad submission' }],
              } satisfies ServerErrorResponse)
            )
          );

          const client = createTestClientWithStripe();
          const data = { email: 'test@example.com' };
          const result = await client.submitForm('test-form-id', data, {
            createPaymentMethod,
          });

          expect(mockedFetch).toHaveBeenCalledTimes(1);
          expect(mockedFetch).toHaveBeenLastCalledWith(
            'https://formspree.io/f/test-form-id',
            {
              body: JSON.stringify({
                email: 'test@example.com',
                paymentMethod: 'test-payment-method-id',
              }),
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Formspree-Client': '@formspree/core@2.8.3',
                'Formspree-Session-Data': expectedSessionData,
              },
              method: 'POST',
              mode: 'cors',
            }
          );

          expect(result).toBeInstanceOf(SubmissionErrorResult);
          const errorResult = result as SubmissionErrorResult<typeof data>;
          expect(errorResult.getFormErrors()).toEqual([
            {
              code: 'UNSPECIFIED',
              message: 'bad submission',
            },
          ]);
          expect(errorResult.getAllFieldErrors()).toEqual([]);
        });
      });

      describe('and payment submission succeeds', () => {
        it('returns SubmissionRedirectResult', async () => {
          const redirectResponseBody = { next: 'test-redirect-url' };
          mockedFetch.mockResolvedValueOnce(
            new Response(JSON.stringify(redirectResponseBody))
          );

          const client = createTestClientWithStripe();
          const data = { email: 'test@example.com' };
          const result = await client.submitForm('test-form-id', data, {
            createPaymentMethod,
          });

          expect(mockedFetch).toHaveBeenCalledTimes(1);
          expect(mockedFetch).toHaveBeenLastCalledWith(
            'https://formspree.io/f/test-form-id',
            {
              body: JSON.stringify({
                email: 'test@example.com',
                paymentMethod: 'test-payment-method-id',
              }),
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Formspree-Client': '@formspree/core@2.8.3',
                'Formspree-Session-Data': expectedSessionData,
              },
              method: 'POST',
              mode: 'cors',
            }
          );

          expect(result).toBeInstanceOf(SubmissionRedirectResult);
          const redirectResult = result as SubmissionRedirectResult;
          expect(redirectResult.kind).toBe('redirect');
          expect(redirectResult.next).toEqual(redirectResponseBody.next);
        });
      });

      describe('and payment submission requires SCA', () => {
        class RequireSCAResponse extends Response {
          constructor() {
            super(
              JSON.stringify({
                resubmitKey: 'test-resubmit-key',
                stripe: {
                  paymentIntentClientSecret:
                    'test-payment-intent-client-secret',
                },
              } satisfies ServerStripePluginPendingResponse)
            );
          }
        }

        describe('and Stripe handleCardAction fails', () => {
          async function handleCardAction(): Promise<PaymentIntentResult> {
            return { error: { type: 'card_error' } };
          }

          it('returns SubmissionErrorResult', async () => {
            mockedFetch.mockResolvedValueOnce(new RequireSCAResponse());

            const client = createTestClientWithStripe(handleCardAction);
            const data = { email: 'test@example.com' };
            const result = await client.submitForm('test-form-id', data, {
              createPaymentMethod,
            });

            expect(mockedFetch).toHaveBeenCalledTimes(1);
            expect(mockedFetch).toHaveBeenLastCalledWith(
              'https://formspree.io/f/test-form-id',
              {
                body: JSON.stringify({
                  email: 'test@example.com',
                  paymentMethod: 'test-payment-method-id',
                }),
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                  'Formspree-Client': '@formspree/core@2.8.3',
                  'Formspree-Session-Data': expectedSessionData,
                },
                method: 'POST',
                mode: 'cors',
              }
            );

            expect(result).toBeInstanceOf(SubmissionErrorResult);
            const errorResult = result as SubmissionErrorResult<typeof data>;
            expect(errorResult.getFormErrors()).toEqual([]);
            expect(errorResult.getAllFieldErrors()).toEqual([
              [
                'paymentMethod',
                [
                  {
                    code: 'STRIPE_CLIENT_ERROR',
                    message: 'Stripe SCA error',
                  },
                ],
              ],
            ]);
          });
        });

        describe('and Stripe handleCardAction succeeds (FormData)', () => {
          async function handleCardAction(): Promise<PaymentIntentResult> {
            return {
              paymentIntent: { id: 'test-payment-intent-id' },
            } as PaymentIntentResult;
          }

          it('resubmits the form and produces a SubmissionRedirectResult', async () => {
            const redirectResponseBody = { next: 'test-redirect-url' };

            mockedFetch
              .mockResolvedValueOnce(new RequireSCAResponse())
              .mockResolvedValueOnce(
                new Response(JSON.stringify(redirectResponseBody))
              );

            const client = createTestClientWithStripe(handleCardAction);
            const data = new FormData();
            data.set('email', 'test@example.com');
            data.set('message', 'Hello!');
            // support files
            data.set(
              'attachment',
              new Blob(['fake-image-content'], { type: 'image/jpeg' })
            );
            const result = await client.submitForm('test-form-id', data, {
              createPaymentMethod,
            });

            expect(mockedFetch).toHaveBeenCalledTimes(2);
            expect(mockedFetch).toHaveBeenNthCalledWith(
              1,
              'https://formspree.io/f/test-form-id',
              {
                body: data,
                headers: {
                  Accept: 'application/json',
                  'Formspree-Client': '@formspree/core@2.8.3',
                  'Formspree-Session-Data': expectedSessionData,
                },
                method: 'POST',
                mode: 'cors',
              }
            );
            expect(mockedFetch).toHaveBeenNthCalledWith(
              2,
              'https://formspree.io/f/test-form-id',
              {
                body: data,
                headers: {
                  Accept: 'application/json',
                  'Formspree-Client': '@formspree/core@2.8.3',
                  'Formspree-Session-Data': expectedSessionData,
                },
                method: 'POST',
                mode: 'cors',
              }
            );

            expect(result).toBeInstanceOf(SubmissionRedirectResult);
            const redirectResult = result as SubmissionRedirectResult;
            expect(redirectResult.kind).toBe('redirect');
            expect(redirectResult.next).toEqual(redirectResponseBody.next);
          });
        });

        describe('and Stripe handleCardAction succeeds (plain object)', () => {
          async function handleCardAction(): Promise<PaymentIntentResult> {
            return {
              paymentIntent: { id: 'test-payment-intent-id' },
            } as PaymentIntentResult;
          }

          it('resubmits the form and produces a SubmissionRedirectResult', async () => {
            const redirectResponseBody = { next: 'test-redirect-url' };

            mockedFetch
              .mockResolvedValueOnce(new RequireSCAResponse())
              .mockResolvedValueOnce(
                new Response(JSON.stringify(redirectResponseBody))
              );

            const client = createTestClientWithStripe(handleCardAction);
            const data = { email: 'test@example.com' };
            const result = await client.submitForm('test-form-id', data, {
              createPaymentMethod,
            });

            expect(mockedFetch).toHaveBeenCalledTimes(2);
            expect(mockedFetch).toHaveBeenNthCalledWith(
              1,
              'https://formspree.io/f/test-form-id',
              {
                body: JSON.stringify({
                  email: 'test@example.com',
                  paymentMethod: 'test-payment-method-id',
                }),
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                  'Formspree-Client': '@formspree/core@2.8.3',
                  'Formspree-Session-Data': expectedSessionData,
                },
                method: 'POST',
                mode: 'cors',
              }
            );
            expect(mockedFetch).toHaveBeenNthCalledWith(
              2,
              'https://formspree.io/f/test-form-id',
              {
                body: JSON.stringify({
                  email: 'test@example.com',
                  // paymentMethod is deleted
                  paymentIntent: 'test-payment-intent-id',
                  resubmitKey: 'test-resubmit-key',
                }),
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                  'Formspree-Client': '@formspree/core@2.8.3',
                  'Formspree-Session-Data': expectedSessionData,
                },
                method: 'POST',
                mode: 'cors',
              }
            );

            expect(result).toBeInstanceOf(SubmissionRedirectResult);
            const redirectResult = result as SubmissionRedirectResult;
            expect(redirectResult.kind).toBe('redirect');
            expect(redirectResult.next).toEqual(redirectResponseBody.next);
          });
        });
      });
    });
  });
});
