import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import KinesisPage from '../../pages/KinesisPage';

jest.mock('@aws-sdk/client-kinesis', () => ({
  KinesisClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      StreamNames: [],
      StreamDescriptionSummary: {
        StreamStatus: 'ACTIVE',
        OpenShardCount: 1,
        RetentionPeriodHours: 24,
        ConsumerCount: 0,
      },
    }),
    destroy: jest.fn(),
  })),
  ListStreamsCommand: jest.fn(),
  DescribeStreamSummaryCommand: jest.fn(),
  CreateStreamCommand: jest.fn(),
  DeleteStreamCommand: jest.fn(),
  PutRecordCommand: jest.fn(),
}));

describe('KinesisPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<KinesisPage showNotification={mockNotify} />);
    expect(screen.getByText(/Kinesis/)).toBeInTheDocument();
  });

  it('shows empty state when no streams exist', async () => {
    render(<KinesisPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText(/No streams/)).toBeInTheDocument();
    });
  });
});
