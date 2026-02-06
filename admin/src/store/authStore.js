import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
    
      login: async (email, password) => {
        try {
          const response = await api.post('/api/auth/login', {
            email: email,
            password: password,
          });

          const { user, accessToken, refreshToken } = response.data;
          
          set({
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            errorCode: error.response?.data?.code,
            errorMessage: error.response?.data?.message
          };
        }
      },

      setAccessToken: (token) => {
        set({ accessToken: token });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },
        
      logout: async () => {
        const { refreshToken } = get();

        const tokenToRevoke = refreshToken;
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });

        delete api.defaults.headers.common['Authorization'];

        if (tokenToRevoke) {
          try {
            await api.post('/api/auth/logout', { refreshToken: tokenToRevoke });
          } catch {
          }
        }
      },

    updateUser: (newUserData) => {
      set((state) => ({
        user: {
          ...state.user,
          ...newUserData,
        }
      }));
    }
  }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state.accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
        }
      }
    }
  )
);
