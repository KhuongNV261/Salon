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

// ─── Danh sách TẤT CẢ màn hình có thể phân quyền ──────────
const ALL_SCREENS = [
  { key: 'pos',       label: '🛒 Bán hàng',           desc: 'Thu ngân, tạo đơn hàng' },
  { key: 'booking',   label: '📅 Lịch hẹn',           desc: 'Xem & quản lý lịch hẹn' },
  { key: 'customers', label: '👤 Khách hàng',          desc: 'Danh sách, nợ, lịch sử khách' },
  { key: 'reports',   label: '📈 Báo cáo',             desc: 'Thống kê doanh thu' },
  { key: 'dashboard', label: '📊 Tổng quan',           desc: 'Dashboard nhanh' },
  { key: 'expenses',  label: '💼 Chi phí / Chốt ca',  desc: 'Quản lý chi phí, ca làm' },
  { key: 'products',  label: '📦 Dịch vụ & Sản phẩm', desc: 'Quản lý menu dịch vụ' },
  { key: 'inventory', label: '🏭 Kho hàng',            desc: 'Nhập xuất kho' },
  { key: 'packages',  label: '🎁 Gói dịch vụ',        desc: 'Gói thẻ khách hàng' },
]

// ─── Vai trò hệ thống mặc định (luôn hiện, owner có thể sửa quyền) ──────────
const SYSTEM_ROLES = [
  { role_name: 'manager', label: 'Quản lý',   color: 'blue',   icon: '🧑‍💼', defaultScreens: ['pos','booking','customers','reports','dashboard','expenses','products','packages','inventory'] },
  { role_name: 'staff',   label: 'Thợ',       color: 'green',  icon: '✂️',  defaultScreens: ['booking'] },
  { role_name: 'cashier', label: 'Thu ngân',  color: 'cyan',   icon: '💰',  defaultScreens: ['pos','booking'] },
]

const COLOR_OPTIONS = [
  { value: 'blue',   label: 'Xanh dương', bg: '#1677ff' },
  { value: 'green',  label: 'Xanh lá',    bg: '#52c41a' },
  { value: 'purple', label: 'Tím',         bg: '#7c3aed' },
  { value: 'orange', label: 'Cam',         bg: '#fa8c16' },
  { value: 'cyan',   label: 'Ngọc',        bg: '#13c2c2' },
  { value: 'red',    label: 'Đỏ',          bg: '#ff4d4f' },
  { value: 'gold',   label: 'Vàng',        bg: '#d48806' },
  { value: 'pink',   label: 'Hồng',        bg: '#eb2f96' },
]

// Lấy màu hex từ tên màu Ant Design
const getColorHex = (color) => COLOR_OPTIONS.find(c => c.value === color)?.bg || '#1677ff'

