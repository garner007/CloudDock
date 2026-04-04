import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FirehosePage from '../../pages/FirehosePage';

jest.mock('@aws-sdk/client-firehose', () => ({
  FirehoseClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      DeliveryStreamNames: [],
      DeliveryStreamDescription: {
        DeliveryStreamStatus: 'ACTIVE',
        CreateTimestamp: '2024-01-01T00:00:00Z',
        Destinations: [],
      },
    }),
    destroy: jest.fn(),
  })),
  ListDeliveryStreamsCommand: jest.fn(),
  DescribeDeliveryStreamCommand: jest.fn(),
  CreateDeliveryStreamCommand: jest.fn(),
  DeleteDeliveryStreamCommand: jest.fn(),
  PutRecordCommand: jest.fn(),
}));

describe('FirehosePage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<FirehosePage showNotification={mockNotify} />);
    expect(screen.getByText(/Firehose/)).toBeInTheDocument();
  });

  it('shows empty state when no streams exist', async () => {
    render(<FirehosePage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText(/No delivery streams/)).toBeInTheDocument();
    });
  });
});
