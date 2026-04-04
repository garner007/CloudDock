import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../../pages/DashboardPage';

const connectedHealth = {
  status: 'connected',
  endpoint: 'http://localhost:4566',
  services: {
    s3: 'running', dynamodb: 'running', lambda: 'running',
    sqs: 'running', sns: 'running', iam: 'running',
    kinesis: 'running', ssm: 'available',
  },
};

describe('DashboardPage', () => {
  test('renders page title', () => {
    render(<DashboardPage health={connectedHealth} onNavigate={jest.fn()} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('shows connected banner when LocalStack is up', () => {
    render(<DashboardPage health={connectedHealth} onNavigate={jest.fn()} />);
    expect(screen.getByText('Connected to LocalStack')).toBeInTheDocument();
  });

  test('shows disconnected banner when LocalStack is down', () => {
    render(
      <DashboardPage
        health={{ status: 'disconnected', endpoint: 'http://localhost:4566' }}
        onNavigate={jest.fn()}
      />
    );
    expect(screen.getByText('Not Connected')).toBeInTheDocument();
  });

  test('shows Configure button and navigates to settings when offline', async () => {
    const user = userEvent.setup();
    const onNavigate = jest.fn();
    render(
      <DashboardPage
        health={{ status: 'disconnected', endpoint: 'http://localhost:4566' }}
        onNavigate={onNavigate}
      />
    );
    await user.click(screen.getByText('Configure'));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  test('renders all 16 service cards', () => {
    render(<DashboardPage health={connectedHealth} onNavigate={jest.fn()} />);
    const services = ['S3', 'DynamoDB', 'ElastiCache', 'Lambda', 'ECS',
      'SQS', 'SNS', 'Kinesis', 'API Gateway', 'Route 53',
      'IAM', 'Cognito', 'Secrets Manager', 'CloudWatch', 'CloudFormation', 'Parameter Store'];
    services.forEach(name => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  test('shows Running badge for services that are running', () => {
    render(<DashboardPage health={connectedHealth} onNavigate={jest.fn()} />);
    const runningBadges = screen.getAllByText('Running');
    expect(runningBadges.length).toBeGreaterThan(0);
  });

  test('shows Unknown badge for services not in health response', () => {
    render(<DashboardPage health={connectedHealth} onNavigate={jest.fn()} />);
    const unknownBadges = screen.getAllByText('Unknown');
    expect(unknownBadges.length).toBeGreaterThan(0);
  });

  test('shows Offline badges when disconnected', () => {
    render(
      <DashboardPage
        health={{ status: 'disconnected', endpoint: 'http://localhost:4566' }}
        onNavigate={jest.fn()}
      />
    );
    const offlineBadges = screen.getAllByText('Offline');
    expect(offlineBadges.length).toBe(16);
  });

  test('navigates to service when a card is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = jest.fn();
    render(<DashboardPage health={connectedHealth} onNavigate={onNavigate} />);
    await user.click(screen.getByText('S3').closest('div.service-card'));
    expect(onNavigate).toHaveBeenCalledWith('s3');
  });
});
