import type { Client } from '@formspree/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ValidationError, useForm, type ExtraData } from '../src';

type TestFormProps = {
  client?: Client;
  extraData?: ExtraData;
};

function TestForm(props: TestFormProps) {
  const { client, extraData } = props;
  const [state, submit, reset] = useForm('test-form-id-42', {
    client: client,
    data: extraData,
  });

  if (state.submitting) {
    return <p>Submitting…</p>;
  }

  if (state.succeeded) {
    return (
      <div>
        <p>Thanks!</p>;<button onClick={reset}>Reset</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Form</h1>
      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          defaultValue="test@example.com"
        />
        <ValidationError
          data-testid="email-field-errors"
          field="email"
          errors={state.errors}
        />
        <button type="submit">Sign up</button>

        {/* form errors */}
        <ValidationError data-testid="form-errors" errors={state.errors} />
      </form>
    </div>
  );
}

describe('useForm', () => {
  const mockedFetch = jest.spyOn(window, 'fetch');

  beforeEach(() => {
    mockedFetch.mockReset();
  });

  describe('given a successful submission', () => {
    it('renders the correct states', async () => {
      mockedFetch.mockResolvedValue(
        new Response(JSON.stringify({ next: 'test-redirect-url' }))
      );

      render(<TestForm extraData={{ secret: 'super-secret' }} />);
      userEvent.click(screen.getByText('Sign up'));

      // Right after clicked, it should show submitting.
      await screen.findByText('Submitting…');

      // Later, we should find the confirmation text.
      await screen.findByText('Thanks!');

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenLastCalledWith(
        'https://formspree.io/f/test-form-id-42',
        expect.objectContaining({
          body: expect.any(FormData),
          headers: {
            Accept: 'application/json',
            'Formspree-Client': '@formspree/react@2.4.4 @formspree/core@2.8.3',
            'Formspree-Session-Data': expect.any(String),
          },
          method: 'POST',
          mode: 'cors',
        })
      );

      const fetchPayload = mockedFetch.mock.calls[0][1]?.body as FormData;
      expect(Array.from(fetchPayload)).toEqual([
        ['email', 'test@example.com'],
        // extra data is added
        ['secret', 'super-secret'],
      ]);
    });
  });

  describe('given a failed submission', () => {
    it('renders the correct states', async () => {
      mockedFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [
              {
                message: '(test) forbidden',
              },
              {
                code: 'TYPE_EMAIL',
                field: 'email',
                message: '(test) should be an email',
              },
            ],
          })
        )
      );

      render(<TestForm extraData={{ secret: 'super-secret' }} />);
      userEvent.click(screen.getByText('Sign up'));

      // Right after clicked, it should show submitting.
      await screen.findByText('Submitting…');

      // Later, it should revert back to form with errors.
      await waitFor(() => {
        screen.getByRole('heading', { name: 'Form' });
        screen.getByLabelText('Email');
      });

      expect(screen.getByTestId('form-errors').textContent).toBe(
        '(test) forbidden'
      );
      expect(screen.getByTestId('email-field-errors').textContent).toBe(
        '(test) should be an email'
      );

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenLastCalledWith(
        'https://formspree.io/f/test-form-id-42',
        expect.objectContaining({
          body: expect.any(FormData),
          headers: {
            Accept: 'application/json',
            'Formspree-Client': '@formspree/react@2.4.4 @formspree/core@2.8.3',
            'Formspree-Session-Data': expect.any(String),
          },
          method: 'POST',
          mode: 'cors',
        })
      );

      const fetchPayload = mockedFetch.mock.calls[0][1]?.body as FormData;
      expect(Array.from(fetchPayload)).toEqual([
        ['email', 'test@example.com'],
        // extra data is added
        ['secret', 'super-secret'],
      ]);
    });
  });

  describe('when the reset function is called', () => {
    it('resets the form state', async () => {
      mockedFetch.mockResolvedValue(
        new Response(JSON.stringify({ next: 'test-redirect-url' }))
      );
      render(<TestForm />);

      await userEvent.click(screen.getByText('Sign up'));
      await screen.findByText('Thanks!');

      expect(mockedFetch).toHaveBeenCalledTimes(1);

      await userEvent.click(screen.getByText('Reset'));
      await waitFor(() => {
        screen.getByRole('heading', { name: 'Form' });
        screen.getByLabelText('Email');
      });
    });
  });
});
