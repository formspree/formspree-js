import React from 'react';
import ReactDOM from 'react-dom/client';
import { act } from '@testing-library/react';
import { ValidationError } from '../src';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

it('renders a field error if one exists', () => {
  act(() => {
    ReactDOM.createRoot(container).render(
      <ValidationError
        prefix="Email"
        field="email"
        className="error"
        errors={[
          {
            field: 'email',
            message: 'is required',
            code: 'REQUIRED',
          },
        ]}
      />
    );
  });

  expect(container).toMatchSnapshot();
});

it('renders field-less errors', () => {
  act(() => {
    ReactDOM.createRoot(container).render(
      <ValidationError
        className="error"
        errors={[
          {
            message: 'Form is disabled',
            code: 'FORM_DISABLED',
          },
        ]}
      />
    );
  });

  expect(container).toMatchSnapshot();
});

it('does not render anything if the field does not have an error', () => {
  act(() => {
    ReactDOM.createRoot(container).render(
      <ValidationError
        prefix="Email"
        field="email"
        errors={[
          {
            field: 'name',
            message: 'is required',
            code: 'REQUIRED',
          },
        ]}
      />
    );
  });

  expect(container).toMatchSnapshot();
});
