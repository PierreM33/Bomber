import React from 'react'
import styles from '../../styles/GameLayout.module.css'
import { LiveActivity } from '../game/LiveActivity'
import { GameStats } from '../game/GameStats'
import { MainAction } from '../game/MainAction'
import { ClaimRewards } from '../game/ClaimRewards'

export const GameLayout = () => {
  return (
    <div className={styles.layoutContainer}>
      {/* COLONNE GAUCHE */}
      <aside className={styles.sidePanel}>
        <h3 className={styles.panelTitle}>Activités Récentes</h3>
        <LiveActivity />
      </aside>

      {/* COLONNE CENTRALE */}
      <main className={styles.centerPanel}>
        <MainAction />

        {/* ✅ NOUVEAU - Composant de claim des rewards */}
        <ClaimRewards />
      </main>

      {/* COLONNE DROITE */}
      <aside className={styles.sidePanel}>
        <h3 className={styles.panelTitle}>État du Contrat</h3>
        <GameStats />
      </aside>
    </div>
  )
}
