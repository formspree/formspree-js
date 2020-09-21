import React from 'react';
import { FormspreeProvider, useFormspree } from '../src';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import { createClient } from '@formspree/core';
import { ErrorBoundary } from './helpers';

jest.mock('@formspree/core');

const { act } = ReactTestUtils;

let container;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

it('instantiates a client and provides it via useFormspree hook', () => {
  createClient.mockImplementation(config => ({
    startBrowserSession: () => {},
    key: config.projectKey
  }));

  const Component = () => {
    const client = useFormspree();
    return <div id="client">projectKey: {client.key}</div>;
  };

  const Page = ({ projectKey }) => {
    return (
      <FormspreeProvider projectKey={projectKey}>
        <Component />
      </FormspreeProvider>
    );
  };

  act(() => {
    ReactDOM.render(<Page projectKey="xxx" />, container);
  });

  expect(container.querySelector('#client').textContent).toBe(
    'projectKey: xxx'
  );
});

it('throws an error if projectKey prop is not provided', () => {
  // Mock error console to suppress noise in output
  console.error = jest.fn();

  act(() => {
    ReactDOM.render(
      <ErrorBoundary>
        <FormspreeProvider></FormspreeProvider>
      </ErrorBoundary>,
      container
    );
  });

  const error = container.querySelector('#error');
  expect(error.textContent).toBe('projectKey is required');
});
