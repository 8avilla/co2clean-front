/**
 * Centralized type definitions for the Portal Salud project.
 * Defined according to the guidelines in ARQUITECTURA.md
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface SearchParams {
  searchTerm: string;
  limit?: number;
  offset?: number;
}
