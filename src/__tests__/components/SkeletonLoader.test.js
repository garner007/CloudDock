import React from 'react';
import { render } from '@testing-library/react';
import Skeleton, { SkeletonTable, SkeletonCards, SkeletonDetail } from '../../components/SkeletonLoader';

describe('Skeleton', () => {
  test('renders the skeleton element', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild;
    expect(el).toBeInTheDocument();
    expect(el.tagName.toLowerCase()).toBe('span');
  });

  test('has pulse animation style', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild;
    expect(el.style.animation).toContain('skeleton-pulse');
  });

  test('applies custom width and height', () => {
    const { container } = render(<Skeleton width="50%" height={20} />);
    const el = container.firstChild;
    expect(el.style.width).toBe('50%');
    expect(el.style.height).toBe('20px');
  });
});

describe('SkeletonTable', () => {
  test('renders correct number of rows', () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  test('renders correct number of columns', () => {
    const { container } = render(<SkeletonTable cols={['50%', '50%']} />);
    const headerCells = container.querySelectorAll('thead th');
    expect(headerCells).toHaveLength(2);
  });
});

describe('SkeletonCards', () => {
  test('renders specified number of cards', () => {
    const { container } = render(<SkeletonCards count={4} />);
    // Cards are direct children of the grid div
    const grid = container.querySelector('div[style*="grid"]');
    expect(grid.children).toHaveLength(4);
  });
});

describe('SkeletonDetail', () => {
  test('renders specified number of detail rows', () => {
    const { container } = render(<SkeletonDetail rows={3} />);
    // Each row is a div with two Skeleton children
    const wrapper = container.querySelector('div[style*="flex-direction"]');
    expect(wrapper.children).toHaveLength(3);
  });
});
