import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import type { BuildingWithRelations, Building } from '../types';
import { buildingApi } from '../services/api';

export interface BuildingState {
  buildings: BuildingWithRelations[];
  loading: boolean;
  error: string | null;
}

type BuildingAction =
  | { type: 'SET_BUILDINGS'; payload: BuildingWithRelations[] }
  | { type: 'ADD_BUILDING'; payload: BuildingWithRelations }
  | { type: 'UPDATE_BUILDING'; payload: BuildingWithRelations }
  | { type: 'DELETE_BUILDING'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: BuildingState = {
  buildings: [],
  loading: false,
  error: null,
};

function buildingReducer(state: BuildingState, action: BuildingAction): BuildingState {
  switch (action.type) {
    case 'SET_BUILDINGS':
      return { ...state, buildings: action.payload, loading: false, error: null };
    case 'ADD_BUILDING':
      return { ...state, buildings: [...state.buildings, action.payload] };
    case 'UPDATE_BUILDING':
      return {
        ...state,
        buildings: state.buildings.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BUILDING':
      return {
        ...state,
        buildings: state.buildings.filter((b) => b.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

interface BuildingContextType {
  state: BuildingState;
  dispatch: React.Dispatch<BuildingAction>;
  setBuildings: (buildings: BuildingWithRelations[]) => void;
  addBuilding: (building: BuildingWithRelations) => void;
  updateBuilding: (building: BuildingWithRelations) => void;
  deleteBuilding: (id: string) => void;
  fetchBuildings: (params?: any) => Promise<void>;
  createBuilding: (data: any) => Promise<Building | null>;
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined);

export function BuildingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(buildingReducer, initialState);

  const setBuildings = useCallback((buildings: BuildingWithRelations[]) => {
    dispatch({ type: 'SET_BUILDINGS', payload: buildings });
  }, []);

  const addBuilding = useCallback((building: BuildingWithRelations) => {
    dispatch({ type: 'ADD_BUILDING', payload: building });
  }, []);

  const updateBuilding = useCallback((building: BuildingWithRelations) => {
    dispatch({ type: 'UPDATE_BUILDING', payload: building });
  }, []);

  const deleteBuilding = useCallback((id: string) => {
    dispatch({ type: 'DELETE_BUILDING', payload: id });
  }, []);

  const fetchBuildings = useCallback(async (params?: any) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await buildingApi.getBuildings(params);
      if (response.data.success) {
        dispatch({ type: 'SET_BUILDINGS', payload: response.data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.data.message });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || '获取数据失败' });
    }
  }, []);

  const createBuilding = useCallback(async (data: any) => {
    try {
      const response = await buildingApi.createBuilding(data);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('创建建筑失败:', error);
      return null;
    }
  }, []);

  return (
    <BuildingContext.Provider
      value={{
        state,
        dispatch,
        setBuildings,
        addBuilding,
        updateBuilding,
        deleteBuilding,
        fetchBuildings,
        createBuilding,
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
}

export function useBuildings() {
  const context = useContext(BuildingContext);
  if (context === undefined) {
    throw new Error('useBuildings must be used within a BuildingProvider');
  }
  return context;
}
