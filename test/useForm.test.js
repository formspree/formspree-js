import React from 'react';
import { StaticKit, useForm } from '../src';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import { ErrorBoundary } from './helpers';
import { version } from '../package.json';

jest.mock('@statickit/core');
import { createClient } from '@statickit/core';
const mockedCreateClient = createClient;
const core = jest.requireActual('@statickit/core');

const { act } = ReactTestUtils;

// A fake success result for a mocked `submitForm` call.
const success = new Promise(resolve => {
  resolve({ body: { id: '000', data: {} }, response: { status: 200 } });
});

const submitSpy = jest.fn();

function TestForm(props) {
  const [state, submit] = useForm(props.form, {
    data: props.extraData,
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
  submitSpy.mockClear();
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

it('fails it initialize without identifying properties', () => {
  mockedCreateClient.mockImplementation(core.createClient);

  // Mock error console to suppress noise in output
  console.error = jest.fn();

  act(() => {
    ReactDOM.render(
      <StaticKit site="xxx">
        <ErrorBoundary>
          <TestForm />
        </ErrorBoundary>
      </StaticKit>,
      container
    );
  });

  const error = container.querySelector('#error');
  expect(error.textContent).toBe(
    'You must provide a form key (e.g. useForm("myForm")'
  );

  // React's error logging
  expect(console.error).toHaveBeenCalled();
});

it('accepts a client directly', async () => {
  const mockClient = {
    startBrowserSession: () => {},
    submitForm: (_form, _data, opts) => {
      submitSpy();
      return success;
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(
      <TestForm form="newsletter" client={mockClient} />,
      container
    );
  });

  const form = container.querySelector('form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });

  expect(submitSpy).toHaveBeenCalled();
});

it('submits a client name', async () => {
  mockedCreateClient.mockImplementation(() => ({
    startBrowserSession: () => {},
    submitForm: (_form, _data, opts) => {
      expect(opts.clientName).toBe(`@statickit/react@${version}`);
      return success;
    },
    teardown: () => {}
  }));

  act(() => {
    ReactDOM.render(
      <StaticKit site="xxx">
        <TestForm form="newsletter" />
      </StaticKit>,
      container
    );
  });

  const form = container.querySelector('form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });
});

it('submits successfully form key', async () => {
  mockedCreateClient.mockImplementation(() => ({
    startBrowserSession: () => {},
    submitForm: (form, _data, _opts) => {
      expect(form).toBe('newsletter');
      return success;
    },
    teardown: () => {}
  }));

  act(() => {
    ReactDOM.render(
      <StaticKit site="xxx">
        <TestForm form="newsletter" />
      </StaticKit>,
      container
    );
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

it('appends extra data to form data', async () => {
  mockedCreateClient.mockImplementation(() => ({
    startBrowserSession: () => {},
    submitForm: (_form, data, _opts) => {
      expect(data.get('extra')).toBe('yep');
      return success;
    },
    teardown: () => {}
  }));

  act(() => {
    ReactDOM.render(
      <StaticKit site="xxx">
        <TestForm form="newsletter" extraData={{ extra: 'yep' }} />
      </StaticKit>,
      container
    );
  });

  const form = container.querySelector('form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });
});

it('evaluates functions passed in data', async () => {
  mockedCreateClient.mockImplementation(() => ({
    startBrowserSession: () => {},
    submitForm: (_form, data, _opts) => {
      expect(data.get('extra')).toBe('yep');
      return success;
    },
    teardown: () => {}
  }));

  act(() => {
    ReactDOM.render(
      <StaticKit site="xxx">
        <TestForm
          form="newsletter"
          extraData={{
            extra: () => {
              return 'yep';
            }
          }}
        />
      </StaticKit>,
      container
    );
  });

  const form = container.querySelector('form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });
});

it('reacts to server-side validation errors', async () => {
  mockedCreateClient.mockImplementation(() => ({
    site: 'xxx',
    invokeFunction: () => {},
    startBrowserSession: () => {},
    submitForm: (_form, _data, _opts) => {
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
  }));

  act(() => {
    ReactDOM.render(
      <StaticKit site="xxx">
        <TestForm form="newsletter" />
      </StaticKit>,
      container
    );
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
