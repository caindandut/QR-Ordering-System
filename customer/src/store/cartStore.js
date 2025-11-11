import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// TẠI SAO DÙNG persist?
// Tác dụng: Tự động lưu "bộ não" này vào localStorage.
// Nếu khách hàng lỡ tay F5 (tải lại) trang, giỏ hàng của họ
// sẽ không bị mất. Rất quan trọng cho UX.

export const useCartStore = create(
  persist(
    // (set) = Hàm để "ghi" state
    // (get) = Hàm để "đọc" state (dùng cho các hàm phái sinh)
    (set, get) => ({
      
      // ===================================
      // 1. STATE (Dữ liệu "Nguồn")
      // ===================================
      // items là một mảng các object:
      // { id: 1, name: "Phở Bò", price: 50000, quantity: 1 }
      items: [],

      // ===================================
      // 2. ACTIONS (Hành động "Thay đổi" State)
      // ===================================

      /**
       * Thêm một món vào giỏ.
       * Nếu đã tồn tại, tăng số lượng.
       * Nếu chưa, thêm mới với số lượng là 1.
       */
      addItem: (itemToAdd) =>
        set((state) => {
          // 2a. Kiểm tra xem món đã có trong giỏ chưa
          const existingItem = state.items.find(
            (item) => item.id === itemToAdd.id
          );

          if (existingItem) {
            // 2b. Nếu ĐÃ CÓ: Dùng .map() để tạo mảng MỚI
            const updatedItems = state.items.map((item) =>
              item.id === itemToAdd.id
                ? { ...item, quantity: item.quantity + 1 } // 👈 Tăng số lượng (bất biến)
                : item
            );
            return { items: updatedItems };
          } else {
            // 2c. Nếu CHƯA CÓ: Dùng "..." (spread) để tạo mảng MỚI
            return {
              items: [
                ...state.items,
                { ...itemToAdd, quantity: 1 }, // 👈 Thêm món mới với SL=1
              ],
            };
          }
        }),

      /**
       * Xóa hẳn 1 món (dù số lượng là bao nhiêu)
       */
      removeItem: (itemIdToRemove) =>
        set((state) => ({
          // Dùng .filter() để tạo mảng MỚI (không chứa món cần xóa)
          items: state.items.filter((item) => item.id !== itemIdToRemove),
        })),

      /**
       * Tăng số lượng của 1 món
       */
      incrementItem: (itemIdToInc) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemIdToInc
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        })),

      /**
       * Giảm số lượng của 1 món.
       * Nếu giảm về 0, xóa luôn món đó khỏi giỏ.
       */
      decrementItem: (itemIdToDec) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === itemIdToDec
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            // Tối ưu: Dùng .filter() để loại bỏ các món có SL = 0
            .filter((item) => item.quantity > 0),
        })),

      /**
       * Xóa sạch giỏ hàng
       */
      clearCart: () => set({ items: [] }),

      // ===================================
      // 3. COMPUTED (Dữ liệu "Phái sinh" / "Đã tính toán")
      // ===================================
      
      // TẠI SAO ĐỂ Ở ĐÂY?
      // Tác dụng: Đóng gói logic tính toán. Component chỉ cần
      // gọi `useCartStore.getState().getTotalItems()`,
      // không cần tự viết logic `reduce` ở 10 nơi khác nhau.
      
      /**
       * Tính tổng số lượng (vd: 2 Phở + 1 Bia = 3)
       */
      getTotalItems: () => {
        // Dùng `get()` để "đọc" state hiện tại
        const items = get().items;
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      /**
       * Tính tổng tiền
       */
      getTotalPrice: () => {
        const items = get().items;
        return items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage', // Tên key trong localStorage
    }
  )
);