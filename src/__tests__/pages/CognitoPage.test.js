import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CognitoPage from '../../pages/CognitoPage';

jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ UserPools: [] }),
    destroy: jest.fn(),
  })),
  ListUserPoolsCommand: jest.fn(),
}));

describe('CognitoPage', () => {
  test('renders page title', async () => {
    render(<CognitoPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Cognito User Pools')).toBeInTheDocument();
    });
  });
});
