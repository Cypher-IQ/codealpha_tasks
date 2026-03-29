import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set) => ({
      lastVisitedProjectId: null,
      lastVisitedBoardId: null,
      taskFilters: {
        search: '',
        priority: '',
        assignee: '',
        labels: ''
      },
      setLastVisited: (projectId, boardId) => set({ 
        lastVisitedProjectId: projectId, 
        lastVisitedBoardId: boardId 
      }),
      setTaskFilters: (filters) => set((state) => ({ 
        taskFilters: { ...state.taskFilters, ...filters } 
      })),
      clearFilters: () => set({ 
        taskFilters: { search: '', priority: '', assignee: '', labels: '' } 
      })
    }),
    {
      name: 'pm-app-storage', // Saved to localStorage implicitly
    }
  )
);

export default useAppStore;
