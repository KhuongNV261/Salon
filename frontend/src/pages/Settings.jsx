import React, { useState, useEffect } from 'react'
import { Input, Select, TimePicker, message, Skeleton, Switch, Collapse, Tag, Spin } from 'antd'
import api from '../api'
import useStore from '../store'
import dayjs from 'dayjs'

const { Panel } = Collapse

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 phút' },
  { value: 20, label: '20 phút' },
  { value: 30, label: '30 phút' },
  { value: 45, label: '45 phút' },
  { value: 60, label: '60 phút (1 tiếng)' },
  { value: 90, label: '90 phút (1.5 tiếng)' },
]

const PROVIDERS = [
  {
    value: 'demo',
    label: '🔧 Demo (không gửi thật – để test)',
    tag: 'Miễn phí',
    tagColor: 'green',
    desc: 'Ghi log vào console. Dùng khi chưa có API.',
    fields: [],
    guide: null,
  },
  {
    value: 'telegram',
    label: '✈️ Telegram Bot',
    tag: 'Miễn phí 100%',
    tagColor: 'blue',
    desc: 'Hoàn toàn miễn phí, không giới hạn. Khách cần cài Telegram và nhắn /start cho bot.',
    fields: ['api_key_bot', 'secret_key_chat'],
    guide: (
      <div style={{ fontSize: 12, lineHeight: 1.8, color: '#555' }}>
        <b>3 bước setup (5 phút):</b>
        <ol style={{ paddingLeft: 18, margin: '6px 0' }}>
          <li>Mở Telegram → nhắn <code>@BotFather</code> → gõ <code>/newbot</code> → đặt tên → copy <b>Bot Token</b></li>
          <li>Khách hàng cài Telegram → tìm bot của bạn → nhắn <code>/start</code> 1 lần</li>
          <li>Bấm <b>"Lấy danh sách khách"</b> bên dưới → copy chat_id của khách → dán vào <b>Secret Key</b></li>
        </ol>
        💡 Dùng để nhắc nội bộ (chủ tiệm) thì không cần khách làm gì — chỉ cần chat_id của bạn.
      </div>
    ),
  },
  {
    value: 'zalo_oa',
    label: '🟦 Zalo Official Account',
    tag: 'Miễn phí',
    tagColor: 'cyan',
    desc: 'Phổ biến nhất tại VN. Khách cần Follow OA trước mới nhận được tin.',
    fields: ['api_key_zalo', 'secret_key_zaloid'],
    guide: (
      <div style={{ fontSize: 12, lineHeight: 1.8, color: '#555' }}>
        <b>Setup:</b>
        <ol style={{ paddingLeft: 18, margin: '6px 0' }}>
          <li>Đăng ký <a href="https://business.zalo.me" target="_blank" rel="noreferrer">business.zalo.me</a> → Tạo Official Account (miễn phí)</li>
          <li>Vào <b>Công cụ → Quản lý ứng dụng</b> → Tạo ứng dụng → Lấy <b>Access Token</b></li>
          <li>Khách Follow OA → khi họ nhắn tin, hệ thống lấy được <b>Zalo user_id</b></li>
          <li>Dán Access Token vào <b>API Key</b>, dán Zalo user_id khách vào <b>Secret Key</b></li>
        </ol>
        ⚠️ Zalo user_id ≠ số điện thoại. Cần webhook để tự động lấy khi khách nhắn tin.
      </div>
    ),
  },
  {
    value: 'gmail',
    label: '📧 Gmail (Email)',
    tag: 'Miễn phí',
    tagColor: 'orange',
    desc: 'Gửi email đẹp qua Gmail. Khách cần có email. Không cần đăng ký bất kỳ đâu.',
    fields: ['api_key_gmail', 'secret_key_apppass', 'test_email', 'email_subject'],
    guide: (
      <div style={{ fontSize: 12, lineHeight: 1.8, color: '#555' }}>
        <b>2 bước setup (3 phút):</b>
        <ol style={{ paddingLeft: 18, margin: '6px 0' }}>
          <li>Gmail của bạn → <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">Cài đặt bảo mật</a> → Bật xác minh 2 bước</li>
          <li>Tìm <b>App Passwords</b> → Tạo mới cho "Mail" → Copy 16 ký tự → dán vào <b>App Password</b></li>
        </ol>
        <b>API Key</b> = địa chỉ Gmail của bạn (tienban@gmail.com)<br/>
        <b>App Password</b> = 16 ký tự từ bước 2<br/>
        📧 Email sẽ được gửi từ Gmail của bạn tới khách.
      </div>
    ),
  },
  {
    value: 'speedsms',
    label: '⚡ SpeedSMS (SMS trả phí)',
    tag: '~500đ/tin',
    tagColor: 'red',
    desc: 'SMS chính hãng đến mọi số điện thoại. Không cần khách cài app. Trả ~500đ/SMS.',
    fields: ['api_key_sms'],
    guide: (
      <div style={{ fontSize: 12, lineHeight: 1.8, color: '#555' }}>
        Đăng ký tại <a href="https://speedsms.vn" target="_blank" rel="noreferrer">speedsms.vn</a> → Nạp tiền → Lấy API Key từ trang quản lý.
      </div>
    ),
  },
  {
    value: 'esms',
    label: '📨 ESMS (SMS trả phí)',
    tag: '~500đ/tin',
    tagColor: 'red',
    desc: 'Nhà cung cấp SMS lớn tại VN. Trả phí theo số lượng.',
    fields: ['api_key_sms', 'secret_key_esms'],
    guide: (
      <div style={{ fontSize: 12, lineHeight: 1.8, color: '#555' }}>
        Đăng ký tại <a href="https://esms.vn" target="_blank" rel="noreferrer">esms.vn</a> → Nạp tiền → Lấy API Key + Secret Key.
      </div>
    ),
  },
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

export default function Settings() {
  const { user } = useStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingSms, setSavingSms] = useState(false)
  const [testingNotif, setTestingNotif] = useState(false)
  const [telegramUsers, setTelegramUsers] = useState([])
  const [loadingTgUsers, setLoadingTgUsers] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [form, setForm] = useState({ name: '', address: '', phone: '', open_time: '08:00', close_time: '20:00', slot_interval: 30 })
  const [smsForm, setSmsForm] = useState({
    enabled: false, provider: 'demo',
    api_key: '', secret_key: '',
    test_email: '', email_subject: 'Nhắc lịch hẹn từ {shop}',
    template: 'Xin chào {name}! {shop} nhắc bạn có lịch hẹn lúc {time} hôm nay. Xin vui lòng đến đúng giờ. Cảm ơn!'
  })

  const canEdit = ['owner', 'manager'].includes(user?.role)
  const currentProvider = PROVIDERS.find(p => p.value === smsForm.provider) || PROVIDERS[0]

  useEffect(() => {
    loadSettings()
    if (canEdit) loadSmsSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try { const r = await api.get('/api/settings'); setForm(r.data) } finally { setLoading(false) }
  }

  const loadSmsSettings = async () => {
    try { const r = await api.get('/api/settings/sms'); setSmsForm(r.data) } catch {}
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      await api.put('/api/settings', form)
      message.success('✅ Đã lưu!')
    } catch (e) { message.error(e.response?.data?.error || 'Lỗi lưu') }
    finally { setSaving(false) }
  }

  const handleSaveSms = async () => {
    setSavingSms(true)
    try {
      await api.put('/api/settings/sms', smsForm)
      message.success('✅ Đã lưu cài đặt thông báo!')
    } catch (e) { message.error(e.response?.data?.error || 'Lỗi') }
    finally { setSavingSms(false) }
  }

  const handleTestNotif = async () => {
    setTestingNotif(true)
    try {
      const payload = {}
      if (smsForm.provider === 'telegram') payload.chat_id = smsForm.secret_key
      if (smsForm.provider === 'zalo_oa') payload.zalo_user_id = smsForm.secret_key
      if (smsForm.provider === 'gmail') payload.email = smsForm.test_email || testEmail
      if (['speedsms', 'esms'].includes(smsForm.provider)) payload.phone = testPhone
      const r = await api.post('/api/settings/sms/test', payload)
      message.success(r.data.message || '✅ Gửi test thành công!')
    } catch (e) { message.error(e.response?.data?.error || 'Gửi thất bại') }
    finally { setTestingNotif(false) }
  }

  const handleGetTelegramUsers = async () => {
    setLoadingTgUsers(true)
    try {
      const r = await api.get('/api/settings/telegram-updates')
      setTelegramUsers(r.data)
      if (r.data.length === 0) message.info('Chưa có ai nhắn bot. Hãy nhờ khách nhắn /start trước!')
    } catch (e) { message.error(e.response?.data?.error || 'Lỗi') }
    finally { setLoadingTgUsers(false) }
  }

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const updateSms = (k, v) => setSmsForm(f => ({ ...f, [k]: v }))

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
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>⚙️ Cài đặt tiệm</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
          {canEdit ? 'Chỉnh sửa thông tin và cài đặt tiệm' : 'Chỉ owner mới chỉnh sửa được'}
        </div>
      </div>

      {/* ── Thông tin tiệm ── */}
      <SettingGroup icon="🏪" title="Thông tin tiệm" subtitle="Tên và địa chỉ hiển thị với khách">
        <FieldRow label="Tên tiệm" required>
          <Input value={form.name} onChange={e => update('name', e.target.value)} disabled={!canEdit} size="large" placeholder="Tiệm Tóc Hoa Lan..." />
        </FieldRow>
        <FieldRow label="Số điện thoại">
          <Input value={form.phone || ''} onChange={e => update('phone', e.target.value)} disabled={!canEdit} size="large" type="tel" placeholder="0912 345 678" />
        </FieldRow>
        <FieldRow label="Địa chỉ">
          <Input.TextArea value={form.address || ''} onChange={e => update('address', e.target.value)} disabled={!canEdit} rows={2} />
        </FieldRow>
      </SettingGroup>

      {/* ── Lịch làm việc ── */}
      <SettingGroup icon="🕐" title="Lịch làm việc & Đặt lịch" subtitle="Khung giờ phục vụ">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <FieldRow label="Giờ mở cửa">
            <TimePicker value={dayjs(form.open_time, 'HH:mm')} onChange={(_, s) => update('open_time', s)} format="HH:mm" minuteStep={30} disabled={!canEdit} style={{ width: '100%' }} size="large" allowClear={false} />
          </FieldRow>
          <FieldRow label="Giờ đóng cửa">
            <TimePicker value={dayjs(form.close_time, 'HH:mm')} onChange={(_, s) => update('close_time', s)} format="HH:mm" minuteStep={30} disabled={!canEdit} style={{ width: '100%' }} size="large" allowClear={false} />
          </FieldRow>
        </div>
        <FieldRow label="Khoảng slot">
          <Select value={form.slot_interval} onChange={v => update('slot_interval', v)} disabled={!canEdit} style={{ width: '100%' }} size="large" options={INTERVAL_OPTIONS} />
        </FieldRow>
        <div style={{ background: 'rgba(102,126,234,0.06)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(102,126,234,0.15)', fontSize: 13, color: '#4f46e5', fontWeight: 600 }}>
          {form.open_time} → {form.close_time} · {form.slot_interval} phút · <b>{slotCount} slot/ngày</b>
        </div>
      </SettingGroup>

      {canEdit && (
        <PrimaryBtn onClick={handleSave} loading={saving} color="purple" style={{ marginBottom: 16 }}>
          {saving ? 'Đang lưu...' : '💾 Lưu cài đặt tiệm'}
        </PrimaryBtn>
      )}

      {/* ── Nhắc lịch hẹn ── */}
      {canEdit && (
        <SettingGroup icon="🔔" title="Nhắc lịch hẹn tự động" subtitle="Tự động gửi tin nhắc 1 giờ trước lịch hẹn">

          {/* Toggle */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 14px', marginBottom: 16,
            background: smsForm.enabled ? '#f6ffed' : '#fafafa',
            borderRadius: 12, border: `1px solid ${smsForm.enabled ? '#b7eb8f' : '#e8e8e8'}`
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: smsForm.enabled ? '#52c41a' : '#888' }}>
                {smsForm.enabled ? '✅ Đang bật – quét mỗi 15 phút' : '⭕ Đang tắt'}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                Backend tự động tìm lịch hẹn sắp đến và gửi nhắc
              </div>
            </div>
            <Switch checked={smsForm.enabled} onChange={v => updateSms('enabled', v)} />
          </div>

          {/* Chọn provider */}
          <FieldRow label="Kênh thông báo">
            <Select value={smsForm.provider} onChange={v => updateSms('provider', v)} style={{ width: '100%' }} size="large"
              options={PROVIDERS.map(p => ({
                value: p.value,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{p.label}</span>
                    <Tag color={p.tagColor} style={{ margin: 0, fontSize: 10 }}>{p.tag}</Tag>
                  </div>
                )
              }))}
            />
          </FieldRow>

          {/* Mô tả provider hiện tại */}
          <div style={{ background: '#f8faff', border: '1px solid #e8e8ff', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#555' }}>{currentProvider.desc}</div>
            {currentProvider.guide && (
              <Collapse ghost size="small" style={{ marginTop: 6 }}>
                <Panel header={<span style={{ fontSize: 12, color: '#667eea', fontWeight: 600 }}>📖 Hướng dẫn chi tiết</span>} key="1">
                  {currentProvider.guide}
                </Panel>
              </Collapse>
            )}
          </div>

          {/* Fields theo provider */}
          {smsForm.provider === 'telegram' && (
            <>
              <FieldRow label="Bot Token" hint="Lấy từ @BotFather trên Telegram">
                <Input.Password value={smsForm.api_key} onChange={e => updateSms('api_key', e.target.value)} placeholder="1234567890:AAF..." size="large" />
              </FieldRow>
              <FieldRow label="Chat ID của khách (Secret Key)" hint="Lấy bằng nút bên dưới sau khi khách nhắn /start">
                <Input value={smsForm.secret_key} onChange={e => updateSms('secret_key', e.target.value)} placeholder="123456789" size="large" />
              </FieldRow>
              {/* Lấy Telegram users */}
              <button onClick={handleGetTelegramUsers} disabled={loadingTgUsers || !smsForm.api_key} style={{
                width: '100%', height: 38, border: '1px solid #1890ff', borderRadius: 8,
                background: '#e6f4ff', color: '#1890ff', fontSize: 13, fontWeight: 600,
                cursor: smsForm.api_key ? 'pointer' : 'not-allowed', marginBottom: 10
              }}>
                {loadingTgUsers ? '⏳ Đang lấy...' : '🔍 Lấy danh sách khách đã nhắn bot'}
              </button>
              {telegramUsers.length > 0 && (
                <div style={{ background: '#f6ffed', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#52c41a', marginBottom: 6 }}>
                    ✅ {telegramUsers.length} người đã nhắn bot:
                  </div>
                  {telegramUsers.map(u => (
                    <div key={u.chat_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #d9f7be' }}>
                      <span style={{ fontSize: 13 }}>{u.name || u.username || 'Không tên'}</span>
                      <button onClick={() => { updateSms('secret_key', String(u.chat_id)); message.success('Đã chọn ' + (u.name || u.username)) }} style={{
                        padding: '2px 10px', fontSize: 11, border: 'none', borderRadius: 6,
                        background: '#52c41a', color: '#fff', cursor: 'pointer', fontWeight: 600
                      }}>
                        Chọn ({u.chat_id})
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {smsForm.provider === 'zalo_oa' && (
            <>
              <FieldRow label="Zalo OA Access Token" hint="Lấy từ business.zalo.me → Quản lý ứng dụng">
                <Input.Password value={smsForm.api_key} onChange={e => updateSms('api_key', e.target.value)} placeholder="Dán Access Token vào đây..." size="large" />
              </FieldRow>
              <FieldRow label="Zalo User ID của khách (Secret Key)" hint="Lấy khi khách nhắn tin vào OA của bạn (qua webhook)">
                <Input value={smsForm.secret_key} onChange={e => updateSms('secret_key', e.target.value)} placeholder="4598xxx..." size="large" />
              </FieldRow>
            </>
          )}

          {smsForm.provider === 'gmail' && (
            <>
              <FieldRow label="Gmail của bạn (API Key)" hint="Ví dụ: tiemtochoalan@gmail.com">
                <Input value={smsForm.api_key} onChange={e => updateSms('api_key', e.target.value)} placeholder="tenban@gmail.com" size="large" type="email" />
              </FieldRow>
              <FieldRow label="App Password (16 ký tự)" hint="Tạo tại: myaccount.google.com → Security → App Passwords">
                <Input.Password value={smsForm.secret_key} onChange={e => updateSms('secret_key', e.target.value)} placeholder="xxxx xxxx xxxx xxxx" size="large" />
              </FieldRow>
              <FieldRow label="Email test (test_email)" hint="Email để nhận tin nhắc test">
                <Input value={smsForm.test_email || ''} onChange={e => updateSms('test_email', e.target.value)} placeholder="khach@gmail.com" size="large" type="email" />
              </FieldRow>
              <FieldRow label="Tiêu đề email">
                <Input value={smsForm.email_subject || ''} onChange={e => updateSms('email_subject', e.target.value)} placeholder="Nhắc lịch hẹn từ {shop}" size="large" />
              </FieldRow>
            </>
          )}

          {(smsForm.provider === 'speedsms' || smsForm.provider === 'esms') && (
            <>
              <FieldRow label="API Key">
                <Input.Password value={smsForm.api_key} onChange={e => updateSms('api_key', e.target.value)} placeholder="Dán API key từ nhà cung cấp..." size="large" />
              </FieldRow>
              {smsForm.provider === 'esms' && (
                <FieldRow label="Secret Key">
                  <Input.Password value={smsForm.secret_key} onChange={e => updateSms('secret_key', e.target.value)} size="large" />
                </FieldRow>
              )}
            </>
          )}

          {/* Template */}
          <FieldRow label="Nội dung tin nhắn">
            <Input.TextArea value={smsForm.template} onChange={e => updateSms('template', e.target.value)} rows={3} style={{ fontFamily: 'monospace', fontSize: 13 }} />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>
              Biến: <code style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3 }}>{'{name}'}</code>{' '}
              <code style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3 }}>{'{shop}'}</code>{' '}
              <code style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3 }}>{'{time}'}</code>{' '}
              <code style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3 }}>{'{service}'}</code>{' '}
              <code style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3 }}>{'{stylist}'}</code>
            </div>
          </FieldRow>

          {/* Preview */}
          <div style={{ background: '#f8f9ff', borderRadius: 10, padding: '10px 14px', marginBottom: 14, border: '1px solid #e8e8ff' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>📱 Xem trước:</div>
            <div style={{ fontSize: 13, color: '#333', fontStyle: 'italic', lineHeight: 1.6 }}>
              {smsForm.template
                .replace('{name}', 'Nguyễn Thị Hoa')
                .replace('{shop}', form.name || 'Tiệm')
                .replace('{time}', '14:30')
                .replace('{service}', 'Cắt + Nhuộm')
                .replace('{stylist}', 'Lan')}
            </div>
            <div style={{ fontSize: 11, color: smsForm.template.length > 160 ? '#ff4d4f' : '#52c41a', marginTop: 6, fontWeight: 600 }}>
              {smsForm.template.length} ký tự {smsForm.template.length > 160 ? '⚠️ Quá 1 SMS' : '✅ OK'}
            </div>
          </div>

          {/* Test input (cho SMS trả phí) */}
          {['speedsms', 'esms'].includes(smsForm.provider) && (
            <FieldRow label="SĐT để gửi test">
              <Input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="0912345678" size="large" type="tel" />
            </FieldRow>
          )}

          {/* Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <PrimaryBtn onClick={handleSaveSms} loading={savingSms} color="green">
              {savingSms ? 'Đang lưu...' : '💾 Lưu'}
            </PrimaryBtn>
            <PrimaryBtn onClick={handleTestNotif} loading={testingNotif} color="blue">
              {testingNotif ? 'Đang gửi...' : '🧪 Gửi test'}
            </PrimaryBtn>
          </div>

          {/* So sánh providers */}
          <div style={{ background: '#fffbe6', borderRadius: 10, padding: '10px 14px', border: '1px solid #ffe58f' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#874d00', marginBottom: 8 }}>📊 So sánh các kênh:</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ffe58f' }}>
                  <th style={{ textAlign: 'left', padding: '3px 0', color: '#92400e' }}>Kênh</th>
                  <th style={{ textAlign: 'center', color: '#92400e' }}>Chi phí</th>
                  <th style={{ textAlign: 'center', color: '#92400e' }}>Khách cần</th>
                  <th style={{ textAlign: 'center', color: '#92400e' }}>Tỉ lệ đọc</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['🟦 Zalo OA', 'Miễn phí', 'Follow OA', '90%'],
                  ['✈️ Telegram', 'Miễn phí', 'Cài app + /start', '85%'],
                  ['📧 Gmail', 'Miễn phí', 'Có email', '40%'],
                  ['📱 SMS', '~500đ/tin', 'Không cần', '95%'],
                ].map(([ch, cp, kh, tl]) => (
                  <tr key={ch} style={{ borderBottom: '1px solid #fff3cd' }}>
                    <td style={{ padding: '4px 0', color: '#555' }}>{ch}</td>
                    <td style={{ textAlign: 'center', color: cp === 'Miễn phí' ? '#52c41a' : '#ff4d4f', fontWeight: 700 }}>{cp}</td>
                    <td style={{ textAlign: 'center', color: '#666' }}>{kh}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{tl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingGroup>
      )}

      {!canEdit && (
        <div style={{ textAlign: 'center', padding: '14px', background: '#fef9c3', borderRadius: 12, color: '#92400e', fontSize: 13 }}>
          🔒 Chỉ chủ tiệm (owner) mới được thay đổi cài đặt
        </div>
      )}
    </div>
  )
}
