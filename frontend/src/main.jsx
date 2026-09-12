import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import App from './App'
import { getSlugFromSubdomain } from './slug'
import 'antd/dist/reset.css'
import './index.css'

// ─── Subdomain redirect ────────────────────────────────────────
// Khi truy cập qua subdomain (vd: thanhthanh.khuong2601.io.vn)
// → slug đã nằm trong subdomain, KHÔNG thêm vào path
// → path sạch: /login, /booking, /booking/public, v.v.
const subdomainSlug = getSlugFromSubdomain()
if (subdomainSlug) {
  const currentPath = window.location.pathname
  let cleanPath = currentPath
  // Strip slug prefix nếu còn sót từ bookmark cũ (vd: /thanhthanh/login → /login)
  if (cleanPath.startsWith('/' + subdomainSlug + '/')) {
    cleanPath = cleanPath.slice(subdomainSlug.length + 1)
  } else if (cleanPath === '/' + subdomainSlug) {
    cleanPath = '/'
  }
  // Root → trang đặt lịch công khai (khách hàng vào là thấy ngay)
  if (cleanPath === '/') cleanPath = '/booking/public'
  if (cleanPath !== currentPath) {
    window.history.replaceState(null, '', cleanPath + window.location.search)
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ConfigProvider locale={viVN} theme={{
      token: {
        colorPrimary: '#667eea',
        borderRadius: 8,
        fontFamily: "'Inter', sans-serif"
      }
    }}>
      <App />
    </ConfigProvider>
  </BrowserRouter>
)
