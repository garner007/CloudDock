import React from 'react';
import { render, screen } from '@testing-library/react';
import GenericServicePage from '../../components/GenericServicePage';

describe('GenericServicePage', () => {
  test('renders service name', () => {
    render(<GenericServicePage serviceId="s3" health={null} />);
    expect(screen.getByText('S3')).toBeInTheDocument();
  });

  test('shows service subtitle/description', () => {
    render(<GenericServicePage serviceId="s3" health={null} />);
    expect(screen.getByText('Simple Storage Service')).toBeInTheDocument();
  });

  test('shows documentation links', () => {
    render(<GenericServicePage serviceId="s3" health={null} />);
    expect(screen.getByText('LocalStack Coverage Docs')).toBeInTheDocument();
    expect(screen.getByText('AWS Documentation')).toBeInTheDocument();
  });

  test('shows unknown service message for invalid serviceId', () => {
    render(<GenericServicePage serviceId="not_real_service" health={null} />);
    expect(screen.getByText('Unknown Service')).toBeInTheDocument();
    expect(screen.getByText(/not_real_service/)).toBeInTheDocument();
  });

  test('renders About section with service description', () => {
    render(<GenericServicePage serviceId="s3" health={null} />);
    expect(screen.getByText(/About S3/)).toBeInTheDocument();
  });
});
