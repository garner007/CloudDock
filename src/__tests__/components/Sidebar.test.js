import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../../components/Sidebar';

const renderSidebar = (props = {}) =>
  render(
    <Sidebar
      currentService="dashboard"
      onNavigate={jest.fn()}
      collapsed={false}
      onToggle={jest.fn()}
      {...props}
    />
  );

describe('Sidebar', () => {
  test('renders all service categories', () => {
    renderSidebar();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Compute')).toBeInTheDocument();
    expect(screen.getByText('Messaging')).toBeInTheDocument();
    expect(screen.getByText('Networking')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
  });

  test('renders all 17 service navigation buttons', () => {
    renderSidebar();
    const services = [
      'Dashboard', 'S3', 'DynamoDB', 'ElastiCache',
      'Lambda', 'ECS',
      'SQS', 'SNS', 'Kinesis',
      'API Gateway', 'Route 53',
      'IAM', 'Cognito', 'Secrets Manager',
      'CloudWatch', 'CloudFormation', 'Parameter Store',
      'Settings',
    ];
    services.forEach(name => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  test('highlights the active service', () => {
    renderSidebar({ currentService: 's3' });
    const s3Button = screen.getByText('S3').closest('button');
    expect(s3Button).toHaveClass('active');
  });

  test('calls onNavigate with correct id when a service is clicked', () => {
    const onNavigate = jest.fn();
    renderSidebar({ onNavigate });
    fireEvent.click(screen.getByText('DynamoDB'));
    expect(onNavigate).toHaveBeenCalledWith('dynamodb');
  });

  test('calls onToggle when collapse button is clicked', () => {
    const onToggle = jest.fn();
    renderSidebar({ onToggle });
    fireEvent.click(screen.getByText('Collapse'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('hides labels and section text when collapsed', () => {
    renderSidebar({ collapsed: true });
    expect(screen.queryByText('Storage')).not.toBeInTheDocument();
    expect(screen.queryByText('Collapse')).not.toBeInTheDocument();
  });

  test('shows section labels when expanded', () => {
    renderSidebar({ collapsed: false });
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });
});
