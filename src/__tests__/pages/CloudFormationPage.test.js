import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CloudFormationPage from '../../pages/CloudFormationPage';

jest.mock('@aws-sdk/client-cloudformation', () => ({
  CloudFormationClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ StackSummaries: [] }),
    destroy: jest.fn(),
  })),
  ListStacksCommand: jest.fn(),
}));

describe('CloudFormationPage', () => {
  test('renders page title', async () => {
    render(<CloudFormationPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('CloudFormation Stacks')).toBeInTheDocument();
    });
  });
});
