import { create } from 'zustand';

interface UIStore {
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: false,
  isModalOpen: false,
  setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsModalOpen: (isOpen: boolean) => set({ isModalOpen: isOpen }),
}));
