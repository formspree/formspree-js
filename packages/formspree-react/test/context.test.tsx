import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { FormspreeProvider, useFormspree } from '../src';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';

jest.mock('@stripe/stripe-js/pure');

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
    it('creates a client available via context', async () => {
      const stripe = {} as Stripe;
      const mockedLoadStripe = loadStripe as jest.MockedFn<typeof loadStripe>;
      mockedLoadStripe.mockResolvedValue(stripe);

      const stripePK = 'test-stripe-public-key';
      const { result } = renderHook(useFormspree, {
        wrapper: ({ children }) => (
          <FormspreeProvider stripePK={stripePK}>{children}</FormspreeProvider>
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
  });
});
