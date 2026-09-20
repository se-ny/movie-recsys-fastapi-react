import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const notify = useCallback((message, type = 'success') => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 3200)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
