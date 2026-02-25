import React from 'react'
import { useBomberGame } from '@/hooks/useBomberGame'
import styles from '../../styles/GameStats.module.css'

export const GameStats = () => {
  const { gameData } = useBomberGame()

  if (!gameData || gameData.isLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingDot} />
        <span className={styles.loadingDot} />
        <span className={styles.loadingDot} />
      </div>
    )
  }

  if (gameData.error) {
    return <div className={styles.error}>❌ {gameData.error}</div>
  }

  // ✅ Fix: utilise totalPot (pas potAmount qui n'existe pas)
  const potInAlph = gameData.totalPot
    ? (Number(gameData.totalPot) / 1e18).toFixed(2)
    : '0.00'

  const ticketCount = gameData.ticketCount?.toString() ?? '0'
  const currentRisk = Number(gameData.currentRisk ?? 0)

  const riskColor = currentRisk >= 40
    ? 'var(--danger-red)'
    : currentRisk >= 20
      ? 'var(--warning-amber)'
      : 'var(--prize-green)'

  return (
    <div className={styles.container}>

      <div className={`${styles.statusBadge} ${gameData.isActive ? styles.active : styles.terminated}`}>
        <span className={styles.statusDot} />
        {gameData.isActive ? 'Live' : 'Terminated'}
      </div>

      {!gameData.isActive && (
        <div className={styles.explosionBox}>
          <span className={styles.explosionIcon}>💥</span>
          <div>
            <div className={styles.explosionTitle}>BOMB EXPLODED!</div>
            <div className={styles.explosionSub}>The game will restart soon.</div>
          </div>
        </div>
      )}

      <div className={styles.statRow}>
        <div className={styles.statLabel}>💰 Current Pot</div>
        <div className={styles.statValue} style={{ color: 'var(--prize-green)' }}>
          {potInAlph} <span className={styles.statUnit}>ALPH</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.statRow}>
        <div className={styles.statLabel}>🎫 Round Number</div>
        <div className={styles.statValue}>#{ticketCount}</div>
      </div>

      <div className={styles.divider} />

      <div className={styles.statRow}>
        <div className={styles.statLabel}>⚠️ Current Risk</div>
        <div className={styles.statValue} style={{ color: riskColor }}>
          {currentRisk}<span className={styles.statUnit}>%</span>
        </div>
      </div>

      <div className={styles.riskBar}>
        <div
          className={styles.riskFill}
          style={{
            width: `${Math.min(currentRisk * 2, 100)}%`,
            background: riskColor,
            boxShadow: `0 0 8px ${riskColor}80`
          }}
        />
      </div>

    </div>
  )
}
