import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader and tracks loading / error / data, with a `reload` for retry
 * buttons. Stale responses from earlier calls are ignored.
 */
export default function useApi(loader, deps = [], { skip = false } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: !skip });
  const callId = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async () => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      if (id === callId.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === callId.current) setState({ data: null, error, loading: false });
    }
  }, []);

  useEffect(() => {
    if (skip) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, run, ...deps]);

  const setData = useCallback(
    (updater) =>
      setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })),
    []
  );

  return { ...state, reload: run, setData };
}
