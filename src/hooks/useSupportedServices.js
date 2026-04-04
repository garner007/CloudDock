import { useMemo } from 'react';
import SERVICES from '../services/catalog';
import { isServiceSupported } from '../services/backends';

/**
 * useSupportedServices — returns the service catalog filtered by the
 * currently-selected backend.
 *
 * Reads backendId from localStorage (key: 'ls_backend', default: 'localstack').
 * Returns a memoized array so consumers don't re-render unnecessarily.
 *
 * @returns {Array} Filtered services supported by the active backend
 */
export function useSupportedServices() {
  const backendId = localStorage.getItem('ls_backend') || 'localstack';

  return useMemo(
    () => SERVICES.filter(s => isServiceSupported(s.id, backendId)),
    [backendId]
  );
}
