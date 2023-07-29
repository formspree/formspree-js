export function createMockStripe() {
  // This implements the method so it passes `isStripe` check in react-stripe-js.
  // It is lurky but Stripe doesn't provide a mock client.
  return {
    confirmCardPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
    createToken: jest.fn(),
    elements: jest.fn(),
    handleCardAction: jest.fn(),
  };
}
