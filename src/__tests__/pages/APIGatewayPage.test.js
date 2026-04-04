import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import APIGatewayPage from '../../pages/APIGatewayPage';

jest.mock('@aws-sdk/client-api-gateway', () => ({
  APIGatewayClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ items: [] }),
    destroy: jest.fn(),
  })),
  GetRestApisCommand: jest.fn(),
}));

describe('APIGatewayPage', () => {
  test('renders page title', async () => {
    render(<APIGatewayPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('API Gateway')).toBeInTheDocument();
    });
  });
});
