import axios from 'axios';
import { Config } from '@/helpers/Config';

// Anexo API Client
export const api = axios.create({
  baseURL: Config.API_ANEXO_URL,
});

// OutSystems API Client
export const outsystemsApi = axios.create({
  baseURL: Config.API_OUTSYSTEMS_URL,
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
  // Logic for adding tokens can go here
  return config;
});

export default api;
