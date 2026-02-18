import React from 'react'
import styles from '../../styles/GameBoard.module.css'
import { LiveActivity } from './LiveActivity'
import { GameStats } from './GameStats'      

export const GameBoard = () => {
  return (
    <div className={styles.boardContainer}>
      {/* Colonne Gauche : Activité en direct */}
      <aside className={styles.sidePanel}>
        <h3>Recent Activity</h3>
        <LiveActivity limit={10} />
      </aside>

      {/* Colonne Centrale : L'action */}
      <main className={styles.mainAction}>
        <div className={styles.riskIndicator}>
          <span>Current Risk: 10%</span>
        </div>
        {/*<BombButton /> Bouton a ajouter et à créer le fichier */}
        <p className={styles.hint}>Cost: 10 ALPH per turn</p>
      </main>

      {/* Colonne Droite : Stats du Contrat */}
      <aside className={styles.sidePanel}>
        <h3>Game Stats</h3>
        <GameStats />
      </aside>
    </div>
  )
}
