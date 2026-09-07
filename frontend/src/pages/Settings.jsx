import React, { useState, useEffect } from 'react'
import { Input, Select, TimePicker, message, Skeleton, Spin, Modal } from 'antd'
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckCircleFilled } from '@ant-design/icons'
import api from '../api'
import useStore from '../store'
import dayjs from 'dayjs'

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 phút' },
  { value: 20, label: '20 phút' },
  { value: 30, label: '30 phút' },
  { value: 45, label: '45 phút' },
  { value: 60, label: '60 phút (1 tiếng)' },
  { value: 90, label: '90 phút (1.5 tiếng)' },
]

function SettingGroup({ icon, title, subtitle, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f4f5f7', background: 'linear-gradient(135deg, rgba(102,126,234,0.05), rgba(118,75,162,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e1b4b' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{subtitle}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

function FieldRow({ label, children, required, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function PrimaryBtn({ onClick, loading, children, color = 'purple', style = {} }) {
  const bg = {
    purple: loading ? '#e2e8f0' : 'linear-gradient(135deg,#667eea,#764ba2)',
    green:  loading ? '#e2e8f0' : 'linear-gradient(135deg,#52c41a,#237804)',
    blue:   loading ? '#e2e8f0' : 'linear-gradient(135deg,#1890ff,#096dd9)',
    red:    loading ? '#e2e8f0' : 'linear-gradient(135deg,#ff4d4f,#cf1322)',
  }[color]
  const shadow = {
    purple: '0 6px 20px rgba(102,126,234,0.4)',
    green:  '0 4px 12px rgba(82,196,26,0.35)',
    blue:   '0 4px 12px rgba(24,144,255,0.35)',
    red:    '0 4px 12px rgba(255,77,79,0.35)',
  }[color]
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: '100%', height: 46, border: 'none', borderRadius: 12,
      background: bg, color: loading ? '#94a3b8' : '#fff',
      fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
      boxShadow: loading ? 'none' : shadow, transition: 'all 0.2s', ...style
    }}>
      {loading ? <Spin size="small" style={{ marginRight: 8 }} /> : null}{children}
    </button>
  )
}

// Modal đổi mật khẩu
function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = async () => {
    if (!form.old_password || !form.new_password || !form.confirm) {
      return message.warning('Vui lòng điền đầy đủ thông tin!')
    }
    if (form.new_password.length < 6) {
      return message.warning('Mật khẩu mới phải ít nhất 6 ký tự!')
    }
    if (form.new_password !== form.confirm) {
      return message.error('Mật khẩu xác nhận không khớp!')
    }
    setLoading(true)
    try {
      await api.put('/api/auth/change-password', {
        old_password: form.old_password,
        new_password: form.new_password,
      })
      message.success('Đổi mật khẩu thành công!')
      setForm({ old_password: '', new_password: '', confirm: '' })
      onClose()
    } catch (e) {
      message.error(e.response?.data?.error || 'Mật khẩu cũ không đúng!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={<span style={{ fontWeight: 700, color: '#1e1b4b' }}>🔑 Đổi mật khẩu</span>}
      centered
      width={360}
    >
      <div style={{ padding: '8px 0' }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Mật khẩu hiện tại</div>
          <Input.Password
            value={form.old_password}
            onChange={e => setForm(f => ({ ...f, old_password: e.target.value }))}
            placeholder="Nhập mật khẩu hiện tại"
            size="large"
            prefix={<LockOutlined style={{ color: '#ccc' }} />}
            iconRender={v => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Mật khẩu mới</div>
          <Input.Password
            value={form.new_password}
            onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
            placeholder="Ít nhất 6 ký tự"
            size="large"
            prefix={<LockOutlined style={{ color: '#ccc' }} />}
            iconRender={v => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Xác nhận mật khẩu mới</div>
          <Input.Password
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="Nhập lại mật khẩu mới"
            size="large"
            prefix={<LockOutlined style={{ color: '#ccc' }} />}
            iconRender={v => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
            onPressEnter={handleChange}
          />
        </div>
        <PrimaryBtn onClick={handleChange} loading={loading} color="purple">
          {loading ? 'Đang lưu...' : '🔑 Xác nhận đổi mật khẩu'}
        </PrimaryBtn>
      </div>
    </Modal>
  )
}

export default function Settings({ setShopInfo }) {
  const { user } = useStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', phone: '',
    open_time: '08:00', close_time: '20:00', slot_interval: 30,
    theme: 'classic',
    bank_name: '', bank_account_number: '', bank_account_name: '', bank_transfer_note: ''
  })

  const canEdit = ['owner', 'manager'].includes(user?.role)

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const r = await api.get('/api/settings')
      setForm(r.data)
    } catch {
      message.error('Không tải được cài đặt!')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      await api.put('/api/settings', form)
      message.success('✅ Đã lưu cài đặt!')
      if (setShopInfo) setShopInfo(prev => ({ ...prev, theme: form.theme, name: form.name }))
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi lưu cài đặt!')
    } finally {
      setSaving(false)
    }
  }

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const slotCount = (() => {
    const [oh, om] = form.open_time.split(':').map(Number)
    const [ch, cm] = form.close_time.split(':').map(Number)
    const m = (ch * 60 + cm) - (oh * 60 + om)
    return m > 0 ? Math.floor(m / form.slot_interval) + 1 : 0
  })()

  if (loading) return <div style={{ padding: 16 }}><Skeleton active paragraph={{ rows: 10 }} /></div>

  return (
    <div style={{ padding: '14px 14px 80px', background: '#f8f9fe', minHeight: '100%' }}>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>⚙️ Cài đặt tiệm</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
          {canEdit ? 'Chỉnh sửa thông tin và cài đặt tiệm' : 'Chỉ owner mới chỉnh sửa được'}
        </div>
      </div>

      {/* ── Thông tin tiệm ── */}
      <SettingGroup icon="🏪" title="Thông tin tiệm" subtitle="Tên và địa chỉ hiển thị với khách">
        <FieldRow label="Tên tiệm" required>
          <Input value={form.name} onChange={e => update('name', e.target.value)}
            disabled={!canEdit} size="large" placeholder="Tiệm Tóc Hoa Lan..." />
        </FieldRow>
        <FieldRow label="Số điện thoại">
          <Input value={form.phone || ''} onChange={e => update('phone', e.target.value)}
            disabled={!canEdit} size="large" type="tel" placeholder="0912 345 678" />
        </FieldRow>
        <FieldRow label="Địa chỉ">
          <Input.TextArea value={form.address || ''} onChange={e => update('address', e.target.value)}
            disabled={!canEdit} rows={2} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
        </FieldRow>
        <FieldRow label="Giao diện (Theme)">
          <Select value={form.theme || 'classic'} onChange={v => update('theme', v)}
            disabled={!canEdit} style={{ width: '100%' }} size="large"
            options={[
              { value: 'classic', label: '🟣 Classic – Tím / Navy (Chuyên nghiệp)' },
              { value: 'nature',  label: '🟢 Nature – Xanh lá (Spa / Nail / Thư giãn)' },
              { value: 'luxury',  label: '⚫ Luxury – Đen / Vàng (Cao cấp)' },
              { value: 'cute',    label: '🩷 Cute – Hồng (Nữ tính / Beauty)' },
            ]}
          />
        </FieldRow>
      </SettingGroup>

      {/* ── Lịch làm việc ── */}
      <SettingGroup icon="🕐" title="Lịch làm việc" subtitle="Khung giờ phục vụ và đặt lịch">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <FieldRow label="Giờ mở cửa">
            <TimePicker value={dayjs(form.open_time, 'HH:mm')}
              onChange={(_, s) => update('open_time', s)} format="HH:mm" minuteStep={30}
              disabled={!canEdit} style={{ width: '100%' }} size="large" allowClear={false} />
          </FieldRow>
          <FieldRow label="Giờ đóng cửa">
            <TimePicker value={dayjs(form.close_time, 'HH:mm')}
              onChange={(_, s) => update('close_time', s)} format="HH:mm" minuteStep={30}
              disabled={!canEdit} style={{ width: '100%' }} size="large" allowClear={false} />
          </FieldRow>
        </div>
        <FieldRow label="Khoảng slot" hint="Thời gian giữa các khung đặt lịch">
          <Select value={form.slot_interval} onChange={v => update('slot_interval', v)}
            disabled={!canEdit} style={{ width: '100%' }} size="large" options={INTERVAL_OPTIONS} />
        </FieldRow>
        <div style={{ background: 'rgba(102,126,234,0.07)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(102,126,234,0.18)', fontSize: 13, color: '#4f46e5', fontWeight: 600 }}>
          📅 {form.open_time} – {form.close_time} · {form.slot_interval} phút/slot · <strong>{slotCount} slot/ngày</strong>
        </div>
      </SettingGroup>

      {/* Nút lưu thông tin tiệm */}
      {canEdit && (
        <PrimaryBtn onClick={handleSave} loading={saving} color="purple" style={{ marginBottom: 16 }}>
          {saving ? 'Đang lưu...' : '💾 Lưu cài đặt tiệm'}
        </PrimaryBtn>
      )}

      {/* ── Thanh toán chuyển khoản ── */}
      {canEdit && (
        <SettingGroup icon="🏦" title="Thanh toán chuyển khoản" subtitle="Hiển thị mã QR VietQR khi khách thanh toán">
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, marginBottom: 4 }}>💡 Cách hoạt động</div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
              Khi chọn "Chuyển khoản", hệ thống tự động hiển thị mã QR VietQR với số tiền cần thanh toán. Khách chỉ cần quét bằng app ngân hàng.
            </div>
          </div>
          <FieldRow label="Tên ngân hàng" hint="Ví dụ: Vietcombank, MB Bank, Techcombank...">
            <Input value={form.bank_name || ''} onChange={e => update('bank_name', e.target.value)}
              size="large" placeholder="MB Bank" />
          </FieldRow>
          <FieldRow label="Số tài khoản" required>
            <Input value={form.bank_account_number || ''} onChange={e => update('bank_account_number', e.target.value)}
              size="large" placeholder="0123456789" />
          </FieldRow>
          <FieldRow label="Tên chủ tài khoản" required>
            <Input value={form.bank_account_name || ''} onChange={e => update('bank_account_name', e.target.value.toUpperCase())}
              size="large" placeholder="NGUYEN VAN A" />
          </FieldRow>
          <FieldRow label="Nội dung chuyển khoản mặc định" hint="Để trống = tự động điền số hóa đơn">
            <Input value={form.bank_transfer_note || ''} onChange={e => update('bank_transfer_note', e.target.value)}
              size="large" placeholder="Thanh toán tiệm tóc" />
          </FieldRow>
          {form.bank_account_number && form.bank_name && (
            <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <CheckCircleFilled style={{ fontSize: 28, color: '#52c41a' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#389e0d' }}>✅ Đã cấu hình QR thanh toán</div>
                <div style={{ fontSize: 12, color: '#666' }}>{form.bank_name} – {form.bank_account_number}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{form.bank_account_name}</div>
              </div>
            </div>
          )}
          <PrimaryBtn onClick={handleSave} loading={saving} color="purple">
            {saving ? 'Đang lưu...' : '💾 Lưu thông tin ngân hàng'}
          </PrimaryBtn>
        </SettingGroup>
      )}

      {/* ── Bảo mật – Đổi mật khẩu ── */}
      <SettingGroup icon="🔐" title="Bảo mật" subtitle="Quản lý mật khẩu tài khoản của bạn">
        <div style={{ fontSize: 13, color: '#555', marginBottom: 14, lineHeight: 1.6 }}>
          Đổi mật khẩu định kỳ để bảo vệ tài khoản. Mật khẩu mới cần ít nhất <strong>6 ký tự</strong>.
        </div>
        <button
          onClick={() => setPwdOpen(true)}
          style={{
            width: '100%', height: 46, border: '2px solid #667eea',
            borderRadius: 12, background: '#fff',
            color: '#667eea', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          🔑 Đổi mật khẩu
        </button>
      </SettingGroup>

      {!canEdit && (
        <div style={{ textAlign: 'center', padding: '14px', background: '#fef9c3', borderRadius: 12, color: '#92400e', fontSize: 13, fontWeight: 600 }}>
          ⚠️ Chỉ chủ tiệm (owner) mới được thay đổi cài đặt
        </div>
      )}

      {/* Modal đổi mật khẩu */}
      <ChangePasswordModal open={pwdOpen} onClose={() => setPwdOpen(false)} />
    </div>
  )
}
