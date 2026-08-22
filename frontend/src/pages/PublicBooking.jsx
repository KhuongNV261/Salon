import React, { useState, useEffect } from 'react'
import { Input, message } from 'antd'
import { Link, useParams } from 'react-router-dom'
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

const DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTHS_VN = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12']

function DateStrip({ selected, onChange }) {
  const days = Array.from({ length: 14 }, (_, i) => dayjs().add(i, 'day'))
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 8px', scrollbarWidth: 'none' }}>
      {days.map(d => {
        const val = d.format('YYYY-MM-DD')
        const active = val === selected
        return (
          <button key={val} onClick={() => onChange(val)} style={{
            flexShrink: 0, width: 52, padding: '8px 4px', borderRadius: 14,
            border: active ? 'none' : '1.5px solid #e8e8f0',
            background: active ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#fff',
            color: active ? '#fff' : '#555', cursor: 'pointer',
            boxShadow: active ? '0 4px 16px rgba(124,58,237,0.4)' : 'none', transition: 'all 0.15s'
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, opacity: active ? 1 : 0.6 }}>{DAYS_VN[d.day()]}</div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{d.date()}</div>
            <div style={{ fontSize: 10, opacity: active ? 0.8 : 0.5 }}>{MONTHS_VN[d.month()]}</div>
          </button>
        )
      })}
    </div>
  )
}

