import {
  FieldErrorCodeEnum,
  FormErrorCodeEnum,
  SubmissionErrorResult,
} from '@formspree/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FormspreeProvider, useSubmit, type ExtraData } from '../src';

jest.mock('@stripe/stripe-js/pure');

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
    const onError = jest.fn();
    const onSettled = jest.fn();
    const onSuccess = jest.fn();

    function TestForm() {
      const handleSubmit = useSubmit<{ email: string }>('test-formspree-key', {
        onError,
        onSettled,
        onSuccess,
      });
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit({ email: 'test-email' });
          }}
        >
          <button>Submit</button>
        </form>
      );
    }

    it('triggers onError option with the error result', async () => {
      mockedFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [
              {
                code: FormErrorCodeEnum.EMPTY,
                message: 'empty form',
              },
              {
                code: FieldErrorCodeEnum.TYPE_EMAIL,
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

      expect(onError).toHaveBeenCalledTimes(1);

      const errorResult = onError.mock.calls[0][0] as SubmissionErrorResult<{
        email: string;
      }>;

      expect(errorResult).toBeInstanceOf(SubmissionErrorResult);
      expect(errorResult.getFormErrors()).toEqual([
        {
          code: FormErrorCodeEnum.EMPTY,
          message: 'empty form',
        },
      ]);
      expect(errorResult.getFieldErrors('email')).toEqual([
        {
          code: FieldErrorCodeEnum.TYPE_EMAIL,
          message: 'must be an email',
        },
      ]);
      expect(errorResult.getAllFieldErrors()).toEqual([
        [
          'email',
          [
            {
              code: FieldErrorCodeEnum.TYPE_EMAIL,
              message: 'must be an email',
            },
          ],
        ],
      ]);

      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(onSettled).toHaveBeenLastCalledWith();

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('when submission succeeds', () => {
    const onError = jest.fn();
    const onSettled = jest.fn();
    const onSuccess = jest.fn();

    function TestForm() {
      const handleSubmit = useSubmit<{ email: string }>('test-formspree-key', {
        onError,
        onSettled,
        onSuccess,
      });

      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit({ email: 'test-email' });
          }}
        >
          <button>Submit</button>
        </form>
      );
    }

    it('triggers onSuccess option with the success result', async () => {
      mockedFetch.mockResolvedValue(
        new Response(JSON.stringify({ next: 'test-redirect-url' }))
      );

      render(
        <FormspreeProvider>
          <TestForm />
        </FormspreeProvider>
      );

      await userEvent.click(screen.getByRole('button'));

      expect(onError).not.toHaveBeenCalled();

      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(onSettled).toHaveBeenLastCalledWith();

      expect(onSuccess).toHaveBeenCalledTimes(1);
      const successResult = onSuccess.mock.calls[0][0];
      expect(successResult).toEqual({
        kind: 'redirect',
        next: 'test-redirect-url',
      });
    });
  });

  // describe('with Stripe')
});
