import { SubmissionError, type SubmissionResult } from '@formspree/core';
import type {
  PaymentIntentResult,
  PaymentMethodResult,
  Stripe,
} from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure/index.js';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type FormEvent } from 'react';
import {
  FormspreeProvider,
  useFormspree,
  useSubmit,
  type ExtraData,
} from '../src';
import { createMockStripe } from './mockStripe';

jest.mock('@stripe/stripe-js/pure/index.js');

describe('useSubmit', () => {
  const mockedFetch = jest.spyOn(window, 'fetch');

  beforeEach(() => {
    mockedFetch.mockReset();
  });

  describe('when submitting with form event', () => {
    function TestForm() {
      const handleSubmit = useSubmit<{ email: string }>('test-formspree-key');
      return (
        <form onSubmit={handleSubmit}>
          <input type="email" name="email" defaultValue="test@example.com" />
          <button>Submit</button>
        </form>
      );
    }

    it('makes a POST request to Formspree with FormData as the body', async () => {
      render(
        <FormspreeProvider>
          <TestForm />
        </FormspreeProvider>
      );

      await userEvent.click(screen.getByRole('button'));

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenLastCalledWith(
        'https://formspree.io/f/test-formspree-key',
        expect.objectContaining({
          body: expect.any(FormData),
          method: 'POST',
          mode: 'cors',
        })
      );

      const body = mockedFetch.mock.calls[0][1]?.body as FormData;
      expect(Array.from(body.entries())).toEqual([
        ['email', 'test@example.com'],
      ]);
    });

    // tests for append extra data is covered in FormData tests
  });

  describe('when submitting with FormData', () => {
    function TestForm({ extraData }: { extraData?: ExtraData }) {
      const handleSubmit = useSubmit<{ email: string }>('test-formspree-key', {
        extraData,
      });
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData();
            data.set('email', 'test@example.com');
            handleSubmit(data);
          }}
        >
          <button>Submit</button>
        </form>
      );
    }

    it('makes a POST request to Formspree with FormData as the body', async () => {
      render(
        <FormspreeProvider>
          <TestForm />
        </FormspreeProvider>
      );

      await userEvent.click(screen.getByRole('button'));

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenLastCalledWith(
        'https://formspree.io/f/test-formspree-key',
        expect.objectContaining({
          body: expect.any(FormData),
          method: 'POST',
          mode: 'cors',
        })
      );

      const body = mockedFetch.mock.calls[0][1]?.body as FormData;
      expect(Array.from(body.entries())).toEqual([
        ['email', 'test@example.com'],
      ]);
    });

    it('appends extra data', async () => {
      const extraData = {
        justString: 'just-string',
        justUndefined: undefined,
        fnToString: () => 'fn-to-string',
        fnToUndefined: () => undefined,
        asyncFnToString: async () => 'async-fn-to-string',
        asyncFnToUndefined: async () => undefined,
      } satisfies ExtraData;

      render(
        <FormspreeProvider>
          <TestForm extraData={extraData} />
        </FormspreeProvider>
      );

      await userEvent.click(screen.getByRole('button'));

      expect(mockedFetch).toHaveBeenCalledTimes(1);

      const body = mockedFetch.mock.calls[0][1]?.body as FormData;
      expect(Array.from(body.entries())).toEqual([
        ['email', 'test@example.com'],
        ['justString', 'just-string'],
        ['fnToString', 'fn-to-string'],
        ['asyncFnToString', 'async-fn-to-string'],
      ]);
    });
  });

  describe('when submitting with plain object', () => {
    function TestForm({ extraData }: { extraData?: ExtraData }) {
      const handleSubmit = useSubmit<{ email: string }>('test-formspree-key', {
        extraData,
      });
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit({ email: 'test@example.com' });
          }}
        >
          <button>Submit</button>
        </form>
      );
    }

    it('makes a POST request to Formspree with the JSON stringified object as the body', async () => {
      render(
        <FormspreeProvider>
          <TestForm />
        </FormspreeProvider>
      );

      await userEvent.click(screen.getByRole('button'));

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenLastCalledWith(
        'https://formspree.io/f/test-formspree-key',
        expect.objectContaining({
          body: JSON.stringify({ email: 'test@example.com' }),
          method: 'POST',
          mode: 'cors',
        })
      );
    });

    it('appends extra data', async () => {
      const extraData = {
        justString: 'just-string',
        justUndefined: undefined,
        fnToString: () => 'fn-to-string',
        fnToUndefined: () => undefined,
        asyncFnToString: async () => 'async-fn-to-string',
        asyncFnToUndefined: async () => undefined,
      } satisfies ExtraData;

      render(
        <FormspreeProvider>
          <TestForm extraData={extraData} />
        </FormspreeProvider>
      );

      await userEvent.click(screen.getByRole('button'));

      expect(mockedFetch).toHaveBeenCalledTimes(1);

      const body = mockedFetch.mock.calls[0][1]?.body;
      expect(body).toEqual(
        JSON.stringify({
          email: 'test@example.com',
          justString: 'just-string',
          fnToString: 'fn-to-string',
          asyncFnToString: 'async-fn-to-string',
        })
      );
    });
  });

  describe('when submission fails', () => {
    type FormData = {
      email: string;
    };

    let result: SubmissionResult<FormData>;

    function TestForm() {
      const submit = useSubmit<FormData>('test-formspree-key');

      async function handleSubmit(
        event: FormEvent<HTMLFormElement>
      ): Promise<void> {
        event.preventDefault();
        result = await submit({ email: 'test-email' });
      }

      return (
        <form onSubmit={handleSubmit}>
          <button>Submit</button>
        </form>
      );
    }

    it('returns an error result', async () => {
      mockedFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [
              {
                code: 'EMPTY',
                message: 'empty form',
              },
              {
                code: 'TYPE_EMAIL',
                field: 'email',
                message: 'must be an email',
              },
            ],
          })
        )
      );

      render(
        <FormspreeProvider>
          <TestForm />
        </FormspreeProvider>
      );

      await userEvent.click(screen.getByRole('button'));

      expect(result).toBeInstanceOf(SubmissionError);
      const errorResult = result as SubmissionError<FormData>;
      expect(errorResult.getFormErrors()).toEqual([
        {
          code: 'EMPTY',
          message: 'empty form',
        },
      ]);
      expect(errorResult.getFieldErrors('email')).toEqual([
        {
          code: 'TYPE_EMAIL',
          message: 'must be an email',
        },
      ]);
      expect(errorResult.getAllFieldErrors()).toEqual([
        [
          'email',
          [
            {
              code: 'TYPE_EMAIL',
              message: 'must be an email',
            },
          ],
        ],
      ]);
    });
  });

  describe('when submission succeeds', () => {
    type FormData = {
      email: string;
    };

    let result: SubmissionResult<FormData>;

    function TestForm() {
      const submit = useSubmit<FormData>('test-formspree-key');

      async function handleSubmit(
        event: FormEvent<HTMLFormElement>
      ): Promise<void> {
        event.preventDefault();
        result = await submit({ email: 'test-email' });
      }

      return (
        <form onSubmit={handleSubmit}>
          <button>Submit</button>
        </form>
      );
    }

    it('returns a success result', async () => {
      mockedFetch.mockResolvedValue(
        new Response(JSON.stringify({ next: 'test-redirect-url' }))
      );

      render(
        <FormspreeProvider>
          <TestForm />
        </FormspreeProvider>
      );

      await userEvent.click(screen.getByRole('button'));

      expect(result).toEqual({
        kind: 'success',
        next: 'test-redirect-url',
      });
    });
  });

  describe('with Stripe (success)', () => {
    it('returns a success result', async () => {
      const mockLoadStripe = loadStripe as jest.MockedFn<typeof loadStripe>;
      const mockCardElement = { name: 'mocked-card-element' };
      const mockStripe = createMockStripe();

      mockStripe.createPaymentMethod.mockResolvedValue({
        paymentMethod: { id: 'test-payment-method-id' },
      } as PaymentMethodResult);

      mockStripe.elements.mockReturnValue({
        getElement() {
          return mockCardElement;
        },
      });

      mockStripe.handleCardAction.mockResolvedValue({
        paymentIntent: { id: 'test-payment-intent-id' },
      } as PaymentIntentResult);

      mockLoadStripe.mockResolvedValue(mockStripe as unknown as Stripe);

      let result: SubmissionResult;

      function TestForm() {
        const { client } = useFormspree();
        const handleSubmit = useSubmit('test-formspree-key');
        return (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              result = await handleSubmit({
                address_line1: 'test-addr-line1',
                address_line2: 'test-addr-line2',
                address_city: 'test-addr-city',
                address_country: 'test-addr-country',
                address_state: 'test-addr-state',
                address_postal_code: 'test-addr-postal_code',
                email: 'test-email',
                name: 'John Doe',
                phone: 'test-phone-number',
              });
            }}
          >
            {client.stripe && <span>Stripe is loaded</span>}
            <button>Submit</button>
          </form>
        );
      }

      render(
        <FormspreeProvider stripePK="fake-stripe-public-key">
          <TestForm />
        </FormspreeProvider>
      );

      await screen.findByText('Stripe is loaded');

      mockedFetch
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              resubmitKey: 'test-resubmit-key',
              stripe: {
                paymentIntentClientSecret: 'test-payment-intent-client-secret',
              },
            })
          )
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ next: 'test-redirect-url' }))
        );

      await userEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(result).toEqual({
          kind: 'success',
          next: 'test-redirect-url',
        });
      });

      expect(mockStripe.createPaymentMethod).toHaveBeenCalledTimes(1);
      expect(mockStripe.createPaymentMethod).toHaveBeenLastCalledWith({
        type: 'card',
        card: mockCardElement,
        billing_details: {
          address: {
            line1: 'test-addr-line1',
            line2: 'test-addr-line2',
            city: 'test-addr-city',
            country: 'test-addr-country',
            state: 'test-addr-state',
            postal_code: 'test-addr-postal_code',
          },
          email: 'test-email',
          name: 'John Doe',
          phone: 'test-phone-number',
        },
      });
    });
  });
});
