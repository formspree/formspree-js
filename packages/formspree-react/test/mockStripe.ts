import type { Stripe } from '@stripe/stripe-js';

export function createMockStripe(): Stripe {
  // This implements the method so it passes `isStripe` check in react-stripe-js.
  // It is lurky but Stripe doesn't provide a mock client.
  return {
    confirmCardPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
    createToken: jest.fn(),
    elements: jest.fn(),
  } as unknown as Stripe;
}
