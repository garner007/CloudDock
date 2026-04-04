import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Route53Page from '../../pages/Route53Page';

jest.mock('@aws-sdk/client-route-53', () => ({
  Route53Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ HostedZones: [] }),
    destroy: jest.fn(),
  })),
  ListHostedZonesCommand: jest.fn(),
}));

describe('Route53Page', () => {
  test('renders page title', async () => {
    render(<Route53Page showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Route 53 Hosted Zones')).toBeInTheDocument();
    });
  });
});
