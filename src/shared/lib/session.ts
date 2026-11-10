export interface StoredSessionCompany {
  id: string;
  name: string;
  nit?: string;
  logoUrl?: string;
}

/** Shape saved in localStorage at login (see AuthResponse). Every field may be missing. */
export interface StoredSessionUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  company?: StoredSessionCompany | null;
  companies?: StoredSessionCompany[];
  permissions?: string[];
  isSuperAdmin?: boolean;
}

/** Reads the logged-in user saved in localStorage (client only). Returns undefined if absent or malformed. */
export const getStoredUser = (): StoredSessionUser | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as StoredSessionUser) : undefined;
  } catch {
    return undefined;
  }
};

export const getActiveCompany = (): StoredSessionCompany | null => getStoredUser()?.company ?? null;

export const getActiveCompanyId = (): string | undefined => getStoredUser()?.company?.id;

export const getCurrentUserId = (): string | undefined => getStoredUser()?.id;
