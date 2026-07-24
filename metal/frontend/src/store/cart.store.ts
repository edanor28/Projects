import { create } from 'zustand';

export interface ProductSnapshot {
  id: string;
  name: string;
  priceCents: number;
  stockQuantity: number;
}

export interface CartItem {
  product: ProductSnapshot;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: ProductSnapshot, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotalCents: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (product, quantity) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.product.id === product.id);
      
      // Regla de Negocio: No exceder el stock visualmente disponible
      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + quantity, product.stockQuantity);
        return {
          items: state.items.map((item) =>
            item.product.id === product.id ? { ...item, quantity: newQuantity } : item
          ),
        };
      }
      return { items: [...state.items, { product, quantity }] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  clearCart: () => set({ items: [] }),

  // ZERO TRUST UI: Este total es puramente estético. 
  // El backend recalculará y cobrará en base a su propia lectura de la BBDD.
  getTotalCents: () => {
    return get().items.reduce((total, item) => total + (item.product.priceCents * item.quantity), 0);
  },
}));