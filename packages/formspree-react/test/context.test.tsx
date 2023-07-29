import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure.js';
import { render, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { CardElement, FormspreeProvider, useFormspree } from '../src';

jest.mock('@stripe/stripe-js/pure.js');

describe('FormspreeProvider', () => {
  describe('default', () => {
    it('creates a client available via context', () => {
      const { result } = renderHook(useFormspree, {
        wrapper: ({ children }) => (
          <FormspreeProvider>{children}</FormspreeProvider>
        ),
      });
      const { client } = result.current;
      expect(client).toBeTruthy();
      expect(client.project).toBeUndefined();
      expect(client.stripe).toBeUndefined();
    });
  });

  describe('with project', () => {
    it('creates a client available via context', () => {
      const project = 'test-project-id';
      const { result } = renderHook(useFormspree, {
        wrapper: ({ children }) => (
          <FormspreeProvider project={project}>{children}</FormspreeProvider>
        ),
      });
      const { client } = result.current;
      expect(client).toBeTruthy();
      expect(client.project).toBe(project);
      expect(client.stripe).toBeUndefined();
    });
  });

  describe('with Stripe', () => {
    beforeEach(() => {
      const stripe = {} as Stripe;
      const mock = loadStripe as jest.MockedFn<typeof loadStripe>;
      mock.mockResolvedValue(stripe);
    });

    let consoleError: jest.SpyInstance<void, string[]>;

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error');
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('creates a client available via context', async () => {
      const { result } = renderHook(useFormspree, {
        wrapper: ({ children }) => (
          <FormspreeProvider stripePK="test-stripe-public-key">
            {children}
          </FormspreeProvider>
        ),
      });

      const { client } = result.current;
      expect(client).toBeTruthy();
      expect(client.project).toBeUndefined();

      await waitFor(() => {
        // need to grab the updated client from result.current
        const { client } = result.current;
        expect(client.stripe).not.toBeUndefined();
      });
    });

    it('renders an app with CardElement without an error', () => {
      consoleError.mockImplementation(() => {}); // silent console.error

      expect(() => {
        render(
          <FormspreeProvider stripePK="test-stripe-public-key">
            <CardElement />
          </FormspreeProvider>
        );
      }).not.toThrow();
    });
  });
});
