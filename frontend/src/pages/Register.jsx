import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.3 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', prefix }) {
  return (
    <div style={{ position: 'relative' }}>
      {prefix && (
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, color: '#9ca3af', fontWeight: 600, pointerEvents: 'none', whiteSpace: 'nowrap'
        }}>{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%', height: 46, border: '1.5px solid #e5e7eb', borderRadius: 10,
          padding: prefix ? '0 12px 0 172px' : '0 14px',
          fontSize: 15, outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.2s', background: '#fff', color: '#1a1a2e',
        }}
        onFocus={e => e.target.style.borderColor = '#667eea'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [form, setForm] = useState({
    tenant_name: '', slug: '',
    owner_name: '', owner_phone: '',
    owner_password: '', confirm_password: '',
  })
  const [createdSlug, setCreatedSlug] = useState('')

  const toSlug = (str) => str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')

  const setField = (k) => (e) => {
    const v = e.target.value
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'tenant_name' && !slugEdited) next.slug = toSlug(v)
      return next
    })
  }

  const setSlug = (e) => {
    setSlugEdited(true)
    setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.tenant_name.trim()) return setError('Vui lòng nhập tên tiệm')
    if (!form.slug || form.slug.length < 3) return setError('Đường dẫn tối thiểu 3 ký tự')
    if (!form.owner_name.trim()) return setError('Vui lòng nhập họ tên chủ tiệm')
    if (!form.owner_phone.trim()) return setError('Vui lòng nhập số điện thoại')
    if (form.owner_password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự')
    if (form.owner_password !== form.confirm_password) return setError('Mật khẩu xác nhận không khớp')

    setLoading(true)
    try {
      await api.post('/api/public/register', {
        tenant_name: form.tenant_name.trim(),
        slug: form.slug,
        owner_name: form.owner_name.trim(),
        owner_phone: form.owner_phone.trim(),
        owner_password: form.owner_password,
      })
      setCreatedSlug(form.slug)
      setStep(2)
    } catch (e) {
      setError(e.response?.data?.error || 'Đăng ký thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 55%, #1a0533 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <div style={{ position:'fixed',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(102,126,234,0.15),transparent)',top:'-10%',left:'-10%',pointerEvents:'none' }} />
      <div style={{ position:'fixed',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(118,75,162,0.18),transparent)',bottom:'-10%',right:'-5%',pointerEvents:'none' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        {/* Header logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, margin: '0 auto 10px', borderRadius: '50%', overflow: 'hidden', filter: 'drop-shadow(0 8px 24px rgba(201,149,108,0.4))' }}>
            <img src="/icon.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#c9956c', letterSpacing: 1.5, fontFamily: "'Cormorant Garamond',serif" }}>AURELIA SALON</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 3 }}>BEAUTY & WELLNESS</div>
        </div>

        {step === 1 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 2 }}>🚀 Tạo tiệm miễn phí</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 22 }}>Dùng thử 7 ngày — không cần thẻ tín dụng</div>

            <Field label="Tên tiệm *">
              <TextInput value={form.tenant_name} onChange={setField('tenant_name')} placeholder="VD: Tiệm tóc Thanh Thanh" />
            </Field>

            <Field label="Đường dẫn tiệm *" hint={`Khách vào: aureliasalon.online/${form.slug || 'tiem-cua-ban'}`}>
              <TextInput value={form.slug} onChange={setSlug} placeholder="tiem-thanh-thanh" prefix="aureliasalon.online/" />
            </Field>

            <Field label="Họ tên chủ tiệm *">
              <TextInput value={form.owner_name} onChange={setField('owner_name')} placeholder="Nguyễn Văn A" />
            </Field>

            <Field label="Số điện thoại *" hint="Dùng để đăng nhập">
              <TextInput value={form.owner_phone} onChange={setField('owner_phone')} placeholder="0912 345 678" type="tel" />
            </Field>

            <Field label="Mật khẩu *" hint="Tối thiểu 6 ký tự">
              <TextInput value={form.owner_password} onChange={setField('owner_password')} placeholder="••••••••" type="password" />
            </Field>

            <Field label="Xác nhận mật khẩu *">
              <TextInput value={form.confirm_password} onChange={setField('confirm_password')} placeholder="••••••••" type="password" />
            </Field>

            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:14 }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              width:'100%', height:50, border:'none', borderRadius:12,
              background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#667eea,#764ba2)',
              color: loading ? '#94a3b8' : '#fff',
              fontSize:15, fontWeight:800, cursor: loading ? 'wait' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(102,126,234,0.4)',
              marginBottom:14, transition:'all 0.2s',
            }}>
              {loading ? '⏳ Đang tạo tiệm...' : '🚀 Tạo tiệm ngay — Miễn phí'}
            </button>

            <div style={{ textAlign:'center', fontSize:13, color:'#6b7280' }}>
              Đã có tiệm?{' '}
              <span onClick={() => navigate('/')} style={{ color:'#667eea', fontWeight:700, cursor:'pointer' }}>
                Đăng nhập
              </span>
            </div>
          </div>
        ) : (
          <div style={{ background:'#fff', borderRadius:20, padding:'36px 28px', boxShadow:'0 24px 64px rgba(0,0,0,0.4)', textAlign:'center' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#1a1a2e', marginBottom:8 }}>Tạo tiệm thành công!</div>
            <div style={{ fontSize:13, color:'#6b7280', marginBottom:20, lineHeight:1.7 }}>
              Tiệm đang dùng thử <strong>miễn phí 7 ngày</strong>.<br/>
              Link đăng nhập của tiệm bạn:
            </div>
            <div style={{
              background:'linear-gradient(135deg,#f0f4ff,#faf0ff)',
              border:'1.5px solid #c4b5fd', borderRadius:10,
              padding:'12px 14px', fontSize:13, fontWeight:700, color:'#5b21b6',
              marginBottom:22, wordBreak:'break-all',
            }}>
              aureliasalon.online/{createdSlug}/login
            </div>
            <button onClick={() => navigate(`/${createdSlug}/login`)} style={{
              width:'100%', height:48, border:'none', borderRadius:12,
              background:'linear-gradient(135deg,#667eea,#764ba2)',
              color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer',
              boxShadow:'0 8px 24px rgba(102,126,234,0.4)', marginBottom:10,
            }}>
              Đăng nhập vào tiệm →
            </button>
            <div style={{ fontSize:11, color:'#9ca3af' }}>Lưu lại link này để đăng nhập lần sau!</div>
          </div>
        )}
      </div>
    </div>
  )
}
