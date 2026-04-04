import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SNSPage from '../../pages/SNSPage';

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Topics: [
        { TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic' },
      ],
      Subscriptions: [],
    }),
    destroy: jest.fn(),
  })),
  ListTopicsCommand: jest.fn(),
  ListSubscriptionsByTopicCommand: jest.fn(),
  CreateTopicCommand: jest.fn(),
  DeleteTopicCommand: jest.fn(),
  PublishCommand: jest.fn(),
}));

describe('SNSPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<SNSPage showNotification={mockNotify} />);
    expect(screen.getByText(/SNS/)).toBeInTheDocument();
  });

  it('renders topic list after data loads', async () => {
    render(<SNSPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('my-topic')).toBeInTheDocument();
    });
  });
});
