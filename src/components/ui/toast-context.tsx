import  { createContext, useContext, useState, ReactNode } from "react";
import { Toast } from "@/components/ui/toast";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  icon?: ReactNode;
}

interface ToastContextType {
  showToast: (message: string, options?: {
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    icon?: ReactNode;
  }) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, options: {
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    icon?: ReactNode;
  } = {}) => {
    const { type = 'info', duration = 3000, icon } = options;
    const id = Date.now().toString();
    
    setToasts((prev) => [...prev, { id, message, type, duration, icon }]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
    
    return id;
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="min-w-[300px] max-w-md"
            >
              <Toast
                className={`
                  p-4 shadow-lg bg-card border flex justify-between items-center
                  ${toast.type === 'success' && 'border-l-4 border-l-green-500'}
                  ${toast.type === 'error' && 'border-l-4 border-l-red-500'}
                  ${toast.type === 'warning' && 'border-l-4 border-l-yellow-500'}
                  ${toast.type === 'info' && 'border-l-4 border-l-blue-500'}
                `}
              >
                <div className="flex items-center gap-3">
                  {toast.icon && <span>{toast.icon}</span>}
                  <p>{toast.message}</p>
                </div>
                <button 
                  onClick={() => hideToast(toast.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </Toast>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
