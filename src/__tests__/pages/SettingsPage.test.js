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
      expect.stringContaining('saved')
    );
  });

  test('backend selector cards are shown', () => {
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    expect(screen.getByText('Backend Emulator')).toBeInTheDocument();
    expect(screen.getByText('LocalStack')).toBeInTheDocument();
  });

  test('test connection shows success when LocalStack responds', async () => {
    const user = userEvent.setup();
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    const testBtn = screen.getByRole('button', { name: /test connection/i });
    await user.click(testBtn);
    await waitFor(() => {
      // The success result shows "✓ Connected — detected: <backend>"
      expect(screen.getByText(/✓ Connected/)).toBeInTheDocument();
    });
  });

  test('test connection shows detected backend on success', async () => {
    const user = userEvent.setup();
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    const testBtn = screen.getByRole('button', { name: /test connection/i });
    await user.click(testBtn);
    await waitFor(() => {
      expect(screen.getByText(/detected/i)).toBeInTheDocument();
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
    const testBtn = screen.getByRole('button', { name: /test connection/i });
    await user.click(testBtn);
    await waitFor(() => {
      expect(screen.getByText(/Could not connect|Connection failed/i)).toBeInTheDocument();
    });
  });

  test('shows connected status banner when health is connected', () => {
    render(
      <SettingsPage
        showNotification={jest.fn()}
        health={{ status: 'connected', endpoint: 'http://localhost:4566' }}
      />
    );
    expect(screen.getByText(/Connected to/)).toBeInTheDocument();
  });

  test('shows disconnected status banner when health is null', () => {
    render(<SettingsPage showNotification={jest.fn()} health={null} />);
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });
});
