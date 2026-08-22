import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { Spin, Result, Badge, Popover, List, Button, Tag, Drawer } from 'antd'
import {
  ShoppingCartOutlined, BarChartOutlined, LogoutOutlined,
  AppstoreOutlined, TeamOutlined, CalendarOutlined, SettingOutlined,
  UserOutlined, InboxOutlined, DashboardOutlined, WalletOutlined,
  BellOutlined, BellFilled, PhoneOutlined, CloseOutlined, MenuOutlined
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

// Tab bar thay đổi theo role và tính năng được bật
const getNavTabs = (role, features = {}) => {
  let tabs = []
  if (role === 'owner' || role === 'manager') {
    tabs = [
      { key: 'dashboard', icon: <DashboardOutlined />,   label: 'Tổng quan', feature: 'dashboard' },
      { key: '',          icon: <ShoppingCartOutlined />, label: 'Bán hàng', feature: 'pos' },
      { key: 'booking',   icon: <CalendarOutlined />,    label: 'Lịch hẹn',  feature: 'booking' },
      { key: 'customers', icon: <UserOutlined />,        label: 'Khách',     feature: 'customers' },
      { key: 'expenses',  icon: <WalletOutlined />,      label: 'Chi phí',   feature: 'expenses' },
    ]
  } else {
    tabs = [
      { key: 'booking',   icon: <CalendarOutlined />,    label: 'Lịch hẹn',  feature: 'booking' },
    ]
  }
  return tabs.filter(t => features[t.feature] !== false)
}

// ─── Guard: yêu cầu đăng nhập ───────────────────────
function PrivateRoute({ children }) {
  const { user } = useStore()
  const { slug } = useParams()
  if (!user) return <Navigate to={`/${slug}/login`} replace />
  return children
}

// ─── Panel thông báo lịch hẹn sắp tới ──────────────
function NotificationBell({ slug }) {
  const { user } = useStore()
  const [alerts, setAlerts] = useState([])       // lịch hẹn sắp tới
  const [dismissed, setDismissed] = useState(new Set()) // đã bấm tắt
  const [open, setOpen] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const intervalRef = useRef(null)

  const fetchUpcoming = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/api/notifications/upcoming', { params: { minutes: 30 } })
      const items = res.data || []
      // Lọc bỏ những cái đã dismiss
      const fresh = items.filter(a => !dismissed.has(a.id))
      setAlerts(fresh)
      // Flash chuông nếu có thông báo mới
      if (fresh.length > 0) {
        setFlashing(true)
        setTimeout(() => setFlashing(false), 3000)
      }
    } catch {}
  }, [user, dismissed])

  useEffect(() => {
    fetchUpcoming()
    intervalRef.current = setInterval(fetchUpcoming, 5 * 60 * 1000) // 5 phút
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
    if (min <= 20) return `${min} phút nữa`
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
                  {/* Urgency bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Tag color={getUrgencyColor(apt.minutes_left)} style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                      {getUrgencyLabel(apt.minutes_left)}
                    </Tag>
                    <span style={{ fontSize: 12, color: '#667eea', fontWeight: 600 }}>
                      {apt.appointment_time_fmt}
                    </span>
                  </div>

                  {/* Stylist + service */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b' }}>
                    💇 {apt.stylist_name}
                    {apt.service_name && <span style={{ color: '#888', fontWeight: 400 }}> · {apt.service_name}</span>}
                  </div>

                  {/* Customer info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: '#555' }}>
                      👤 {apt.customer_name}
                      {apt.customer_phone && (
                        <span style={{ color: '#888', marginLeft: 6 }}>· {apt.customer_phone}</span>
                      )}
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

          {/* Nút liên hệ nhanh (chỉ hiện khi có số điện thoại) */}
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

// ─── Shell layout mobile ─────────────────────────────
function MobileLayout({ children, shopInfo }) {
  const { user, tenant, logout } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager'

  const handleLogout = () => {
    logout()
    navigate(`/${slug}/login`)
  }

  const currentPage = location.pathname.replace(`/${slug}`, '').replace(/^\//, '')
  const NAV_TABS = getNavTabs(user?.role, shopInfo?.features)

  return (
    <div className="mobile-app">
      <header className="mobile-header">
        <div className="mobile-header-left">
          {isOwnerOrManager ? (
            <MenuOutlined style={{ fontSize: 20, color: '#fff', marginRight: 10, cursor: 'pointer' }} onClick={() => setDrawerOpen(true)} />
          ) : (
            <span className="header-logo">🏪</span>
          )}
          <div>
            <div className="header-shop-name">{tenant?.name || 'LocalPOS'}</div>
            <div className="header-user-name">{user?.name} · <span style={{ textTransform: 'capitalize', opacity: 0.7 }}>{user?.role}</span></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* 🔔 Chuông thông báo lịch hẹn */}
          <NotificationBell slug={slug} />

          {/* Cài đặt (chỉ owner/manager) */}
          {(user?.role === 'owner' || user?.role === 'manager') && shopInfo?.features?.settings !== false && (
            <Link to={`/${slug}/settings`} style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, color: '#fff', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, textDecoration: 'none'
            }} title="Cài đặt">
              <SettingOutlined />
            </Link>
          )}

          <button className="header-logout-btn" onClick={handleLogout} title="Đăng xuất">
            <LogoutOutlined />
          </button>
        </div>
      </header>

      {/* Side Menu cho Chủ */}
      <Drawer
        title="Danh mục quản lý"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        styles={{ body: { padding: 0 } }}
        width={260}
      >
        <List
          dataSource={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
            { key: '', icon: <ShoppingCartOutlined />, label: 'Bán hàng' },
            { key: 'booking', icon: <CalendarOutlined />, label: 'Lịch hẹn' },
            { key: 'products', icon: <AppstoreOutlined />, label: 'Dịch vụ / Sản phẩm' },
            { key: 'customers', icon: <UserOutlined />, label: 'Khách hàng' },
            { key: 'expenses', icon: <WalletOutlined />, label: 'Chi phí / Chốt ca' },
            { key: 'packages', icon: <AppstoreOutlined />, label: 'Gói Dịch Vụ / Thẻ' },
            { key: 'inventory', icon: <InboxOutlined />, label: 'Kho hàng' },
            { key: 'reports', icon: <BarChartOutlined />, label: 'Báo cáo' },
            { key: 'staff', icon: <TeamOutlined />, label: 'Nhân viên' },
            { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
          ].filter(item => shopInfo?.features?.[item.key === '' ? 'pos' : item.key] !== false)}
          renderItem={item => (
            <List.Item style={{ padding: 0 }}>
              <Link
                to={`/${slug}/${item.key}`}
                onClick={() => setDrawerOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%',
                  padding: '16px 24px', color: '#333', fontSize: 16,
                  textDecoration: 'none', background: currentPage === item.key || (!currentPage && item.key === '') ? '#f0f5ff' : 'transparent',
                  fontWeight: currentPage === item.key || (!currentPage && item.key === '') ? 700 : 400
                }}
              >
                <span style={{ marginRight: 14, fontSize: 18, color: '#667eea' }}>{item.icon}</span>
                {item.label}
              </Link>
            </List.Item>
          )}
        />
      </Drawer>

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
      </nav>
    </div>
  )
}

