import React, { useEffect, useState } from 'react'
import { useBomberGame } from '@/hooks/useBomberGame'
import styles from '../../styles/LoadingHistory.module.css'

export const LoadingHistory = () => {
  const { isLoadingHistory } = useBomberGame()
  const [dots, setDots] = useState('.')
  const [visible, setVisible] = useState(true)

  // Anime les points
  useEffect(() => {
    if (!isLoadingHistory) return
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [isLoadingHistory])

  // Fade-out à la fin du chargement
  useEffect(() => {
    if (!isLoadingHistory) {
      const t = setTimeout(() => setVisible(false), 600)
      return () => clearTimeout(t)
    }
    setVisible(true)
  }, [isLoadingHistory])

  if (!visible) return null

  return (
    <div className={`${styles.banner} ${!isLoadingHistory ? styles.fadeOut : ''}`}>
      <span className={styles.spinner}>⏳</span>
      <span className={styles.text}>
        {isLoadingHistory
          ? `Loading history${dots}`
          : '✅ History loaded!'
        }
      </span>
    </div>
  )
}
