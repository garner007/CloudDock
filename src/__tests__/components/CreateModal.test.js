import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateModal from '../../components/CreateModal';

const fields = [
  { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter name' },
  { name: 'region', label: 'Region', type: 'select', options: ['us-east-1', 'us-west-2'] },
];

const getSubmitBtn = () => screen.getByRole('button', { name: 'Create' });

describe('CreateModal', () => {
  test('does not render when open is false', () => {
    const { container } = render(
      <CreateModal open={false} title="New Item" onClose={jest.fn()} onSubmit={jest.fn()} fields={fields} />
    );
    expect(container.querySelector('.modal-overlay')).not.toBeInTheDocument();
  });

  test('renders fields when open', () => {
    render(
      <CreateModal open={true} title="Create Bucket" onClose={jest.fn()} onSubmit={jest.fn()} fields={fields} />
    );
    expect(screen.getByText('Create Bucket')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
  });

  test('shows validation error for required field on submit', async () => {
    const onSubmit = jest.fn();
    render(
      <CreateModal open={true} title="New Item" onClose={jest.fn()} onSubmit={onSubmit} fields={fields} />
    );
    fireEvent.click(getSubmitBtn());
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('calls onSubmit with form values', async () => {
    const onSubmit = jest.fn();
    render(
      <CreateModal open={true} title="New Item" onClose={jest.fn()} onSubmit={onSubmit} fields={fields} />
    );
    fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'my-bucket' } });
    fireEvent.click(getSubmitBtn());
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'my-bucket' }));
    });
  });

  test('shows loading state on submit button', () => {
    render(
      <CreateModal
        open={true}
        title="New Item"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        fields={fields}
        loading={true}
      />
    );
    const submitBtn = screen.getByText('Creating...');
    expect(submitBtn).toBeDisabled();
  });

  test('closes on Escape key', () => {
    const onClose = jest.fn();
    render(
      <CreateModal open={true} title="New Item" onClose={onClose} onSubmit={jest.fn()} fields={fields} />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  test('resets form when modal opens', () => {
    const { rerender } = render(
      <CreateModal open={true} title="New Item" onClose={jest.fn()} onSubmit={jest.fn()} fields={fields} />
    );
    fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'test' } });
    // Close and reopen
    rerender(
      <CreateModal open={false} title="New Item" onClose={jest.fn()} onSubmit={jest.fn()} fields={fields} />
    );
    rerender(
      <CreateModal open={true} title="New Item" onClose={jest.fn()} onSubmit={jest.fn()} fields={fields} />
    );
    expect(screen.getByPlaceholderText('Enter name').value).toBe('');
  });
});
