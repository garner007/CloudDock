import { useState, useCallback, useEffect } from 'react';

/**
 * useAwsResource — shared hook for loading AWS resource lists.
 *
 * Encapsulates the useState/useCallback/useEffect pattern repeated across
 * 25+ service pages (S3, DynamoDB, SQS, etc.).
 *
 * @param {() => Promise<any[]>} loadFn   Async function that returns items
 * @param {object}               options
 * @param {boolean}              options.autoLoad  Auto-load on mount (default true)
 * @param {(err: Error) => void} options.onError   Called when loadFn rejects
 * @returns {{ items, loading, error, refresh, setItems }}
 */
export function useAwsResource(loadFn, { autoLoad = true, onError } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadFn();
      setItems(data);
    } catch (err) {
      setError(err.message);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [loadFn, onError]);

  useEffect(() => {
    if (autoLoad) refresh();
  }, [autoLoad, refresh]);

  return { items, loading, error, refresh, setItems };
}
