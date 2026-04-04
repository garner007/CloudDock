import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyState from '../../components/EmptyState';
import { Archive } from 'lucide-react';

describe('EmptyState', () => {
  test('renders title', () => {
    render(<EmptyState icon={Archive} title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  test('renders description when provided', () => {
    render(<EmptyState icon={Archive} title="No items" description="Create one to get started" />);
    expect(screen.getByText('Create one to get started')).toBeInTheDocument();
  });

  test('renders action when provided', () => {
    render(
      <EmptyState
        icon={Archive}
        title="No items"
        action={<button>Create</button>}
      />
    );
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  test('works without optional props', () => {
    render(<EmptyState icon={Archive} title="Empty" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    // No description or action should not throw
  });

  test('uses empty-state CSS class', () => {
    const { container } = render(<EmptyState icon={Archive} title="Empty" />);
    expect(container.querySelector('.empty-state')).toBeInTheDocument();
  });
});
