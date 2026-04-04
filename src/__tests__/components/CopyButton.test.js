import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CopyButton from '../../components/CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  test('renders the copy button', () => {
    render(<CopyButton value="test-value" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('has correct title with value', () => {
    render(<CopyButton value="arn:aws:s3:::bucket" />);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Copy: arn:aws:s3:::bucket');
  });

  test('uses custom label for title', () => {
    render(<CopyButton value="arn:aws:s3:::bucket" label="Copy ARN" />);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Copy ARN');
  });

  test('calls navigator.clipboard.writeText on click', async () => {
    render(<CopyButton value="test-value" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-value');
  });

  test('does not copy when value is empty', async () => {
    render(<CopyButton value="" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });
});
