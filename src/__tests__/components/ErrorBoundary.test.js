import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Component that throws during render
function ThrowingChild({ message = 'Test error' }) {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  // Suppress console.error noise from React error boundary internals
  let originalConsoleError;
  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalConsoleError;
  });

  test('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  test('shows error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  test('shows service name in error message', () => {
    render(
      <ErrorBoundary serviceName="S3">
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong in S3/)).toBeInTheDocument();
  });

  test('defaults serviceName to "this page"', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong in this page/)).toBeInTheDocument();
  });

  test('shows Try again and Reload app buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByText('Reload app')).toBeInTheDocument();
  });
});
