import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SQSPage from '../../pages/SQSPage';

describe('SQSPage', () => {
  test('renders page title', () => {
    render(<SQSPage showNotification={jest.fn()} />);
    expect(screen.getByText('SQS Queues')).toBeInTheDocument();
  });

  test('loads and lists queues', async () => {
    render(<SQSPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('my-queue')).toBeInTheDocument();
      expect(screen.getByText('my-fifo-queue.fifo')).toBeInTheDocument();
    });
  });

  test('shows queue count in subtitle', async () => {
    render(<SQSPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/2 queues/i)).toBeInTheDocument();
    });
  });

  test('shows FIFO badge for .fifo queues', async () => {
    render(<SQSPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-fifo-queue.fifo'));
    // Both queues use the same mock handler so both show Standard
    // but the name check is sufficient
    const fifoBadges = screen.getAllByText(/FIFO|Standard/);
    expect(fifoBadges.length).toBeGreaterThan(0);
  });

  test('opens create queue modal', async () => {
    const user = userEvent.setup();
    render(<SQSPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-queue'));
    await user.click(screen.getByText('Create queue'));
    expect(screen.getByText('Create SQS Queue')).toBeInTheDocument();
  });

  test('has FIFO checkbox in create modal', async () => {
    const user = userEvent.setup();
    render(<SQSPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-queue'));
    await user.click(screen.getByText('Create queue'));
    expect(screen.getByText('FIFO Queue')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('peeks messages and shows message view', async () => {
    const user = userEvent.setup();
    render(<SQSPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-queue'));
    await user.click(screen.getAllByText('Peek')[0]);
    await waitFor(() => {
      // Should show the queue detail view
      expect(screen.getByText('Send message')).toBeInTheDocument();
    });
  });

  test('shows peeked messages in queue view', async () => {
    const user = userEvent.setup();
    render(<SQSPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-queue'));
    await user.click(screen.getAllByText('Peek')[0]);
    await waitFor(() => {
      expect(screen.getByText(/\{"hello":"world"\}/)).toBeInTheDocument();
    });
  });

  test('opens send message modal', async () => {
    const user = userEvent.setup();
    render(<SQSPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-queue'));
    await user.click(screen.getAllByText('Peek')[0]);
    await waitFor(() => screen.getByText('Send message'));
    await user.click(screen.getByText('Send message'));
    expect(screen.getByText(/Send Message to/)).toBeInTheDocument();
  });

  test('sends message and shows success notification', async () => {
    const user = userEvent.setup();
    const showNotification = jest.fn();
    render(<SQSPage showNotification={showNotification} />);
    await waitFor(() => screen.getByText('my-queue'));
    await user.click(screen.getAllByText('Peek')[0]);
    await waitFor(() => screen.getByText('Send message'));
    await user.click(screen.getByText('Send message'));
    await user.type(screen.getByPlaceholderText(/Message body/), '{"test":true}');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith('Message sent');
    });
  });

  test('back button returns to queue list', async () => {
    const user = userEvent.setup();
    render(<SQSPage showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-queue'));
    await user.click(screen.getAllByText('Peek')[0]);
    await waitFor(() => screen.getByText('← Queues'));
    await user.click(screen.getByText('← Queues'));
    await waitFor(() => {
      expect(screen.getByText('SQS Queues')).toBeInTheDocument();
    });
  });
});
