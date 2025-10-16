'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import axios, { AxiosInstance } from 'axios';

interface ApiContextType {
  api: AxiosInstance;
  endpoint: string;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  endpoint: string;
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ endpoint, children }) => {
  const api = axios.create({
    baseURL: endpoint,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return (
    <ApiContext.Provider value={{ api, endpoint }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
