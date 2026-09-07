import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Skeleton, Tag, Empty, Button } from 'antd'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  ReloadOutlined, RiseOutlined, TeamOutlined,
  CalendarOutlined, WarningOutlined, DollarOutlined
} from '@ant-design/icons'
import api from '../api'
import useStore from '../store'
import dayjs from 'dayjs'

const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const fmtK = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}tr` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n || 0)
const fmtDate = (s) => dayjs(s).format('DD/MM')

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>📅 {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{fmtMoney(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useStore()
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [chartDays, setChartDays] = useState(7)

  useEffect(() => { load() }, [])
  useEffect(() => { load() }, [chartDays])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/dashboard/summary', { params: { days: chartDays } })
      setData(res.data)
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const chartData = (data?.chart_7days || []).map(r => ({
    ...r,
    ngay: fmtDate(r.ngay)
  }))

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div className="page-title" style={{ marginBottom: 2 }}>
            📊 Dashboard
          </div>
          <div style={{ fontSize: 12, color: '#aaa' }}>
            {lastUpdated ? `Cập nhật: ${dayjs(lastUpdated).format('HH:mm')}` : ''}
          </div>
        </div>
        <button onClick={load} style={{
          background: '#f5f5f5', border: '1px solid #e8e8e8',
          borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
          fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <ReloadOutlined spin={loading} /> Làm mới
        </button>
      </div>

      {/* Chào mừng */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: 16, padding: '18px 20px', marginBottom: 14, color: '#fff'
      }}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
          {dayjs().format('dddd, DD/MM/YYYY')}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>
          Chào {user?.name}! 👋
        </div>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Dưới đây là tổng quan tiệm hôm nay
        </div>
      </div>

      {/* KPI hôm nay */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>
        ⚡ Hôm nay
      </div>
      {loading && !data ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Doanh thu', value: fmtMoney(data?.today?.revenue), icon: '💰', color: '#667eea' },
            { label: 'Đã thu', value: fmtMoney(data?.today?.paid), icon: '✅', color: '#52c41a' },
            { label: 'Hóa đơn', value: data?.today?.orders || 0, icon: '🧾', color: '#1677ff' },
            { label: 'Lịch hẹn', value: data?.today?.appointments || 0, icon: '📅', color: '#fa8c16' },
            { label: 'Khách mới', value: data?.today?.new_customers || 0, icon: '👤', color: '#13c2c2' },
            { label: 'Công nợ', value: fmtMoney(data?.today?.debt), icon: '📋', color: '#ff4d4f' },
          ].map(kpi => (
            <div key={kpi.label} className="stat-card" style={{ borderLeftColor: kpi.color }}>
              <div className="stat-label">{kpi.icon} {kpi.label}</div>
              <div className="stat-value" style={{ color: kpi.color, fontSize: 16 }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Cảnh báo */}
      {(data?.alerts?.low_stock > 0 || data?.alerts?.debt_customers > 0) && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>⚠️ Cảnh báo</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data?.alerts?.low_stock > 0 && (
              <div style={{
                background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 10,
                padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: 1
              }}>
                <WarningOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fa8c16' }}>Hàng sắp hết</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{data.alerts.low_stock} sản phẩm</div>
                </div>
              </div>
            )}
            {data?.alerts?.debt_customers > 0 && (
              <div style={{
                background: '#fff2f0', border: '1px solid #ffa39e', borderRadius: 10,
                padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: 1
              }}>
                <DollarOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ff4d4f' }}>Khách đang nợ</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{data.alerts.debt_customers} khách</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thao tác nhanh */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>⚡ Thao tác nhanh</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          <Link to={`/${slug}/staff`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 10,
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
              color: '#389e0d', fontWeight: 600
            }}>
              <TeamOutlined style={{ fontSize: 20 }} />
              <div>
                <div style={{ fontSize: 14 }}>Thêm & Quản lý nhân viên</div>
                <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Tạo tài khoản, phân quyền, xem hoa hồng</div>
              </div>
            </div>
          </Link>
        </div>
      </div>


      {/* Biểu đồ chart */}
      <div className="m-card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>📈 Doanh thu</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setChartDays(d)} style={{
                padding: '3px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: chartDays === d ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f5f5f5',
                color: chartDays === d ? '#fff' : '#888'
              }}>{d} ngày</button>
            ))}
          </div>
        </div>
        {loading && !data ? <Skeleton active paragraph={{ rows: 4 }} /> :
          chartData.length === 0 ? <Empty description="Chưa có dữ liệu" style={{ padding: '20px 0' }} /> : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="ngay" tick={{ fontSize: 10 }} interval={chartDays === 30 ? 4 : chartDays === 14 ? 1 : 0} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10 }} width={38} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="doanh_thu" name="Doanh thu" stroke="#667eea" fill="url(#dashGrad1)" strokeWidth={2} />
                <Area type="monotone" dataKey="da_thu" name="Đã thu" stroke="#52c41a" fill="url(#dashGrad2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Tháng này */}
      <div className="m-card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#555' }}>
          📆 Tháng {dayjs().format('M')} tổng kết
        </div>
        {loading && !data ? <Skeleton active paragraph={{ rows: 3 }} /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Tổng doanh thu', value: fmtMoney(data?.month?.revenue), color: '#667eea' },
              { label: 'Đã thu về', value: fmtMoney(data?.month?.paid), color: '#52c41a' },
              { label: 'Tổng chi phí', value: fmtMoney(data?.month?.expenses), color: '#ff4d4f' },
              { label: 'Lợi nhuận ước tính', value: fmtMoney(data?.month?.profit_est), color: data?.month?.profit_est >= 0 ? '#52c41a' : '#ff4d4f', bold: true },
              { label: 'Hoa hồng nhân viên', value: fmtMoney(data?.month?.total_commission), color: '#fa8c16' },
              { label: 'Số hóa đơn', value: `${data?.month?.orders || 0} đơn`, color: '#1677ff' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#666' }}>{row.label}</span>
                <span style={{ fontWeight: row.bold ? 800 : 700, color: row.color, fontSize: row.bold ? 15 : 13 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top dịch vụ tháng này */}
      {data?.top_services?.length > 0 && (
        <div className="m-card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#555' }}>
            🔥 Top dịch vụ tháng này
          </div>
          {data.top_services.map((s, i) => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0', borderBottom: i < data.top_services.length - 1 ? '1px solid #f5f5f5' : 'none'
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, background: i === 0 ? '#fff7e6' : '#f5f5f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 12, color: i === 0 ? '#fa8c16' : '#999'
              }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13 }}>{s.name}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#667eea' }}>{fmtMoney(s.tong)}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>×{Number(s.qty).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top nhân viên */}
      {data?.staff?.filter(s => s.tong_doanh_thu > 0).length > 0 && (
        <div className="m-card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#555' }}>
            👥 Nhân viên tháng này
          </div>
          {data.staff.filter(s => s.tong_doanh_thu > 0).map((s, i) => (
            <div key={s.name} style={{
              padding: '8px 0',
              borderBottom: i < data.staff.length - 1 ? '1px solid #f5f5f5' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {s.name}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#667eea' }}>{fmtMoney(s.tong_doanh_thu)}</div>
                  {s.hoa_hong > 0 && (
                    <div style={{ fontSize: 11, color: '#fa8c16' }}>HH: {fmtMoney(s.hoa_hong)}</div>
                  )}
                </div>
              </div>
              {data.staff[0]?.tong_doanh_thu > 0 && (
                <div style={{ marginTop: 6, background: '#f5f5f5', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    width: `${(s.tong_doanh_thu / data.staff[0].tong_doanh_thu) * 100}%`,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
