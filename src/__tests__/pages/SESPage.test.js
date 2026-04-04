import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SESPage from '../../pages/SESPage';

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Identities: [],
      VerificationAttributes: {},
    }),
    destroy: jest.fn(),
  })),
  ListIdentitiesCommand: jest.fn(),
  GetIdentityVerificationAttributesCommand: jest.fn(),
  VerifyEmailIdentityCommand: jest.fn(),
  DeleteIdentityCommand: jest.fn(),
  SendEmailCommand: jest.fn(),
}));

describe('SESPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<SESPage showNotification={mockNotify} />);
    expect(screen.getByText(/SES/)).toBeInTheDocument();
  });

  it('shows empty state when no identities exist', async () => {
    render(<SESPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText(/No verified identities/)).toBeInTheDocument();
    });
  });
});
