import { renderHook, act, waitFor } from '@testing-library/react';
import { useAwsResource } from '../../hooks/useAwsResource';

describe('useAwsResource', () => {
  it('auto-loads on mount and sets items', async () => {
    const data = [{ id: 1 }, { id: 2 }];
    const loadFn = jest.fn().mockResolvedValue(data);

    const { result } = renderHook(() => useAwsResource(loadFn));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(loadFn).toHaveBeenCalledTimes(1);
    expect(result.current.items).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it('sets loading true during load, false after', async () => {
    let resolve;
    const loadFn = jest.fn(() => new Promise(r => { resolve = r; }));

    const { result } = renderHook(() => useAwsResource(loadFn));

    expect(result.current.loading).toBe(true);

    await act(async () => { resolve([{ id: 1 }]); });

    expect(result.current.loading).toBe(false);
  });

  it('handles rejection — sets error and calls onError', async () => {
    const error = new Error('Network failure');
    const loadFn = jest.fn().mockRejectedValue(error);
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useAwsResource(loadFn, { onError })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network failure');
    expect(result.current.items).toEqual([]);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('autoLoad=false skips initial load', async () => {
    const loadFn = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() =>
      useAwsResource(loadFn, { autoLoad: false })
    );

    // Give it a tick to ensure nothing fires
    await act(async () => {});

    expect(loadFn).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
  });

  it('refresh() reloads data', async () => {
    const loadFn = jest.fn()
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

    const { result } = renderHook(() => useAwsResource(loadFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ id: 1 }]);

    await act(async () => { await result.current.refresh(); });

    expect(loadFn).toHaveBeenCalledTimes(2);
    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('setItems allows manual update', async () => {
    const loadFn = jest.fn().mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(() => useAwsResource(loadFn));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.setItems([{ id: 99 }]); });

    expect(result.current.items).toEqual([{ id: 99 }]);
  });
});
