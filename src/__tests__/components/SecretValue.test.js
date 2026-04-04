import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SecretValue from '../../components/SecretValue';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Eye: (props) => <svg data-testid="eye-icon" {...props} />,
  EyeOff: (props) => <svg data-testid="eye-off-icon" {...props} />,
  Copy: (props) => <svg data-testid="copy-icon" {...props} />,
}));

describe('SecretValue', () => {
  const mockValue = 'super-secret-key-12345';

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  test('shows masked value by default', () => {
    render(<SecretValue value={mockValue} />);
    expect(screen.getByText(/\u2022{4,}/)).toBeInTheDocument();
    expect(screen.queryByText(mockValue)).not.toBeInTheDocument();
  });

  test('reveals value on eye button click', () => {
    render(<SecretValue value={mockValue} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reveal secret value' }));
    expect(screen.getByText(mockValue)).toBeInTheDocument();
  });

  test('hides again on second click', () => {
    render(<SecretValue value={mockValue} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reveal secret value' }));
    expect(screen.getByText(mockValue)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide secret value' }));
    expect(screen.queryByText(mockValue)).not.toBeInTheDocument();
    expect(screen.getByText(/\u2022{4,}/)).toBeInTheDocument();
  });

  test('auto-hides after 10 seconds', () => {
    jest.useFakeTimers();
    render(<SecretValue value={mockValue} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reveal secret value' }));
    expect(screen.getByText(mockValue)).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(10000); });
    expect(screen.queryByText(mockValue)).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  test('copy button calls navigator.clipboard.writeText', () => {
    render(<SecretValue value={mockValue} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy secret value' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockValue);
  });

  test('copy button calls onCopy callback', () => {
    const onCopy = jest.fn();
    render(<SecretValue value={mockValue} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy secret value' }));
    expect(onCopy).toHaveBeenCalled();
  });

  test('has proper ARIA labels', () => {
    render(<SecretValue value={mockValue} />);
    expect(screen.getByRole('button', { name: 'Reveal secret value' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy secret value' })).toBeInTheDocument();
  });
});
