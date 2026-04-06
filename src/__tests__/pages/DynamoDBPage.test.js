import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DynamoDBPage from '../../pages/DynamoDBPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('DynamoDBPage — table list', () => {
  test('renders page title', () => {
    render(<DynamoDBPage showNotification={jest.fn()} />);
    expect(screen.getByText('DynamoDB Tables')).toBeInTheDocument();
  });

  test('loads and displays tables', async () => {
    render(<DynamoDBPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
      expect(screen.getByText('products')).toBeInTheDocument();
      expect(screen.getByText('orders')).toBeInTheDocument();
    });
  });

  test('shows ACTIVE badge for each table', async () => {
    render(<DynamoDBPage showNotification={jest.fn()} />);
    await screen.findByText('users');
    const activeBadges = screen.getAllByText(/ACTIVE/);
    expect(activeBadges.length).toBeGreaterThan(0);
  });

  test('shows table count in subtitle', async () => {
    render(<DynamoDBPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/3 tables/i)).toBeInTheDocument();
    });
  });

  test('opens create table modal', async () => {
    const user = userEvent.setup();
    render(<DynamoDBPage showNotification={jest.fn()} />);
    await screen.findByText('users');
    await user.click(screen.getByText('Create table'));
    expect(screen.getByText('Create DynamoDB Table')).toBeInTheDocument();
  });

  test('create table modal has required fields', async () => {
    const user = userEvent.setup();
    render(<DynamoDBPage showNotification={jest.fn()} />);
    await screen.findByText('users');
    await user.click(screen.getByText('Create table'));
    expect(screen.getByPlaceholderText('my-table')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('id')).toBeInTheDocument();
  });

  test('requires table name to create', async () => {
    const user = userEvent.setup();
    const showNotification = jest.fn();
    render(<DynamoDBPage showNotification={showNotification} />);
    await screen.findByText('users');
    await user.click(screen.getByText('Create table'));
    await user.click(screen.getByRole('button', { name: 'Create Table' }));
    expect(showNotification).not.toHaveBeenCalled();
  });
});

describe('DynamoDBPage — item browser', () => {
  test('navigates to table view when Browse is clicked', async () => {
    const user = userEvent.setup();
    render(<DynamoDBPage showNotification={jest.fn()} />);
    await screen.findByText('users');
    await user.click(screen.getAllByText('Browse')[0]);
    await waitFor(() => {
      expect(screen.getByText(/DynamoDB/)).toBeInTheDocument();
    });
  });

  test('shows scanned items in table view', async () => {
    const user = userEvent.setup();
    render(<DynamoDBPage showNotification={jest.fn()} />);
    await screen.findByText('users');
    await user.click(screen.getAllByText('Browse')[0]);
    await waitFor(() => {
      expect(screen.getByText('user-1')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  test('shows Overview tab with table stats', async () => {
    const user = userEvent.setup();
    render(<DynamoDBPage showNotification={jest.fn()} />);
    await screen.findByText('users');
    await user.click(screen.getAllByText('Browse')[0]);
    await screen.findByText('Overview');
    await user.click(screen.getByText('Overview'));
    await waitFor(() => {
      expect(screen.getByText('Item Count')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  test('back button returns to table list', async () => {
    const user = userEvent.setup();
    render(<DynamoDBPage showNotification={jest.fn()} />);
    await screen.findByText('users');
    await user.click(screen.getAllByText('Browse')[0]);
    await screen.findByText(/Tables/);
    await user.click(screen.getByText(/Tables/));
    await waitFor(() => {
      expect(screen.getByText('DynamoDB Tables')).toBeInTheDocument();
    });
  });
});
