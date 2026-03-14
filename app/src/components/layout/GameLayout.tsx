import React from 'react'
import styles from '../../styles/GameLayout.module.css'
import { BomberGameProvider } from '@/contexts/BomberGameContext'
import { LiveActivity } from '../game/LiveActivity'
import { GameStats } from '../game/GameStats'
import { MainAction } from '../game/MainAction'
import { ClaimRewards } from '../game/ClaimRewards'

export const GameLayout = () => {
  return (
    <BomberGameProvider>
      <div className={styles.layoutContainer}>
        <aside className={styles.sidePanel}>
          <h3 className={styles.panelTitle}>Recent Activities</h3>
          <LiveActivity />
        </aside>

        <main className={styles.centerPanel}>
          <MainAction />
          <ClaimRewards />
        </main>

        <aside className={styles.sidePanel}>
          <h3 className={styles.panelTitle}>Game State</h3>
          <GameStats />
        </aside>
      </div>
    </BomberGameProvider>
  )
}
