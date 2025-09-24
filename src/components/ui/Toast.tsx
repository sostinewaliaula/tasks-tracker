import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon, XIcon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration: number = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  onHide: (id: string) => void;
}

function ToastContainer({ toasts, onHide }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onHide: (id: string) => void;
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleHide = () => {
    setIsLeaving(true);
    setTimeout(() => onHide(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "pointer-events-auto transform transition-all duration-300 ease-in-out max-w-sm w-full";
    const visibilityStyles = isVisible && !isLeaving 
      ? "translate-x-0 opacity-100 scale-100" 
      : "translate-x-full opacity-0 scale-95";
    
    return `${baseStyles} ${visibilityStyles}`;
  };

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return "bg-gradient-to-r from-green-500 to-green-600 border-green-200 dark:border-green-700";
      case 'error':
        return "bg-gradient-to-r from-red-500 to-red-600 border-red-200 dark:border-red-700";
      case 'warning':
        return "bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-200 dark:border-yellow-700";
      case 'info':
        return "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-200 dark:border-blue-700";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 border-gray-200 dark:border-gray-700";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-white" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-white" />;
      case 'warning':
        return <AlertCircleIcon className="h-5 w-5 text-white" />;
      case 'info':
        return <AlertCircleIcon className="h-5 w-5 text-white" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-white" />;
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className={`${getTypeStyles()} rounded-xl shadow-xl border backdrop-blur-sm`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">
                {toast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleHide}
                className="inline-flex text-white hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg p-1 transition-colors duration-200"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-white/20 rounded-b-xl overflow-hidden">
          <div 
            className="h-full bg-white/40 transition-all ease-linear"
            style={{
              animation: `shrink ${toast.duration || 5000}ms linear forwards`
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
