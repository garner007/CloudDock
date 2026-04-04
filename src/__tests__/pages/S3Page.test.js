import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import S3Page from '../../pages/S3Page';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('S3Page — bucket list', () => {
  test('renders page title', () => {
    render(<S3Page showNotification={jest.fn()} />);
    expect(screen.getByText('Amazon S3')).toBeInTheDocument();
  });

  test('renders bucket list after load', async () => {
    render(<S3Page showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('my-test-bucket')).toBeInTheDocument();
      expect(screen.getByText('another-bucket')).toBeInTheDocument();
    });
  });

  test('shows bucket count in subtitle', async () => {
    render(<S3Page showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/2 buckets/i)).toBeInTheDocument();
    });
  });

  test('opens create bucket modal', async () => {
    const user = userEvent.setup();
    render(<S3Page showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-test-bucket'));
    await user.click(screen.getByText('Create bucket'));
    expect(screen.getByText('Create S3 Bucket')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('my-bucket')).toBeInTheDocument();
  });

  test('closes create bucket modal on Cancel', async () => {
    const user = userEvent.setup();
    render(<S3Page showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-test-bucket'));
    await user.click(screen.getByText('Create bucket'));
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create S3 Bucket')).not.toBeInTheDocument();
  });

  test('creates bucket and shows success notification', async () => {
    const user = userEvent.setup();
    const showNotification = jest.fn();
    render(<S3Page showNotification={showNotification} />);
    await waitFor(() => screen.getByText('my-test-bucket'));
    await user.click(screen.getByText('Create bucket'));
    await user.type(screen.getByPlaceholderText('my-bucket'), 'new-bucket');
    await user.click(screen.getByRole('button', { name: 'Create Bucket' }));
    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('new-bucket'));
    });
  });

  test('calls confirm dialog when deleting a bucket', async () => {
    const user = userEvent.setup();
    render(<S3Page showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-test-bucket'));
    const trashButtons = document.querySelectorAll('.btn-danger');
    expect(trashButtons.length).toBeGreaterThan(0);
    await user.click(trashButtons[0]);
    expect(screen.getByText(/Delete bucket/)).toBeInTheDocument();
  });
});

describe('S3Page — object browser', () => {
  test('navigates into a bucket when Browse is clicked', async () => {
    const user = userEvent.setup();
    render(<S3Page showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-test-bucket'));
    await user.click(screen.getAllByText('Browse')[0]);
    await waitFor(() => {
      expect(screen.getByText(/my-test-bucket/)).toBeInTheDocument();
    });
  });

  test('shows files in bucket', async () => {
    const user = userEvent.setup();
    render(<S3Page showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-test-bucket'));
    await user.click(screen.getAllByText('Browse')[0]);
    await waitFor(() => {
      expect(screen.getByText('hello.txt')).toBeInTheDocument();
    });
  });

  test('back button returns to bucket list', async () => {
    const user = userEvent.setup();
    render(<S3Page showNotification={jest.fn()} />);
    await waitFor(() => screen.getByText('my-test-bucket'));
    await user.click(screen.getAllByText('Browse')[0]);
    await waitFor(() => screen.getByText('hello.txt'));
    await user.click(screen.getByText('All Buckets'));
    await waitFor(() => {
      expect(screen.getByText('my-test-bucket')).toBeInTheDocument();
    });
  });
});
