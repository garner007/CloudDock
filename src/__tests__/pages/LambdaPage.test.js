import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LambdaPage from '../../pages/LambdaPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('LambdaPage', () => {
  test('renders page title and loads data', async () => {
    render(<LambdaPage showNotification={jest.fn()} />);
    expect(screen.getByText('Lambda Functions')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('my-function')).toBeInTheDocument());
  });

  test('shows function list with runtime badges and count', async () => {
    render(<LambdaPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('my-function')).toBeInTheDocument();
      expect(screen.getByText('node-function')).toBeInTheDocument();
    });
    expect(screen.getByText(/2 functions/i)).toBeInTheDocument();
    expect(screen.getByText('python3.11')).toBeInTheDocument();
    expect(screen.getByText('nodejs20.x')).toBeInTheDocument();
  });

  test('opens invoke modal with function metadata', async () => {
    const user = userEvent.setup();
    render(<LambdaPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-function'));
    await user.click(screen.getAllByText('Invoke')[0]);
    expect(screen.getByText('Invoke Payload (JSON)')).toBeInTheDocument();
    expect(screen.getAllByText('python3.11').length).toBeGreaterThan(0);
    expect(screen.getAllByText('handler.lambda_handler').length).toBeGreaterThan(0);
    expect(screen.getAllByText('128 MB').length).toBeGreaterThan(0);
  });

  test('invokes function, shows response and logs, then closes', async () => {
    const user = userEvent.setup();
    const showNotification = jest.fn();
    render(<LambdaPage showNotification={showNotification} />);
    await waitFor(() => screen.getByText('my-function'));
    await user.click(screen.getAllByText('Invoke')[0]);
    const invokeButtons = screen.getAllByRole('button', { name: /invoke/i });
    await user.click(invokeButtons[invokeButtons.length - 1]);
    await waitFor(() => {
      if (showNotification.mock.calls.some(c => c[1] === 'error')) {
        throw new Error('Invoke failed: ' + showNotification.mock.calls.find(c => c[1] === 'error')[0]);
      }
      expect(screen.getByText('Response')).toBeInTheDocument();
    });
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText(/START RequestId/)).toBeInTheDocument();
    await user.click(screen.getByText('Close'));
    expect(screen.queryByText('Invoke Payload (JSON)')).not.toBeInTheDocument();
  });
});
