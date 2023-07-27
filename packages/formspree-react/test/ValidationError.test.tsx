import { SubmissionError } from '@formspree/core';
import { act } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ValidationError } from '../src';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
});

it('renders a field error if one exists', () => {
  act(() => {
    ReactDOM.createRoot(container).render(
      <ValidationError
        prefix="Email"
        field="email"
        className="error"
        errors={
          new SubmissionError({
            field: 'email',
            message: 'is required',
            code: 'REQUIRED_FIELD_MISSING',
          })
        }
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
        errors={
          new SubmissionError({
            message: 'Form is disabled',
            code: 'INACTIVE',
          })
        }
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
        errors={
          new SubmissionError({
            field: 'name',
            message: 'is required',
            code: 'REQUIRED_FIELD_MISSING',
          })
        }
      />
    );
  });

  expect(container).toMatchSnapshot();
});
