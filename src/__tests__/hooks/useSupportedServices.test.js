import { renderHook } from '@testing-library/react';
import { useSupportedServices } from '../../hooks/useSupportedServices';
import SERVICES from '../../services/catalog';
import { isServiceSupported } from '../../services/backends';

beforeEach(() => {
  localStorage.clear();
});

describe('useSupportedServices', () => {
  it('returns filtered services for localstack', () => {
    localStorage.setItem('ls_backend', 'localstack');

    const { result } = renderHook(() => useSupportedServices());

    // Should only include services supported by localstack
    const expected = SERVICES.filter(s => isServiceSupported(s.id, 'localstack'));
    expect(result.current).toEqual(expected);
    expect(result.current.length).toBeGreaterThan(0);

    // Verify every returned service is actually supported
    result.current.forEach(s => {
      expect(isServiceSupported(s.id, 'localstack')).toBe(true);
    });
  });

  it('returns filtered services for floci (excludes unsupported)', () => {
    localStorage.setItem('ls_backend', 'floci');

    const { result } = renderHook(() => useSupportedServices());

    const expected = SERVICES.filter(s => isServiceSupported(s.id, 'floci'));
    expect(result.current).toEqual(expected);

    // Floci supports fewer services than localstack
    const localstackCount = SERVICES.filter(s => isServiceSupported(s.id, 'localstack')).length;
    expect(result.current.length).toBeLessThan(localstackCount);
  });

  it('reads backendId from localStorage', () => {
    localStorage.setItem('ls_backend', 'floci');

    const { result } = renderHook(() => useSupportedServices());

    // EKS is localstack-only, should not appear for floci
    expect(result.current.find(s => s.id === 'eks')).toBeUndefined();
  });

  it('defaults to localstack when localStorage is empty', () => {
    const { result } = renderHook(() => useSupportedServices());

    const expected = SERVICES.filter(s => isServiceSupported(s.id, 'localstack'));
    expect(result.current).toEqual(expected);
  });
});
