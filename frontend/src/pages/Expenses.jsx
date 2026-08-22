import React, { useState, useEffect, useRef } from 'react'
import {
  Modal, Form, Input, InputNumber, Select, DatePicker,
  Popconfirm, message, Empty, Skeleton, Tag
} from 'antd'
import { PlusOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons'
import api from '../api'
import dayjs from 'dayjs'

const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'

const CATEGORIES = [
  { value: 'rent',      label: '💼 Mặt bằng',  color: '#722ed1' },
  { value: 'electric',  label: '⚡ Điện',        color: '#faad14' },
  { value: 'water',     label: '💧 Nước',         color: '#1677ff' },
  { value: 'salary',    label: '👥 Lương',        color: '#52c41a' },
  { value: 'supplies',  label: '🧴 Vật tư',      color: '#13c2c2' },
  { value: 'equipment', label: '🔧 Thiết bị',   color: '#fa8c16' },
  { value: 'marketing', label: '📢 Marketing',  color: '#eb2f96' },
  { value: 'other',     label: '📌 Khác',        color: '#8c8c8c' },
]
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()])
  const [catFilter, setCatFilter] = useState(null)
  const [form] = Form.useForm()
  // Ca lam viec
  const [currentSession, setCurrentSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [openCaModal, setOpenCaModal] = useState(false)
  const [closeCaModal, setCloseCaModal] = useState(false)
  const [openingCash, setOpeningCash] = useState(0)
  const [closingCash, setClosingCash] = useState(0)
  const [closeResult, setCloseResult] = useState(null)
  const [caNote, setCaNote] = useState('')

  useEffect(() => {
    load()
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const r = await api.get('/api/cash-session/current')
      setCurrentSession(r.data)
    } catch {}
  }

  const handleOpenCa = async () => {
    setSessionLoading(true)
    try {
      await api.post('/api/cash-session/open', { opening_cash: openingCash })
      message.success('Da mo ca!')
      setOpenCaModal(false)
      setOpeningCash(0)
      loadSession()
    } catch (e) {
      message.error(e.response?.data?.error || 'Loi mo ca')
    } finally { setSessionLoading(false) }
  }

  const handleCloseCa = async () => {
    if (!currentSession) return
    setSessionLoading(true)
    try {
      const r = await api.post(`/api/cash-session/${currentSession.id}/close`, {
        closing_cash_actual: closingCash, note: caNote,
      })
      setCloseResult(r.data)
      setCloseCaModal(false)
      setCurrentSession(null)
      message.success(r.data.message)
    } catch (e) {
      message.error(e.response?.data?.error || 'Loi chot ca')
    } finally { setSessionLoading(false) }
  }

  const load = async (range = dateRange) => {
    setLoading(true)
    try {
      const params = {
        date_from: range[0].format('YYYY-MM-DD'),
        date_to: range[1].format('YYYY-MM-DD'),
      }
      if (catFilter) params.category = catFilter
      const [expRes, sumRes] = await Promise.all([
        api.get('/api/expenses', { params }),
        api.get('/api/expenses/summary', { params }),
      ])
      setExpenses(expRes.data)
      setSummary(sumRes.data)
    } finally {
      setLoading(false)
    }
  }

  const save = async (vals) => {
    setSaving(true)
    try {
      await api.post('/api/expenses', {
        ...vals,
        expense_date: vals.expense_date.format('YYYY-MM-DD'),
      })
      message.success('Đã ghi nhận chi phí!')
      form.resetFields()
      setModal(false)
      load()
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi lưu chi phí')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/api/expenses/${id}`)
      message.success('Đã xóa')
      load()
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi xóa')
    }
  }

  const totalExpenses = summary?.total || 0

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>💸 Chi phí</div>
        <button
          onClick={() => {
            form.resetFields()
            form.setFieldsValue({ expense_date: dayjs(), category: 'other' })
            setModal(true)
          }}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none', borderRadius: 10, color: '#fff',
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <PlusOutlined /> Thêm
        </button>
      </div>

      {/* Banner Ca Làm Việc */}
      {currentSession ? (
        <div style={{
          background: 'linear-gradient(135deg, #f6ffed, #d9f7be)',
          border: '1px solid #b7eb8f', borderRadius: 12,
          padding: '12px 16px', marginBottom: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#389e0d' }}>✅ Ca đang mở</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              Mở lúc: {dayjs(currentSession.opened_at).format('HH:mm DD/MM')}
              {currentSession.opened_by_name && ` · ${currentSession.opened_by_name}`}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Tiền đầu ca: <b>{Number(currentSession.opening_cash || 0).toLocaleString('vi-VN')}đ</b>
            </div>
          </div>
          <button onClick={() => { setClosingCash(0); setCaNote(''); setCloseCaModal(true) }} style={{
            background: 'linear-gradient(135deg, #ff7875, #ff4d4f)',
            border: 'none', borderRadius: 10, padding: '8px 14px',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}>⏹ Chốt ca</button>
        </div>
      ) : (
        <div style={{
          background: '#fff8e1', border: '1px solid #ffe082',
          borderRadius: 12, padding: '12px 16px', marginBottom: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontSize: 13, color: '#856404' }}>⚠️ Chưa có ca nào đang mở</div>
          <button onClick={() => { setOpeningCash(0); setOpenCaModal(true) }} style={{
            background: 'linear-gradient(135deg, #52c41a, #389e0d)',
            border: 'none', borderRadius: 10, padding: '7px 14px',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>▶ Mở ca</button>
        </div>
      )}

      {/* Kết quả Chốt Ca */}
      {closeResult && (
        <div style={{
          background: '#fff', border: `2px solid ${closeResult.difference === 0 ? '#52c41a' : closeResult.difference > 0 ? '#1677ff' : '#ff4d4f'}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 12,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            {closeResult.difference === 0 ? '✅ Ca khớp tiền!' : closeResult.difference > 0 ? '📈 Ca dư tiền' : '📉 Ca thiếu tiền'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            <div>Tiền đầu ca: <b>{Number(closeResult.opening_cash).toLocaleString('vi-VN')}đ</b></div>
            <div>Thu TM: <b style={{ color: '#52c41a' }}>{Number(closeResult.revenue_cash).toLocaleString('vi-VN')}đ</b></div>
            <div>Thu CK: <b style={{ color: '#1677ff' }}>{Number(closeResult.revenue_transfer).toLocaleString('vi-VN')}đ</b></div>
            <div>Chi: <b style={{ color: '#ff4d4f' }}>{Number(closeResult.total_expense).toLocaleString('vi-VN')}đ</b></div>
            <div>Phải có: <b>{Number(closeResult.expected).toLocaleString('vi-VN')}đ</b></div>
            <div>Thực đếm: <b>{Number(closeResult.actual).toLocaleString('vi-VN')}đ</b></div>
            <div style={{ gridColumn: 'span 2', fontWeight: 700, fontSize: 15, marginTop: 6,
              color: closeResult.difference === 0 ? '#52c41a' : closeResult.difference > 0 ? '#1677ff' : '#ff4d4f' }}>
              Lệch: {closeResult.difference > 0 ? '+' : ''}{Number(closeResult.difference).toLocaleString('vi-VN')}đ
            </div>
          </div>
          <button onClick={() => setCloseResult(null)} style={{
            marginTop: 10, background: '#f5f5f5', border: 'none',
            borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#888'
          }}>Đóng</button>
        </div>
      )}

      {/* Bộ lọc ngày */}
      <div className="m-card" style={{ marginBottom: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>🗓️ Khoảng thời gian</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Tháng này', range: [dayjs().startOf('month'), dayjs()] },
            { label: 'Tháng trước', range: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
            { label: '3 tháng', range: [dayjs().subtract(2, 'month').startOf('month'), dayjs()] },
          ].map(p => (
            <button key={p.label}
              onClick={() => { setDateRange(p.range); load(p.range) }}
              style={{
                border: '1px solid #e8e8e8', borderRadius: 8, padding: '5px 12px',
                fontSize: 12, cursor: 'pointer', background: '#fff', color: '#555'
              }}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* Tổng & phân tích */}
      {loading ? <Skeleton active paragraph={{ rows: 2 }} /> : (
        <>
          {/* Tổng chi phí */}
          <div style={{
            background: 'linear-gradient(135deg, #ff7875, #ff4d4f)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 12, color: '#fff', textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Tổng chi phí kỳ này</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>{fmtMoney(totalExpenses)}</div>
          </div>

          {/* Phân tích theo danh mục */}
          {summary?.by_category?.length > 0 && (
            <div className="m-card" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#555' }}>
                📊 Theo danh mục
              </div>
              {summary.by_category
                .sort((a, b) => b.amount - a.amount)
                .map(cat => {
                  const info = CAT_MAP[cat.category] || { label: cat.category, color: '#8c8c8c' }
                  const pct = totalExpenses > 0 ? (cat.amount / totalExpenses * 100) : 0
                  return (
                    <div key={cat.category} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: '#555' }}>{info.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{fmtMoney(cat.amount)}</span>
                      </div>
                      <div style={{ background: '#f5f5f5', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          background: info.color,
                          width: `${pct}%`,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  )
                })
              }
            </div>
          )}
        </>
      )}

      {/* Lọc theo danh mục */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 10, scrollbarWidth: 'none' }}>
        <button onClick={() => { setCatFilter(null); load() }}
          style={{
            flexShrink: 0, border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 12,
            cursor: 'pointer', fontWeight: 600,
            background: !catFilter ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f5f5f5',
            color: !catFilter ? '#fff' : '#555'
          }}>Tất cả</button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => { setCatFilter(c.value); load() }}
            style={{
              flexShrink: 0, border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 12,
              cursor: 'pointer', fontWeight: 600,
              background: catFilter === c.value ? c.color : '#f5f5f5',
              color: catFilter === c.value ? '#fff' : '#555'
            }}>{c.label}</button>
        ))}
      </div>

      {/* Danh sách chi phí */}
      {loading ? <Skeleton active paragraph={{ rows: 5 }} /> :
        expenses.length === 0 ? (
          <div className="m-card"><Empty description="Chưa có chi phí nào" style={{ padding: '20px 0' }} /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {expenses.map(e => {
              const info = CAT_MAP[e.category] || { label: e.category_label, color: '#8c8c8c' }
              return (
                <div key={e.id} className="m-card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Tag style={{
                          background: info.color + '20', color: info.color,
                          border: `1px solid ${info.color}40`, fontSize: 11, borderRadius: 6
                        }}>
                          {info.label}
                        </Tag>
                        <span style={{ fontSize: 11, color: '#aaa' }}>
                          {dayjs(e.expense_date).format('DD/MM/YYYY')}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                        {e.description || '(Không có mô tả)'}
                      </div>
                      {e.created_by_name && (
                        <div style={{ fontSize: 11, color: '#bbb' }}>Bởi: {e.created_by_name}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 10 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#ff4d4f' }}>
                        -{fmtMoney(e.amount)}
                      </div>
                      <Popconfirm
                        title="Xóa chi phí này?"
                        onConfirm={() => remove(e.id)}
                        okText="Xóa" cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <button style={{
                          background: '#fff2f0', border: '1px solid #ffccc7',
                          borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
                          color: '#ff4d4f', fontSize: 14, display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}>
                          <DeleteOutlined />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      {/* Modal thêm chi phí */}
      <Modal
        title="➕ Thêm chi phí"
        open={modal}
        onCancel={() => setModal(false)}
        onOk={() => form.submit()}
        okText="Lưu" cancelText="Hủy"
        confirmLoading={saving}
        centered
      >
        <Form form={form} layout="vertical" onFinish={save} style={{ marginTop: 8 }}>
          <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
            <Select placeholder="Chọn danh mục">
              {CATEGORIES.map(c => (
                <Select.Option key={c.value} value={c.value}>{c.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi phí">
            <Input placeholder="Ví dụ: Hóa đơn điện tháng 8" />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền (đ)" rules={[{ required: true, message: 'Nhập số tiền' }]}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="500000"
              min={0} step={10000}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => v.replace(/,/g, '')}
            />
          </Form.Item>
          <Form.Item name="expense_date" label="Ngày" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Mở Ca */}
      <Modal
        title="▶ Mở ca làm việc"
        open={openCaModal}
        onCancel={() => setOpenCaModal(false)}
        onOk={handleOpenCa}
        okText="Mở ca"
        cancelText="Hủy"
        confirmLoading={sessionLoading}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 14, color: '#555', marginBottom: 16 }}>
            Nhập số tiền mặt đang có trong két khi bắt đầu ca:
          </div>
          <InputNumber
            value={openingCash}
            onChange={v => setOpeningCash(v || 0)}
            style={{ width: '100%' }}
            size="large"
            min={0}
            step={100000}
            placeholder="Tiền đầu ca (VD: 1000000)"
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => v?.replace(/,/g, '')}
            prefix="₫"
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[0, 500000, 1000000, 2000000].map(v => (
              <button key={v} onClick={() => setOpeningCash(v)} style={{
                background: openingCash === v ? '#667eea' : '#f5f5f5',
                color: openingCash === v ? '#fff' : '#333',
                border: 'none', borderRadius: 8, padding: '5px 12px',
                cursor: 'pointer', fontSize: 13
              }}>{v === 0 ? 'Không có' : `${(v/1000)}k`}</button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal Chốt Ca */}
      <Modal
        title="⏹ Chốt ca làm việc"
        open={closeCaModal}
        onCancel={() => setCloseCaModal(false)}
        onOk={handleCloseCa}
        okText="Chốt ca"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        confirmLoading={sessionLoading}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ background: '#f8f9ff', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            <div>Ca mở lúc: <b>{currentSession ? dayjs(currentSession.opened_at).format('HH:mm DD/MM/YYYY') : '-'}</b></div>
            <div>Tiền đầu ca: <b>{Number(currentSession?.opening_cash || 0).toLocaleString('vi-VN')}đ</b></div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 8 }}>
            Đếm tiền trong két thực tế:
          </div>
          <InputNumber
            value={closingCash}
            onChange={v => setClosingCash(v || 0)}
            style={{ width: '100%' }}
            size="large"
            min={0}
            step={100000}
            placeholder="Số tiền đếm được trong két"
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => v?.replace(/,/g, '')}
            prefix="₫"
          />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Ghi chú (tuỳ chọn)</div>
            <Input
              value={caNote}
              onChange={e => setCaNote(e.target.value)}
              placeholder="Ghi chú về ca này..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
