import React, { useState } from 'react'
import { useWallet } from '@alephium/web3-react'
import styles from '../../styles/GameLayout.module.css'
import { useBomberGame } from '@/hooks/useBomberGame'
import { buyTicket } from '@/services/bomber.service'

export const MainAction = () => {
  const { connectionStatus, signer, account } = useWallet()
  const { gameData, refreshGameData } = useBomberGame()
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = async () => {
    console.log("Bouton cliqué. Status:", connectionStatus)

    if (connectionStatus !== 'connected' || !signer) {
      alert("Veuillez connecter votre wallet Alephium")
      return
    }

    if (!gameData.isActive) {
      alert("La bombe a explosé ! Attendez le round suivant.")
      return
    }

    try {
      setIsPlaying(true)
      console.log("Lancement de l'achat pour le compte:", account?.address)

      const result = await buyTicket(signer)

      console.log("Résultat reçu dans le composant:", result)

      // Optionnel: on peut attendre que la transaction soit "confirmée" 
      // mais un petit délai suffit souvent pour la mise à jour UI
      setTimeout(() => {
        console.log("Rafraîchissement des données du jeu...")
        refreshGameData()
      }, 4000)

    } catch (e: any) {
      console.error("Erreur capturée dans handlePlay:", e)
      alert(`Erreur: ${e.message || "Échec de la transaction"}`)
    } finally {
      setIsPlaying(false)
    }
  }

  // Conversion sécurisée pour l'affichage
  const riskLevel = gameData.currentRisk ? Number(gameData.currentRisk) : 0
  const priceAlph = gameData.currentPrice
    ? (Number(gameData.currentPrice) / 1e18).toFixed(2)
    : "0.00"

  return (
    <div className={styles.actionCard}>
      <div className={styles.riskCircle}>
        <div className={styles.riskValue}>{riskLevel}%</div>
        <div className={styles.riskLabel}>RISQUE</div>
      </div>

      <button
        className={styles.playButton}
        onClick={handlePlay}
        disabled={isPlaying || !gameData.isActive || connectionStatus !== 'connected'}
      >
        {isPlaying ? 'Signature en cours...' : `Prendre la Bombe (${priceAlph} ALPH)`}
      </button>

      {!gameData.isActive && (
        <p style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '10px', textAlign: 'center' }}>
          💥 BOMBE EXPLOSÉE ! <br/> Le jeu redémarrera bientôt.
        </p>
      )}
    </div>
  )
}
