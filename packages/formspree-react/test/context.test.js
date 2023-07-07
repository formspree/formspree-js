import React from 'react';
import { FormspreeProvider, useFormspree } from '../src';
import ReactDOM from 'react-dom/client';
import { act } from '@testing-library/react';
import { createClient } from '@formspree/core';

jest.mock('@formspree/core');

let container;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

it('instantiates a client and provides it via useFormspree hook', async () => {
  createClient.mockImplementation((config) => ({
    key: config.project,
  }));

  const Component = () => {
    const client = useFormspree();

    return <div id="client">project: {client.client.key}</div>;
  };

  const Page = ({ project }) => {
    return (
      <FormspreeProvider project={project}>
        <Component />
      </FormspreeProvider>
    );
  };

  act(() => {
    ReactDOM.createRoot(container).render(<Page project="xxx" />);
  });

  expect(container.querySelector('#client').textContent).toBe('project: xxx');
});
