import React from 'react'
import styles from '../../styles/GameLayout.module.css'
import { LiveActivity } from '../game/LiveActivity'
import { GameStats } from '../game/GameStats'
import { MainAction } from '../game/MainAction'
import { ClaimRewards } from '../game/ClaimRewards'
import { LoadingHistory } from '../game/LoadingHistory'

export const GameLayout = () => {
  return (
    <>
      {/* Banner HORS du layout — ne perturbe pas les colonnes */}
      <LoadingHistory />

      <div className={styles.layoutContainer}>
        {/* COLONNE GAUCHE */}
        <aside className={styles.sidePanel}>
          <h3 className={styles.panelTitle}>Recent Activities</h3>
          <LiveActivity />
        </aside>

        {/* COLONNE CENTRALE */}
        <main className={styles.centerPanel}>
          <MainAction />
          <ClaimRewards />
        </main>

        {/* COLONNE DROITE */}
        <aside className={styles.sidePanel}>
          <h3 className={styles.panelTitle}>Game State</h3>
          <GameStats />
        </aside>
      </div>
    </>
  )
}
