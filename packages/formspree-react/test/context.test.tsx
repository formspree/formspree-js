import { useStripe } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure.js';
import { render, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { CardElement, FormspreeProvider, useFormspree } from '../src';
import { createMockStripe } from './mockStripe';

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
    let mockStripe: ReturnType<typeof createMockStripe>;

    beforeEach(() => {
      mockStripe = createMockStripe();
      const mock = loadStripe as jest.MockedFn<typeof loadStripe>;
      mock.mockResolvedValue(mockStripe as unknown as Stripe);
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

      await waitFor(() => {
        const { client } = result.current;
        expect(client).toBeTruthy();
        expect(client.project).toBeUndefined();
        expect(client.stripe).toBe(mockStripe);
      });
    });

    it('passes Stripe client via Stripe Elements context', async () => {
      const { result } = renderHook(useStripe, {
        wrapper: ({ children }) => (
          <FormspreeProvider stripePK="test-stripe-public-key">
            {children}
          </FormspreeProvider>
        ),
      });

      expect(result.current).toBeNull();
      await waitFor(() => {
        expect(result.current).toBe(mockStripe);
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
