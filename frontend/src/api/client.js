import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/transactions'

export const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[api] request failed', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      detail: error.response?.data?.detail,
    })
    return Promise.reject(error)
  },
)

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinel_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
