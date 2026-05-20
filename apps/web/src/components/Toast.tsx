import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface ToastItem {
  id: number;
  kind: 'ok' | 'error';
  text: string;
}

const Ctx = createContext<(kind: 'ok' | 'error', text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: 'ok' | 'error', text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3500);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status">
        {items.map((i) => (
          <div key={i.id} className={`toast ${i.kind}`}>
            {i.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
