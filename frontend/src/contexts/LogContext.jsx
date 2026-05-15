import React, { createContext, useContext, useState, useCallback } from 'react';

const LogContext = createContext();

export const useLog = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLog must be used within LogProvider');
  }
  return context;
};

export const LogProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((type, message) => {
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const log = {
      id: Date.now() + Math.random(),
      type, // 'info', 'success', 'error', 'warning'
      message,
      timestamp
    };

    setLogs(prev => [...prev, log]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
};
