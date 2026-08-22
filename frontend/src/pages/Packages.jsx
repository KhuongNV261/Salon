import React, { useState, useEffect } from "react"
import { message, Modal, Input, InputNumber, Select } from "antd"
import api from "../api"

const fmtMoney = v => Number(v || 0).toLocaleString("vi-VN") + "d"

const STATUS_MAP = {
  active: { label: "Con han", color: "#52c41a", bg: "#f6ffed" },
  exhausted: { label: "Het buoi", color: "#ff4d4f", bg: "#fff1f0" },
  expired: { label: "Het han", color: "#faad14", bg: "#fffbe6" },
}

function PackageCard({ pkg, onEdit, onDelete }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "14px 16px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.08)", marginBottom: 10,
      borderLeft: "4px solid " + (pkg.is_active ? "#667eea" : "#d9d9d9"),
      opacity: pkg.is_active ? 1 : 0.6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>{pkg.name}</div>
          {pkg.description && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{pkg.description}</div>}
          {pkg.service_product_name && (
            <div style={{ fontSize: 12, color: "#667eea", marginTop: 4 }}>
              Dich vu: {pkg.service_product_name}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, background: "#f0f4ff", padding: "2px 8px", borderRadius: 6, color: "#4f46e5" }}>
              {pkg.total_sessions} buoi
            </span>
            <span style={{ fontSize: 12, background: "#f6ffed", padding: "2px 8px", borderRadius: 6, color: "#389e0d", fontWeight: 700 }}>
              {fmtMoney(pkg.price)}
            </span>
            <span style={{ fontSize: 12, background: "#fff7e6", padding: "2px 8px", borderRadius: 6, color: "#d46b08" }}>
              {pkg.valid_days} ngay
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(pkg)} style={{
            background: "#f0f4ff", border: "none", borderRadius: 8, padding: "5px 10px",
            fontSize: 12, color: "#4f46e5", cursor: "pointer", fontWeight: 600,
          }}>Sua</button>
          <button onClick={() => onDelete(pkg)} style={{
            background: "#fff1f0", border: "none", borderRadius: 8, padding: "5px 10px",
            fontSize: 12, color: "#ff4d4f", cursor: "pointer", fontWeight: 600,
          }}>An</button>
        </div>
      </div>
    </div>
  )
}

