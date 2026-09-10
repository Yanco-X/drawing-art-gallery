import { useEffect, useState } from 'react';
import { ApiError } from '../services';

export type Async<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

const describe = (error: unknown): string =>
  error instanceof ApiError
    ? error.message
    : 'Could not reach the API. Is the backend running?';

// `load` is the dependency: pass a module-level function, not an inline
// closure, or it refetches every render.
export const useAsync = <T,>(load: () => Promise<T>): Async<T> => {
  const [state, setState] = useState<Async<T>>({ status: 'loading' });

  useEffect(() => {
    // Guards against a response landing after this component is gone, or
    // after a newer request has already answered.
    let live = true;
    load().then(
      (data) => {
        if (live) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (live) setState({ status: 'error', message: describe(error) });
      },
    );
    return () => {
      live = false;
    };
  }, [load]);

  return state;
};
