import React from 'react'
import { useBomberGame } from '@/hooks/useBomberGame'
import styles from '../../styles/LiveActivity.module.css'

function shortAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

function timeAgo(timestamp: number): string {
  if (timestamp === 0) return 'Earlier'
  const diff = Math.floor((Date.now() - timestamp) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export const LiveActivity = () => {
  const { recentActivities, isLoadingHistory } = useBomberGame()

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoadingHistory) {
    return (
      <div className={styles.loadingMsg}>
        ⏳ Loading activity...
      </div>
    )
  }

  if (recentActivities.length === 0) {
    return <div className={styles.empty}>No recent activity...</div>
  }

  return (
    <div className={styles.container}>
      {recentActivities.map((activity, index) => (
        <div key={index} className={styles.activityRow}>
          {activity.action === 'exploded' ? (
            <>
              <div className={styles.activityTop}>
                <span className={styles.addressExploded}>{shortAddress(activity.player)}</span>
                <span className={styles.explodedBadge}>💥 BOOM!</span>
              </div>
              <div className={styles.activityMeta}>{timeAgo(activity.timestamp)}</div>
            </>
          ) : (
            <>
              <div className={styles.activityTop}>
                <span className={styles.address}>{shortAddress(activity.player)}</span>
                <span className={styles.survivedBadge}>✅ survived</span>
              </div>
              <div className={styles.activityMeta}>
                Ticket #{activity.ticketIndex}
                {activity.price && ` · ${activity.price.toFixed(2)} ALPH`}
                {activity.risk !== undefined && ` · Risk: ${activity.risk}%`}
                {' · '}{timeAgo(activity.timestamp)}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
