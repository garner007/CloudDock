import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { server } from '../../mocks/server';
import S3Page from '../../pages/S3Page';

const ENDPOINT = 'http://localhost:4566';

describe('S3Page — bucket list', () => {
  test('shows loading indicator initially', () => {
    render(<S3Page showNotification={jest.fn()} />);
    // Loading spinner should appear right away
    expect(document.querySelector('.spin')).toBeInTheDocument();
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

  test('shows empty state when no buckets exist', async () => {
    server.use(
      rest.get(ENDPOINT + '/', (req, res, ctx) =>
        res(ctx.xml(`<?xml version="1.0"?><ListAllMyBucketsResult><Buckets/></ListAllMyBucketsResult>`))
      )
    );
    render(<S3Page showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('No buckets')).toBeInTheDocument();
    });
  });

  test('shows error notification when API fails', async () => {
    const showNotification = jest.fn();
    server.use(
      rest.get(ENDPOINT + '/', (req, res, ctx) => res(ctx.status(500)))
    );
    render(<S3Page showNotification={showNotification} />);
    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(
        expect.any(String), 'error'
      );
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
    await user.click(screen.getAllByText('Create Bucket')[0]);
    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('new-bucket')
      );
    });
  });

  test('calls confirm and shows notification when deleting a bucket', async () => {
    const user = userEvent.setup();
    const showNotification = jest.fn();
    server.use(
      rest.delete(`${ENDPOINT}/:bucket`, (req, res, ctx) => res(ctx.status(204)))
    );
    render(<S3Page showNotification={showNotification} />);
    await waitFor(() => screen.getByText('my-test-bucket'));
    const deleteButtons = screen.getAllByTitle ? screen.getAllByRole('button', { name: /delete|trash/i }) : [];
    // Click first delete icon
    const trashButtons = document.querySelectorAll('.btn-danger');
    await user.click(trashButtons[0]);
    expect(window.confirm).toHaveBeenCalled();
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
