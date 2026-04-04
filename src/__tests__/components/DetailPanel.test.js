import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DetailPanel, { KVGrid } from '../../components/DetailPanel';

describe('DetailPanel', () => {
  test('renders title and children', () => {
    render(
      <DetailPanel title="Bucket Details" onClose={jest.fn()}>
        <p>Content here</p>
      </DetailPanel>
    );
    expect(screen.getByText('Bucket Details')).toBeInTheDocument();
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  test('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(
      <DetailPanel title="Details" onClose={onClose}>
        <p>Body</p>
      </DetailPanel>
    );
    fireEvent.click(screen.getByLabelText('Close panel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('closes on Escape key', () => {
    const onClose = jest.fn();
    render(
      <DetailPanel title="Details" onClose={onClose}>
        <p>Body</p>
      </DetailPanel>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('closes on backdrop click', () => {
    const onClose = jest.fn();
    render(
      <DetailPanel title="Details" onClose={onClose}>
        <p>Body</p>
      </DetailPanel>
    );
    fireEvent.click(screen.getByTestId('detail-panel-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('has correct ARIA attributes', () => {
    render(
      <DetailPanel title="My Panel" onClose={jest.fn()}>
        <p>Body</p>
      </DetailPanel>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'My Panel');
  });
});

describe('KVGrid', () => {
  test('renders key-value pairs', () => {
    const items = [
      { label: 'Name', value: 'my-bucket' },
      { label: 'Region', value: 'us-east-1' },
    ];
    render(<KVGrid items={items} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('my-bucket')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
  });
});