// ─── Card hiển thị 1 vai trò (dùng chung system + custom) ─────────────────
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
              ? <span style={{ fontSize: 11, color: '#667eea', background: '#f0f5ff', border: '1px solid #d6e4ff', borderRadius: 10, padding: '1px 8px' }}>Hệ thống</span>
              : <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{perm.role_name}</span>
            }
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onEdit(perm, isSystem)}
              style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#6b7280', fontSize: 13 }}>
              <EditOutlined /> Sửa
            </button>
            {!isSystem && (
              <Popconfirm title={`Xóa vai trò "${perm.label}"?`} description="Nhân viên thuộc vai trò này sẽ mất quyền tùy chỉnh."
                onConfirm={() => onDelete(perm.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                <button style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#ef4444', fontSize: 13 }}>
                  <DeleteOutlined />
                </button>
              </Popconfirm>
            )}
          </div>
        </div>

        {/* Màn hình được phép */}
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Được truy cập ({screenCount} màn hình):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_SCREENS
            .filter(s => enabledFeatures[s.key] !== false) // chỉ hiện màn hình super admin đã bật
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

// ─── Modal thêm/sửa vai trò ────────────────────────────────
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

  // Auto-generate role_name từ label (chỉ khi tạo mới và không phải system role)
  const handleLabelChange = (val) => {
    const isSystem = isSystemEdit || (editing && SYSTEM_ROLES.some(r => r.role_name === editing.role_name))
    const rn = (editing || isSystem) ? form.role_name : val.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    setForm(f => ({ ...f, label: val, role_name: rn }))
  }

  const toggleScreen = (key) => {
    setForm(f => ({
      ...f,
      screens: f.screens.includes(key) ? f.screens.filter(s => s !== key) : [...f.screens, key]
    }))
  }

  const handleSave = async () => {
    if (!form.label.trim()) return message.warning('Nhập tên vai trò!')
    if (!form.screens.length) return message.warning('Chọn ít nhất 1 màn hình!')
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  // Màn hình super admin đã bật cho tiệm này
  const availableScreens = ALL_SCREENS.filter(s => enabledFeatures[s.key] !== false)

  const screens = useBreakpoint()
  const isMobile = !screens.md

  const title = <span style={{ fontWeight: 700, color: '#1e1b4b' }}>{editing ? '✏️ Sửa vai trò' : '➕ Tạo vai trò mới'}</span>

  const body = (
    <div style={{ padding: isMobile ? '0 0 24px' : '8px 0' }}>
      {/* Tên vai trò */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Tên vai trò <span style={{ color: '#ef4444' }}>*</span></div>
        {isSystemEdit || (editing && SYSTEM_ROLES.some(r => r.role_name === editing.role_name))
          ? <div style={{ padding: '8px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, color: '#1e1b4b', fontWeight: 600 }}>
              {form.label} <Tag color={form.color} style={{ marginLeft: 8 }}>Hệ thống</Tag>
            </div>
          : <Input
              value={form.label}
              onChange={e => handleLabelChange(e.target.value)}
              placeholder="VD: Thợ cắt, Gội đầu, Lễ tân..."
              size="large"
              disabled={!!editing && !isSystemEdit}
            />
        }
        {form.role_name && !isSystemEdit && !(editing && SYSTEM_ROLES.some(r => r.role_name === editing.role_name)) && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            Key: <code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>{form.role_name}</code>
          </div>
        )}
      </div>

      {/* Màu */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Màu nhận diện</div>
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

      {/* Phân quyền màn hình */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Màn hình được phép truy cập</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <LockOutlined />
          Chỉ hiển thị tính năng tiệm bạn đang sử dụng
        </div>
        {availableScreens.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ccc', padding: 24 }}>Chưa có tính năng nào được kích hoạt</div>
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
        }}>Hủy</button>
        <button onClick={handleSave} disabled={loading} style={{
          flex: 2, height: 44, border: 'none', borderRadius: 12,
          background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#667eea,#764ba2)',
          color: loading ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(102,126,234,0.4)'
        }}>
          {loading ? <Spin size="small" /> : (editing ? '💾 Lưu thay đổi' : '✅ Tạo vai trò')}
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
        closeIcon={<span style={{ fontSize: 18 }}>✕</span>}
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

// ─── Component chính ────────────────────────────────────────
export default function Permissions({ shopInfo }) {
  const [perms, setPerms] = useState([])    // vai trò từ DB
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
      message.error('Không tải được cấu hình vai trò')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setIsSystemEdit(false); setModalOpen(true) }

  // Edit một vai trò — system hoặc custom
  const openEdit = (perm, isSystem = false) => {
    setEditing(perm)
    setIsSystemEdit(isSystem)
    setModalOpen(true)
  }

  const handleSave = async (form) => {
    try {
      if (editing && editing.id) {
        // Cập nhật role đã có trong DB
        await api.put(`/api/role-permissions/${editing.id}`, {
          label: form.label, screens: form.screens, color: form.color
        })
        message.success(`✅ Cập nhật "${form.label}" thành công!`)
      } else {
        // Tạo mới (kể cả system role chưa có entry)
        await api.post('/api/role-permissions', form)
        message.success(`✅ Lưu cấu hình "${form.label}" thành công!`)
      }
      load()
    } catch (e) {
      message.error(e.response?.data?.error || 'Có lỗi xảy ra')
      throw e
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/role-permissions/${id}`)
      message.success('Đã xóa vai trò')
      load()
    } catch (e) {
      message.error(e.response?.data?.error || 'Có lỗi xảy ra')
    }
  }

  const enabledScreens = ALL_SCREENS.filter(s => enabledFeatures[s.key] !== false)

  // Tách: system roles (manager/staff/cashier) vs custom roles
  const dbPermMap = Object.fromEntries(perms.map(p => [p.role_name, p]))
  const customPerms = perms.filter(p => !SYSTEM_ROLES.some(sr => sr.role_name === p.role_name))

  // Merge: system role lấy config từ DB nếu có, không thì dùng default
  const systemRows = SYSTEM_ROLES.map(sr => {
    const dbEntry = dbPermMap[sr.role_name]
    return dbEntry
      ? { ...dbEntry, icon: sr.icon, _fromDB: true }
      : { ...sr, screens: sr.defaultScreens, id: null, _fromDB: false }
  })

  return (
    <div>
      {/* Header mô tả */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.06))',
        border: '1px solid rgba(102,126,234,0.15)', borderRadius: 14,
        padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🔐</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e1b4b', marginBottom: 2 }}>Phân quyền theo vai trò</div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            Chọn màn hình nào từng vai trò được xem, trong phạm vi tính năng <strong>đang bật cho tiệm bạn</strong>.
          </div>
        </div>
      </div>

      {/* Tính năng đang hoạt động */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckOutlined style={{ color: '#52c41a' }} /> Tính năng đang hoạt động ({enabledScreens.length} màn hình):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_SCREENS.map(s => {
            const on = enabledFeatures[s.key] !== false
            return (
              <Tooltip key={s.key} title={on ? 'Đã kích hoạt — có thể phân quyền' : 'Tính năng này chưa được bật cho tiệm bạn'}>
                <div style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: on ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${on ? '#bbf7d0' : '#e5e7eb'}`,
                  color: on ? '#16a34a' : '#9ca3af',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {on ? '✓' : '✕'} {s.label}
                </div>
              </Tooltip>
            )
          })}
        </div>
      </div>

      {/* ── SECTION 1: Vai trò hệ thống ── */}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>🏢 Vai trò hệ thống</div>
        <div style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', borderRadius: 8, padding: '2px 8px' }}>Luôn tồn tại · Có thể sửa quyền</div>
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
              }}>Mặc định · Nhấn Sửa để tuỳ chỉnh</div>
            )}
          </div>
        ))}
      </div>

      {/* ── SECTION 2: Vai trò tùy chỉnh ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>✨ Vai trò tùy chỉnh</div>
          <div style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', borderRadius: 8, padding: '2px 8px' }}>{customPerms.length} đã tạo</div>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 10,
          background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', boxShadow: '0 4px 14px rgba(102,126,234,0.3)'
        }}>
          <PlusOutlined /> Thêm vai trò
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : customPerms.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '28px 20px', background: '#fafafa',
          borderRadius: 16, border: '2px dashed #e5e7eb', color: '#9ca3af'
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎨</div>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Chưa có vai trò tùy chỉnh</div>
          <div style={{ fontSize: 12 }}>VD: Thợ cắt chuyên, Gội đầu, Lễ tân...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {customPerms.map(p => (
            <RoleCard key={p.id} perm={p} enabledFeatures={enabledFeatures}
              onEdit={() => openEdit(p, false)} onDelete={handleDelete} isSystem={false} />
          ))}
        </div>
      )}

      {/* Tip gán vai trò */}
      <div style={{
        marginTop: 16, padding: '12px 16px', background: 'linear-gradient(135deg,#fff7e6,#fffbe6)',
        border: '1px solid #ffd591', borderRadius: 12,
        fontSize: 12, color: '#854d0e', display: 'flex', gap: 8
      }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <div>
          <b>Vai trò hệ thống</b> áp dụng cho tất cả nhân viên có vai trò đó.
          <b style={{ marginLeft: 4 }}>Vai trò tùy chỉnh</b> cần gán riêng trong trang <strong>Nhân viên</strong>.
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
