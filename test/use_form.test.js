import React from 'react';
import useForm from '../src/use_form';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import StaticKit from '@statickit/core';

jest.mock('@statickit/core');

const { act } = ReactTestUtils;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return <h1>{this.state.errorMessage}</h1>;
    }

    return this.props.children;
  }
}

function TestForm(props) {
  const [state, submit] = useForm({
    id: props.id,
    site: props.site,
    form: props.form,
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
      <ErrorBoundary>
        <TestForm client={{}} />
      </ErrorBoundary>,
      container
    );
  });

  const heading = container.querySelector('h1');
  expect(heading.textContent).toBe(
    'You must set an `id` or `site` & `form` properties'
  );

  // React's error logging
  expect(console.error).toHaveBeenCalled();
});

it('submits successfully with legacy arg structure', async () => {
  StaticKit.mockImplementation(() => ({
    submitForm: props => {
      expect(props.id).toBe('xxx');

      return new Promise(resolve => {
        resolve({ body: { id: '000', data: {} }, response: { status: 200 } });
      });
    },
    teardown: () => {}
  }));

  act(() => {
    ReactDOM.render(<TestFormLegacyArgs id="xxx" />, container);
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

it('submits successfully with `id` property', async () => {
  const mockClient = {
    submitForm: props => {
      expect(props.id).toBe('xxx');

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

it('submits successfully with `site` + `form` properties', async () => {
  const mockClient = {
    submitForm: props => {
      expect(props.site).toBe('xxx');
      expect(props.form).toBe('newsletter');

      return new Promise(resolve => {
        resolve({ body: { id: '000', data: {} }, response: { status: 200 } });
      });
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(
      <TestForm site="xxx" form="newsletter" client={mockClient} />,
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

      return new Promise(resolve => {
        resolve({ body: { id: '000', data: {} }, response: { status: 200 } });
      });
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(
      <TestForm
        site="xxx"
        form="newsletter"
        extraData={{ extra: 'yep' }}
        client={mockClient}
      />,
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

      return new Promise(resolve => {
        resolve({ body: { id: '000', data: {} }, response: { status: 200 } });
      });
    },
    teardown: () => {}
  };

  act(() => {
    ReactDOM.render(
      <TestForm
        site="xxx"
        form="newsletter"
        extraData={{
          extra: () => {
            return 'yep';
          }
        }}
        client={mockClient}
      />,
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
