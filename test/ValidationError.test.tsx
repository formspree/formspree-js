import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import { ValidationError } from '../src';

const { act } = ReactTestUtils;

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

it('renders an error if one exists', () => {
  act(() => {
    ReactDOM.render(
      <ValidationError
        prefix="Email"
        field="email"
        className="error"
        errors={[
          {
            field: 'email',
            message: 'is required',
            code: 'REQUIRED',
            properties: {}
          }
        ]}
      />,
      container
    );
  });

  expect(container).toMatchSnapshot();
});

it('does not render anything if the field does not have an error', () => {
  act(() => {
    ReactDOM.render(
      <ValidationError
        prefix="Email"
        field="email"
        errors={[
          {
            field: 'name',
            message: 'is required',
            code: 'REQUIRED',
            properties: {}
          }
        ]}
      />,
      container
    );
  });

  expect(container).toMatchSnapshot();
});
