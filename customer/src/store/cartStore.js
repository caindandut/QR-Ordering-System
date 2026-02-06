import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      
      items: [],

      addItem: (itemToAdd) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === itemToAdd.id
          );

          if (existingItem) {
            const updatedItems = state.items.map((item) =>
              item.id === itemToAdd.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
            return { items: updatedItems };
          } else {
            return {
              items: [
                ...state.items,
                { ...itemToAdd, quantity: 1 },
              ],
            };
          }
        }),

      removeItem: (itemIdToRemove) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemIdToRemove),
        })),

      incrementItem: (itemIdToInc) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemIdToInc
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        })),

      decrementItem: (itemIdToDec) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === itemIdToDec
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0),
        })),

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        const items = get().items;
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const items = get().items;
        return items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
