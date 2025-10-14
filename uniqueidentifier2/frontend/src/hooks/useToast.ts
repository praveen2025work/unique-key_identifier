import { useState, useCallback } from 'react';
import { Toast } from '../types';

export const useToast = () => {
  const [toast, setToast] = useState<Toast>({
    show: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showToast = useCallback((
    type: Toast['type'],
    title: string,
    message: string,
    duration = 5000
  ) => {
    setToast({
      show: true,
      type,
      title,
      message,
    });

    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};
