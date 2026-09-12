import React, { useState, useEffect, useCallback } from 'react'
import {
  message, Modal, Drawer, Input, Select, Tag, Popconfirm, Spin, Tooltip, Grid
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined,
  CheckOutlined
} from '@ant-design/icons'
import api from '../api'

const { useBreakpoint } = Grid

// â”€â”€â”€ Danh sÃ¡ch Táº¤T Cáº¢ mÃ n hÃ¬nh cÃ³ thá»ƒ phÃ¢n quyá»n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALL_SCREENS = [
  { Mã: 'pos',       label: 'ðŸ›’ BÃ¡n hÃ ng',           desc: 'Thu ngÃ¢n, táº¡o Ä‘Æ¡n hÃ ng' },
  { Mã: 'booking',   label: 'ðŸ“… Lá»‹ch háº¹n',           desc: 'Xem & quáº£n lÃ½ lá»‹ch háº¹n' },
  { Mã: 'customers', label: 'ðŸ‘¤ KhÃ¡ch hÃ ng',          desc: 'Danh sÃ¡ch, ná»£, lá»‹ch sá»­ khÃ¡ch' },
  { Mã: 'reports',   label: 'ðŸ“ˆ BÃ¡o cÃ¡o',             desc: 'Thá»‘ng kÃª doanh thu' },
  { Mã: 'dashboard', label: 'ðŸ“Š Tá»•ng quan',           desc: 'Dashboard nhanh' },
  { Mã: 'expenses',  label: 'ðŸ’¼ Chi phÃ­ / Chá»‘t ca',  desc: 'Quáº£n lÃ½ chi phÃ­, ca lÃ m' },
  { Mã: 'products',  label: 'ðŸ“¦ Dá»‹ch vá»¥ & Sáº£n pháº©m', desc: 'Quáº£n lÃ½ menu dá»‹ch vá»¥' },
  { Mã: 'inventory', label: 'ðŸ­ Kho hÃ ng',            desc: 'Nháº­p xuáº¥t kho' },
  { Mã: 'packages',  label: 'ðŸŽ GÃ³i dá»‹ch vá»¥',        desc: 'GÃ³i tháº» khÃ¡ch hÃ ng' },
]

// â”€â”€â”€ Vai trÃ² há»‡ thá»‘ng máº·c Ä‘á»‹nh (luÃ´n hiá»‡n, owner cÃ³ thá»ƒ sá»­a quyá»n) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SYSTEM_ROLES = [
  { role_name: 'manager', label: 'Quáº£n lÃ½',   color: 'blue',   icon: 'ðŸ§‘â€ðŸ’¼', defaultScreens: ['pos','booking','customers','reports','dashboard','expenses','products','packages','inventory'] },
  { role_name: 'staff',   label: 'Thá»£',       color: 'green',  icon: 'âœ‚ï¸',  defaultScreens: ['booking'] },
  { role_name: 'cashier', label: 'Thu ngÃ¢n',  color: 'cyan',   icon: 'ðŸ’°',  defaultScreens: ['pos','booking'] },
]

const COLOR_OPTIONS = [
  { value: 'blue',   label: 'Xanh dÆ°Æ¡ng', bg: '#1677ff' },
  { value: 'green',  label: 'Xanh lÃ¡',    bg: '#52c41a' },
  { value: 'purple', label: 'TÃ­m',         bg: '#7c3aed' },
  { value: 'orange', label: 'Cam',         bg: '#fa8c16' },
  { value: 'cyan',   label: 'Ngá»c',        bg: '#13c2c2' },
  { value: 'red',    label: 'Äá»',          bg: '#ff4d4f' },
  { value: 'gold',   label: 'VÃ ng',        bg: '#d48806' },
  { value: 'pink',   label: 'Há»“ng',        bg: '#eb2f96' },
]

// Láº¥y mÃ u hex tá»« tÃªn mÃ u Ant Design
const getColorHex = (color) => COLOR_OPTIONS.find(c => c.value === color)?.bg || '#1677ff'