function CustomerPackageRow({ cp, onUse }) {
  const s = STATUS_MAP[cp.status] || STATUS_MAP.active
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "12px 14px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 8,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b" }}>{cp.customer_name}</div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{cp.package_name}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: s.color,
            background: s.bg, padding: "2px 8px", borderRadius: 6
          }}>{s.label}</span>
          <span style={{ fontSize: 12, color: "#666" }}>
            Con <b style={{ color: "#4f46e5" }}>{cp.remaining_sessions}</b>/{cp.total_sessions} buoi
          </span>
          {cp.expired_at && (
            <span style={{ fontSize: 11, color: "#aaa" }}>
              HH: {new Date(cp.expired_at).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>
      </div>
      {cp.status === "active" && cp.remaining_sessions > 0 && (
        <button onClick={() => onUse(cp)} style={{
          background: "linear-gradient(135deg,#667eea,#764ba2)",
          border: "none", borderRadius: 10, padding: "7px 14px",
          color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
          flexShrink: 0,
        }}>Dung 1 buoi</button>
      )}
    </div>
  )
}

export default function Packages() {
  const [tab, setTab] = useState("manage")
  const [packages, setPackages] = useState([])
  const [customerPkgs, setCustomerPkgs] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editPkg, setEditPkg] = useState(null)
  const [form, setForm] = useState({ name: "", description: "", service_product_id: "", service_product_name: "", total_sessions: 10, price: 0, valid_days: 90 })
  const [saving, setSaving] = useState(false)
  const [searchCust, setSearchCust] = useState("")

  useEffect(() => {
    loadPackages()
    loadProducts()
  }, [])

  useEffect(() => {
    if (tab === "customers") loadCustomerPackages()
  }, [tab])

  const loadPackages = async () => {
    try { const r = await api.get("/api/packages"); setPackages(r.data) } catch {}
  }

  const loadProducts = async () => {
    try {
      const r = await api.get("/api/products")
      setProducts((r.data || []).filter(p => p.is_service))
    } catch {}
  }

  const loadCustomerPackages = async () => {
    setLoading(true)
    try {
      const r = await api.get("/api/customers")
      const custs = r.data || []
      const all = []
      await Promise.all(custs.slice(0, 50).map(async c => {
        try {
          const r2 = await api.get("/api/customers/" + c.id + "/packages")
          ;(r2.data || []).forEach(cp => all.push({ ...cp, customer_name: c.name }))
        } catch {}
      }))
      setCustomerPkgs(all.sort((a) => a.status === "active" ? -1 : 1))
    } finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditPkg(null)
    setForm({ name: "", description: "", service_product_id: "", service_product_name: "", total_sessions: 10, price: 0, valid_days: 90 })
    setShowForm(true)
  }

  const openEdit = (pkg) => {
    setEditPkg(pkg)
    setForm({ ...pkg })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return message.warning("Nhap ten goi!")
    setSaving(true)
    try {
      if (editPkg) {
        await api.put("/api/packages/" + editPkg.id, form)
        message.success("Da cap nhat goi!")
      } else {
        await api.post("/api/packages", form)
        message.success("Da tao goi moi!")
      }
      setShowForm(false)
      loadPackages()
    } catch (e) {
      message.error(e.response?.data?.error || "Loi")
    } finally { setSaving(false) }
  }

  const handleDelete = (pkg) => {
    Modal.confirm({
      title: "An goi " + pkg.name + "?",
      content: "Goi se khong con hien thi khi ban moi, nhung cac goi da ban van con hieu luc.",
      okText: "An di", cancelText: "Thoi",
      onOk: async () => {
        try {
          await api.delete("/api/packages/" + pkg.id)
          message.success("Da an goi!")
          loadPackages()
        } catch { message.error("Loi") }
      }
    })
  }

  const handleUse = (cp) => {
    Modal.confirm({
      title: "Tru 1 buoi – " + cp.package_name + "?",
      content: "Khach: " + cp.customer_name + " – Con lai: " + cp.remaining_sessions + " buoi -> " + (cp.remaining_sessions - 1) + " buoi",
      okText: "Xac nhan dung", cancelText: "Thoi",
      onOk: async () => {
        try {
          await api.post("/api/customer-packages/" + cp.id + "/use", {})
          message.success("Da tru 1 buoi!")
          loadCustomerPackages()
        } catch (e) { message.error(e.response?.data?.error || "Loi") }
      }
    })
  }

  const filteredCustomerPkgs = customerPkgs.filter(cp =>
    !searchCust || cp.customer_name?.toLowerCase().includes(searchCust.toLowerCase()) ||
    cp.package_name?.toLowerCase().includes(searchCust.toLowerCase())
  )

  return (
    <div style={{ padding: "14px 14px 80px", background: "#f8f9fe", minHeight: "100%" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1e1b4b" }}>Goi Dich Vu</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>The lieu trinh / Combo nhieu buoi</div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ key: "manage", label: "Quan ly goi" }, { key: "customers", label: "Goi cua khach" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "7px 14px", borderRadius: 10, border: "none",
            background: tab === t.key ? "linear-gradient(135deg,#667eea,#764ba2)" : "#fff",
            color: tab === t.key ? "#fff" : "#555",
            fontWeight: tab === t.key ? 700 : 400, fontSize: 13, cursor: "pointer",
            boxShadow: tab === t.key ? "0 4px 12px rgba(102,126,234,0.3)" : "0 1px 3px rgba(0,0,0,0.08)",
          }}>{t.label}</button>
        ))}
      </div>
      {tab === "manage" && (
        <>
          <button onClick={openCreate} style={{
            width: "100%", height: 44, border: "2px dashed #667eea", borderRadius: 12,
            background: "rgba(102,126,234,0.05)", color: "#667eea", fontSize: 14,
            fontWeight: 700, cursor: "pointer", marginBottom: 14,
          }}>+ Tao goi moi</button>
          {packages.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Chua co goi nao. Tao goi dau tien!</div>
          ) : (
            packages.map(p => <PackageCard key={p.id} pkg={p} onEdit={openEdit} onDelete={handleDelete} />)
          )}
        </>
      )}
      {tab === "customers" && (
        <>
          <Input placeholder="Tim theo ten khach hoac ten goi..." value={searchCust}
            onChange={e => setSearchCust(e.target.value)} style={{ marginBottom: 12, borderRadius: 10 }} allowClear />
          {loading ? (
            <div style={{ textAlign: "center", padding: 30, color: "#888" }}>Dang tai...</div>
          ) : filteredCustomerPkgs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Chua co khach nao dang co goi</div>
          ) : (
            filteredCustomerPkgs.map(cp => <CustomerPackageRow key={cp.id} cp={cp} onUse={handleUse} />)
          )}
        </>
      )}
      <Modal title={editPkg ? "Sua goi" : "Tao goi moi"} open={showForm}
        onCancel={() => setShowForm(false)} onOk={handleSave}
        okText={saving ? "Dang luu..." : "Luu"} cancelText="Huy" confirmLoading={saving}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>Ten goi *</div>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Goi goi dau 10 buoi" size="large" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>Mo ta (tuy chon)</div>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ghi chu them..." />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>So buoi *</div>
            <InputNumber value={form.total_sessions} onChange={v => setForm(f => ({ ...f, total_sessions: v }))} min={1} max={200} style={{ width: "100%" }} size="large" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>Hieu luc (ngay)</div>
            <InputNumber value={form.valid_days} onChange={v => setForm(f => ({ ...f, valid_days: v }))} min={1} max={3650} style={{ width: "100%" }} size="large" />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>Gia ban goi (VND)</div>
          <InputNumber value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} min={0} step={10000} style={{ width: "100%" }} size="large"
            formatter={v => (v + "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={v => v?.replace(/,/g, "")} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>Lien ket dich vu (tuy chon)</div>
          <Select value={form.service_product_id || undefined}
            onChange={(v, opt) => setForm(f => ({ ...f, service_product_id: v || "", service_product_name: opt?.label || "" }))}
            style={{ width: "100%" }} size="large" allowClear placeholder="Chon dich vu..."
            options={products.map(p => ({ value: p.id, label: p.name }))} />
        </div>
      </Modal>
    </div>
  )
}