// ─── ShopLoader: resolve slug → shop info ────────────
const VALID_THEMES = ['classic', 'nature', 'luxury', 'cute']

function ShopLoader() {
  const { slug } = useParams()
  const [shopInfo, setShopInfo] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, tenant, setAuth, logout } = useStore()
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

  // Apply theme mỗi khi shopInfo thay đổi (chủ tiệm đổi theme trong Settings)
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
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="404"
        title="Không tìm thấy tiệm"
        subTitle={`Đường dẫn "/${slug}" không tồn tại. Vui lòng kiểm tra lại URL.`}
      />
    </div>
  )

  const features = shopInfo?.features || {}
  const isEnabled = (key) => features[key] !== false
  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager'

  return (
    <div ref={wrapperRef} data-theme={VALID_THEMES.includes(shopInfo?.theme) ? shopInfo.theme : 'classic'} style={{ minHeight: '100dvh' }}>
      <Routes>
        <Route path="login" element={<Login shopInfo={shopInfo} />} />
        {isEnabled('dashboard') && isOwnerOrManager && (
          <Route path="dashboard" element={
            <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Dashboard /></MobileLayout></PrivateRoute>
          } />
        )}
        <Route path="" element={
          <PrivateRoute>
            {isOwnerOrManager ? (
              <MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><POS /></MobileLayout>
            ) : (
              <Navigate to={`/${slug}/booking`} replace />
            )}
          </PrivateRoute>
        } />
        {isEnabled('booking') && (
          <Route path="booking" element={
            user
              ? <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Booking /></MobileLayout></PrivateRoute>
              : <PublicBooking shopInfo={shopInfo} />
          } />
        )}
        {isEnabled('customers') && isOwnerOrManager && (
          <Route path="customers" element={
            <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Customers /></MobileLayout></PrivateRoute>
          } />
        )}
        {isEnabled('inventory') && isOwnerOrManager && (
          <Route path="inventory" element={
            <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Inventory /></MobileLayout></PrivateRoute>
          } />
        )}
        {isOwnerOrManager && (
          <Route path="products" element={
            <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Products /></MobileLayout></PrivateRoute>
          } />
        )}
        {isEnabled('staff') && isOwnerOrManager && (
          <Route path="staff" element={
            <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Staff /></MobileLayout></PrivateRoute>
          } />
        )}
        {isEnabled('reports') && isOwnerOrManager && (
          <Route path="reports" element={
            <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Reports /></MobileLayout></PrivateRoute>
          } />
        )}
        {isEnabled('expenses') && isOwnerOrManager && (
          <Route path="expenses" element={
            <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Expenses /></MobileLayout></PrivateRoute>
          } />
        )}
        {isOwnerOrManager && (
          <Route path="packages" element={
            <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Packages /></MobileLayout></PrivateRoute>
          } />
        )}
        {isEnabled('settings') && isOwnerOrManager && (
          <Route path="settings" element={
            <PrivateRoute><MobileLayout shopInfo={shopInfo} setShopInfo={setShopInfo}><Settings setShopInfo={setShopInfo} /></MobileLayout></PrivateRoute>
          } />
        )}
        <Route path="*" element={<Navigate to={`/${slug}/`} replace />} />
      </Routes>
    </div>
  )
}

// ─── Root ────────────────────────────────────────────
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
  return <Navigate to="/tiem-hoa-lan/booking" replace />
}
