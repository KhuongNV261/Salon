import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { Spin, Popover, List, Button, Tag } from 'antd'
import {
  ShoppingCartOutlined, BarChartOutlined, LogoutOutlined,
  AppstoreOutlined, TeamOutlined, CalendarOutlined, SettingOutlined,
  UserOutlined, InboxOutlined, DashboardOutlined, WalletOutlined,
  BellOutlined, BellFilled, EllipsisOutlined
} from '@ant-design/icons'
import Login from './pages/Login'
import POS from './pages/POS'
import Reports from './pages/Reports'
import Products from './pages/Products'
import Staff from './pages/Staff'
import Booking from './pages/Booking'
import Settings from './pages/Settings'
import Customers from './pages/Customers'
import Inventory from './pages/Inventory'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Packages from './pages/Packages'
import PublicBooking from './pages/PublicBooking'
import LandingPage from './pages/LandingPage'
import SuperAdminLogin from './pages/SuperAdminLogin'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import useStore from './store'
import api from './api'
import 'antd/dist/reset.css'
import './themes/themes.css'
import './index.css'

// ─── Map route key → tên trang hiển thị trên header ───────
const PAGE_TITLES = {
  '':          '🛒 Bán hàng',
  'dashboard': '📊 Tổng quan',
  'booking':   '📅 Lịch hẹn',
  'customers': '👤 Khách hàng',
  'expenses':  '💼 Chi phí / Chốt ca',
  'products':  '📦 Dịch vụ & Sản phẩm',
  'staff':     '👥 Nhân viên',
  'reports':   '📈 Báo cáo',
  'packages':  '🎁 Gói dịch vụ',
  'inventory': '🏭 Kho hàng',
  'settings':  '⚙️ Cài đặt',
}

// ─── Tab bar cốt lõi (4 tab) ───────────────────────────────
const getNavTabs = (role, features = {}) => {
  if (role !== 'owner' && role !== 'manager') {
    return [
      { key: 'booking', icon: <CalendarOutlined />, label: 'Lịch hẹn', feature: 'booking' },
    ].filter(t => features[t.feature] !== false)
  }
  return [
    { key: '',          icon: <ShoppingCartOutlined />, label: 'Bán hàng',  feature: 'pos' },
    { key: 'booking',   icon: <CalendarOutlined />,    label: 'Lịch hẹn',  feature: 'booking' },
    { key: 'customers', icon: <UserOutlined />,        label: 'Khách',     feature: 'customers' },
    { key: 'reports',   icon: <BarChartOutlined />,    label: 'Báo cáo',   feature: 'reports' },
  ].filter(t => features[t.feature] !== false)
}

// ─── Các trang "Thêm" cho owner/manager ────────────────────
const getMoreItems = (features = {}) => [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng quan',           feature: 'dashboard' },
  { key: 'expenses',  icon: <WalletOutlined />,    label: 'Chi phí / Chốt ca',  feature: 'expenses' },
  { key: 'products',  icon: <AppstoreOutlined />,  label: 'Dịch vụ & Sản phẩm', feature: 'products' },
  { key: 'packages',  icon: <AppstoreOutlined />,  label: 'Gói dịch vụ / Thẻ',  feature: 'packages' },
  { key: 'inventory', icon: <InboxOutlined />,     label: 'Kho hàng',           feature: 'inventory' },
  { key: 'staff',     icon: <TeamOutlined />,      label: 'Nhân viên',          feature: 'staff' },
  { key: 'settings',  icon: <SettingOutlined />,   label: 'Cài đặt',           feature: 'settings' },
].filter(t => features[t.feature] !== false)

// ─── Guard: yêu cầu đăng nhập – nhớ URL gốc ───────────────
function PrivateRoute({ children }) {
  const { user } = useStore()
  const { slug } = useParams()
  const location = useLocation()
  if (!user) {
    // Lưu URL hiện tại vào state để Login biết redirect về đâu sau khi đăng nhập
    return <Navigate to={`/${slug}/login`} state={{ from: location.pathname + location.search }} replace />
  }
  return children
}

