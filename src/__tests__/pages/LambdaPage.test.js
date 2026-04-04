import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LambdaPage from '../../pages/LambdaPage';

describe('LambdaPage', () => {
  test('renders page title', () => {
    render(<LambdaPage showNotification={jest.fn()} />);
    expect(screen.getByText('Lambda Functions')).toBeInTheDocument();
  });

  test('loads and lists functions', async () => {
    render(<LambdaPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('my-function')).toBeInTheDocument();
      expect(screen.getByText('node-function')).toBeInTheDocument();
    });
  });

  test('shows correct runtime badges', async () => {
    render(<LambdaPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('python3.11')).toBeInTheDocument();
      expect(screen.getByText('nodejs20.x')).toBeInTheDocument();
    });
  });

  test('shows function count in subtitle', async () => {
    render(<LambdaPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/2 functions/i)).toBeInTheDocument();
    });
  });

  test('opens invoke modal on Invoke click', async () => {
    const user = userEvent.setup();
    render(<LambdaPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-function'));
    await user.click(screen.getAllByText('Invoke')[0]);
    expect(screen.getByText(/my-function/)).toBeInTheDocument();
    expect(screen.getByText('Invoke Payload (JSON)')).toBeInTheDocument();
  });

  test('invoke modal shows function metadata', async () => {
    const user = userEvent.setup();
    render(<LambdaPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-function'));
    await user.click(screen.getAllByText('Invoke')[0]);
    await waitFor(() => {
      expect(screen.getByText('python3.11')).toBeInTheDocument();
      expect(screen.getByText('handler.lambda_handler')).toBeInTheDocument();
      expect(screen.getByText('128 MB')).toBeInTheDocument();
    });
  });

  test('invokes function and shows response', async () => {
    const user = userEvent.setup();
    const showNotification = jest.fn();
    render(<LambdaPage showNotification={showNotification} />);
    await waitFor(() => screen.getByText('my-function'));
    await user.click(screen.getAllByText('Invoke')[0]);
    await user.click(screen.getByRole('button', { name: /invoke/i }));
    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument();
      expect(screen.getByText(/HTTP 200/i)).toBeInTheDocument();
    });
  });

  test('shows log tail after invocation', async () => {
    const user = userEvent.setup();
    render(<LambdaPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-function'));
    await user.click(screen.getAllByText('Invoke')[0]);
    await user.click(screen.getByRole('button', { name: /invoke/i }));
    await waitFor(() => {
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText(/START RequestId/)).toBeInTheDocument();
    });
  });

  test('closes modal on Close button click', async () => {
    const user = userEvent.setup();
    render(<LambdaPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-function'));
    await user.click(screen.getAllByText('Invoke')[0]);
    await user.click(screen.getByText('Close'));
    expect(screen.queryByText('Invoke Payload (JSON)')).not.toBeInTheDocument();
  });
});
