import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Skeleton, Tag, message } from 'antd'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  ReloadOutlined, RiseOutlined, CalendarOutlined,
  CopyOutlined, PhoneOutlined
} from '@ant-design/icons'
import api from '../api'
import useStore from '../store'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
dayjs.locale('vi')

const fmtMoney = (n) => {
  const v = Number(n || 0)
  if (v >= 1000000) return `${(v/1000000).toFixed(1)}tr`
  if (v >= 1000) return `${(v/1000).toFixed(0)}k`
  return String(v)
}
const fmtMoneyFull = (n) => Number(n||0).toLocaleString('vi-VN') + 'Ä‘'
const fmtDate = (s) => dayjs(s).format('DD/MM')

const STATUS_LABEL = {
  pending:     { label: 'Chá» xÃ¡c nháº­n', color: '#d48806' },
  confirmed:   { label: 'ÄÃ£ xÃ¡c nháº­n',  color: '#0958d9' },
  in_progress: { label: 'Äang lÃ m',       color: '#531dab' },
}

const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'Ä‘'
const fmtK = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}tr` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n || 0)
const fmtDate = (s) => dayjs(s).format('DD/MM')

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>ðŸ“… {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{fmtMoneyFull(p.value)}</strong>
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
  // Auto-refresh má»—i 60 giÃ¢y
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t) }, [chartDays])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/dashboard/summary', { params: { days: chartDays } })
      setData(res.data)
      setLastUpdated(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Copy tin nháº¯n nháº¯c lá»‹ch â€” paste vÃ o Zalo
  const copyZalo = (appt) => {
    const shop = user?.shop_name || 'Tiá»‡m'
    const txt = `Xin chÃ o ${appt.customer_name}! ðŸ‘‹\n` +
      `${shop} xin nháº¯c báº¡n cÃ³ lá»‹ch háº¹n lÃºc *${appt.time}* ngÃ y *${appt.date}*` +
      (appt.service_name ? ` â€” dá»‹ch vá»¥: *${appt.service_name}*` : '') +
      (appt.stylist_name ? ` vá»›i thá»£ *${appt.stylist_name}*` : '') +
      `.\n\nVui lÃ²ng cÃ³ máº·t Ä‘Ãºng giá» nhÃ©. Cáº£m Æ¡n! ðŸ™`
    navigator.clipboard.writeText(txt)
      .then(() => message.success('âœ… ÄÃ£ copy! Má»Ÿ Zalo vÃ  paste gá»­i khÃ¡ch.', 4))
      .catch(() => message.info('KhÃ´ng tá»± copy Ä‘Æ°á»£c, vui lÃ²ng copy thá»§ cÃ´ng.'))
  }

  const chartData = (data?.chart_7days || []).map(r => ({ ...r, ngay: fmtDate(r.ngay) }))
  const na = data?.next_appointment

  return (
    <div className="page" style={{ paddingBottom: 80 }}>

      {/* â”€â”€ HERO HEADER â”€â”€ */}
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
        borderRadius: 18, padding: '18px 20px', marginBottom: 14, color: '#fff', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:12, opacity:0.6, marginBottom:2 }}>{dayjs().format('dddd, DD/MM/YYYY')}</div>
            <div style={{ fontSize:20, fontWeight:800, marginBottom:2 }}>ChÃ o {user?.name?.split(' ').pop()}! ðŸ‘‹</div>
            <div style={{ fontSize:11, opacity:0.5 }}>{lastUpdated ? `Cáº­p nháº­t ${dayjs(lastUpdated).format('HH:mm')}` : ''}</div>
          </div>
          <button onClick={load} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:13, color:'#fff', display:'flex', alignItems:'center', gap:5 }}>
            <ReloadOutlined spin={loading} /> LÃ m má»›i
          </button>
        </div>
      </div>

      {loading && !data ? <Skeleton active paragraph={{ rows: 6 }} /> : (<>

        {/* â”€â”€ DOANH THU â€” sá»‘ to nháº¥t â”€â”€ */}
        <div style={{
          background:'linear-gradient(135deg,#667eea,#764ba2)', borderRadius:18,
          padding:'20px 22px', marginBottom:10, color:'#fff',
          boxShadow:'0 8px 24px rgba(102,126,234,0.4)'
        }}>
          <div style={{ fontSize:12, opacity:0.8, marginBottom:4 }}>ðŸ’° Doanh thu hÃ´m nay</div>
          <div style={{ fontSize:38, fontWeight:900, lineHeight:1, marginBottom:6 }}>
            {fmtMoney(data?.today?.revenue)}
            <span style={{ fontSize:16, fontWeight:500, opacity:0.7, marginLeft:4 }}>d</span>
          </div>
          <div style={{ display:'flex', gap:16, fontSize:12, opacity:0.85 }}>
            <span>âœ… ÄÃ£ thu: <strong>{fmtMoney(data?.today?.paid)}d</strong></span>
            {(data?.today?.debt||0) > 0 && <span style={{ color:'#ffd666' }}>ðŸ“‹ Ná»£: <strong>{fmtMoney(data?.today?.debt)}d</strong></span>}
          </div>
        </div>

        {/* â”€â”€ KHÃCH + Lá»ŠCH Há»ªN â€” 2 cá»™t â”€â”€ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'16px 18px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>ðŸ‘¥ KhÃ¡ch hÃ´m nay</div>
            <div style={{ fontSize:34, fontWeight:900, color:'#1e1b4b', lineHeight:1 }}>{data?.today?.orders||0}</div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>+{data?.today?.new_customers||0} khÃ¡ch má»›i</div>
          </div>
          <div style={{ background:'#fff', borderRadius:16, padding:'16px 18px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>ðŸ“… Lá»‹ch háº¹n hÃ´m nay</div>
            <div style={{ fontSize:34, fontWeight:900, color:'#1e1b4b', lineHeight:1 }}>{data?.today?.appointments||0}</div>
            <div style={{ fontSize:11, marginTop:4 }}>
              <Link to={`/${slug}/booking`} style={{ color:'#667eea', textDecoration:'none' }}>Xem lá»‹ch â†’</Link>
            </div>
          </div>
        </div>

        {/* â”€â”€ Lá»ŠCH TIáº¾P THEO â”€â”€ */}
        {na ? (
          <div style={{ background:'#fff', borderRadius:16, padding:'14px 16px', marginBottom:10, border:'2px solid #e0e7ff' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#667eea', display:'flex', alignItems:'center', gap:6 }}>
                <CalendarOutlined /> Lá»ŠCH TIáº¾P THEO
              </div>
              <Tag color={STATUS_LABEL[na.status]?.color||'default'} style={{ borderRadius:10, fontSize:11, margin:0 }}>
                {STATUS_LABEL[na.status]?.label||na.status}
              </Tag>
            </div>
            <div style={{ fontSize:28, fontWeight:900, color:'#1e1b4b', lineHeight:1, marginBottom:4 }}>
              {na.time} <span style={{ fontSize:14, fontWeight:500, color:'#9ca3af' }}>{na.date}</span>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'#374151', marginBottom:2 }}>{na.customer_name}</div>
            <div style={{ fontSize:12, color:'#9ca3af', display:'flex', gap:10 }}>
              {na.service_name && <span>âœ‚ï¸ {na.service_name}</span>}
              {na.stylist_name && <span>ðŸ‘¤ {na.stylist_name}</span>}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={() => copyZalo(na)} style={{
                flex:1, padding:'10px 0', borderRadius:12, border:'none',
                background:'linear-gradient(135deg,#06b6d4,#0891b2)', color:'#fff',
                fontWeight:700, fontSize:13, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                boxShadow:'0 4px 12px rgba(6,182,212,0.35)'
              }}><CopyOutlined /> Copy nháº¯c Zalo</button>
              {na.customer_phone && (
                <a href={`tel:${na.customer_phone}`} style={{
                  padding:'10px 16px', borderRadius:12, border:'1.5px solid #e5e7eb',
                  background:'#fff', color:'#374151', fontSize:13, textDecoration:'none',
                  display:'flex', alignItems:'center', gap:4, fontWeight:600
                }}><PhoneOutlined /> Gá»i</a>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:16, padding:'14px 16px', marginBottom:10, textAlign:'center', color:'#16a34a' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>âœ…</div>
            <div style={{ fontWeight:700, fontSize:13 }}>KhÃ´ng cÃ²n lá»‹ch háº¹n nÃ o sáº¯p tá»›i</div>
          </div>
        )}

        {/* â”€â”€ Cáº¢NH BÃO â”€â”€ */}
        {(data?.alerts?.low_stock>0 || data?.alerts?.debt_customers>0) && (
          <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            {data?.alerts?.low_stock>0 && (
              <div style={{ flex:1, minWidth:130, background:'#fff7e6', border:'1px solid #ffd591', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:20 }}>âš ï¸</span>
                <div><div style={{ fontSize:11, fontWeight:700, color:'#d46b08' }}>HÃ ng sáº¯p háº¿t</div><div style={{ fontSize:16, fontWeight:800, color:'#874d00' }}>{data.alerts.low_stock} sp</div></div>
              </div>
            )}
            {data?.alerts?.debt_customers>0 && (
              <div style={{ flex:1, minWidth:130, background:'#fff2f0', border:'1px solid #ffa39e', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:20 }}>ðŸ’³</span>
                <div><div style={{ fontSize:11, fontWeight:700, color:'#cf1322' }}>KhÃ¡ch Ä‘ang ná»£</div><div style={{ fontSize:16, fontWeight:800, color:'#820014' }}>{data.alerts.debt_customers} khÃ¡ch</div></div>
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ BIá»‚U Äá»’ â”€â”€ */}
        <div style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1e1b4b', display:'flex', alignItems:'center', gap:6 }}>
              <RiseOutlined style={{ color:'#667eea' }} /> Doanh thu {chartDays} ngÃ y qua
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {[7,14,30].map(d => (
                <button key={d} onClick={() => setChartDays(d)} style={{
                  padding:'4px 10px', borderRadius:8, border:'none', cursor:'pointer',
                  background: chartDays===d ? '#667eea':'#f4f5f7',
                  color: chartDays===d ? '#fff':'#666', fontSize:12, fontWeight: chartDays===d?700:400
                }}>{d}N</button>
              ))}
            </div>
          </div>
          {chartData.length===0 ? (
            <div style={{ textAlign:'center', color:'#ccc', padding:'20px 0', fontSize:13 }}>ChÆ°a cÃ³ dá»¯ liá»‡u</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="ngay" tick={{ fontSize:10 }} interval={chartDays===30?4:0}/>
                <YAxis tickFormatter={v=>fmtMoney(v)} tick={{ fontSize:9 }} width={38}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="doanh_thu" name="Doanh thu" stroke="#667eea" fill="url(#g1)" strokeWidth={2.5} dot={false}/>
                <Area type="monotone" dataKey="da_thu" name="ÄÃ£ thu" stroke="#52c41a" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* â”€â”€ THÃNG NÃ€Y â”€â”€ */}
        <div style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1e1b4b', marginBottom:12 }}>ðŸ“† ThÃ¡ng {dayjs().format('M')} tá»•ng káº¿t</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Doanh thu', value:fmtMoneyFull(data?.month?.revenue), color:'#667eea' },
              { label:'ÄÃ£ thu vá»',  value:fmtMoneyFull(data?.month?.paid),    color:'#52c41a' },
              { label:'Chi phÃ­',    value:fmtMoneyFull(data?.month?.expenses), color:'#ff4d4f' },
              { label:'Lá»£i nhuáº­n Æ°á»›c', value:fmtMoneyFull(data?.month?.profit_est), color: (data?.month?.profit_est||0)>=0?'#16a34a':'#ff4d4f' },
            ].map(item => (
              <div key={item.label} style={{ background:'#f8f9fe', borderRadius:12, padding:'10px 12px', borderLeft:`3px solid ${item.color}` }}>
                <div style={{ fontSize:11, color:'#9ca3af', marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:800, color:item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* â”€â”€ TOP Dá»ŠCH Vá»¤ â”€â”€ */}
        {data?.top_services?.length>0 && (
          <div style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1e1b4b', marginBottom:10 }}>ðŸ† Dá»‹ch vá»¥ bÃ¡n cháº¡y thÃ¡ng nÃ y</div>
            {data.top_services.map((s,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom: i<data.top_services.length-1?'1px solid #f5f5f5':'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:i<3?'#fff':'#9ca3af' }}>{i+1}</div>
                  <div style={{ fontSize:13, color:'#374151' }}>{s.name}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#667eea' }}>{fmtMoneyFull(s.tong)}</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>{s.qty} láº§n</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* â”€â”€ NHÃ‚N VIÃŠN â”€â”€ */}
        {data?.staff?.filter(s=>s.tong_doanh_thu>0).length>0 && (
          <div style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1e1b4b', marginBottom:10 }}>ðŸ‘¥ NhÃ¢n viÃªn thÃ¡ng nÃ y</div>
            {data.staff.filter(s=>s.tong_doanh_thu>0).map((s,i) => (
              <div key={s.name} style={{ padding:'8px 0', borderBottom: i<data.staff.length-1?'1px solid #f5f5f5':'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{i===0?'ðŸ¥‡':i===1?'ðŸ¥ˆ':i===2?'ðŸ¥‰':`${i+1}.`} {s.name}</div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#667eea' }}>{fmtMoneyFull(s.tong_doanh_thu)}</div>
                    {s.hoa_hong>0 && <div style={{ fontSize:11, color:'#fa8c16' }}>HH: {fmtMoneyFull(s.hoa_hong)}</div>}
                  </div>
                </div>
                <div style={{ marginTop:6, background:'#f5f5f5', borderRadius:4, height:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, background:'linear-gradient(90deg,#667eea,#764ba2)', width:`${data.staff[0]?.tong_doanh_thu>0?(s.tong_doanh_thu/data.staff[0].tong_doanh_thu)*100:0}%`, transition:'width 0.5s' }}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </>)}
    </div>
  )
