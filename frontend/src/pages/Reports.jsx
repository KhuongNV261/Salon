import React, { useState, useEffect } from 'react'
import { DatePicker, Tag, Empty, Skeleton, Tabs } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import api from '../api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const fmtK     = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}tr` : n >= 1000 ? `${(n/1000).toFixed(0)}k` : String(n)
const fmtDate  = (s) => dayjs(s).format('DD/MM')

const STAT_CONFIGS = [
  { key: 'total_revenue',   label: 'Doanh thu',      icon: '💰', color: '#667eea', money: true },
  { key: 'total_orders',    label: 'Hóa đơn',        icon: '🧾', color: '#1677ff', money: false },
  { key: 'total_paid',      label: 'Đã thu',         icon: '✅', color: '#52c41a', money: true },
  { key: 'total_debt',      label: 'Công nợ',        icon: '📋', color: '#fa8c16', money: true },
  { key: 'new_customers',   label: 'Khách mới',      icon: '👤', color: '#13c2c2', money: false },
  { key: 'low_stock_count', label: 'Hàng sắp hết',  icon: '⚠️', color: '#ff4d4f', money: false },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#333' }}>📅 {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{fmtMoney(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Reports() {
  const [today, setToday] = useState({})
  const [chartData, setChartData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [debtList, setDebtList] = useState([])
  const [staffData, setStaffData] = useState([])
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()])
  const [loading, setLoading] = useState(false)
  const [todayLoading, setTodayLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadToday()
    loadRangeData(dateRange)
  }, [])

  const loadToday = async () => {
    setTodayLoading(true)
    try { const t = await api.get('/api/reports/today'); setToday(t.data) }
    finally { setTodayLoading(false) }
  }

  const loadRangeData = async (range) => {
    if (!range?.[0] || !range?.[1]) return
    setLoading(true)
    const params = { date_from: range[0].format('YYYY-MM-DD'), date_to: range[1].format('YYYY-MM-DD') }
    try {
      const [chart, tp, debt, staff] = await Promise.all([
        api.get('/api/reports/chart', { params }),
        api.get('/api/reports/top-products', { params }),
        api.get('/api/reports/debt'),
        api.get('/api/reports/staff-summary', { params }),
      ])
      setChartData(chart.data.map(r => ({ ...r, ngay: fmtDate(r.ngay) })))
      setTopProducts(tp.data)
      setDebtList(debt.data)
      setStaffData(staff.data)
    } finally { setLoading(false) }
  }

  const filterPanel = (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#555' }}>🗓️ Khoảng thời gian:</div>
      <RangePicker
        value={dateRange}
        onChange={r => setDateRange(r)}
        format="DD/MM/YYYY"
        style={{ width: '100%', marginBottom: 10 }}
        presets={[
          { label: 'Hôm nay', value: [dayjs(), dayjs()] },
          { label: '7 ngày', value: [dayjs().subtract(6, 'day'), dayjs()] },
          { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs()] },
          { label: 'Tháng trước', value: [dayjs().subtract(1,'month').startOf('month'), dayjs().subtract(1,'month').endOf('month')] },
        ]}
        allowClear={false}
      />
      <button onClick={() => loadRangeData(dateRange)} style={{
        width: '100%', height: 44, background: 'linear-gradient(135deg, #667eea, #764ba2)',
        border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer'
      }}>
        🔍 Xem báo cáo
      </button>
    </div>
  )

  return (
    <div className="page">
      {/* Hôm nay */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>📊 Hôm nay</div>
        <button onClick={loadToday} style={{
          background: 'none', border: '1px solid #e8e8e8', borderRadius: 8,
          padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#666'
        }}>🔄 Làm mới</button>
      </div>
      <div className="stat-grid">
        {STAT_CONFIGS.map(s => (
          <div key={s.key} className="stat-card" style={{ borderLeftColor: s.color }}>
            <div className="stat-label">{s.icon} {s.label}</div>
            {todayLoading
              ? <Skeleton.Input active size="small" style={{ width: 80 }} />
              : <div className="stat-value" style={{ color: s.color }}>
                  {s.money ? fmtMoney(today[s.key] || 0) : (today[s.key] || 0)}
                </div>
            }
          </div>
        ))}
      </div>

      {/* Bộ lọc */}
      {filterPanel}

      {/* Tabs báo cáo */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: '📈 Doanh thu',
            children: (
              <>
                {/* Biểu đồ */}
                {loading ? (
                  <div className="m-card"><Skeleton active paragraph={{ rows: 6 }} /></div>
                ) : chartData.length === 0 ? (
                  <div className="m-card"><Empty description="Chưa có dữ liệu" /></div>
                ) : (
                  <div className="m-card" style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#555' }}>📈 Biểu đồ doanh thu</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDT" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorThu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                        <XAxis dataKey="ngay" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={45} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="doanh_thu" name="Doanh thu" stroke="#667eea" fill="url(#colorDT)" strokeWidth={2} />
                        <Area type="monotone" dataKey="da_thu" name="Đã thu" stroke="#52c41a" fill="url(#colorThu)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>

                    {/* Summary table */}
                    <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span>💰 Tổng doanh thu:</span>
                        <strong style={{ color: '#667eea' }}>{fmtMoney(chartData.reduce((s, r) => s + r.doanh_thu, 0))}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span>✅ Tổng đã thu:</span>
                        <strong style={{ color: '#52c41a' }}>{fmtMoney(chartData.reduce((s, r) => s + r.da_thu, 0))}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span>🧾 Số hóa đơn:</span>
                        <strong style={{ color: '#1677ff' }}>{chartData.reduce((s, r) => s + r.so_hd, 0)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top sản phẩm */}
                <div className="m-card" style={{ marginBottom: 12 }}>
                  <div className="page-title" style={{ fontSize: 14 }}>🔥 Top dịch vụ bán chạy</div>
                  {loading ? <Skeleton active paragraph={{ rows: 4 }} /> :
                    topProducts.length === 0
                    ? <Empty description="Chưa có dữ liệu" style={{ padding: '20px 0' }} />
                    : topProducts.map((p, i) => (
                        <div key={p.product_name} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 0', borderBottom: i < topProducts.length - 1 ? '1px solid #f5f5f5' : 'none'
                        }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 800, fontSize: 13,
                            background: i === 0 ? '#fff7e6' : i === 1 ? '#f5f5f5' : '#f9f9f9',
                            color: i === 0 ? '#fa8c16' : '#999'
                          }}>{i + 1}</div>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{p.product_name}</div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#667eea' }}>{fmtMoney(p.tong_tien)}</div>
                            <div style={{ fontSize: 11, color: '#999' }}>×{Number(p.tong_so_luong).toLocaleString()}</div>
                          </div>
                        </div>
                      ))
                  }
                </div>
              </>
            )
          },
          {
            key: 'staff',
            label: '👥 Nhân viên',
            children: (
              <div className="m-card">
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#555' }}>
                  👥 Thống kê nhân viên
                </div>
                {loading ? <Skeleton active paragraph={{ rows: 5 }} /> :
                  staffData.length === 0 ? <Empty description="Chưa có dữ liệu" /> :
                  staffData.map((s, i) => (
                    <div key={s.id} style={{
                      padding: '12px 0',
                      borderBottom: i < staffData.length - 1 ? '1px solid #f5f5f5' : 'none'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`} {s.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                            <Tag style={{ fontSize: 11 }}>{s.role}</Tag>
                            {s.commission_rate > 0 && <Tag color="orange" style={{ fontSize: 11 }}>HH: {s.commission_rate}%</Tag>}
                            <span>{s.so_don} đơn</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#667eea' }}>{fmtMoney(s.tong_doanh_thu)}</div>
                          {s.hoa_hong > 0 && (
                            <div style={{ fontSize: 12, color: '#fa8c16', fontWeight: 600 }}>
                              Hoa hồng: {fmtMoney(s.hoa_hong)}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Progress bar */}
                      {staffData[0]?.tong_doanh_thu > 0 && (
                        <div style={{ marginTop: 8, background: '#f5f5f5', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 4,
                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                            width: `${(s.tong_doanh_thu / staffData[0].tong_doanh_thu) * 100}%`,
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      )}
                    </div>
                  ))
                }
                {staffData.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '2px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>Tổng hoa hồng phải trả:</span>
                      <span style={{ fontWeight: 800, color: '#fa8c16' }}>
                        {fmtMoney(staffData.reduce((s, r) => s + r.hoa_hong, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'debt',
            label: `📋 Nợ (${debtList.length})`,
            children: (
              <div className="m-card">
                <div className="page-title" style={{ fontSize: 14 }}>📋 Danh sách công nợ</div>
                {debtList.length === 0
                  ? <div style={{ textAlign: 'center', padding: '20px 0', color: '#52c41a', fontWeight: 600 }}>✅ Không có ai nợ!</div>
                  : <>
                      {debtList.map((c, i) => (
                        <div key={c.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 0', borderBottom: i < debtList.length - 1 ? '1px solid #f5f5f5' : 'none'
                        }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: '#999' }}>{c.phone}</div>
                          </div>
                          <Tag color="red" style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px' }}>{fmtMoney(c.debt)}</Tag>
                        </div>
                      ))}
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Tổng nợ:</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#ff4d4f' }}>
                          {fmtMoney(debtList.reduce((s, r) => s + r.debt, 0))}
                        </span>
                      </div>
                    </>
                }
              </div>
            )
          }
        ]}
      />
    </div>
  )
}
