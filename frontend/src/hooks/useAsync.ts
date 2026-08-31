import { useEffect, useState } from 'react';
import { ApiError } from '../services';

/**
 * One remote read, resolved once per loader.
 *
 * Deliberately not a cache: at this size the gallery makes two requests on
 * load and that is the whole story. Reach for a query library when that
 * stops being true, not before.
 */
export type Async<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

const describe = (error: unknown): string =>
  error instanceof ApiError
    ? error.message
    : 'Could not reach the API. Is the backend running?';

/**
 * `load` is the dependency, so pass a module-level function rather than an
 * inline closure — a new function every render would refetch every render.
 */
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
