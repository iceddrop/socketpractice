import { create } from 'zustand';

interface UIStore {
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  isModalOpenTwo: boolean;
  
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setIsModalOpenTwo: (isOpen: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: false,
  isModalOpen: false,
  isModalOpenTwo: false,
  setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsModalOpen: (isOpen: boolean) => set({ isModalOpen: isOpen }),
  setIsModalOpenTwo: (isOpen: boolean) => set({ isModalOpenTwo: isOpen }),
}));