export default function PublicBooking({ shopInfo }) {
  const { slug } = useParams()
  const [step, setStep] = useState(1)
  const [settings, setSettings] = useState({ open_time: '08:00', close_time: '20:00', slot_interval: 30 })
  const [services, setServices] = useState([])
  const [stylists, setStylists] = useState([])
  const [busySlots, setBusySlots] = useState({})
  const [selectedService, setSelectedService] = useState(null)
  const [selectedStylist, setSelectedStylist] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookResult, setBookResult] = useState(null)

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (step === 2) loadAvailability() }, [step, selectedDate, selectedStylist])

  const loadData = async () => {
    try {
      const [s, st, svc] = await Promise.all([
        api.get('/api/settings').catch(() => ({ data: {} })),
        api.get('/api/appointments/stylists').catch(() => ({ data: [] })),
        api.get('/api/products').catch(() => ({ data: [] })),
      ])
      setSettings({ open_time: '08:00', close_time: '20:00', slot_interval: 30, ...s.data })
      setStylists(st.data || [])
      setServices((svc.data || []).filter(p => p.is_service))
    } catch {}
  }

  const loadAvailability = async () => {
    try {
      const params = { date: selectedDate }
      if (selectedStylist) params.stylist_id = selectedStylist
      const r = await api.get('/api/appointments/availability', { params })
      setBusySlots(r.data.busy || {})
    } catch { setBusySlots({}) }
  }

  const handleBook = async () => {
    if (!customerName.trim()) return message.warning('Ban chua nhap ten!')
    if (!customerPhone.trim()) return message.warning('Ban chua nhap so dien thoai!')
    setSubmitting(true)
    try {
      const stylist = stylists.find(s => s.id === selectedStylist)
      const svc = services.find(s => s.id === selectedService)
      const res = await api.post('/api/appointments', {
        customer_name: customerName, customer_phone: customerPhone,
        stylist_id: selectedStylist || null, stylist_name: stylist?.name || null,
        service_id: selectedService || null, service_name: svc?.name || null,
        appointment_time: `${selectedDate}T${selectedSlot}:00`,
        duration_minutes: settings.slot_interval, note: note || null,
      })
      setBookResult({ stylist_name: res.data.stylist_name || 'Se phan cong sau', service_name: svc?.name || '', date: selectedDate, time: selectedSlot, customer_name: customerName })
      setStep(4)
    } catch (e) { message.error(e.response?.data?.error || 'Dat lich that bai!') }
    finally { setSubmitting(false) }
  }

  const allSlots = genSlots(settings.open_time, settings.close_time, settings.slot_interval)
  const nowMin = dayjs().hour() * 60 + dayjs().minute()
  const isToday = selectedDate === dayjs().format('YYYY-MM-DD')
  const shopName = shopInfo?.name || 'Tiem Toc Hoa Lan'
  const shopPhone = shopInfo?.phone || ''
  const shopAddress = shopInfo?.address || ''

  const btnPrimary = { width: '100%', height: 52, border: 'none', borderRadius: 16, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,58,237,0.4)', transition: 'all 0.2s' }
  const btnBack = { flex: 0, padding: '0 20px', height: 52, border: '1.5px solid #e8e8f0', borderRadius: 16, background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer' }

  return (
    <div style={{ minHeight: '100dvh', background: '#faf5ff', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', padding: '20px 20px 32px', position: 'relative', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, boxShadow: '0 8px 32px rgba(124,58,237,0.35)' }}>
        <Link to={`/${slug}/login`} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', textDecoration: 'none', borderRadius: 50, padding: '6px 14px', fontSize: 12, fontWeight: 600 }}>Dang nhap</Link>
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ fontSize: 52, marginBottom: 6 }}>💐</div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: 0 }}>{shopName}</h1>
          {shopAddress && <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 6 }}>📍 {shopAddress}</div>}
          {shopPhone && <a href={`tel:${shopPhone}`} style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, textDecoration: 'none', display: 'block', marginTop: 4 }}>📞 {shopPhone}</a>}
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 50, padding: '6px 16px', display: 'inline-block', fontSize: 13, color: '#fff', fontWeight: 600 }}>📅 Dat lich truc tuyen — Mien phi</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>

        {/* Step indicator */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            {[{ n: 1, label: 'Dich vu' }, { n: 2, label: 'Thoi gian' }, { n: 3, label: 'Thong tin' }].map((s, i) => (
              <React.Fragment key={s.n}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= s.n ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#e5e7eb', color: step >= s.n ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: 14, boxShadow: step === s.n ? '0 4px 12px rgba(124,58,237,0.4)' : 'none', transition: 'all 0.3s' }}>{step > s.n ? '✓' : s.n}</div>
                  <div style={{ fontSize: 10, color: step >= s.n ? '#7c3aed' : '#9ca3af', fontWeight: 600 }}>{s.label}</div>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: step > s.n ? 'linear-gradient(90deg,#7c3aed,#ec4899)' : '#e5e7eb', margin: '0 6px 20px', transition: 'all 0.3s' }} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>Chon dich vu ✂️</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Chon dich vu ban muon</div>
            {services.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><div style={{ fontSize: 40 }}>✂️</div><div style={{ marginTop: 8 }}>Dang tai...</div></div> : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {services.map(svc => (
                    <button key={svc.id} onClick={() => setSelectedService(svc.id === selectedService ? null : svc.id)} style={{ background: selectedService === svc.id ? 'linear-gradient(135deg,#f5f3ff,#fdf4ff)' : '#fff', border: selectedService === svc.id ? '2px solid #7c3aed' : '2px solid #f0f0f0', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.15s', boxShadow: selectedService === svc.id ? '0 4px 16px rgba(124,58,237,0.15)' : '0 1px 4px rgba(0,0,0,0.06)', width: '100%' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: selectedService === svc.id ? '#7c3aed' : '#1e1b4b' }}>✂️ {svc.name}</div>
                        {svc.description && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{svc.description}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#7c3aed' }}>{fmtMoney(svc.price)}</div>
                        {selectedService === svc.id && <div style={{ fontSize: 16 }}>✅</div>}
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(2)} disabled={!selectedService} style={{ ...btnPrimary, marginBottom: 8, opacity: !selectedService ? 0.5 : 1 }}>Tiep theo →</button>
                <button onClick={() => setStep(2)} style={{ width: '100%', height: 44, border: '1.5px solid #e8e8f0', borderRadius: 16, background: '#fff', color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}>Bo qua, chon gio truoc</button>
              </>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>Chon thoi gian 📅</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Chon tho, ngay va gio phu hop</div>
            {stylists.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>✂️ Chon tho:</div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                  <button onClick={() => setSelectedStylist(null)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 50, border: !selectedStylist ? 'none' : '1.5px solid #e8e8f0', background: !selectedStylist ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#fff', color: !selectedStylist ? '#fff' : '#555', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Bat ky</button>
                  {stylists.map(s => (
                    <button key={s.id} onClick={() => setSelectedStylist(s.id)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 50, border: selectedStylist === s.id ? 'none' : '1.5px solid #e8e8f0', background: selectedStylist === s.id ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#fff', color: selectedStylist === s.id ? '#fff' : '#555', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>✂️ {s.name}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>📅 Chon ngay:</div>
              <DateStrip selected={selectedDate} onChange={(d) => { setSelectedDate(d); setSelectedSlot(null) }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>🕐 Chon gio — {dayjs(selectedDate).format('ddd DD/MM')}:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {allSlots.map(slot => {
                  const [h, m] = slot.split(':').map(Number)
                  const slotMin = h * 60 + m
                  const isBusy = busySlots[slot] === true
                  const isPast = isToday && slotMin <= nowMin
                  const isSelected = slot === selectedSlot
                  const disabled = isBusy || isPast
                  return (
                    <button key={slot} onClick={() => !disabled && setSelectedSlot(slot)} style={{ padding: '10px 4px', borderRadius: 12, border: isSelected ? 'none' : `1.5px solid ${disabled ? '#f0f0f0' : '#e8e8f0'}`, background: isSelected ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : isBusy ? '#fef2f2' : isPast ? '#f9fafb' : '#fff', color: isSelected ? '#fff' : disabled ? '#d1d5db' : '#374151', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: isSelected ? 700 : 500, fontSize: 13, boxShadow: isSelected ? '0 4px 12px rgba(124,58,237,0.4)' : 'none', textDecoration: isBusy ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                      {slot}
                      {isBusy && <div style={{ fontSize: 9, marginTop: 1 }}>Het</div>}
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={btnBack}>← Quay lai</button>
              <button onClick={() => setStep(3)} disabled={!selectedSlot} style={{ ...btnPrimary, flex: 1, opacity: !selectedSlot ? 0.5 : 1 }}>Tiep theo →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>Thong tin cua ban 👤</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>De tiem xac nhan va nhac lich hen</div>
            <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#fdf4ff)', border: '1px solid #e9d5ff', borderRadius: 16, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>📋 Lich hen cua ban</div>
              {selectedService && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span style={{ color: '#6b7280' }}>Dich vu:</span><span style={{ fontWeight: 600 }}>{services.find(s => s.id === selectedService)?.name}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span style={{ color: '#6b7280' }}>Tho:</span><span style={{ fontWeight: 600 }}>{stylists.find(s => s.id === selectedStylist)?.name || 'Bat ky'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span style={{ color: '#6b7280' }}>Ngay:</span><span style={{ fontWeight: 600 }}>{dayjs(selectedDate).format('ddd DD/MM/YYYY')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#6b7280' }}>Gio:</span><span style={{ fontWeight: 900, color: '#7c3aed', fontSize: 16 }}>{selectedSlot}</span></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Ho ten *</div><Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nguyen Thi Lan" size="large" style={{ borderRadius: 12, fontSize: 15 }} /></div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>So dien thoai *</div><Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="0901234567" size="large" type="tel" style={{ borderRadius: 12, fontSize: 15 }} /></div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Ghi chu (tuy chon)</div><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Yeu cau dac biet..." style={{ borderRadius: 12 }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(2)} style={btnBack}>← Quay lai</button>
              <button onClick={handleBook} disabled={submitting || !customerName.trim() || !customerPhone.trim()} style={{ ...btnPrimary, flex: 1, opacity: submitting || !customerName.trim() || !customerPhone.trim() ? 0.6 : 1 }}>{submitting ? '⏳ Dang dat...' : '✅ Xac nhan dat lich'}</button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && bookResult && (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, boxShadow: '0 12px 40px rgba(124,58,237,0.4)' }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e1b4b', marginBottom: 8 }}>Dat lich thanh cong!</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Cam on ban da dat lich tai <strong style={{ color: '#7c3aed' }}>{shopName}</strong>!</p>
            <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#fdf4ff)', border: '1px solid #e9d5ff', borderRadius: 20, padding: '20px 24px', textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>📋 Chi tiet lich hen</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#6b7280' }}>Khach:</span><span style={{ fontWeight: 700 }}>{bookResult.customer_name}</span></div>
                {bookResult.service_name && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#6b7280' }}>Dich vu:</span><span style={{ fontWeight: 600 }}>{bookResult.service_name}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#6b7280' }}>Tho:</span><span style={{ fontWeight: 600 }}>✂️ {bookResult.stylist_name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#6b7280' }}>Ngay:</span><span style={{ fontWeight: 600 }}>{dayjs(bookResult.date).format('ddd DD/MM/YYYY')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}><span style={{ color: '#6b7280' }}>Gio:</span><span style={{ fontWeight: 900, color: '#7c3aed', fontSize: 20 }}>{bookResult.time}</span></div>
              </div>
            </div>
            {shopPhone && <a href={`tel:${shopPhone}`} style={{ display: 'block', background: '#fff', border: '1.5px solid #e9d5ff', borderRadius: 14, padding: '12px 20px', color: '#7c3aed', textDecoration: 'none', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📞 Goi tiem: {shopPhone}</a>}
            <button onClick={() => { setStep(1); setSelectedService(null); setSelectedSlot(null); setCustomerName(''); setCustomerPhone(''); setNote(''); setBookResult(null) }} style={btnPrimary}>📅 Dat them lich</button>
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; }`}</style>
    </div>
  )
}
