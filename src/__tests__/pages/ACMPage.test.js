import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ACMPage from '../../pages/ACMPage';

// Mock the dynamic import of @aws-sdk/client-acm
jest.mock('@aws-sdk/client-acm', () => ({
  __esModule: true,
  ACMClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      CertificateSummaryList: [
        {
          DomainName: 'example.com',
          CertificateArn: 'arn:aws:acm:us-east-1:000000000000:certificate/abc-123',
          Status: 'ISSUED',
          Type: 'AMAZON_ISSUED',
        },
      ],
    }),
    destroy: jest.fn(),
  })),
  ListCertificatesCommand: jest.fn(),
  RequestCertificateCommand: jest.fn(),
  DeleteCertificateCommand: jest.fn(),
  DescribeCertificateCommand: jest.fn(),
}));

describe('ACMPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<ACMPage showNotification={mockNotify} />);
    expect(screen.getByText(/ACM/)).toBeInTheDocument();
  });

  it('renders the certificate request button', () => {
    render(<ACMPage showNotification={mockNotify} />);
    expect(screen.getByText('Request certificate')).toBeInTheDocument();
  });

  it('loads certificate data without errors', async () => {
    render(<ACMPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });
  });
});
