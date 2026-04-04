import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { useSettings } from '../../hooks/useSettings';

// Helper component that displays settings values
function SettingsDisplay() {
  const { endpoint, region, accessKey, secretKey, backendId } = useSettings();
  return (
    <div>
      <span data-testid="endpoint">{endpoint}</span>
      <span data-testid="region">{region}</span>
      <span data-testid="accessKey">{accessKey}</span>
      <span data-testid="secretKey">{secretKey}</span>
      <span data-testid="backendId">{backendId}</span>
    </div>
  );
}

// Helper component that can update settings
function SettingsUpdater({ updateMap }) {
  const { updateSettings } = useSettings();
  return (
    <button onClick={() => updateSettings(updateMap)} data-testid="update-btn">
      Update
    </button>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('useSettings', () => {
  it('provides default values when localStorage is empty', () => {
    render(
      <SettingsProvider>
        <SettingsDisplay />
      </SettingsProvider>
    );

    expect(screen.getByTestId('endpoint').textContent).toBe('http://localhost:4566');
    expect(screen.getByTestId('region').textContent).toBe('us-east-1');
    expect(screen.getByTestId('accessKey').textContent).toBe('test');
    expect(screen.getByTestId('secretKey').textContent).toBe('test');
    expect(screen.getByTestId('backendId').textContent).toBe('localstack');
  });

  it('reads existing localStorage values on mount', () => {
    localStorage.setItem('ls_endpoint', 'http://custom:9999');
    localStorage.setItem('ls_region', 'eu-west-1');
    localStorage.setItem('ls_access_key', 'mykey');
    localStorage.setItem('ls_secret_key', 'mysecret');
    localStorage.setItem('ls_backend', 'moto');

    render(
      <SettingsProvider>
        <SettingsDisplay />
      </SettingsProvider>
    );

    expect(screen.getByTestId('endpoint').textContent).toBe('http://custom:9999');
    expect(screen.getByTestId('region').textContent).toBe('eu-west-1');
    expect(screen.getByTestId('accessKey').textContent).toBe('mykey');
    expect(screen.getByTestId('secretKey').textContent).toBe('mysecret');
    expect(screen.getByTestId('backendId').textContent).toBe('moto');
  });

  it('updateSettings updates both state and localStorage', () => {
    render(
      <SettingsProvider>
        <SettingsDisplay />
        <SettingsUpdater updateMap={{ ls_endpoint: 'http://new:4566', ls_region: 'ap-south-1' }} />
      </SettingsProvider>
    );

    expect(screen.getByTestId('endpoint').textContent).toBe('http://localhost:4566');

    act(() => {
      screen.getByTestId('update-btn').click();
    });

    expect(screen.getByTestId('endpoint').textContent).toBe('http://new:4566');
    expect(screen.getByTestId('region').textContent).toBe('ap-south-1');
    expect(localStorage.getItem('ls_endpoint')).toBe('http://new:4566');
    expect(localStorage.getItem('ls_region')).toBe('ap-south-1');
  });

  it('throws error when used outside SettingsProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<SettingsDisplay />);
    }).toThrow('useSettings must be used within SettingsProvider');

    spy.mockRestore();
  });

  it('multiple consumers see the same state after updateSettings', () => {
    render(
      <SettingsProvider>
        <SettingsDisplay />
        <SettingsUpdater updateMap={{ ls_backend: 'floci' }} />
      </SettingsProvider>
    );

    expect(screen.getByTestId('backendId').textContent).toBe('localstack');

    act(() => {
      screen.getByTestId('update-btn').click();
    });

    expect(screen.getByTestId('backendId').textContent).toBe('floci');
  });

  it('preserves unmodified settings when updating a subset', () => {
    render(
      <SettingsProvider>
        <SettingsDisplay />
        <SettingsUpdater updateMap={{ ls_region: 'us-west-2' }} />
      </SettingsProvider>
    );

    act(() => {
      screen.getByTestId('update-btn').click();
    });

    // Updated
    expect(screen.getByTestId('region').textContent).toBe('us-west-2');
    // Preserved
    expect(screen.getByTestId('endpoint').textContent).toBe('http://localhost:4566');
    expect(screen.getByTestId('backendId').textContent).toBe('localstack');
  });
});
