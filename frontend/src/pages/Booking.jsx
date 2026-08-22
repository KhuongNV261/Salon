import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Select, Input, Modal, message, Tag, Tooltip, Badge } from 'antd'
import { PlusOutlined, ReloadOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons'
import api from '../api'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
dayjs.locale('vi')

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
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

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const STATUS_CFG = {
  pending:     { label: 'Chờ',      bg: '#fff7e6', color: '#d48806', border: '#ffd591', dot: '🟡' },
  confirmed:   { label: 'Xác nhận', bg: '#e6f4ff', color: '#0958d9', border: '#91caff', dot: '🔵' },
  in_progress: { label: 'Đang làm', bg: '#f9f0ff', color: '#531dab', border: '#d3adf7', dot: '🟣' },
  done:        { label: 'Xong',     bg: '#f6ffed', color: '#389e0d', border: '#b7eb8f', dot: '🟢' },
  cancelled:   { label: 'Hủy',      bg: '#fff1f0', color: '#cf1322', border: '#ffa39e', dot: '🔴' },
}

// Màu theo stylist index
const STYLIST_COLORS = [
  { bg: '#e0f2fe', border: '#0ea5e9', text: '#0369a1' },
  { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
  { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
]

/* ─────────────────────────────────────────
   DATE TABS
───────────────────────────────────────── */
function DateTabs({ selected, onChange }) {
  const days = Array.from({ length: 7 }, (_, i) => dayjs().add(i - 1, 'day'))
  const names = { 0: 'Hôm qua', 1: 'Hôm nay', 2: 'Ngày mai' }
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
      {days.map((d, i) => {
        const val = d.format('YYYY-MM-DD')
        const active = val === selected
        return (
          <button key={val} onClick={() => onChange(val)} style={{
            flexShrink: 0, minWidth: 64, padding: '8px 4px',
            borderRadius: 12, border: 'none', cursor: 'pointer',
            background: active ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f4f5f7',
            color: active ? '#fff' : '#555',
            textAlign: 'center',
            boxShadow: active ? '0 4px 12px rgba(102,126,234,0.35)' : 'none',
            transition: 'all 0.18s',
          }}>
            <div style={{ fontSize: 9, opacity: active ? 0.85 : 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {names[i] ?? d.format('ddd')}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{d.format('DD')}</div>
            <div style={{ fontSize: 10, fontWeight: 500, opacity: active ? 0.9 : 0.5 }}>{d.format('MM/YY')}</div>
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────
   TIMELINE CALENDAR VIEW (Drag & Drop)
───────────────────────────────────────── */
function TimelineView({ appointments, stylists, selectedDate, shopSettings, onMoveApt, onClickApt, onNewApt }) {
  const HOUR_H = 64          // px per hour
  const COL_W = 130          // px per stylist column
  const LABEL_W = 44         // time label width
  const openMin = timeToMinutes(shopSettings.open_time || '08:00')
  const closeMin = timeToMinutes(shopSettings.close_time || '20:00')
  const totalMin = closeMin - openMin
  const totalH = totalMin / 60
  const containerH = totalH * HOUR_H

  // Generate hour labels
  const hours = []
  for (let h = Math.floor(openMin / 60); h <= Math.ceil(closeMin / 60); h++) {
    hours.push(h)
  }

  // Drag state
  const dragRef = useRef(null)
  const containerRef = useRef(null)

  const getMinFromY = (y) => {
    const pct = y / containerH
    return Math.round((openMin + pct * totalMin) / 30) * 30  // snap to 30min
  }

  const handleDragStart = (e, apt) => {
    dragRef.current = { apt, offsetY: e.nativeEvent.offsetY }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', apt.id)
  }

  const handleDrop = (e, stylist) => {
    e.preventDefault()
    const dragging = dragRef.current
    if (!dragging) return
    const rect = containerRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top - (dragging.offsetY || 0)
    const newMin = getMinFromY(Math.max(0, Math.min(y, containerH - 1)))
    const h = String(Math.floor(newMin / 60)).padStart(2, '0')
    const m = String(newMin % 60).padStart(2, '0')
    const newTime = `${selectedDate}T${h}:${m}:00`
    onMoveApt(dragging.apt.id, newTime, stylist.id, stylist.name)
    dragRef.current = null
  }

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }

  // Click on empty slot → new appointment
  const handleColClick = (e, stylist) => {
    if (dragRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const newMin = getMinFromY(Math.max(0, Math.min(y, containerH - 1)))
    
    // Check quá khứ
    const isPastDate = dayjs(selectedDate).isBefore(dayjs(), 'day')
    if (isPastDate || (isToday && newMin < nowMin)) {
      message.warning('Không thể đặt lịch vào thời gian trong quá khứ!')
      return
    }

    const h = String(Math.floor(newMin / 60)).padStart(2, '0')
    const m = String(newMin % 60).padStart(2, '0')
    onNewApt(stylist, `${h}:${m}`)
  }

  // Now line
  const now = dayjs()
  const nowMin = now.hour() * 60 + now.minute()
  const isToday = selectedDate === now.format('YYYY-MM-DD')
  const nowTop = ((nowMin - openMin) / totalMin) * containerH

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
      {/* Header: stylist columns */}
      <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '2px solid #f0f0f0', marginLeft: LABEL_W }}>
        {stylists.map((s, i) => {
          const col = STYLIST_COLORS[i % STYLIST_COLORS.length]
          return (
            <div key={s.id} style={{
              width: COL_W, minWidth: COL_W, flexShrink: 0,
              padding: '8px 6px', textAlign: 'center',
              borderLeft: `3px solid ${col.border}`,
              background: col.bg,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: col.text }}>✂️ {s.name}</div>
              <div style={{ fontSize: 10, color: col.text, opacity: 0.7 }}>
                {appointments.filter(a => a.stylist_id === s.id && !['cancelled'].includes(a.status)).length} lịch
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Time labels */}
        <div style={{ width: LABEL_W, minWidth: LABEL_W, flexShrink: 0, position: 'relative', height: containerH }}>
          {hours.map(h => {
            const top = ((h * 60 - openMin) / totalMin) * containerH
            if (top < 0 || top > containerH) return null
            return (
              <div key={h} style={{
                position: 'absolute', top: top - 8, left: 0, right: 0,
                fontSize: 10, color: '#aaa', fontWeight: 600, textAlign: 'right', paddingRight: 8
              }}>
                {String(h).padStart(2, '0')}:00
              </div>
            )
          })}
          {/* Hour lines */}
          {hours.map(h => {
            const top = ((h * 60 - openMin) / totalMin) * containerH
            if (top < 0 || top > containerH) return null
            return <div key={`line-${h}`} style={{ position: 'absolute', top, left: LABEL_W - 4, right: -9999, height: 1, background: '#f0f0f0', zIndex: 1 }} />
          })}
        </div>

        {/* Columns */}
        <div ref={containerRef} style={{ display: 'flex', position: 'relative', flex: 1, height: containerH }}>
          {/* Gray out past area */}
          {dayjs(selectedDate).isBefore(dayjs(), 'day') && (
            <div style={{
              position: 'absolute', left: 0, right: 0, top: 0, height: containerH,
              background: 'rgba(0,0,0,0.06)', zIndex: 5, pointerEvents: 'none'
            }} />
          )}
          {isToday && nowTop > 0 && (
            <div style={{
              position: 'absolute', left: 0, right: 0, top: 0, height: Math.min(nowTop, containerH),
              background: 'rgba(0,0,0,0.06)', zIndex: 5, pointerEvents: 'none'
            }} />
          )}

          {/* Now line */}
          {isToday && nowTop >= 0 && nowTop <= containerH && (
            <div style={{
              position: 'absolute', left: 0, right: 0, top: nowTop,
              height: 2, background: '#ff4d4f', zIndex: 15, pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute', left: -6, top: -4,
                width: 10, height: 10, borderRadius: '50%', background: '#ff4d4f'
              }} />
            </div>
          )}

          {/* Stylist columns */}
          {stylists.map((stylist, si) => {
            const col = STYLIST_COLORS[si % STYLIST_COLORS.length]
            const colApts = appointments.filter(a =>
              a.stylist_id === stylist.id && !['cancelled'].includes(a.status)
            )

            return (
              <div
                key={stylist.id}
                onDrop={(e) => handleDrop(e, stylist)}
                onDragOver={handleDragOver}
                onClick={(e) => handleColClick(e, stylist)}
                style={{
                  width: COL_W, minWidth: COL_W, flexShrink: 0,
                  position: 'relative', height: containerH,
                  borderLeft: `2px solid ${si === 0 ? '#e8eaed' : '#f0f0f0'}`,
                  cursor: 'crosshair',
                  background: si % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.008)',
                }}
              >
                {/* Appointments */}
                {colApts.map(apt => {
                  const aptMin = timeToMinutes(dayjs(apt.appointment_time).format('HH:mm'))
                  const top = ((aptMin - openMin) / totalMin) * containerH
                  const dur = apt.duration_minutes || 60
                  const height = Math.max((dur / totalMin) * containerH, 28)
                  const cfg = STATUS_CFG[apt.status] || {}
                  
                  const isAptPast = dayjs(apt.appointment_time).isBefore(dayjs())

                  return (
                    <div
                      key={apt.id}
                      draggable={!isAptPast}
                      onDragStart={(e) => { 
                        if (isAptPast) { e.preventDefault(); return }
                        e.stopPropagation(); handleDragStart(e, apt) 
                      }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (isAptPast) {
                          message.warning('Lịch trong quá khứ không thể thao tác tại đây, vui lòng dùng Tab Danh sách')
                          return
                        }
                        onClickApt(apt) 
                      }}
                      style={{
                        position: 'absolute',
                        top: Math.max(0, top),
                        left: 4, right: 4,
                        height: height - 4,
                        background: isAptPast ? '#f5f5f5' : (cfg.bg || col.bg),
                        border: `1.5px solid ${isAptPast ? '#d9d9d9' : (cfg.border || col.border)}`,
                        borderRadius: 8,
                        padding: '4px 6px',
                        cursor: isAptPast ? 'not-allowed' : 'grab',
                        zIndex: 10,
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        transition: 'box-shadow 0.15s',
                        opacity: isAptPast ? 0.65 : 1,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {apt.customer_name}
                      </div>
                      {height > 40 && (
                        <div style={{ fontSize: 10, color: cfg.color, opacity: 0.8, marginTop: 1 }}>
                          {dayjs(apt.appointment_time).format('HH:mm')} · {dur}p
                        </div>
                      )}
                      {height > 54 && apt.service_name && (
                        <div style={{ fontSize: 9, color: cfg.color, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          ✂️ {apt.service_name}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Unassigned column */}
          <div style={{ width: COL_W, minWidth: COL_W, flexShrink: 0, position: 'relative', height: containerH, borderLeft: '2px dashed #e8eaed' }}>
            {appointments.filter(a => !a.stylist_id && !['cancelled'].includes(a.status)).map(apt => {
              const aptMin = timeToMinutes(dayjs(apt.appointment_time).format('HH:mm'))
              const top = ((aptMin - openMin) / totalMin) * containerH
              const dur = apt.duration_minutes || 60
              const height = Math.max((dur / totalMin) * containerH, 28)
              return (
                <div key={apt.id} onClick={(e) => { e.stopPropagation(); onClickApt(apt) }}
                  style={{
                    position: 'absolute', top: Math.max(0, top), left: 4, right: 4,
                    height: height - 4, background: '#f5f5f5', border: '1.5px dashed #d9d9d9',
                    borderRadius: 8, padding: '4px 6px', cursor: 'pointer', overflow: 'hidden'
                  }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>{apt.customer_name}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   SLOT GRID
───────────────────────────────────────── */
function SlotGrid({ slots, busy, selected, stylistId, totalStylists, onSelect, selectedDate }) {
  const now = dayjs()
  const isToday = selectedDate === now.format('YYYY-MM-DD')
  const nowMin = now.hour() * 60 + now.minute()
  const isPastDate = dayjs(selectedDate).isBefore(now, 'day')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
      {slots.map(time => {
        const busyList = busy[time] || []
        let isFree = true
        if (stylistId) isFree = !busyList.includes(stylistId)
        else if (totalStylists > 0) isFree = busyList.length < totalStylists
        
        const slotMin = timeToMinutes(time)
        if (isPastDate || (isToday && slotMin < nowMin)) isFree = false
        
        const isActive = selected === time

        return (
          <button key={time} onClick={() => isFree && onSelect(isActive ? null : time)}
            disabled={!isFree}
            style={{
              padding: '10px 2px', borderRadius: 12, border: 'none',
              cursor: isFree ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
              background: isActive ? 'linear-gradient(135deg,#667eea,#764ba2)' : isFree ? '#f0f4ff' : '#f5f5f5',
              boxShadow: isActive ? '0 4px 12px rgba(102,126,234,0.4)' : 'none',
              transform: isActive ? 'scale(1.04)' : 'scale(1)',
            }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: isActive ? '#fff' : isFree ? '#4f46e5' : '#ccc' }}>
              {time}
            </div>
            <div style={{ fontSize: 10, marginTop: 3, fontWeight: 500, color: isActive ? 'rgba(255,255,255,0.8)' : isFree ? '#818cf8' : '#ccc' }}>
              {isFree ? '● Còn chỗ' : '✕ Hết chỗ'}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────
   APT CARD (List view)
───────────────────────────────────────── */
function AptCard({ apt, onStatus, onCancel, onEdit }) {
  const cfg = STATUS_CFG[apt.status] || {}
  return (
    <div style={{
      background: cfg.bg || '#fff', border: `1.5px solid ${cfg.border || '#eee'}`,
      borderRadius: 14, padding: '13px 14px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{apt.customer_name}</div>
          {apt.customer_phone && <div style={{ fontSize: 12, color: '#999', marginTop: 1 }}>{apt.customer_phone}</div>}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: cfg.color, color: '#fff' }}>
          {cfg.dot} {cfg.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
        <span style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 8, padding: '3px 9px' }}>
          🕐 {dayjs(apt.appointment_time).format('HH:mm')} · {apt.duration_minutes}p
        </span>
        {apt.service_name && (
          <span style={{ background: 'rgba(102,126,234,0.1)', color: '#4f46e5', borderRadius: 8, padding: '3px 9px' }}>
            ✂️ {apt.service_name}
          </span>
        )}
        {apt.stylist_name && (
          <span style={{ background: 'rgba(118,75,162,0.1)', color: '#6d28d9', borderRadius: 8, padding: '3px 9px' }}>
            👤 {apt.stylist_name}
          </span>
        )}
        {apt.reminder_sent && (
          <span style={{ background: '#f6ffed', color: '#52c41a', borderRadius: 8, padding: '3px 9px', border: '1px solid #b7eb8f' }}>
            📱 Đã nhắc
          </span>
        )}
      </div>

      {apt.note && <div style={{ fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' }}>💬 {apt.note}</div>}

      {!['done', 'cancelled'].includes(apt.status) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {apt.status === 'pending' && (
            <Btn color="#4f46e5" onClick={() => onStatus(apt.id, 'confirmed')}>✓ Xác nhận</Btn>
          )}
          {apt.status === 'confirmed' && (
            <Btn color="#7c3aed" onClick={() => onStatus(apt.id, 'in_progress')}>▶ Bắt đầu</Btn>
          )}
          {apt.status === 'in_progress' && (
            <Btn color="#15803d" onClick={() => onStatus(apt.id, 'done')}>✓ Hoàn thành</Btn>
          )}
          <button onClick={() => onCancel(apt.id)} style={{
            padding: '8px 14px', borderRadius: 10, border: '1.5px solid #fca5a5',
            background: '#fff', color: '#ef4444', fontSize: 13, cursor: 'pointer', fontWeight: 600
          }}>Hủy</button>
        </div>
      )}
    </div>
  )
}

function Btn({ color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
      background: color, color: '#fff', fontWeight: 700,
      fontSize: 13, cursor: 'pointer', boxShadow: `0 2px 8px ${color}55`
    }}>{children}</button>
  )
}

/* ─────────────────────────────────────────
   MAIN BOOKING PAGE
───────────────────────────────────────── */
export default function Booking() {
  const [view, setView] = useState('timeline')
  const [shopSettings, setShopSettings] = useState({ open_time: '08:00', close_time: '20:00', slot_interval: 30 })
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [selectedStylist, setSelectedStylist] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [note, setNote] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [stylists, setStylists] = useState([])
  const [services, setServices] = useState([])
  const [busySlots, setBusySlots] = useState({})
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [preSelectedStylist, setPreSelectedStylist] = useState(null)
  const [aptDetailModal, setAptDetailModal] = useState(null)


  const allSlots = genSlots(shopSettings.open_time, shopSettings.close_time, shopSettings.slot_interval)

  useEffect(() => { loadSettings(); loadStylists(); loadServices() }, [])
  useEffect(() => {
    loadAvailability(); loadAppointments()
    setSelectedSlot(null)
  }, [selectedDate, selectedStylist])

  const loadSettings = async () => {
    try { const r = await api.get('/api/settings'); setShopSettings(r.data) } catch {}
  }
  const loadStylists = async () => {
    const r = await api.get('/api/appointments/stylists'); setStylists(r.data)
  }
  const loadServices = async () => {
    const r = await api.get('/api/products')
    setServices(r.data.filter(p => p.is_service))
  }
  const loadAvailability = async () => {
    setLoading(true)
    try {
      const params = { date: selectedDate }
      if (selectedStylist) params.stylist_id = selectedStylist
      const r = await api.get('/api/appointments/availability', { params })
      setBusySlots(r.data.busy || {})
    } catch { setBusySlots({}) }
    finally { setLoading(false) }
  }
  const loadAppointments = async () => {
    const r = await api.get('/api/appointments', { params: { date_from: selectedDate, date_to: selectedDate } })
    setAppointments(r.data)
  }

  // Mở form đặt lịch từ timeline click
  const handleNewFromTimeline = (stylist, slot) => {
    setPreSelectedStylist(stylist)
    setSelectedSlot(slot)
    setSelectedStylist(stylist.id)
    setView('book')
    setTimeout(() => setConfirmModal(true), 100)
  }

  // Drag & drop: cập nhật lịch hẹn
  const handleMoveApt = async (aptId, newTime, stylistId, stylistName) => {
    try {
      await api.put(`/api/appointments/${aptId}`, {
        appointment_time: newTime,
        stylist_id: stylistId,
        stylist_name: stylistName,
      })
      message.success('✅ Đã cập nhật lịch hẹn')
      loadAppointments(); loadAvailability()
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi cập nhật lịch')
    }
  }

  const openConfirm = () => {
    if (!selectedSlot) return message.warning('Chọn khung giờ trước!')
    setConfirmModal(true)
  }

  const handleBook = async () => {
    if (!customerName.trim()) return message.warning('Nhập tên khách hàng!')
    setSubmitting(true)
    try {
      const stylist = stylists.find(s => s.id === selectedStylist)
      const svc = services.find(s => s.id === selectedService)
      const res = await api.post('/api/appointments', {
        customer_name: customerName,
        customer_phone: customerPhone || null,
        stylist_id: selectedStylist || null,
        stylist_name: stylist?.name || null,
        service_id: selectedService || null,
        service_name: svc?.name || null,
        appointment_time: `${selectedDate}T${selectedSlot}:00`,
        duration_minutes: shopSettings.slot_interval,
        note: note || null
      })
      message.success(`✅ Đặt lịch thành công! Thợ: ${res.data.stylist_name || 'Sẽ phân công sau'}`)
      setCustomerName(''); setCustomerPhone(''); setNote('')
      setSelectedSlot(null); setConfirmModal(false); setPreSelectedStylist(null)
      loadAvailability(); loadAppointments()
      setView('timeline')
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi đặt lịch')
    } finally { setSubmitting(false) }
  }

  const updateStatus = async (id, status) => {
    await api.put(`/api/appointments/${id}`, { status })
    message.success('Đã cập nhật!')
    loadAppointments(); loadAvailability()
    if (aptDetailModal?.id === id) setAptDetailModal(a => ({ ...a, status }))
  }
  const cancelApt = async (id) => {
    await api.delete(`/api/appointments/${id}`)
    message.success('Đã hủy lịch')
    loadAppointments(); loadAvailability()
    setAptDetailModal(null)
  }



  const VIEW_TABS = [
    { key: 'timeline', label: '📆 Timeline' },
    { key: 'book',     label: '📅 Đặt lịch' },
    { key: 'list',     label: `📋 Danh sách${appointments.length ? ` (${appointments.length})` : ''}` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f9fe' }}>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #eff0f6', flexShrink: 0 }}>
        {VIEW_TABS.map(t => (
          <button key={t.key} onClick={() => setView(t.key)} style={{
            flex: 1, padding: '12px 4px', border: 'none', cursor: 'pointer',
            background: 'none', fontSize: 12, fontWeight: view === t.key ? 700 : 400,
            color: view === t.key ? '#667eea' : '#9ca3af',
            borderBottom: `3px solid ${view === t.key ? '#667eea' : 'transparent'}`,
            transition: 'all 0.15s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Date selector (always visible) */}
      <div style={{ background: '#fff', padding: '10px 14px 8px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>
            📅 {dayjs(selectedDate).format('dddd, DD/MM/YYYY')}
          </span>
          <button onClick={() => { loadAppointments(); loadAvailability() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667eea', fontSize: 13, padding: '2px 8px' }}>
            <ReloadOutlined />
          </button>
        </div>
        <DateTabs selected={selectedDate} onChange={(d) => { setSelectedDate(d); setSelectedSlot(null) }} />
      </div>

      {/* ── TIMELINE VIEW ── */}
      {view === 'timeline' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Legend */}
          <div style={{ padding: '6px 14px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#888', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>💡 Kéo thả để đổi giờ/thợ</span>
              <span>🖱️ Bấm ô trống để đặt lịch</span>
              {Object.entries(STATUS_CFG).filter(([k]) => k !== 'cancelled').map(([k, v]) => (
                <span key={k}>{v.dot} {v.label}</span>
              ))}
            </div>
          </div>

          {stylists.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
                <div>Chưa có thợ. Thêm nhân viên trong mục Nhân viên.</div>
              </div>
            </div>
          ) : (
            <TimelineView
              appointments={appointments}
              stylists={stylists}
              selectedDate={selectedDate}
              shopSettings={shopSettings}
              onMoveApt={handleMoveApt}
              onClickApt={setAptDetailModal}
              onNewApt={handleNewFromTimeline}
            />
          )}
        </div>
      )}

      {/* ── BOOK VIEW ── */}
      {view === 'book' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 110px' }}>

            {/* STYLIST */}
            <section style={{ marginBottom: 20 }}>
              <SectionLabel>✂️ Chọn thợ <span style={{ fontWeight: 400, color: '#aaa', fontSize: 11, marginLeft: 6 }}>(để trống = tự động)</span></SectionLabel>
              <Select
                allowClear value={selectedStylist}
                onChange={v => { setSelectedStylist(v || null); setSelectedSlot(null) }}
                placeholder="Chọn thợ hoặc để trống tự động..."
                style={{ width: '100%' }} size="large"
                options={stylists.map(s => ({ value: s.id, label: `👤 ${s.name}` }))}
              />
            </section>

            {/* TIME SLOTS */}
            <section style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <SectionLabel style={{ marginBottom: 0 }}>⏰ Chọn khung giờ</SectionLabel>
                {loading && <span style={{ fontSize: 11, color: '#818cf8' }}>Đang tải...</span>}
              </div>
              <SlotGrid
                slots={allSlots} busy={busySlots}
                selected={selectedSlot}
                stylistId={selectedStylist}
                totalStylists={stylists.length}
                onSelect={setSelectedSlot}
                selectedDate={selectedDate}
              />
            </section>

            {/* SERVICE */}
            <section style={{ marginBottom: 16 }}>
              <SectionLabel>💇 Dịch vụ</SectionLabel>
              <Select
                allowClear value={selectedService}
                onChange={setSelectedService}
                placeholder="Chọn dịch vụ (không bắt buộc)..."
                style={{ width: '100%' }} size="large"
                options={services.map(s => ({ value: s.id, label: `${s.name} · ${Number(s.price).toLocaleString('vi-VN')}đ` }))}
              />
            </section>

            {/* NOTE */}
            <section>
              <SectionLabel>📝 Ghi chú</SectionLabel>
              <Input.TextArea
                placeholder="Yêu cầu kiểu tóc, màu nhuộm..."
                value={note} onChange={e => setNote(e.target.value)}
                rows={2} style={{ fontSize: 15, borderRadius: 12 }}
              />
            </section>
          </div>

          {/* Sticky CTA */}
          <div style={{ position: 'sticky', bottom: 0, padding: '10px 14px 14px', background: 'linear-gradient(to top, #f8f9fe 80%, transparent)', flexShrink: 0 }}>
            <button onClick={openConfirm} style={{
              width: '100%', height: 54, border: 'none', borderRadius: 16,
              fontSize: 16, fontWeight: 800, cursor: selectedSlot ? 'pointer' : 'not-allowed',
              background: selectedSlot ? 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' : '#e2e8f0',
              color: selectedSlot ? '#fff' : '#94a3b8',
              boxShadow: selectedSlot ? '0 6px 20px rgba(102,126,234,0.45)' : 'none',
              transition: 'all 0.2s',
            }}>
              {selectedSlot
                ? `📅 Đặt ${dayjs(selectedDate).format('DD/MM')} lúc ${selectedSlot}`
                : 'Chọn khung giờ để đặt lịch'}
            </button>
          </div>
        </>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 80px' }}>
          {/* Filter bar */}
          {stylists.length > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 10, paddingBottom: 2 }}>
              <button onClick={() => setSelectedStylist(null)} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: !selectedStylist ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f5f5f5',
                color: !selectedStylist ? '#fff' : '#666'
              }}>Tất cả</button>
              {stylists.map((s, i) => (
                <button key={s.id} onClick={() => setSelectedStylist(selectedStylist === s.id ? null : s.id)} style={{
                  flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  background: selectedStylist === s.id ? STYLIST_COLORS[i % STYLIST_COLORS.length].border : '#f5f5f5',
                  color: selectedStylist === s.id ? '#fff' : '#666'
                }}>✂️ {s.name}</button>
              ))}
            </div>
          )}
          {appointments
            .filter(apt => !selectedStylist || apt.stylist_id === selectedStylist)
            .length === 0
            ? <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div>Chưa có lịch hẹn ngày {dayjs(selectedDate).format('DD/MM')}</div>
              </div>
            : appointments
                .filter(apt => !selectedStylist || apt.stylist_id === selectedStylist)
                .map(apt => (
                  <AptCard key={apt.id} apt={apt}
                    onStatus={updateStatus} onCancel={cancelApt}
                    onEdit={setAptDetailModal}
                  />
                ))
          }
        </div>
      )}

      {/* ── CONFIRM MODAL (đặt lịch) ── */}
      <Modal
        title={<span style={{ fontSize: 16 }}>✏️ Thông tin khách hàng</span>}
        open={confirmModal}
        onCancel={() => { setConfirmModal(false); setPreSelectedStylist(null) }}
        onOk={handleBook}
        okText="✅ Xác nhận đặt lịch"
        cancelText="Hủy"
        confirmLoading={submitting}
        centered
        okButtonProps={{
          style: { background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none', height: 44, fontSize: 15, fontWeight: 700 },
          disabled: !customerName.trim()
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.08))',
          borderRadius: 12, padding: '12px 14px', marginBottom: 16,
          border: '1px solid rgba(102,126,234,0.2)'
        }}>
          <div style={{ fontWeight: 700, color: '#667eea', fontSize: 13, marginBottom: 6 }}>📅 Tóm tắt</div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
            🗓️ {dayjs(selectedDate).format('dddd, DD/MM/YYYY')} &nbsp;
            ⏰ <b>{selectedSlot}</b><br />
            {(preSelectedStylist || stylists.find(s => s.id === selectedStylist)) &&
              <>✂️ {preSelectedStylist?.name || stylists.find(s => s.id === selectedStylist)?.name}<br /></>}
            {selectedService && <>💇 {services.find(s => s.id === selectedService)?.name}</>}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tên khách *</div>
          <Input size="large" placeholder="Nguyễn Thị Hương"
            value={customerName} onChange={e => setCustomerName(e.target.value)}
            prefix={<UserOutlined style={{ color: '#ccc' }} />} style={{ fontSize: 16 }} autoFocus
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Số điện thoại</div>
          <Input size="large" placeholder="0912..." type="tel"
            value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
            style={{ fontSize: 16 }}
          />
        </div>
      </Modal>

      {/* ── APT DETAIL MODAL ── */}
      <Modal
        title={aptDetailModal ? `📋 ${aptDetailModal.customer_name}` : ''}
        open={!!aptDetailModal}
        onCancel={() => setAptDetailModal(null)}
        footer={null}
        centered
        width={380}
      >
        {aptDetailModal && (() => {
          const apt = aptDetailModal
          const cfg = STATUS_CFG[apt.status] || {}
          return (
            <div>
              {/* Status badge */}
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, background: cfg.color, color: '#fff' }}>
                  {cfg.dot} {cfg.label}
                </span>
              </div>

              {/* Info */}
              <div style={{ background: '#f8f9ff', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#888' }}>⏰ Giờ hẹn:</span>
                  <span style={{ fontWeight: 700 }}>{dayjs(apt.appointment_time).format('HH:mm DD/MM/YYYY')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#888' }}>⌛ Thời lượng:</span>
                  <span style={{ fontWeight: 700 }}>{apt.duration_minutes} phút</span>
                </div>
                {apt.stylist_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#888' }}>✂️ Thợ:</span>
                    <span style={{ fontWeight: 700 }}>{apt.stylist_name}</span>
                  </div>
                )}
                {apt.service_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#888' }}>💇 Dịch vụ:</span>
                    <span style={{ fontWeight: 700 }}>{apt.service_name}</span>
                  </div>
                )}
                {apt.customer_phone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#888' }}>📞 SĐT:</span>
                    <a href={`tel:${apt.customer_phone}`} style={{ fontWeight: 700, color: '#667eea' }}>{apt.customer_phone}</a>
                  </div>
                )}
                {apt.note && <div style={{ marginTop: 6, fontSize: 12, color: '#888', fontStyle: 'italic' }}>💬 {apt.note}</div>}
              </div>

              {/* Reminder status - chỉ hiển thị, không có nút gửi */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: apt.reminder_sent ? '#f6ffed' : '#fafafa',
                border: `1px solid ${apt.reminder_sent ? '#b7eb8f' : '#e8e8e8'}`,
                borderRadius: 10, marginBottom: 14
              }}>
                <span style={{ fontSize: 13, color: apt.reminder_sent ? '#52c41a' : '#888' }}>
                  {apt.reminder_sent ? '✅ Đã nhắc' : '🔔 Chưa nhắc'}
                </span>
              </div>

              {/* Actions */}
              {!['done', 'cancelled'].includes(apt.status) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {apt.status === 'pending' && <Btn color="#4f46e5" onClick={() => updateStatus(apt.id, 'confirmed')}>✓ Xác nhận</Btn>}
                  {apt.status === 'confirmed' && <Btn color="#7c3aed" onClick={() => updateStatus(apt.id, 'in_progress')}>▶ Bắt đầu</Btn>}
                  {apt.status === 'in_progress' && <Btn color="#15803d" onClick={() => updateStatus(apt.id, 'done')}>✓ Hoàn thành</Btn>}
                  <button onClick={() => cancelApt(apt.id)} style={{
                    padding: '8px 14px', borderRadius: 10, border: '1.5px solid #fca5a5',
                    background: '#fff', color: '#ef4444', fontSize: 13, cursor: 'pointer', fontWeight: 600
                  }}>Hủy lịch</button>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10, ...style }}>
      {children}
    </div>
  )
}
