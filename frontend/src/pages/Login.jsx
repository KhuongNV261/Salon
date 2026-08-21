import React, { useState } from 'react'
import { Input, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import api from '../api'
import useStore from '../store'
import { useNavigate, useParams } from 'react-router-dom'

export default function Login({ shopInfo }) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useStore(s => s.setAuth)
  const navigate = useNavigate()
  const { slug } = useParams()

  const handleLogin = async () => {
    if (!phone || !password) return message.warning('Nhập số điện thoại và mật khẩu!')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', {
        tenant_id: shopInfo.tenant_id,
        phone,
        password,
      })
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('tenant_id', shopInfo.tenant_id)
      setAuth(
        { name: res.data.user_name, role: res.data.user_role },
        { name: res.data.tenant_name, id: shopInfo.tenant_id, slug: slug }
      )
      message.success(`Chào mừng ${res.data.user_name}!`)
      navigate(`/${slug}/`)
    } catch (err) {
      message.error(err.response?.data?.detail || err.response?.data?.error || 'Sai số điện thoại hoặc mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      {/* Top branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 24px' }}>
        {/* Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, marginBottom: 16,
          boxShadow: '0 8px 32px rgba(102,126,234,0.5)'
        }}>🏪</div>

        {/* Shop name */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            {shopInfo.name}
          </div>
          {shopInfo.address && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              📍 {shopInfo.address}
            </div>
          )}
          <div style={{
            display: 'inline-block', marginTop: 8,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '3px 12px',
            fontSize: 12, color: 'rgba(255,255,255,0.55)'
          }}>
            localpos.vn/<span style={{ color: '#a78bfa', fontWeight: 700 }}>{slug}</span>
          </div>
        </div>

        {/* Login card */}
        <div style={{
          width: '100%', maxWidth: 380,
          background: '#fff', borderRadius: 24,
          padding: '28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>
            👋 Đăng nhập nhân viên
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
              Số điện thoại
            </div>
            <Input
              size="large"
              prefix={<UserOutlined style={{ color: '#ccc' }} />}
              placeholder="0912 345 678"
              value={phone} onChange={e => setPhone(e.target.value)}
              type="tel" style={{ fontSize: 16, borderRadius: 12 }}
              onPressEnter={() => document.getElementById('pwd-input').focus()}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
              Mật khẩu
            </div>
            <Input.Password
              id="pwd-input"
              size="large"
              prefix={<LockOutlined style={{ color: '#ccc' }} />}
              placeholder="••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ fontSize: 16, borderRadius: 12 }}
              onPressEnter={handleLogin}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', height: 52, border: 'none', borderRadius: 14,
              background: loading ? '#e2e8f0' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: loading ? '#94a3b8' : '#fff',
              fontSize: 16, fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(102,126,234,0.45)',
              transition: 'all 0.2s', letterSpacing: 0.3
            }}
          >
            {loading ? '⏳ Đang đăng nhập...' : '🔑 Đăng nhập'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
            Quên mật khẩu? Liên hệ chủ tiệm
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '16px 0 24px', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
        Powered by LocalPOS
      </div>
    </div>
  )
}
