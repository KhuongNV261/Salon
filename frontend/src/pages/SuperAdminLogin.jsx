import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, message } from 'antd'
import { LockOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { superLogin } from '../api'

export default function SuperAdminLogin() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!password) return message.warning('Vui lòng nhập mật khẩu!')
    setLoading(true)
    try {
      const res = await superLogin(password)
      localStorage.setItem('super_token', res.data.access_token)
      message.success('Đăng nhập thành công!')
      navigate('/super-admin/dashboard')
    } catch (err) {
      message.error(err.response?.data?.error || 'Sai mật khẩu quản trị')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Animated blobs background */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(102,126,234,0.15), transparent)',
        top: '-15%', left: '-15%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(118,75,162,0.15), transparent)',
        bottom: '-10%', right: '-10%', pointerEvents: 'none'
      }} />

      {/* Logo + Brand */}
      <div style={{ textAlign: 'center', marginBottom: 36, animation: 'fadeSlideDown 0.5s ease' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 16px',
          boxShadow: '0 12px 40px rgba(102,126,234,0.5)',
        }}>💈</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
          LocalPOS
        </div>
        <div style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.08)', borderRadius: 20,
          padding: '4px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          🔐 Cổng Quản trị Hệ thống
        </div>
      </div>

      {/* Login Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 28,
        padding: '36px 32px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        animation: 'fadeSlideUp 0.5s ease 0.1s both'
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            Đăng nhập quản trị
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Chỉ dành cho Super Admin của LocalPOS
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Mật khẩu
          </div>
          <Input.Password
            size="large"
            prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
            placeholder="Nhập mật khẩu quản trị..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={handleLogin}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14,
              color: '#fff',
              fontSize: 15,
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', height: 52, border: 'none', borderRadius: 14,
            background: loading ? 'rgba(102,126,234,0.4)' : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 28px rgba(102,126,234,0.5)',
            transition: 'all 0.25s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            letterSpacing: '-0.2px'
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(102,126,234,0.6)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 8px 28px rgba(102,126,234,0.5)' }}
        >
          {loading ? '⏳ Đang xác thực...' : <><span>Đăng nhập hệ thống</span><ArrowRightOutlined /></>}
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Truy cập trái phép sẽ bị ghi lại và xử lý
        </div>
      </div>

      {/* Back to home */}
      <a href="/" style={{
        marginTop: 28, fontSize: 13, color: 'rgba(255,255,255,0.35)',
        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
        animation: 'fadeIn 0.5s ease 0.3s both',
        transition: 'color 0.2s'
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
      >
        ← Về trang chủ LocalPOS
      </a>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ant-input-affix-wrapper {
          background: rgba(255,255,255,0.08) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 14px !important;
        }
        .ant-input-affix-wrapper input {
          background: transparent !important;
          color: #fff !important;
          font-size: 15px !important;
        }
        .ant-input-affix-wrapper input::placeholder { color: rgba(255,255,255,0.3) !important; }
        .ant-input-affix-wrapper .anticon { color: rgba(255,255,255,0.4) !important; }
        .ant-input-affix-wrapper:focus-within {
          border-color: rgba(102,126,234,0.6) !important;
          box-shadow: 0 0 0 2px rgba(102,126,234,0.2) !important;
        }
      `}</style>
    </div>
  )
}
