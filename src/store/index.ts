import { create } from "zustand";
import type { LatLng, CollectionPoint, MaterialCategory } from "../types/index";

interface AppState {
  // State slices
  userLocation: LatLng | null;
  selectedCategories: Set<MaterialCategory>;
  allPoints: CollectionPoint[];
  filteredPoints: CollectionPoint[];
  selectedPointId: string | null;
  isLoadingData: boolean;
  isLoadingLocation: boolean;
  dataError: string | null;
  locationError: string | null;
  searchError: string | null;

  // Actions
  setLocation: (location: LatLng | null) => void;
  setCategories: (categories: Set<MaterialCategory>) => void;
  setAllPoints: (points: CollectionPoint[]) => void;
  setFilteredPoints: (points: CollectionPoint[]) => void;
  setSelectedPoint: (id: string | null) => void;
  setDataError: (error: string | null) => void;
  setLocationError: (error: string | null) => void;
  setSearchError: (error: string | null) => void;
  setIsLoadingData: (loading: boolean) => void;
  setIsLoadingLocation: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  userLocation: null,
  selectedCategories: new Set<MaterialCategory>(),
  allPoints: [],
  filteredPoints: [],
  selectedPointId: null,
  isLoadingData: false,
  isLoadingLocation: false,
  dataError: null,
  locationError: null,
  searchError: null,

  // Actions
  setLocation: (location) => set({ userLocation: location }),

  // Use new Set(categories) to ensure Zustand detects the state change,
  // since its default equality check won't detect mutations to the same Set instance.
  setCategories: (categories) => set({ selectedCategories: new Set(categories) }),

  setAllPoints: (points) => set({ allPoints: points }),

  setFilteredPoints: (points) => set({ filteredPoints: points }),

  setSelectedPoint: (id) => set({ selectedPointId: id }),

  setDataError: (error) => set({ dataError: error }),

  setLocationError: (error) => set({ locationError: error }),

  setSearchError: (error) => set({ searchError: error }),

  setIsLoadingData: (loading) => set({ isLoadingData: loading }),

  setIsLoadingLocation: (loading) => set({ isLoadingLocation: loading }),
}));
