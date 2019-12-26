import React from 'react';
import { StaticKit, useForm } from '../src';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import { createClient } from '@statickit/core';
import { ErrorBoundary } from './helpers';
import { version } from '../package.json';

jest.mock('@statickit/core');

const { act } = ReactTestUtils;

// A fake success result for a mocked `submitForm` call.
const success = new Promise(resolve => {
  resolve({ body: { id: '000', data: {} }, response: { status: 200 } });
});

function TestForm(props) {
  const [state, submit] = useForm({
    id: props.id,
    site: props.site,
    form: props.form,
    data: props.extraData
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

function TestFormLegacyArgs(props) {
  const [state, submit] = useForm(props.id);

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

it('fails it initialize without identifying properties', () => {
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
    'You must set an `id` or `site` & `form` properties'
  );

  // React's error logging
  expect(console.error).toHaveBeenCalled();
});

it('submits successfully with legacy arg structure', async () => {
  createClient.mockImplementation(() => ({
    submitForm: props => {
      expect(props.id).toBe('xxx');
      return success;
    },
    teardown: () => {}
  }));

  act(() => {
    ReactDOM.render(
      <StaticKit site="xxx">
        <TestFormLegacyArgs id="xxx" />
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

it('submits a client name', async () => {
  const mockClient = {
    submitForm: props => {
      expect(props.clientName).toBe(`@statickit/react@${version}`);
      return success;
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(
      <StaticKit client={mockClient}>
        <TestForm id="xxx" />
      </StaticKit>,
      container
    );
  });

  const form = container.querySelector('form');

  await act(async () => {
    ReactTestUtils.Simulate.submit(form);
  });
});

it('submits successfully with `id` property', async () => {
  const mockClient = {
    submitForm: props => {
      expect(props.id).toBe('xxx');
      return success;
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(
      <StaticKit client={mockClient}>
        <TestForm id="xxx" />
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

it('submits successfully with `site` + `form` properties', async () => {
  const mockClient = {
    submitForm: props => {
      expect(props.site).toBe('xxx');
      expect(props.form).toBe('newsletter');
      return success;
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(
      <StaticKit client={mockClient}>
        <TestForm site="xxx" form="newsletter" />
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
  const mockClient = {
    submitForm: props => {
      expect(props.data.get('extra')).toBe('yep');
      return success;
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(
      <StaticKit client={mockClient}>
        <TestForm site="xxx" form="newsletter" extraData={{ extra: 'yep' }} />
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
  const mockClient = {
    submitForm: props => {
      expect(props.data.get('extra')).toBe('yep');
      return success;
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(
      <StaticKit client={mockClient}>
        <TestForm
          site="xxx"
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
    ReactDOM.render(
      <StaticKit client={mockClient}>
        <TestForm id="xxx" />
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
