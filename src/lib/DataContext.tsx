import React, { createContext, useContext, useState, useCallback } from 'react';
import { DatasetInfo, AnalysisResult } from './data-processing';

interface DataContextType {
  currentDataset: DatasetInfo | null;
  setCurrentDataset: (dataset: DatasetInfo | null) => void;
  analysisResults: AnalysisResult[];
  addAnalysisResult: (result: AnalysisResult) => void;
  clearAnalysisResults: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [currentDataset, setCurrentDataset] = useState<DatasetInfo | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addAnalysisResult = useCallback((result: AnalysisResult) => {
    setAnalysisResults(prev => [...prev, result]);
  }, []);

  const clearAnalysisResults = useCallback(() => {
    setAnalysisResults([]);
  }, []);

  return (
    <DataContext.Provider
      value={{
        currentDataset,
        setCurrentDataset,
        analysisResults,
        addAnalysisResult,
        clearAnalysisResults,
        isProcessing,
        setIsProcessing,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
} 