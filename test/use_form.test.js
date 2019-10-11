import React, { useState } from 'react';
import useForm from '../src/use_form';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';

const { act } = ReactTestUtils;

function TestForm(props) {
  const [state, submit] = useForm({
    id: props.id,
    client: props.client
  });

  if (state.succeeded) {
    return <div id="message">Thanks!</div>;
  }

  if (state.errors.length > 0) {
    return <div id="errors">{JSON.stringify(state.errors)}</div>;
  }

  return (
    <div>
      <h1>Form</h1>
      <div id="succeeded">{state.succeeded}</div>
      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          defaultValue="test@example.com"
        />
        <button type="submit">Sign up</button>
      </form>
    </div>
  );
}

let container;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

it('reacts to successful form submission', async () => {
  const mockClient = {
    submitForm: _props => {
      return new Promise(resolve => {
        resolve({ body: { id: '000', data: {} }, response: { status: 200 } });
      });
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(<TestForm id="xxx" client={mockClient} />, container);
  });

  const heading = container.querySelector('h1');
  const form = container.querySelector('form');

  expect(heading.textContent).toBe('Form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });

  const message = container.querySelector('#message');
  expect(message.textContent).toBe('Thanks!');
});

it('reacts to server-side validation errors', async () => {
  const mockClient = {
    submitForm: _props => {
      return new Promise(resolve => {
        resolve({
          body: {
            errors: [
              {
                field: 'email',
                code: 'EMAIL_FORMAT',
                message: 'must be an email'
              }
            ]
          },
          response: { status: 422 }
        });
      });
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(<TestForm id="xxx" client={mockClient} />, container);
  });

  const form = container.querySelector('form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });

  const errors = container.querySelector('#errors');
  expect(errors.textContent).toBe(
    `[{"field":"email","code":"EMAIL_FORMAT","message":"must be an email"}]`
  );
});
