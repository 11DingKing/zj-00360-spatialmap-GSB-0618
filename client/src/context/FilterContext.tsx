import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { BuildingUsage } from '../types';

export type ColorMode = 'usage' | 'year';

export interface FilterState {
  usage: BuildingUsage[];
  yearStart: number;
  yearEnd: number;
  isCoded: boolean | null;
  colorMode: ColorMode;
}

type FilterAction =
  | { type: 'SET_USAGE'; payload: BuildingUsage[] }
  | { type: 'TOGGLE_USAGE'; payload: BuildingUsage }
  | { type: 'SET_YEAR_START'; payload: number }
  | { type: 'SET_YEAR_END'; payload: number }
  | { type: 'SET_IS_CODED'; payload: boolean | null }
  | { type: 'SET_COLOR_MODE'; payload: ColorMode }
  | { type: 'RESET' };

const initialState: FilterState = {
  usage: [],
  yearStart: 1900,
  yearEnd: new Date().getFullYear(),
  isCoded: null,
  colorMode: 'usage',
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_USAGE':
      return { ...state, usage: action.payload };
    case 'TOGGLE_USAGE': {
      const usage = state.usage.includes(action.payload)
        ? state.usage.filter((u) => u !== action.payload)
        : [...state.usage, action.payload];
      return { ...state, usage };
    }
    case 'SET_YEAR_START':
      return { ...state, yearStart: action.payload };
    case 'SET_YEAR_END':
      return { ...state, yearEnd: action.payload };
    case 'SET_IS_CODED':
      return { ...state, isCoded: action.payload };
    case 'SET_COLOR_MODE':
      return { ...state, colorMode: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface FilterContextType {
  state: FilterState;
  dispatch: React.Dispatch<FilterAction>;
  setUsage: (usage: BuildingUsage[]) => void;
  toggleUsage: (usage: BuildingUsage) => void;
  setYearStart: (year: number) => void;
  setYearEnd: (year: number) => void;
  setIsCoded: (value: boolean | null) => void;
  setColorMode: (mode: ColorMode) => void;
  reset: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  const setUsage = (usage: BuildingUsage[]) => dispatch({ type: 'SET_USAGE', payload: usage });
  const toggleUsage = (usage: BuildingUsage) => dispatch({ type: 'TOGGLE_USAGE', payload: usage });
  const setYearStart = (year: number) => dispatch({ type: 'SET_YEAR_START', payload: year });
  const setYearEnd = (year: number) => dispatch({ type: 'SET_YEAR_END', payload: year });
  const setIsCoded = (value: boolean | null) => dispatch({ type: 'SET_IS_CODED', payload: value });
  const setColorMode = (mode: ColorMode) => dispatch({ type: 'SET_COLOR_MODE', payload: mode });
  const reset = () => dispatch({ type: 'RESET' });

  return (
    <FilterContext.Provider
      value={{
        state,
        dispatch,
        setUsage,
        toggleUsage,
        setYearStart,
        setYearEnd,
        setIsCoded,
        setColorMode,
        reset,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
