import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TopBar from '../../components/TopBar';

const mockHealth = {
  status: 'connected',
  endpoint: 'http://localhost:4566',
  services: { s3: 'running', lambda: 'running' },
};

const renderTopBar = (props = {}) =>
  render(
    <TopBar
      health={mockHealth}
      checkingHealth={false}
      onRefreshHealth={jest.fn()}
      onNavigate={jest.fn()}
      currentService="dashboard"
      {...props}
    />
  );

describe('TopBar', () => {
  test('renders LocalStack branding', () => {
    renderTopBar();
    expect(screen.getByText('LocalStack')).toBeInTheDocument();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
  });

  test('shows connected indicator when health status is connected', () => {
    renderTopBar({ health: mockHealth });
    // TopBar shows backend name (e.g. "LocalStack") when connected
    const healthIndicator = document.querySelector('.health-indicator.connected');
    expect(healthIndicator).toBeInTheDocument();
  });

  test('shows Offline when health status is disconnected', () => {
    renderTopBar({ health: { status: 'disconnected', endpoint: 'http://localhost:4566' } });
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  test('shows checking indicator while refreshing', () => {
    renderTopBar({ checkingHealth: true });
    // RefreshCw spin icon should appear
    expect(document.querySelector('.spin')).toBeInTheDocument();
  });

  test('calls onRefreshHealth when refresh button clicked', () => {
    const onRefreshHealth = jest.fn();
    renderTopBar({ onRefreshHealth });
    // The small refresh button inside health indicator
    const refreshBtns = document.querySelectorAll('.refresh-btn');
    fireEvent.click(refreshBtns[0]);
    expect(onRefreshHealth).toHaveBeenCalledTimes(1);
  });

  test('navigates to dashboard when logo is clicked', () => {
    const onNavigate = jest.fn();
    renderTopBar({ onNavigate });
    fireEvent.click(screen.getByText('LocalStack').closest('div'));
    expect(onNavigate).toHaveBeenCalledWith('dashboard');
  });

  test('navigates to settings when gear button is clicked', () => {
    const onNavigate = jest.fn();
    renderTopBar({ onNavigate });
    fireEvent.click(screen.getByTitle('Settings'));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  test('displays the current region', () => {
    localStorage.setItem('ls_region', 'eu-west-1');
    renderTopBar();
    expect(screen.getByText('eu-west-1')).toBeInTheDocument();
    localStorage.clear();
  });

  test('shows command palette trigger', () => {
    renderTopBar();
    expect(screen.getByText('Search services…')).toBeInTheDocument();
  });

  test('calls onOpenPalette when search trigger is clicked', () => {
    const onOpenPalette = jest.fn();
    renderTopBar({ onOpenPalette });
    fireEvent.click(screen.getByText('Search services…'));
    expect(onOpenPalette).toHaveBeenCalledTimes(1);
  });
});
