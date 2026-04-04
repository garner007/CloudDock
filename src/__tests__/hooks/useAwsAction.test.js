import { renderHook, act, waitFor } from '@testing-library/react';
import { useAwsAction } from '../../hooks/useAwsAction';

describe('useAwsAction', () => {
  it('execute() calls actionFn with args', async () => {
    const actionFn = jest.fn().mockResolvedValue('ok');

    const { result } = renderHook(() => useAwsAction(actionFn));

    await act(async () => {
      await result.current.execute('arg1', 'arg2');
    });

    expect(actionFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('shows success notification after action', async () => {
    const actionFn = jest.fn().mockResolvedValue('ok');
    const showNotification = jest.fn();

    const { result } = renderHook(() =>
      useAwsAction(actionFn, {
        successMessage: 'Created!',
        showNotification,
      })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(showNotification).toHaveBeenCalledWith('Created!', 'success');
  });

  it('calls onSuccess callback after action', async () => {
    const actionFn = jest.fn().mockResolvedValue('result-data');
    const onSuccess = jest.fn();

    const { result } = renderHook(() =>
      useAwsAction(actionFn, { onSuccess })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(onSuccess).toHaveBeenCalledWith('result-data');
  });

  it('shows error notification on failure', async () => {
    const actionFn = jest.fn().mockRejectedValue(new Error('Boom'));
    const showNotification = jest.fn();
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useAwsAction(actionFn, { showNotification, onError })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(showNotification).toHaveBeenCalledWith('Boom', 'error');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('sets loading during execution', async () => {
    let resolve;
    const actionFn = jest.fn(() => new Promise(r => { resolve = r; }));

    const { result } = renderHook(() => useAwsAction(actionFn));

    expect(result.current.loading).toBe(false);

    let promise;
    act(() => {
      promise = result.current.execute();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolve('done'); await promise; });

    expect(result.current.loading).toBe(false);
  });
});
