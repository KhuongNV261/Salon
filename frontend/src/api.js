import axios from 'axios'

// baseURL rỗng để tránh double /api/api/...
// Tất cả request đều dùng đường dẫn đầy đủ /api/...
const baseURL = import.meta.env.VITE_API_URL || ''
const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/super-admin')) {
      localStorage.clear()
      // Redirect về trang login của slug hiện tại
      const parts = window.location.pathname.split('/')
      const slug = parts[1]
      if (slug && slug !== 'super-admin') {
        window.location.href = `/${slug}/login`
      }
    }
    return Promise.reject(err)
  }
)

// Super Admin API (prefix /api/super/...)
export const superLogin = (password) => api.post('/api/super/login', { password })
export const superGetTenants = () => api.get('/api/super/tenants')
export const superCreateTenant = (data) => api.post('/api/super/tenants', data)
export const superUpdateTenant = (id, data) => api.put(`/api/super/tenants/${id}`, data)
export const superExtendTenant = (id, months) => api.post(`/api/super/tenants/${id}/extend`, { months })

export default api
