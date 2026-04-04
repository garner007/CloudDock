import { useState, useCallback } from 'react';

/**
 * useAwsAction — shared hook for create/delete/update operations.
 *
 * Wraps an async action with loading state and optional notifications.
 *
 * @param {(...args) => Promise<any>} actionFn          The async action to perform
 * @param {object}                    options
 * @param {string}                    options.successMessage   Message shown on success
 * @param {(result) => void}          options.onSuccess        Called with result on success
 * @param {(err: Error) => void}      options.onError          Called on failure
 * @param {(msg, type) => void}       options.showNotification Notification callback
 * @returns {{ execute, loading }}
 */
export function useAwsAction(actionFn, { successMessage, onSuccess, onError, showNotification } = {}) {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    try {
      const result = await actionFn(...args);
      if (showNotification && successMessage) {
        showNotification(successMessage, 'success');
      }
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      if (showNotification) {
        showNotification(err.message, 'error');
      }
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [actionFn, successMessage, onSuccess, onError, showNotification]);

  return { execute, loading };
}
