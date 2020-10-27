import React from 'react';
import { FormspreeProvider, useForm } from '../src';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import { ErrorBoundary } from './helpers';
import { version } from '../package.json';

jest.mock('@formspree/core');
import { createClient, getDefaultClient } from '@formspree/core';
const core = jest.requireActual('@formspree/core');
const mockedCreateClient = createClient;
const mockedGetDefaultClient = getDefaultClient;

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
      <FormspreeProvider project="xxx">
        <ErrorBoundary>
          <TestForm />
        </ErrorBoundary>
      </FormspreeProvider>,
      container
    );
  });

  const error = container.querySelector('#error');
  expect(error.textContent).toBe(
    'You must provide a form key or hashid ' +
      '(e.g. useForm("myForm") or useForm("123xyz")'
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
      expect(opts.clientName).toBe(`@formspree/react@${version}`);
      return success;
    },
    teardown: () => {}
  }));

  act(() => {
    ReactDOM.render(
      <FormspreeProvider project="xxx">
        <TestForm form="newsletter" />
      </FormspreeProvider>,
      container
    );
  });

  const form = container.querySelector('form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });
});

it('creates the default client if none exists in the context', async () => {
  mockedGetDefaultClient.mockImplementation(() => ({
    startBrowserSession: () => {},
    submitForm: (form, _data, _opts) => {
      expect(form).toBe('123abc');
      return success;
    },
    teardown: () => {}
  }));

  act(() => {
    ReactDOM.render(<TestForm form="123abc" />, container);
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
      <FormspreeProvider project="xxx">
        <TestForm form="newsletter" />
      </FormspreeProvider>,
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
      <FormspreeProvider project="xxx">
        <TestForm form="newsletter" extraData={{ extra: 'yep' }} />
      </FormspreeProvider>,
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
      <FormspreeProvider project="xxx">
        <TestForm
          form="newsletter"
          extraData={{
            extra: () => {
              return 'yep';
            }
          }}
        />
      </FormspreeProvider>,
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
    project: 'xxx',
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
      <FormspreeProvider project="xxx">
        <TestForm form="newsletter" />
      </FormspreeProvider>,
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

it('reacts to form disabled errors', async () => {
  mockedCreateClient.mockImplementation(() => ({
    project: 'xxx',
    startBrowserSession: () => {},
    submitForm: (_form, _data, _opts) => {
      return new Promise(resolve => {
        resolve({
          body: {
            errors: [
              {
                code: 'DEACTIVATED',
                message: 'Form not active'
              }
            ]
          },
          response: { status: 403 }
        });
      });
    },
    teardown: () => {}
  }));

  act(() => {
    ReactDOM.render(
      <FormspreeProvider project="xxx">
        <TestForm form="newsletter" />
      </FormspreeProvider>,
      container
    );
  });

  const form = container.querySelector('form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });

  const errors = container.querySelector('#errors');
  expect(errors.textContent).toBe(
    `[{"code":"DEACTIVATED","message":"Form not active"}]`
  );
});

it('allows submit handler to be called with data directly', async () => {
  mockedGetDefaultClient.mockImplementation(() => ({
    startBrowserSession: () => {},
    submitForm: (form, data, _opts) => {
      expect(form).toBe('123abc');
      expect(data.email).toBe('email@email.com');
      expect(data.extra).toBe(true);
      return success;
    },
    teardown: () => {}
  }));

  function DirectSubmitForm() {
    const [state, submit] = useForm('123abc', { data: { extra: true } });
    const doSubmit = () => {
      submit({ email: 'email@email.com' });
    };
    return (
      <div>
        <form onSubmit={doSubmit}>
          <button type="submit">Sign up</button>
        </form>
      </div>
    );
  }

  act(() => {
    ReactDOM.render(<DirectSubmitForm />, container);
  });

  const form = container.querySelector('form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });
});
