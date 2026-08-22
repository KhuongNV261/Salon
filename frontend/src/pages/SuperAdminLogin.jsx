import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Input, Button, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { superLogin } from '../api'

export default function SuperAdminLogin() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!password) return
    setLoading(true)
    try {
      const res = await superLogin(password)
      localStorage.setItem('super_token', res.data.access_token)
      message.success('Đăng nhập hệ thống thành công')
      navigate('/super-admin/dashboard')
    } catch (err) {
      message.error(err.response?.data?.error || 'Sai mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, margin: 0, fontWeight: 600 }}>Super Admin</h1>
          <p style={{ color: '#888', marginTop: 8 }}>Quản trị viên hệ thống LocalPOS</p>
        </div>
        
        <Input.Password
          size="large"
          prefix={<LockOutlined />}
          placeholder="Mật khẩu quản trị..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleLogin}
          style={{ marginBottom: 16 }}
        />
        
        <Button 
          type="primary" 
          block 
          size="large"
          onClick={handleLogin}
          loading={loading}
          style={{ background: '#000' }}
        >
          Đăng nhập
        </Button>
      </Card>
    </div>
  )
}