// â”€â”€â”€ Card hiá»ƒn thá»‹ 1 vai trÃ² (dÃ¹ng chung system + custom) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RoleCard({ perm, enabledFeatures, onEdit, onDelete, isSystem }) {
  const screenCount = perm.screens.filter(s => enabledFeatures[s] !== false).length
  const hex = getColorHex(perm.color)

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '16px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
      border: `1.5px solid ${hex}22`,
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Color stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: hex, borderRadius: '16px 0 0 16px' }} />

      <div style={{ paddingLeft: 8 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color={perm.color} style={{ fontWeight: 700, fontSize: 13, padding: '3px 12px', borderRadius: 20, margin: 0 }}>
              {perm.icon && <span style={{ marginRight: 4 }}>{perm.icon}</span>}{perm.label}
            </Tag>
            {isSystem
              ? <span style={{ fontSize: 11, color: '#667eea', background: '#f0f5ff', border: '1px solid #d6e4ff', borderRadius: 10, padding: '1px 8px' }}>Há»‡ thá»‘ng</span>
              : <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{perm.role_name}</span>
            }
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onEdit(perm, isSystem)}
              style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#6b7280', fontSize: 13 }}>
              <EditOutlined /> Sá»­a
            </button>
            {!isSystem && (
              <Popconfirm title={`XÃ³a vai trÃ² "${perm.label}"?`} description="NhÃ¢n viÃªn thuá»™c vai trÃ² nÃ y sáº½ máº¥t quyá»n tÃ¹y chá»‰nh."
                onConfirm={() => onDelete(perm.id)} okText="XÃ³a" cancelText="Há»§y" okButtonProps={{ danger: true }}>
                <button style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#ef4444', fontSize: 13 }}>
                  <DeleteOutlined />
                </button>
              </Popconfirm>
            )}
          </div>
        </div>

        {/* MÃ n hÃ¬nh Ä‘Æ°á»£c phÃ©p */}
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          ÄÆ°á»£c truy cáº­p ({screenCount} mÃ n hÃ¬nh):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_SCREENS
            .filter(s => enabledFeatures[s.key] !== false) // chá»‰ hiá»‡n mÃ n hÃ¬nh super admin Ä‘Ã£ báº­t
            .map(s => {
              const allowed = perm.screens.includes(s.key)
              return (
                <div key={s.key} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: allowed ? `${hex}18` : '#f9fafb',
                  border: `1px solid ${allowed ? hex + '44' : '#e5e7eb'}`,
                  color: allowed ? hex : '#9ca3af',
                }}>
                  {allowed ? <CheckOutlined style={{ fontSize: 10 }} /> : <LockOutlined style={{ fontSize: 10 }} />}
                  {s.label}
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Modal thÃªm/sá»­a vai trÃ² â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RoleModal({ open, onClose, onSave, editing, enabledFeatures, isSystemEdit }) {
  const [form, setForm] = useState({ label: '', role_name: '', color: 'blue', screens: ['booking'] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({ label: editing.label, role_name: editing.role_name, color: editing.color || 'blue', screens: [...editing.screens] })
      } else {
        setForm({ label: '', role_name: '', color: 'blue', screens: ['booking'] })
      }
    }
  }, [open, editing])

  // Auto-generate role_name tá»« label (chá»‰ khi táº¡o má»›i vÃ  khÃ´ng pháº£i system role)
  const handleLabelChange = (val) => {
    const isSystem = isSystemEdit || (editing && SYSTEM_ROLES.some(r => r.role_name === editing.role_name))
    const rn = (editing || isSystem) ? form.role_name : val.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/Ä‘/g, 'd').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    setForm(f => ({ ...f, label: val, role_name: rn }))
  }

  const toggleScreen = (key) => {
    setForm(f => ({
      ...f,
      screens: f.screens.includes(key) ? f.screens.filter(s => s !== key) : [...f.screens, key]
    }))
  }

  const handleSave = async () => {
    if (!form.label.trim()) return message.warning('Nháº­p tÃªn vai trÃ²!')
    if (!form.screens.length) return message.warning('Chá»n Ã­t nháº¥t 1 mÃ n hÃ¬nh!')
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  // MÃ n hÃ¬nh super admin Ä‘Ã£ báº­t cho tiá»‡m nÃ y
  const availableScreens = ALL_SCREENS.filter(s => enabledFeatures[s.key] !== false)

  const screens = useBreakpoint()
  const isMobile = !screens.md

  const title = <span style={{ fontWeight: 700, color: '#1e1b4b' }}>{editing ? 'âœï¸ Sá»­a vai trÃ²' : 'âž• Táº¡o vai trÃ² má»›i'}</span>

  const body = (
    <div style={{ padding: isMobile ? '0 0 24px' : '8px 0' }}>
      {/* TÃªn vai trÃ² */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>TÃªn vai trÃ² <span style={{ color: '#ef4444' }}>*</span></div>
        {isSystemEdit || (editing && SYSTEM_ROLES.some(r => r.role_name === editing.role_name))
          ? <div style={{ padding: '8px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, color: '#1e1b4b', fontWeight: 600 }}>
              {form.label} <Tag color={form.color} style={{ marginLeft: 8 }}>Há»‡ thá»‘ng</Tag>
            </div>
          : <Input
              value={form.label}
              onChange={e => handleLabelChange(e.target.value)}
              placeholder="VD: Thá»£ cáº¯t, Gá»™i Ä‘áº§u, Lá»… tÃ¢n..."
              size="large"
              disabled={!!editing && !isSystemEdit}
            />
        }
        {form.role_name && !isSystemEdit && !(editing && SYSTEM_ROLES.some(r => r.role_name === editing.role_name)) && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            Mã: <code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>{form.role_name}</code>
          </div>
        )}
      </div>

      {/* MÃ u */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>MÃ u nháº­n diá»‡n</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLOR_OPTIONS.map(c => (
            <div key={c.value} onClick={() => setForm(f => ({ ...f, color: c.value }))}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: c.bg, cursor: 'pointer',
                border: form.color === c.value ? `3px solid #1e1b4b` : '3px solid transparent',
                boxShadow: form.color === c.value ? `0 0 0 2px ${c.bg}55` : 'none',
                transition: 'all 0.15s',
              }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* PhÃ¢n quyá»n mÃ n hÃ¬nh */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>MÃ n hÃ¬nh Ä‘Æ°á»£c phÃ©p truy cáº­p</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <LockOutlined />
          Chá»‰ hiá»ƒn thá»‹ cÃ¡c tÃ­nh nÄƒng super admin Ä‘Ã£ báº­t cho tiá»‡m báº¡n
        </div>
        {availableScreens.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ccc', padding: 24 }}>ChÆ°a cÃ³ tÃ­nh nÄƒng nÃ o Ä‘Æ°á»£c kÃ­ch hoáº¡t</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availableScreens.map(s => {
              const active = form.screens.includes(s.key)
              const hex = getColorHex(form.color)
              return (
                <div key={s.key} onClick={() => toggleScreen(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    borderRadius: 12, cursor: 'pointer',
                    background: active ? `${hex}10` : '#f9fafb',
                    border: `1.5px solid ${active ? hex + '55' : '#e5e7eb'}`,
                    transition: 'all 0.15s',
                  }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: active ? hex : '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {active && <CheckOutlined style={{ fontSize: 11, color: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#1e1b4b' : '#6b7280' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{
          flex: 1, height: 44, border: '1.5px solid #e5e7eb', borderRadius: 12,
          background: '#fff', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer'
        }}>Há»§y</button>
        <button onClick={handleSave} disabled={loading} style={{
          flex: 2, height: 44, border: 'none', borderRadius: 12,
          background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#667eea,#764ba2)',
          color: loading ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(102,126,234,0.4)'
        }}>
          {loading ? <Spin size="small" /> : (editing ? 'ðŸ’¾ LÆ°u thay Ä‘á»•i' : 'âœ… Táº¡o vai trÃ²')}
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer
        open={open} onClose={onClose}
        placement="bottom"
        height="90vh"
        title={title}
        styles={{ body: { padding: '12px 16px', overflowY: 'auto' }, header: { borderBottom: '1px solid #f0f0f0' } }}
        closeIcon={<span style={{ fontSize: 18 }}>âœ•</span>}
      >
        {body}
      </Drawer>
    )
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={title} width={520} centered>
      {body}
    </Modal>
  )
}

// â”€â”€â”€ Component chÃ­nh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Permissions({ shopInfo }) {
  const [perms, setPerms] = useState([])    // vai trÃ² tá»« DB
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [isSystemEdit, setIsSystemEdit] = useState(false)

  const enabledFeatures = shopInfo?.features || {}

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/role-permissions')
      setPerms(res.data)
    } catch {
      message.error('KhÃ´ng táº£i Ä‘Æ°á»£c cáº¥u hÃ¬nh vai trÃ²')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setIsSystemEdit(false); setModalOpen(true) }

  // Edit má»™t vai trÃ² â€” system hoáº·c custom
  const openEdit = (perm, isSystem = false) => {
    setEditing(perm)
    setIsSystemEdit(isSystem)
    setModalOpen(true)
  }

  const handleSave = async (form) => {
    try {
      if (editing && editing.id) {
        // Cáº­p nháº­t role Ä‘Ã£ cÃ³ trong DB
        await api.put(`/api/role-permissions/${editing.id}`, {
          label: form.label, screens: form.screens, color: form.color
        })
        message.success(`âœ… Cáº­p nháº­t "${form.label}" thÃ nh cÃ´ng!`)
      } else {
        // Táº¡o má»›i (ká»ƒ cáº£ system role chÆ°a cÃ³ entry)
        await api.post('/api/role-permissions', form)
        message.success(`âœ… LÆ°u cáº¥u hÃ¬nh "${form.label}" thÃ nh cÃ´ng!`)
      }
      load()
    } catch (e) {
      message.error(e.response?.data?.error || 'CÃ³ lá»—i xáº£y ra')
      throw e
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/role-permissions/${id}`)
      message.success('ÄÃ£ xÃ³a vai trÃ²')
      load()
    } catch (e) {
      message.error(e.response?.data?.error || 'CÃ³ lá»—i xáº£y ra')
    }
  }

  const enabledScreens = ALL_SCREENS.filter(s => enabledFeatures[s.key] !== false)

  // TÃ¡ch: system roles (manager/staff/cashier) vs custom roles
  const dbPermMap = Object.fromEntries(perms.map(p => [p.role_name, p]))
  const customPerms = perms.filter(p => !SYSTEM_ROLES.some(sr => sr.role_name === p.role_name))

  // Merge: system role láº¥y config tá»« DB náº¿u cÃ³, khÃ´ng thÃ¬ dÃ¹ng default
  const systemRows = SYSTEM_ROLES.map(sr => {
    const dbEntry = dbPermMap[sr.role_name]
    return dbEntry
      ? { ...dbEntry, icon: sr.icon, _fromDB: true }
      : { ...sr, screens: sr.defaultScreens, id: null, _fromDB: false }
  })

  return (
    <div>
      {/* Header mÃ´ táº£ */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.06))',
        border: '1px solid rgba(102,126,234,0.15)', borderRadius: 14,
        padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>ðŸ”</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e1b4b', marginBottom: 2 }}>PhÃ¢n quyá»n theo vai trÃ²</div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            Cáº¥u hÃ¬nh mÃ n hÃ¬nh tá»«ng vai trÃ² Ä‘Æ°á»£c xem. Chá»‰ trong pháº¡m vi tÃ­nh nÄƒng <strong>super admin Ä‘Ã£ kÃ­ch hoáº¡t</strong>.
          </div>
        </div>
      </div>

      {/* TÃ­nh nÄƒng Ä‘ang hoáº¡t Ä‘á»™ng */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckOutlined style={{ color: '#52c41a' }} /> TÃ­nh nÄƒng Ä‘ang hoáº¡t Ä‘á»™ng ({enabledScreens.length} mÃ n hÃ¬nh):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_SCREENS.map(s => {
            const on = enabledFeatures[s.key] !== false
            return (
              <Tooltip key={s.key} title={on ? 'ÄÃ£ kÃ­ch hoáº¡t â€” cÃ³ thá»ƒ phÃ¢n quyá»n' : 'Super admin chÆ°a báº­t cho tiá»‡m báº¡n'}>
                <div style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: on ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${on ? '#bbf7d0' : '#e5e7eb'}`,
                  color: on ? '#16a34a' : '#9ca3af',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {on ? 'âœ“' : 'âœ•'} {s.label}
                </div>
              </Tooltip>
            )
          })}
        </div>
      </div>

      {/* â”€â”€ SECTION 1: Vai trÃ² há»‡ thá»‘ng â”€â”€ */}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>ðŸ¢ Vai trÃ² há»‡ thá»‘ng</div>
        <div style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', borderRadius: 8, padding: '2px 8px' }}>LuÃ´n tá»“n táº¡i Â· CÃ³ thá»ƒ sá»­a quyá»n</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {systemRows.map(sr => (
          <div key={sr.role_name} style={{ position: 'relative' }}>
            <RoleCard
              perm={sr}
              enabledFeatures={enabledFeatures}
              onEdit={() => openEdit(sr, true)}
              onDelete={null}
              isSystem={true}
            />
            {!sr._fromDB && (
              <div style={{
                position: 'absolute', top: 12, right: 60,
                fontSize: 11, color: '#9ca3af', background: '#f9fafb',
                border: '1px dashed #d1d5db', borderRadius: 8, padding: '2px 8px'
              }}>Máº·c Ä‘á»‹nh Â· Nháº¥n Sá»­a Ä‘á»ƒ tuá»³ chá»‰nh</div>
            )}
          </div>
        ))}
      </div>

      {/* â”€â”€ SECTION 2: Vai trÃ² tÃ¹y chá»‰nh â”€â”€ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>âœ¨ Vai trÃ² tÃ¹y chá»‰nh</div>
          <div style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', borderRadius: 8, padding: '2px 8px' }}>{customPerms.length} Ä‘Ã£ táº¡o</div>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 10,
          background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', boxShadow: '0 4px 14px rgba(102,126,234,0.3)'
        }}>
          <PlusOutlined /> ThÃªm vai trÃ²
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : customPerms.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '28px 20px', background: '#fafafa',
          borderRadius: 16, border: '2px dashed #e5e7eb', color: '#9ca3af'
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>ðŸŽ¨</div>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>ChÆ°a cÃ³ vai trÃ² tÃ¹y chá»‰nh</div>
          <div style={{ fontSize: 12 }}>VD: Thá»£ cáº¯t chuyÃªn, Gá»™i Ä‘áº§u, Lá»… tÃ¢n...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {customPerms.map(p => (
            <RoleCard key={p.id} perm={p} enabledFeatures={enabledFeatures}
              onEdit={() => openEdit(p, false)} onDelete={handleDelete} isSystem={false} />
          ))}
        </div>
      )}

      {/* Tip gÃ¡n vai trÃ² */}
      <div style={{
        marginTop: 16, padding: '12px 16px', background: 'linear-gradient(135deg,#fff7e6,#fffbe6)',
        border: '1px solid #ffd591', borderRadius: 12,
        fontSize: 12, color: '#854d0e', display: 'flex', gap: 8
      }}>
        <span style={{ fontSize: 16 }}>ðŸ’¡</span>
        <div>
          <b>Vai trÃ² há»‡ thá»‘ng</b> Ã¡p dá»¥ng cho táº¥t cáº£ nhÃ¢n viÃªn cÃ³ vai trÃ² Ä‘Ã³.
          <b style={{ marginLeft: 4 }}>Vai trÃ² tÃ¹y chá»‰nh</b> cáº§n gÃ¡n riÃªng trong trang <strong>NhÃ¢n viÃªn</strong>.
        </div>
      </div>

      <RoleModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSave} editing={editing}
        enabledFeatures={enabledFeatures}
        isSystemEdit={isSystemEdit}
      />
    </div>
  )
}

