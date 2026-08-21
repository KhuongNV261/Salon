import { create } from 'zustand'

const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  tenant: JSON.parse(localStorage.getItem('tenant') || 'null'),

  setAuth: (user, tenant) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('tenant', JSON.stringify(tenant))
    set({ user, tenant })
  },

  logout: () => {
    localStorage.clear()
    set({ user: null, tenant: null })
  },

  // Giỏ hàng POS
  cart: [],
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(i => i.id === product.id)
    if (existing) {
      return { cart: state.cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) }
    }
    return { cart: [...state.cart, { ...product, qty: 1 }] }
  }),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(i => i.id !== productId)
  })),
  updateQty: (productId, qty) => set((state) => ({
    cart: qty <= 0
      ? state.cart.filter(i => i.id !== productId)
      : state.cart.map(i => i.id === productId ? { ...i, qty } : i)
  })),
  clearCart: () => set({ cart: [] }),
}))

export default useStore
