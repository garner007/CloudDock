import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmDialog from '../../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  test('renders title and message', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete bucket?"
        message="This cannot be undone."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText('Delete bucket?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  test('calls onConfirm when confirm button clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog open={true} title="Delete?" onConfirm={onConfirm} onCancel={jest.fn()} />
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when cancel button clicked', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog open={true} title="Delete?" onConfirm={jest.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('shows loading state and disables buttons during async confirm', async () => {
    let resolveConfirm;
    const onConfirm = jest.fn(() => new Promise(r => { resolveConfirm = r; }));
    render(
      <ConfirmDialog open={true} title="Delete?" onConfirm={onConfirm} onCancel={jest.fn()} />
    );
    fireEvent.click(screen.getByText('Delete'));

    // While promise pending, buttons should be disabled
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeDisabled();
    });

    // Resolve the promise
    resolveConfirm();
    await waitFor(() => {
      expect(screen.getByText('Cancel')).not.toBeDisabled();
    });
  });

  test('has aria-describedby when message is present', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete?"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-describedby', 'confirm-message');
  });

  test('does not render when not open', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Delete?" onConfirm={jest.fn()} onCancel={jest.fn()} />
    );
    expect(container.querySelector('.modal-overlay')).not.toBeInTheDocument();
  });
});