// ─── Panel thông báo lịch hẹn sắp tới ─────────────────────
function NotificationBell({ slug }) {
  const { user } = useStore()
  const [alerts, setAlerts] = useState([])
  const [dismissed, setDismissed] = useState(new Set())
  const [open, setOpen] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const intervalRef = useRef(null)

  const fetchUpcoming = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/api/notifications/upcoming', { params: { minutes: 30 } })
      const items = res.data || []
      const fresh = items.filter(a => !dismissed.has(a.id))
      setAlerts(fresh)
      if (fresh.length > 0) {
        setFlashing(true)
        setTimeout(() => setFlashing(false), 3000)
      }
    } catch {}
  }, [user, dismissed])

  useEffect(() => {
    fetchUpcoming()
    intervalRef.current = setInterval(fetchUpcoming, 5 * 60 * 1000)
    return () => clearInterval(intervalRef.current)
  }, [fetchUpcoming])

  const dismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]))
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const dismissAll = () => {
    const ids = new Set(alerts.map(a => a.id))
    setDismissed(prev => new Set([...prev, ...ids]))
    setAlerts([])
    setOpen(false)
  }

  const urgentCount = alerts.filter(a => a.minutes_left <= 15).length
  const count = alerts.length

  const getUrgencyColor = (min) => {
    if (min <= 10) return '#ff4d4f'
    if (min <= 20) return '#fa8c16'
    return '#52c41a'
  }

  const getUrgencyLabel = (min) => {
    if (min <= 0) return 'Đã tới giờ!'
    if (min <= 10) return `${min} phút nữa ⚠️`
    return `${min} phút nữa`
  }

  const panelContent = (
    <div style={{ width: 300, maxHeight: 400, overflowY: 'auto' }}>
      {count === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#aaa' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 13 }}>Không có lịch hẹn nào sắp tới</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1e1b4b' }}>
              🔔 {count} lịch hẹn sắp tới
            </span>
            <Button type="text" size="small" onClick={dismissAll} style={{ color: '#aaa', fontSize: 12 }}>
              Đọc tất cả
            </Button>
          </div>
          <List
            dataSource={alerts}
            renderItem={apt => (
              <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #fafafa' }}>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Tag color={getUrgencyColor(apt.minutes_left)} style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                      {getUrgencyLabel(apt.minutes_left)}
                    </Tag>
                    <span style={{ fontSize: 12, color: '#667eea', fontWeight: 600 }}>
                      {apt.appointment_time_fmt}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b' }}>
                    💇 {apt.stylist_name}
                    {apt.service_name && <span style={{ color: '#888', fontWeight: 400 }}> · {apt.service_name}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: '#555' }}>
                      👤 {apt.customer_name}
                      {apt.customer_phone && <span style={{ color: '#888', marginLeft: 6 }}>· {apt.customer_phone}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {apt.customer_phone && (
                        <a href={`tel:${apt.customer_phone}`}
                          style={{ padding: '2px 8px', borderRadius: 6, background: '#e6f4ff', color: '#1890ff', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}
                          onClick={() => dismiss(apt.id)}
                        >
                          📞 Gọi
                        </a>
                      )}
                      <button onClick={() => dismiss(apt.id)} style={{
                        border: 'none', background: '#f5f5f5', borderRadius: 6,
                        padding: '2px 6px', cursor: 'pointer', color: '#aaa', fontSize: 11
                      }}>✕</button>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#aaa', textAlign: 'center' }}>
            Polling mỗi 5 phút · <Button type="link" size="small" style={{ fontSize: 11, padding: 0 }} onClick={fetchUpcoming}>Làm mới ngay</Button>
          </div>
        </>
      )}
    </div>
  )

  if (!user || (user.role !== 'owner' && user.role !== 'manager')) return null

  return (
    <Popover
      content={panelContent}
      title={null}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      overlayStyle={{ paddingTop: 4 }}
      overlayInnerStyle={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', padding: '12px 14px' }}
    >
      <button
        style={{
          background: count > 0 ? 'rgba(255,140,0,0.18)' : 'rgba(255,255,255,0.12)',
          border: count > 0 ? '1px solid rgba(255,140,0,0.5)' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8, color: '#fff', width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, cursor: 'pointer', position: 'relative',
          transition: 'all 0.3s',
          animation: flashing && count > 0 ? 'bellShake 0.5s ease-in-out 3' : 'none',
        }}
        title={count > 0 ? `${count} lịch hẹn sắp tới!` : 'Thông báo lịch hẹn'}
      >
        {count > 0
          ? <BellFilled style={{ color: urgentCount > 0 ? '#ff4d4f' : '#fa8c16' }} />
          : <BellOutlined />
        }
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: urgentCount > 0 ? '#ff4d4f' : '#fa8c16',
            color: '#fff', borderRadius: '50%',
            width: 16, height: 16, fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid transparent',
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
    </Popover>
  )
}

// ─── Shell layout mobile ────────────────────────────────────
function MobileLayout({ children, shopInfo }) {
  const { user, tenant, logout } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams()
  const [moreOpen, setMoreOpen] = useState(false)
  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager'

  const handleLogout = () => {
    logout()
    navigate(`/${slug}/login`)
  }

  const currentPage = location.pathname.replace(`/${slug}`, '').replace(/^\//, '')
  const NAV_TABS = getNavTabs(user?.role, shopInfo?.features)
  const MORE_ITEMS = isOwnerOrManager ? getMoreItems(shopInfo?.features) : []
  const pageTitle = PAGE_TITLES[currentPage] ?? ''
  const moreActive = MORE_ITEMS.some(m => m.key === currentPage)

  return (
    <div className="mobile-app">
      <header className="mobile-header">
        <div className="mobile-header-left">
          <div>
            <div className="header-shop-name" style={{ fontSize: 12, opacity: 0.7 }}>
              🏪 {tenant?.name || 'LocalPOS'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {pageTitle}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* 🔔 Chuông thông báo */}
          <NotificationBell slug={slug} />

          {/* Tên + role người dùng */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>

          {/* Đăng xuất */}
          <button className="header-logout-btn" onClick={handleLogout} title="Đăng xuất">
            <LogoutOutlined />
          </button>
        </div>
      </header>

      <main className="mobile-content">{children}</main>

      <nav className="bottom-tab-bar">
        {NAV_TABS.map(tab => {
          const active = currentPage === tab.key || (!currentPage && tab.key === '')
          return (
            <Link
              key={tab.key}
              to={`/${slug}/${tab.key}`}
              className={`tab-item ${active ? 'tab-active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </Link>
          )
        })}

        {/* Tab "Thêm" – chỉ hiện cho owner/manager */}
        {isOwnerOrManager && MORE_ITEMS.length > 0 && (
          <Popover
            open={moreOpen}
            onOpenChange={setMoreOpen}
            trigger="click"
            placement="topRight"
            arrow={false}
            overlayInnerStyle={{ padding: 0, borderRadius: 14, overflow: 'hidden', minWidth: 210, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            content={
              <div>
                <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 12, color: '#667eea' }}>
                  ☰ Danh mục khác
                </div>
                {MORE_ITEMS.map(item => {
                  const isActive = currentPage === item.key
                  return (
                    <Link
                      key={item.key}
                      to={`/${slug}/${item.key}`}
                      onClick={() => setMoreOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px',
                        color: isActive ? '#667eea' : '#333',
                        background: isActive ? '#f0f5ff' : '#fff',
                        fontWeight: isActive ? 700 : 400,
                        fontSize: 14, textDecoration: 'none',
                        borderBottom: '1px solid #f8f8f8',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 18, color: isActive ? '#667eea' : '#aaa', width: 22, textAlign: 'center' }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            }
          >
            <div className={`tab-item ${moreActive ? 'tab-active' : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
              <span className="tab-icon"><EllipsisOutlined /></span>
              <span className="tab-label">Thêm</span>
            </div>
          </Popover>
        )}
      </nav>
    </div>
  )
}

// ─── ShopLoader: resolve slug → shop info ──────────────────
const VALID_THEMES = ['classic', 'nature', 'luxury', 'cute']

function ShopLoader() {
  const { slug } = useParams()
  const [shopInfo, setShopInfo] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useStore()
  const wrapperRef = React.useRef(null)

  useEffect(() => { loadShop() }, [slug])

  const loadShop = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/public/shop/${slug}`)
      setShopInfo(res.data)
      const theme = VALID_THEMES.includes(res.data?.theme) ? res.data.theme : 'classic'
      if (wrapperRef.current) {
        wrapperRef.current.setAttribute('data-theme', theme)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!shopInfo || !wrapperRef.current) return
    const theme = VALID_THEMES.includes(shopInfo.theme) ? shopInfo.theme : 'classic'
    wrapperRef.current.setAttribute('data-theme', theme)
  }, [shopInfo])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 16, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
      <div style={{ fontSize: 48 }}>🏪</div>
      <Spin size="large" />
      <div style={{ color: '#fff', fontSize: 14, opacity: 0.8 }}>Đang tải...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f6fa, #e8edff)' }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🚧</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#1e1b4b', marginBottom: 8 }}>Không tìm thấy tiệm</div>
      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        Đường dẫn <strong style={{ color: '#667eea' }}>/{slug}</strong> không tồn tại.<br />
        Kiểm tra lại URL hoặc liên hệ chủ tiệm.
      </div>
      <Link to="/" style={{
        background: 'linear-gradient(135deg,#667eea,#764ba2)',
        color: '#fff', borderRadius: 12, padding: '12px 28px',
        fontWeight: 700, fontSize: 15, textDecoration: 'none',
        boxShadow: '0 6px 20px rgba(102,126,234,0.4)'
      }}>
        🏠 Về trang chủ
      </Link>
    </div>
  )

  const features = shopInfo?.features || {}
  const isEnabled = (key) => features[key] !== false
  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager'

  const wrap = (page) => (
    <PrivateRoute>
      <MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}>
        {page}
      </MobileLayout>
    </PrivateRoute>
  )

  return (
    <div ref={wrapperRef} data-theme={VALID_THEMES.includes(shopInfo?.theme) ? shopInfo.theme : 'classic'} style={{ minHeight: '100dvh' }}>
      <Routes>
        <Route path="login" element={<Login shopInfo={shopInfo} />} />

        {/* Bán hàng (POS) – chỉ owner/manager */}
        <Route path="" element={
          <PrivateRoute>
            {isOwnerOrManager
              ? <MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><POS /></MobileLayout>
              : <Navigate to={`/${slug}/booking`} replace />
            }
          </PrivateRoute>
        } />

        {/* Lịch hẹn – cần đăng nhập */}
        {isEnabled('booking') && (
          <Route path="booking" element={wrap(<Booking />)} />
        )}

        {/* Đặt lịch công khai – KHÔNG cần đăng nhập */}
        {isEnabled('booking') && (
          <Route path="booking/public" element={<PublicBooking shopInfo={shopInfo} />} />
        )}

        {isEnabled('dashboard') && isOwnerOrManager && (
          <Route path="dashboard" element={wrap(<Dashboard />)} />
        )}
        {isEnabled('customers') && isOwnerOrManager && (
          <Route path="customers" element={wrap(<Customers />)} />
        )}
        {isEnabled('inventory') && isOwnerOrManager && (
          <Route path="inventory" element={wrap(<Inventory />)} />
        )}
        {isOwnerOrManager && (
          <Route path="products" element={wrap(<Products />)} />
        )}
        {isEnabled('staff') && isOwnerOrManager && (
          <Route path="staff" element={wrap(<Staff />)} />
        )}
        {isEnabled('reports') && isOwnerOrManager && (
          <Route path="reports" element={wrap(<Reports />)} />
        )}
        {isEnabled('expenses') && isOwnerOrManager && (
          <Route path="expenses" element={wrap(<Expenses />)} />
        )}
        {isOwnerOrManager && (
          <Route path="packages" element={wrap(<Packages />)} />
        )}
        {isEnabled('settings') && isOwnerOrManager && (
          <Route path="settings" element={
            <PrivateRoute>
              <MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}>
                <Settings setShopInfo={setShopInfo} />
              </MobileLayout>
            </PrivateRoute>
          } />
        )}

        <Route path="*" element={<Navigate to={`/${slug}/`} replace />} />
      </Routes>
    </div>
  )
}

// ─── Root ───────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/super-admin" element={<SuperAdminLogin />} />
      <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
      <Route path="/:slug/*" element={<ShopLoader />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RootRedirect() {
  const { user, tenant } = useStore()
  if (user && tenant?.slug) return <Navigate to={`/${tenant.slug}/`} replace />
  return <LandingPage />
}
