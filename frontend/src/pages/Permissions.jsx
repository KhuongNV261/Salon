import React, { useState, useEffect, useCallback } from 'react'
import {
  message, Modal, Input, Select, Tag, Popconfirm, Spin, Tooltip
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined,
  CheckOutlined, UserOutlined
} from '@ant-design/icons'
import api from '../api'

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

// ─── Card hiển thị 1 vai trò ───────────────────────────────
function RoleCard({ perm, enabledFeatures, onEdit, onDelete }) {
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
              {perm.label}
            </Tag>
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{perm.role_name}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onEdit(perm)}
              style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#6b7280', fontSize: 13 }}>
              <EditOutlined />
            </button>
            <Popconfirm title={`Xóa vai trò "${perm.label}"?`} description="Nhân viên thuộc vai trò này sẽ mất quyền tùy chỉnh."
              onConfirm={() => onDelete(perm.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
              <button style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#ef4444', fontSize: 13 }}>
                <DeleteOutlined />
              </button>
            </Popconfirm>
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
function RoleModal({ open, onClose, onSave, editing, enabledFeatures }) {
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

  // Auto-generate role_name từ label
  const handleLabelChange = (val) => {
    const rn = editing ? form.role_name : val.toLowerCase()
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

  return (
    <Modal
      open={open} onCancel={onClose} footer={null}
      title={<span style={{ fontWeight: 700, color: '#1e1b4b' }}>{editing ? '✏️ Sửa vai trò' : '➕ Tạo vai trò mới'}</span>}
      width={520} centered
    >
      <div style={{ padding: '8px 0' }}>
        {/* Tên vai trò */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Tên vai trò <span style={{ color: '#ef4444' }}>*</span></div>
          <Input
            value={form.label}
            onChange={e => handleLabelChange(e.target.value)}
            placeholder="VD: Thợ cắt, Gội đầu, Lễ tân..."
            size="large"
            disabled={!!editing}
          />
          {form.role_name && (
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
            Chỉ hiển thị các tính năng super admin đã bật cho tiệm bạn
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
                    {/* Toggle */}
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
    </Modal>
  )
}

// ─── Component chính ────────────────────────────────────────
export default function Permissions({ shopInfo }) {
  const [perms, setPerms] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // Tính năng super admin đã bật cho tiệm (ràng buộc phân quyền)
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

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (perm) => { setEditing(perm); setModalOpen(true) }

  const handleSave = async (form) => {
    try {
      if (editing) {
        await api.put(`/api/role-permissions/${editing.id}`, {
          label: form.label, screens: form.screens, color: form.color
        })
        message.success(`✅ Cập nhật vai trò "${form.label}" thành công!`)
      } else {
        await api.post('/api/role-permissions', form)
        message.success(`✅ Tạo vai trò "${form.label}" thành công!`)
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

  // Màn hình nào super admin đã bật cho tiệm này
  const enabledScreens = ALL_SCREENS.filter(s => enabledFeatures[s.key] !== false)

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
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e1b4b', marginBottom: 2 }}>Phân quyền theo vai trò nghề nghiệp</div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            Tạo các vai trò (thợ cắt, gội đầu, lễ tân...) và chọn màn hình nào họ được xem.
            Chỉ có thể phân quyền các tính năng <strong>super admin đã kích hoạt</strong> cho tiệm bạn.
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
              <Tooltip key={s.key} title={on ? 'Đã kích hoạt — có thể phân quyền' : 'Super admin chưa bật cho tiệm bạn'}>
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

      {/* Nút thêm vai trò */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
          {loading ? 'Đang tải...' : `${perms.length} vai trò đã tạo`}
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', border: 'none', borderRadius: 10,
          background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', boxShadow: '0 4px 14px rgba(102,126,234,0.4)'
        }}>
          <PlusOutlined /> Thêm vai trò mới
        </button>
      </div>

      {/* List vai trò */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : perms.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px', background: '#fafafa',
          borderRadius: 16, border: '2px dashed #e5e7eb', color: '#9ca3af'
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có vai trò nào</div>
          <div style={{ fontSize: 13 }}>Thêm vai trò đầu tiên để phân quyền cho nhân viên</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {perms.map(p => (
            <RoleCard key={p.id} perm={p} enabledFeatures={enabledFeatures} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Tip gán vai trò */}
      {perms.length > 0 && (
        <div style={{
          marginTop: 16, padding: '12px 16px', background: 'linear-gradient(135deg,#fff7e6,#fffbe6)',
          border: '1px solid #ffd591', borderRadius: 12,
          fontSize: 12, color: '#854d0e', display: 'flex', gap: 8
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <div>
            <b>Gán vai trò cho nhân viên:</b> Vào trang <strong>Nhân viên</strong> → Sửa nhân viên →
            chọn <strong>"Vai trò nghề nghiệp"</strong> để áp dụng phân quyền.
          </div>
        </div>
      )}

      <RoleModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSave} editing={editing}
        enabledFeatures={enabledFeatures}
      />
    </div>
  )
}
