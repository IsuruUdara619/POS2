import logger from './logger';
import { API_BASE_URL } from '../config';

export { API_BASE_URL };

async function handleResponse(res: Response, method: string, path: string) {
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(text || 'Request failed');
    err.status = res.status;
    err.response = { status: res.status, statusText: res.statusText, data: text };
    
    // Log API error with full context
    logger.logApiError(err, `${API_BASE_URL}${path}`, method);
    throw err;
  }
  return res.json();
}

export async function get(path: string) {
  const startTime = performance.now();
  logger.debug('API Request', { method: 'GET', path, url: `${API_BASE_URL}${path}` });
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    const duration = performance.now() - startTime;
    logger.logPerformance(`GET ${path}`, duration);
    
    return await handleResponse(res, 'GET', path);
  } catch (error) {
    logger.error('API Request Failed', { method: 'GET', path, error });
    throw error;
  }
}

export async function post(path: string, data: unknown) {
  const startTime = performance.now();
  logger.debug('API Request', { method: 'POST', path, url: `${API_BASE_URL}${path}`, data });
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
    });
    
    const duration = performance.now() - startTime;
    logger.logPerformance(`POST ${path}`, duration);
    
    return await handleResponse(res, 'POST', path);
  } catch (error) {
    logger.error('API Request Failed', { method: 'POST', path, error });
    throw error;
  }
}

export async function put(path: string, data: unknown) {
  const startTime = performance.now();
  logger.debug('API Request', { method: 'PUT', path, url: `${API_BASE_URL}${path}`, data });
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
    });
    
    const duration = performance.now() - startTime;
    logger.logPerformance(`PUT ${path}`, duration);
    
    return await handleResponse(res, 'PUT', path);
  } catch (error) {
    logger.error('API Request Failed', { method: 'PUT', path, error });
    throw error;
  }
}

export async function del(path: string) {
  const startTime = performance.now();
  logger.debug('API Request', { method: 'DELETE', path, url: `${API_BASE_URL}${path}` });
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    const duration = performance.now() - startTime;
    logger.logPerformance(`DELETE ${path}`, duration);
    
    return await handleResponse(res, 'DELETE', path);
  } catch (error) {
    logger.error('API Request Failed', { method: 'DELETE', path, error });
    throw error;
  }
}
