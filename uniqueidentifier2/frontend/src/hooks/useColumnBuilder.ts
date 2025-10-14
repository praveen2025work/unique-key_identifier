import { useState, useCallback } from 'react';
import { BuilderMode, ColumnBuilderState } from '../types';

export const useColumnBuilder = () => {
  const [state, setState] = useState<ColumnBuilderState>({
    activeBuilder: 'include',
    includeBuilder: [],
    excludeBuilder: [],
    includedCombinations: [],
    excludedCombinations: [],
  });

  const setActiveBuilder = useCallback((mode: BuilderMode) => {
    setState(prev => ({ ...prev, activeBuilder: mode }));
  }, []);

  const addColumnToActiveBuilder = useCallback((column: string) => {
    setState(prev => {
      const builderKey = prev.activeBuilder === 'include' ? 'includeBuilder' : 'excludeBuilder';
      const currentBuilder = prev[builderKey];
      
      if (!currentBuilder.includes(column)) {
        return {
          ...prev,
          [builderKey]: [...currentBuilder, column],
        };
      }
      return prev;
    });
  }, []);

  const removeColumnFromBuilder = useCallback((index: number, mode: BuilderMode) => {
    setState(prev => {
      const builderKey = mode === 'include' ? 'includeBuilder' : 'excludeBuilder';
      const currentBuilder = prev[builderKey];
      
      return {
        ...prev,
        [builderKey]: currentBuilder.filter((_, i) => i !== index),
      };
    });
  }, []);

  const addIncludeCombination = useCallback(() => {
    setState(prev => {
      if (prev.includeBuilder.length === 0) return prev;
      
      const combo = prev.includeBuilder.join(',');
      if (!prev.includedCombinations.includes(combo)) {
        return {
          ...prev,
          includedCombinations: [...prev.includedCombinations, combo],
          includeBuilder: [],
        };
      }
      return { ...prev, includeBuilder: [] };
    });
  }, []);

  const addExcludeCombination = useCallback(() => {
    setState(prev => {
      if (prev.excludeBuilder.length === 0) return prev;
      
      const combo = prev.excludeBuilder.join(',');
      if (!prev.excludedCombinations.includes(combo)) {
        return {
          ...prev,
          excludedCombinations: [...prev.excludedCombinations, combo],
          excludeBuilder: [],
        };
      }
      return { ...prev, excludeBuilder: [] };
    });
  }, []);

  const removeCombination = useCallback((index: number, type: 'include' | 'exclude') => {
    setState(prev => {
      const key = type === 'include' ? 'includedCombinations' : 'excludedCombinations';
      return {
        ...prev,
        [key]: prev[key].filter((_, i) => i !== index),
      };
    });
  }, []);

  const clearBuilder = useCallback((mode: BuilderMode) => {
    setState(prev => ({
      ...prev,
      [mode === 'include' ? 'includeBuilder' : 'excludeBuilder']: [],
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState({
      activeBuilder: 'include',
      includeBuilder: [],
      excludeBuilder: [],
      includedCombinations: [],
      excludedCombinations: [],
    });
  }, []);

  const loadState = useCallback((newState: Partial<ColumnBuilderState>) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  return {
    ...state,
    setActiveBuilder,
    addColumnToActiveBuilder,
    removeColumnFromBuilder,
    addIncludeCombination,
    addExcludeCombination,
    removeCombination,
    clearBuilder,
    resetAll,
    loadState,
  };
};
