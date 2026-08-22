import React, { useState, useEffect } from 'react'
import { Input, Select, TimePicker, message, Skeleton, Spin } from 'antd'
import api from '../api'
import useStore from '../store'
import dayjs from 'dayjs'

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 phut' },
  { value: 20, label: '20 phut' },
  { value: 30, label: '30 phut' },
  { value: 45, label: '45 phut' },
  { value: 60, label: '60 phut (1 tieng)' },
  { value: 90, label: '90 phut (1.5 tieng)' },
]

function SettingGroup({ icon, title, subtitle, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f4f5f7', background: 'linear-gradient(135deg, rgba(102,126,234,0.04), rgba(118,75,162,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
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
    green: loading ? '#e2e8f0' : 'linear-gradient(135deg,#52c41a,#237804)',
    blue: loading ? '#e2e8f0' : 'linear-gradient(135deg,#1890ff,#096dd9)',
  }[color]
  const shadow = {
    purple: '0 6px 20px rgba(102,126,234,0.4)',
    green: '0 4px 12px rgba(82,196,26,0.35)',
    blue: '0 4px 12px rgba(24,144,255,0.35)',
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

export default function Settings({ setShopInfo }) {
  const { user } = useStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    try { const r = await api.get('/api/settings'); setForm(r.data) } finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      await api.put('/api/settings', form)
      message.success('Da luu cai dat!')
      if (setShopInfo) setShopInfo(prev => ({ ...prev, theme: form.theme }))
    } catch (e) { message.error(e.response?.data?.error || 'Loi luu') }
    finally { setSaving(false) }
  }

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const slotCount = (() => {
    const [oh, om] = form.open_time.split(':').map(Number)
    const [ch, cm] = form.close_time.split(':').map(Number)
    const m = (ch * 60 + cm) - (oh * 60 + om)
    return m > 0 ? Math.floor(m / form.slot_interval) + 1 : 0
  })()

  if (loading) return <div style={{ padding: 16 }}><Skeleton active paragraph={{ rows: 8 }} /></div>

  return (
    <div style={{ padding: '14px 14px 80px', background: '#f8f9fe', minHeight: '100%' }}>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>Cai dat tiem</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
          {canEdit ? 'Chinh sua thong tin va cai dat tiem' : 'Chi owner moi chinh sua duoc'}
        </div>
      </div>

      {/* Thong tin tiem */}
      <SettingGroup icon="tiem" title="Thong tin tiem" subtitle="Ten va dia chi hien thi voi khach">
        <FieldRow label="Ten tiem" required>
          <Input value={form.name} onChange={e => update('name', e.target.value)} disabled={!canEdit} size="large" placeholder="Tiem Toc Hoa Lan..." />
        </FieldRow>
        <FieldRow label="So dien thoai">
          <Input value={form.phone || ''} onChange={e => update('phone', e.target.value)} disabled={!canEdit} size="large" type="tel" placeholder="0912 345 678" />
        </FieldRow>
        <FieldRow label="Dia chi">
          <Input.TextArea value={form.address || ''} onChange={e => update('address', e.target.value)} disabled={!canEdit} rows={2} />
        </FieldRow>
        <FieldRow label="Giao dien (Theme)">
          <Select value={form.theme || 'classic'} onChange={v => update('theme', v)} disabled={!canEdit} style={{ width: '100%' }} size="large" options={[
            { value: 'classic', label: 'Classic (Tim / Navy) - Chuyen nghiep' },
            { value: 'nature', label: 'Nature (Xanh la) - Spa / Nail / Thu gian' },
            { value: 'luxury', label: 'Luxury (Den / Vang) - Cao cap' },
            { value: 'cute', label: 'Cute (Hong) - Nu tinh / Beauty' }
          ]} />
        </FieldRow>
      </SettingGroup>

      {/* Lich lam viec */}
      <SettingGroup icon="gio" title="Lich lam viec" subtitle="Khung gio phuc vu">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <FieldRow label="Gio mo cua">
            <TimePicker value={dayjs(form.open_time, 'HH:mm')} onChange={(_, s) => update('open_time', s)} format="HH:mm" minuteStep={30} disabled={!canEdit} style={{ width: '100%' }} size="large" allowClear={false} />
          </FieldRow>
          <FieldRow label="Gio dong cua">
            <TimePicker value={dayjs(form.close_time, 'HH:mm')} onChange={(_, s) => update('close_time', s)} format="HH:mm" minuteStep={30} disabled={!canEdit} style={{ width: '100%' }} size="large" allowClear={false} />
          </FieldRow>
        </div>
        <FieldRow label="Khoang slot">
          <Select value={form.slot_interval} onChange={v => update('slot_interval', v)} disabled={!canEdit} style={{ width: '100%' }} size="large" options={INTERVAL_OPTIONS} />
        </FieldRow>
        <div style={{ background: 'rgba(102,126,234,0.06)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(102,126,234,0.15)', fontSize: 13, color: '#4f46e5', fontWeight: 600 }}>
          {form.open_time} - {form.close_time} / {form.slot_interval} phut / {slotCount} slot/ngay
        </div>
      </SettingGroup>

      {canEdit && (
        <PrimaryBtn onClick={handleSave} loading={saving} color="purple" style={{ marginBottom: 16 }}>
          {saving ? 'Dang luu...' : 'Luu cai dat tiem'}
        </PrimaryBtn>
      )}

      {/* Thanh toan chuyen khoan */}
      {canEdit && (
        <SettingGroup icon="ngan-hang" title="Thanh toan chuyen khoan" subtitle="Hien ma QR VietQR khi khach thanh toan qua ngan hang">
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, marginBottom: 4 }}>Cach hoat dong</div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
              Khi chon hinh thuc "Chuyen khoan", he thong tu dong hien ma QR VietQR voi so tien can thanh toan. Khach chi can quet bang app ngan hang.
            </div>
          </div>
          <FieldRow label="Ten ngan hang" hint="Vi du: Vietcombank, MB Bank, Techcombank...">
            <Input value={form.bank_name || ''} onChange={e => update('bank_name', e.target.value)} size="large" placeholder="MB Bank" />
          </FieldRow>
          <FieldRow label="So tai khoan" required>
            <Input value={form.bank_account_number || ''} onChange={e => update('bank_account_number', e.target.value)} size="large" placeholder="0123456789" />
          </FieldRow>
          <FieldRow label="Ten chu tai khoan" required>
            <Input value={form.bank_account_name || ''} onChange={e => update('bank_account_name', e.target.value.toUpperCase())} size="large" placeholder="NGUYEN VAN A" />
          </FieldRow>
          <FieldRow label="Noi dung chuyen khoan mac dinh" hint="De trong = tu dong dien so hoa don">
            <Input value={form.bank_transfer_note || ''} onChange={e => update('bank_transfer_note', e.target.value)} size="large" placeholder="Thanh toan tiem toc" />
          </FieldRow>
          {form.bank_account_number && form.bank_name && (
            <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>ok</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#389e0d' }}>Da cau hinh QR thanh toan</div>
                <div style={{ fontSize: 12, color: '#666' }}>{form.bank_name} - {form.bank_account_number}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{form.bank_account_name}</div>
              </div>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <PrimaryBtn onClick={handleSave} loading={saving} color="purple">
              {saving ? 'Dang luu...' : 'Luu thong tin ngan hang'}
            </PrimaryBtn>
          </div>
        </SettingGroup>
      )}

      {!canEdit && (
        <div style={{ textAlign: 'center', padding: '14px', background: '#fef9c3', borderRadius: 12, color: '#92400e', fontSize: 13 }}>
          Chi chu tiem (owner) moi duoc thay doi cai dat
        </div>
      )}
    </div>
  )
}
