import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StepFunctionsPage from '../../pages/StepFunctionsPage';

jest.mock('@aws-sdk/client-sfn', () => ({
  SFNClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ stateMachines: [] }),
    destroy: jest.fn(),
  })),
  ListStateMachinesCommand: jest.fn(),
}));

describe('StepFunctionsPage', () => {
  test('renders page title', async () => {
    render(<StepFunctionsPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Step Functions')).toBeInTheDocument();
    });
  });
});
