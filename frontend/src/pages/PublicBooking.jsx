import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import api from '../api'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
dayjs.locale('vi')

const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'

function genSlots(openTime, closeTime, intervalMin) {
  const slots = []
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  while (cur <= end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += intervalMin
  }
  return slots
}

const DAYS_VN = ['CN','T2','T3','T4','T5','T6','T7']
const MONTHS_VN = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12']

export default function PublicBooking({ shopInfo }) {
  // Lấy slug từ shopInfo.slug (subdomain mode) hoặc fallback từ pathname
  const slug = shopInfo?.slug || window.location.hostname.split('.')[0]
  const [settings, setSettings] = useState({ open_time: '08:00', close_time: '20:00', slot_interval: 30 })
  const [services, setServices] = useState([])
  const [stylists, setStylists] = useState([])
  const [busySlots, setBusySlots] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedStylist, setSelectedStylist] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookResult, setBookResult] = useState(null)

  const shopName = shopInfo?.name || 'Tiệm Tóc'
  const shopPhone = shopInfo?.phone || ''
  const shopAddress = shopInfo?.address || ''

  useEffect(() => { if (slug) loadData() }, [slug])
  useEffect(() => { if (slug && selectedDate) loadAvailability() }, [slug, selectedDate, selectedStylist])

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, st, svc] = await Promise.all([
        api.get(`/api/public/${slug}/settings`).catch(() => ({ data: {} })),
        api.get(`/api/public/${slug}/stylists`).catch(() => ({ data: [] })),
        api.get(`/api/public/${slug}/services`).catch(() => ({ data: [] })),
      ])
      setSettings({ open_time: '08:00', close_time: '20:00', slot_interval: 30, ...s.data })
      setStylists(st.data || [])
      setServices(svc.data || [])
    } catch {}
    finally { setLoading(false) }
  }

  const loadAvailability = async () => {
    try {
      const params = { date: selectedDate }
      if (selectedStylist) params.stylist_id = selectedStylist
      const r = await api.get(`/api/public/${slug}/availability`, { params })
      setBusySlots(r.data.busy || {})
    } catch { setBusySlots({}) }
  }

  const handleBook = async () => {
    if (!selectedSlot) return message.warning('Vui lòng chọn giờ!')
    if (!customerName.trim()) return message.warning('Vui lòng nhập tên!')
    if (!customerPhone.trim()) return message.warning('Vui lòng nhập số điện thoại!')
    setSubmitting(true)
    try {
      const stylist = stylists.find(s => s.id === selectedStylist)
      const svc = services.find(s => s.id === selectedService)
      const res = await api.post(`/api/public/${slug}/appointments`, {
        customer_name: customerName, customer_phone: customerPhone,
        stylist_id: selectedStylist || null, stylist_name: stylist?.name || null,
        service_id: selectedService || null, service_name: svc?.name || null,
        appointment_time: `${selectedDate}T${selectedSlot}:00`,
        duration_minutes: settings.slot_interval, note: note || null,
      })
      setBookResult({ stylist_name: res.data.stylist_name || 'Sẽ phân công sau', service_name: svc?.name || '', date: selectedDate, time: selectedSlot, customer_name: customerName })
    } catch (e) { message.error(e.response?.data?.error || 'Đặt lịch thất bại!') }
    finally { setSubmitting(false) }
  }

  const resetForm = () => {
    setBookResult(null); setSelectedService(null); setSelectedSlot(null)
    setCustomerName(''); setCustomerPhone(''); setNote('')
  }

  const allSlots = genSlots(settings.open_time, settings.close_time, settings.slot_interval)
  const nowMin = dayjs().hour() * 60 + dayjs().minute()
  const isToday = selectedDate === dayjs().format('YYYY-MM-DD')
  const days14 = Array.from({ length: 14 }, (_, i) => dayjs().add(i, 'day'))
  const selectedSvc = services.find(s => s.id === selectedService)
  const canBook = !!(selectedSlot && customerName.trim() && customerPhone.trim())
  const grad = 'linear-gradient(135deg,#7c3aed,#ec4899)'

  // ── Màn hình thành công ──
  if (bookResult) return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 8px' }}>Đặt lịch thành công!</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 28 }}>Cảm ơn <strong style={{ color: '#ec4899' }}>{bookResult.customer_name}</strong> đã tin tưởng {shopName}! 🌸</p>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px', marginBottom: 20, textAlign: 'left' }}>
          {[
            ['Dịch vụ', bookResult.service_name || 'Chưa chọn'],
            ['Thợ', bookResult.stylist_name],
            ['Ngày', dayjs(bookResult.date).format('dddd, DD/MM/YYYY')],
            ['Giờ', bookResult.time],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{k}</span>
              <span style={{ color: k === 'Giờ' ? '#ec4899' : '#fff', fontWeight: k === 'Giờ' ? 900 : 600, fontSize: k === 'Giờ' ? 20 : 14 }}>{v}</span>
            </div>
          ))}
        </div>
        {shopPhone && <a href={`tel:${shopPhone}`} style={{ display: 'block', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px', color: '#fff', textDecoration: 'none', fontWeight: 700, marginBottom: 12 }}>📞 Gọi tiệm: {shopPhone}</a>}
        <button onClick={resetForm} style={{ width: '100%', height: 52, border: 'none', borderRadius: 14, background: grad, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>📅 Đặt thêm lịch</button>
      </div>
    </div>
  )

  const Divider = ({ title, right }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 4, height: 20, background: grad, borderRadius: 4 }} />
      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{title}</span>
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
  )

  // ── Màn hình đặt lịch ──
  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box} ::-webkit-scrollbar{display:none} input::placeholder{color:rgba(255,255,255,0.25)} input:focus{border-color:rgba(124,58,237,0.6)!important;outline:none}`}</style>

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{shopName}</div>
          {shopAddress && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>📍 {shopAddress}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {shopPhone && <a href={`tel:${shopPhone}`} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 20, padding: '7px 13px', color: '#10b981', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📞 Gọi</a>}
          <a href='/login' style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '7px 13px', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Đăng nhập</a>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 48px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✂️</div>
            <div>Đang tải...</div>
          </div>
        ) : (
          <>
            {/* DỊCH VỤ */}
            <div style={{ marginBottom: 24 }}>
              <Divider title='Dịch vụ ✂️' right={selectedSvc && <span style={{ fontSize: 12, background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.5)', borderRadius: 20, padding: '3px 10px', color: '#c4b5fd', fontWeight: 600 }}>✓ {selectedSvc.name}</span>} />
              {services.length === 0
                ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 20, fontSize: 13 }}>Chưa có dịch vụ nào</div>
                : <div style={{ display: 'grid', gridTemplateColumns: services.length === 1 ? '1fr' : 'repeat(2,1fr)', gap: 10 }}>
                    {services.map(svc => {
                      const active = selectedService === svc.id
                      return (
                        <button key={svc.id} onClick={() => setSelectedService(active ? null : svc.id)} style={{ background: active ? 'linear-gradient(135deg,rgba(124,58,237,0.45),rgba(236,72,153,0.35))' : 'rgba(255,255,255,0.06)', border: active ? '1.5px solid rgba(124,58,237,0.8)' : '1.5px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: active ? '0 4px 20px rgba(124,58,237,0.3)' : 'none', width: '100%', position: 'relative' }}>
                          {active && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 14 }}>✅</div>}
                          <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#e9d5ff' : 'rgba(255,255,255,0.85)', marginBottom: 4, paddingRight: 20 }}>✂️ {svc.name}</div>
                          {svc.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{svc.description}</div>}
                          <div style={{ fontSize: 15, fontWeight: 900, color: active ? '#f0abfc' : '#c4b5fd' }}>{fmtMoney(svc.price)}</div>
                        </button>
                      )
                    })}
                  </div>
              }
            </div>

            {/* CHỌN THỢ */}
            {stylists.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Divider title='Chọn thợ 💇' />
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {[{ id: null, name: '🎲 Bất kỳ' }, ...stylists.map(s => ({ ...s, name: '✂️ ' + s.name }))].map(s => {
                    const active = selectedStylist === s.id
                    return <button key={s.id ?? 'any'} onClick={() => setSelectedStylist(s.id)} style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 50, border: active ? 'none' : '1.5px solid rgba(255,255,255,0.15)', background: active ? grad : 'rgba(255,255,255,0.06)', color: active ? '#fff' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: active ? '0 4px 16px rgba(124,58,237,0.4)' : 'none', transition: 'all 0.2s' }}>{s.name}</button>
                  })}
                </div>
              </div>
            )}

            {/* CHỌN NGÀY */}
            <div style={{ marginBottom: 24 }}>
              <Divider title='Chọn ngày 📅' right={<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{dayjs(selectedDate).format('ddd, DD/MM')}</span>} />
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {days14.map(d => {
                  const val = d.format('YYYY-MM-DD')
                  const active = val === selectedDate
                  return (
                    <button key={val} onClick={() => { setSelectedDate(val); setSelectedSlot(null) }} style={{ flexShrink: 0, width: 54, padding: '10px 4px', borderRadius: 16, border: active ? 'none' : '1.5px solid rgba(255,255,255,0.1)', background: active ? grad : 'rgba(255,255,255,0.05)', color: active ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: active ? '0 4px 16px rgba(124,58,237,0.4)' : 'none' }}>
                      <div style={{ fontSize: 10, fontWeight: 700 }}>{DAYS_VN[d.day()]}</div>
                      <div style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.2 }}>{d.date()}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{MONTHS_VN[d.month()]}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CHỌN GIỜ */}
            <div style={{ marginBottom: 24 }}>
              <Divider title='Chọn giờ 🕐' right={selectedSlot && <span style={{ fontSize: 14, fontWeight: 900, color: '#ec4899' }}>🕐 {selectedSlot}</span>} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {allSlots.map(slot => {
                  const [h, m] = slot.split(':').map(Number)
                  const slotMin = h * 60 + m
                  const isBusy = busySlots[slot] === true
                  const isPast = isToday && slotMin <= nowMin
                  const isSelected = slot === selectedSlot
                  const disabled = isBusy || isPast
                  return (
                    <button key={slot} disabled={disabled} onClick={() => setSelectedSlot(slot)} style={{ padding: '11px 4px', borderRadius: 12, border: isSelected ? 'none' : `1.5px solid ${disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)'}`, background: isSelected ? grad : isBusy ? 'rgba(239,68,68,0.08)' : isPast ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)', color: isSelected ? '#fff' : disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: isSelected ? 800 : 500, fontSize: 13, boxShadow: isSelected ? '0 4px 16px rgba(124,58,237,0.5)' : 'none', textDecoration: isBusy ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                      {slot}
                      {isBusy && <div style={{ fontSize: 9, marginTop: 2, color: 'rgba(239,68,68,0.7)' }}>Hết</div>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* THÔNG TIN */}
            <div style={{ marginBottom: 28 }}>
              <Divider title='Thông tin của bạn 👤' />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'HỌ TÊN *', val: customerName, set: setCustomerName, ph: 'Nguyễn Thị Lan', type: 'text' },
                  { label: 'SỐ ĐIỆN THOẠI *', val: customerPhone, set: setCustomerPhone, ph: '0901 234 567', type: 'tel' },
                  { label: 'GHI CHÚ', val: note, set: setNote, ph: 'Yêu cầu đặc biệt...', type: 'text' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: 0.5 }}>{f.label}</div>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: '100%', padding: '13px 16px', borderRadius: 14, fontSize: 15, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', color: '#fff', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* TÓM TẮT */}
            {(selectedSvc || selectedSlot) && (
              <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 8 }}>📋 Tóm tắt lịch hẹn</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                  {selectedSvc && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>✂️ {selectedSvc.name}</span>}
                  {selectedStylist && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>👤 {stylists.find(s => s.id === selectedStylist)?.name}</span>}
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>📅 {dayjs(selectedDate).format('ddd DD/MM')}</span>
                  {selectedSlot && <span style={{ fontSize: 14, fontWeight: 900, color: '#ec4899' }}>🕐 {selectedSlot}</span>}
                </div>
              </div>
            )}

            {/* NÚT ĐẶT LỊCH */}
            <button onClick={handleBook} disabled={submitting || !canBook} style={{ width: '100%', height: 58, border: 'none', borderRadius: 18, background: canBook ? grad : 'rgba(255,255,255,0.08)', color: canBook ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 17, fontWeight: 800, cursor: canBook ? 'pointer' : 'not-allowed', boxShadow: canBook ? '0 8px 28px rgba(124,58,237,0.45)' : 'none', transition: 'all 0.3s' }}>
              {submitting ? '⏳ Đang đặt lịch...' : canBook ? '✅ Xác nhận đặt lịch' : '⬆️ Chọn giờ & điền thông tin để đặt'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
