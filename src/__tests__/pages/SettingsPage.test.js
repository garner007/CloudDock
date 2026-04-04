import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { server } from '../../mocks/server';
import SettingsPage from '../../pages/SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders page title', () => {
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('shows default endpoint value', () => {
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    expect(screen.getByDisplayValue('http://localhost:4566')).toBeInTheDocument();
  });

  test('shows default region value', () => {
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    expect(screen.getByDisplayValue('us-east-1')).toBeInTheDocument();
  });

  test('shows default credentials', () => {
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    const testInputs = screen.getAllByDisplayValue('test');
    expect(testInputs.length).toBe(2); // access key + secret key
  });

  test('saves settings to localStorage', async () => {
    const user = userEvent.setup();
    const showNotification = jest.fn();
    render(<SettingsPage showNotification={showNotification} health={null} />);

    const endpointInput = screen.getByDisplayValue('http://localhost:4566');
    await user.clear(endpointInput);
    await user.type(endpointInput, 'http://localhost:4510');

    await user.click(screen.getByText('Save Settings'));

    expect(localStorage.getItem('ls_endpoint')).toBe('http://localhost:4510');
    expect(showNotification).toHaveBeenCalledWith(
      expect.stringContaining('saved'), expect.anything()
    );
  });

  test('preset buttons update endpoint field', async () => {
    const user = userEvent.setup();
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    await user.click(screen.getByText('LocalStack (Docker)'));
    expect(screen.getByDisplayValue('http://localstack:4566')).toBeInTheDocument();
  });

  test('test connection shows success when LocalStack responds', async () => {
    const user = userEvent.setup();
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    await user.click(screen.getByText('Test Connection'));
    await waitFor(() => {
      expect(screen.getByText('✓ Connection successful')).toBeInTheDocument();
    });
  });

  test('test connection shows service list on success', async () => {
    const user = userEvent.setup();
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    await user.click(screen.getByText('Test Connection'));
    await waitFor(() => {
      expect(screen.getByText('s3')).toBeInTheDocument();
      expect(screen.getByText('lambda')).toBeInTheDocument();
    });
  });

  test('test connection shows failure when endpoint is unreachable', async () => {
    const user = userEvent.setup();
    server.use(
      rest.get('http://localhost:4566/_localstack/health', (req, res, ctx) =>
        res(ctx.status(500))
      )
    );
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    await user.click(screen.getByText('Test Connection'));
    await waitFor(() => {
      expect(screen.getByText('✕ Connection failed')).toBeInTheDocument();
    });
  });

  test('shows connected status banner when health is connected', () => {
    render(
      <SettingsPage
        showNotification={jest.fn()}
        health={{ status: 'connected', endpoint: 'http://localhost:4566' }}
      />
    );
    expect(screen.getByText('Connected to LocalStack')).toBeInTheDocument();
  });

  test('shows disconnected status banner when health is null', () => {
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });
});
