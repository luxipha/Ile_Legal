import React from 'react';
import { ToastProvider } from './ui/toast';

/**
 * ToastWrapper component to wrap the application with the ToastProvider
 * This allows toast notifications to be displayed throughout the app
 */
export const ToastWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ToastProvider>{children}</ToastProvider>;
};

export default ToastWrapper;
