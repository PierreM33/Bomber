import React, { useEffect, useState } from 'react'
import { Toast as ToastType, ToastType as TType } from '@/hooks/useToast'
import styles from '../../styles/Toast.module.css'

interface ToastItemProps {
  toast: ToastType
  onRemove: (id: number) => void
}

const ICONS: Record<TType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️'
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slide-in
    const t1 = setTimeout(() => setVisible(true), 10)
    // Slide-out avant suppression
    const t2 = setTimeout(() => setVisible(false), 4400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]} ${visible ? styles.visible : ''}`}
      onClick={() => onRemove(toast.id)}
    >
      <span className={styles.icon}>{ICONS[toast.type]}</span>
      <div className={styles.content}>
        <div className={styles.message}>{toast.message}</div>
        {toast.detail && <div className={styles.detail}>{toast.detail}</div>}
      </div>
      <button className={styles.close} onClick={() => onRemove(toast.id)}>×</button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastType[]
  onRemove: (id: number) => void
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  if (toasts.length === 0) return null
  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}
