'use client';

import { useCallback, useEffect, useState } from 'react';
import { EmissionGroupsService } from '@/components/CarbonFootprint/services/catalogs.service';
import type { EmissionGroup } from '../types';

// Module-level cache: groups rarely change, so one request is shared by every consumer
let cachedGroups: EmissionGroup[] | undefined;
let inFlightRequest: Promise<EmissionGroup[]> | undefined;

const fetchGroups = (): Promise<EmissionGroup[]> => {
  if (cachedGroups) return Promise.resolve(cachedGroups);
  if (!inFlightRequest) {
    inFlightRequest = EmissionGroupsService.getAll()
      .then(apiGroups => {
        cachedGroups = apiGroups.map(group => ({ id: group.id, label: group.name }));
        return cachedGroups;
      })
      .finally(() => {
        inFlightRequest = undefined;
      });
  }
  return inFlightRequest;
};

export const resetEmissionGroupsCache = () => {
  cachedGroups = undefined;
  inFlightRequest = undefined;
};

export interface UseEmissionGroupsResult {
  groups: EmissionGroup[];
  isLoading: boolean;
  hasError: boolean;
  getGroupLabel: (groupId: string) => string;
}

export const useEmissionGroups = (): UseEmissionGroupsResult => {
  const [groups, setGroups] = useState<EmissionGroup[]>(cachedGroups ?? []);
  const [isLoading, setIsLoading] = useState(!cachedGroups);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (cachedGroups) return;
    let isMounted = true;
    fetchGroups()
      .then(result => {
        if (isMounted) setGroups(result);
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const getGroupLabel = useCallback(
    (groupId: string) => groups.find(group => group.id === groupId)?.label ?? '',
    [groups],
  );

  return { groups, isLoading, hasError, getGroupLabel };
};
