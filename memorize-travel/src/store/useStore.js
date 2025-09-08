import { create } from 'zustand';

const useStore = create((set) => ({
  lands: [],
  currentLandIndex: 0,
  isModalOpen: false,
  isProcessing: false,
  uploadProgress: 0,
  currentUploadedImage: null,
  generatedMiniature: null,
  pendingComposite: null, // Stores the temporary composite image before confirmation
  previousBackground: null, // Stores the background before adding miniature
  landSegments: {}, // Stores segments for each land { landId: { segments: [], originalImages: {} } }

  // Land actions
  setLands: (lands) => set({ lands }),
  
  addLand: (land) => set((state) => ({
    lands: [...state.lands, land],
    currentLandIndex: state.lands.length
  })),

  updateLand: (landId, updates) => set((state) => ({
    lands: state.lands.map(land =>
      land.id === landId ? { ...land, ...updates } : land
    )
  })),

  setCurrentLandIndex: (index) => set({ currentLandIndex: index }),

  // Modal actions
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ 
    isModalOpen: false, 
    currentUploadedImage: null,
    generatedMiniature: null,
    uploadProgress: 0 
  }),

  // Upload actions
  setProcessing: (status) => set({ isProcessing: status }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setCurrentUploadedImage: (image) => set({ currentUploadedImage: image }),
  setGeneratedMiniature: (miniature) => set({ generatedMiniature: miniature }),
  setPendingComposite: (composite) => set({ pendingComposite: composite }),
  setPreviousBackground: (background) => set({ previousBackground: background }),
  
  // Clear pending state
  clearPendingState: () => set({ 
    pendingComposite: null, 
    previousBackground: null,
    generatedMiniature: null 
  }),

  // Get current land
  getCurrentLand: () => {
    const state = useStore.getState();
    return state.lands[state.currentLandIndex];
  },

  // Segment actions
  setLandSegments: (landId, segments, originalImages) => set((state) => ({
    landSegments: {
      ...state.landSegments,
      [landId]: {
        segments: segments || [],
        originalImages: originalImages || {}
      }
    }
  })),

  getLandSegments: (landId) => {
    const state = useStore.getState();
    return state.landSegments[landId] || { segments: [], originalImages: {} };
  }
}));

export default useStore;