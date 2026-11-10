'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/shared/lib/api-client';

export type EntityLoadStatus = 'loading' | 'ready' | 'not-found' | 'error';

interface EntityLoaderResult<T> {
  data: T | undefined;
  status: EntityLoadStatus;
  reload: () => Promise<void>;
}

/**
 * Loads one entity for an edit screen and tells apart "does not exist" (404 or empty
 * response) from a real failure, so the UI can offer a retry only when it makes sense.
 */
export const useEntityLoader = <T>(loader: () => Promise<T | null | undefined>): EntityLoaderResult<T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [status, setStatus] = useState<EntityLoadStatus>('loading');

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await loader();
      if (result === null || result === undefined) {
        setStatus('not-found');
        return;
      }
      setData(result);
      setStatus('ready');
    } catch (error) {
      setStatus(error instanceof ApiError && error.status === 404 ? 'not-found' : 'error');
    }
  }, [loader]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, status, reload };
};
