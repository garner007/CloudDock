import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EventBridgePage from '../../pages/EventBridgePage';

jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      EventBuses: [
        { Name: 'default', Arn: 'arn:aws:events:us-east-1:000000000000:event-bus/default' },
      ],
      Rules: [],
    }),
    destroy: jest.fn(),
  })),
  ListEventBusesCommand: jest.fn(),
  ListRulesCommand: jest.fn(),
  PutRuleCommand: jest.fn(),
  DeleteRuleCommand: jest.fn(),
  PutEventsCommand: jest.fn(),
}));

describe('EventBridgePage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<EventBridgePage showNotification={mockNotify} />);
    expect(screen.getByText(/EventBridge/)).toBeInTheDocument();
  });

  it('shows event buses section after data loads', async () => {
    render(<EventBridgePage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('Event Buses')).toBeInTheDocument();
    });
  });
});
