import React, { useState, useEffect } from 'react' // Ajout de useEffect
import { useWallet } from '@alephium/web3-react'
import styles from '../../styles/GameLayout.module.css'
import { useBomberGame } from '@/hooks/useBomberGame'
import { buyTicket } from '@/services/bomber.service'

export const MainAction = () => {
  const { connectionStatus, signer, account } = useWallet()
  const { gameData, refreshGameData } = useBomberGame()
  const [isPlaying, setIsPlaying] = useState(false)

  // Log automatique à chaque mise à jour des données du contrat
  useEffect(() => {
    if (gameData && !gameData.isLoading) {
      console.group('📄 Smart Contract State Update');
      console.log('Status:', gameData.isActive ? '🟢 Active' : '🔴 Terminated');
      console.log('Pot Amount:', (Number(gameData.potAmount) / 1e18).toFixed(4), 'ALPH');
      console.log('Price:', (Number(gameData.currentPrice) / 1e18).toFixed(4), 'ALPH');
      console.log('Current Risk:', gameData.currentRisk, '%');
      console.log('Round:', gameData.ticketCount);
      console.log('Raw Data:', gameData);
      console.groupEnd();
    }
  }, [gameData]);

  const handlePlay = async () => {
    if (connectionStatus !== 'connected' || !signer) {
      alert("Please connect your Alephium wallet")
      return
    }
    if (!gameData?.isActive) {
      alert("The bomb exploded! Wait for the next round.")
      return
    }
    try {
      setIsPlaying(true)

      console.group('🚀 Transaction Outbound');
      console.log("Wallet:", account?.address);
      console.log("Price to Pay:", (Number(gameData.currentPrice) / 1e18).toFixed(4), "ALPH");

      const result = await buyTicket(signer)

      console.log("Transaction Result:", result);
      console.groupEnd();

      // Petit délai pour laisser la blockchain indexer avant de refresh
      setTimeout(() => {
        console.log("🔄 Refreshing game data...");
        refreshGameData();
      }, 4000);

    } catch (e: any) {
      console.error("❌ Transaction Failed:", e);
      alert(`Error: ${e.message || "Transaction failed"}`)
    } finally {
      setIsPlaying(false)
    }
  }

  const priceAlph = gameData?.currentPrice
    ? (Number(gameData.currentPrice) / 1e18).toFixed(2)
    : "0.00"

  const isDisabled = isPlaying || !gameData?.isActive || connectionStatus !== 'connected'

  return (
    <div className={styles.actionCard}>
      <button
        className={styles.playButton}
        onClick={handlePlay}
        disabled={isDisabled}
      >
        {isPlaying
          ? '⏳ Signing...'
          : `💣 Take the bomb (${priceAlph} ALPH)`
        }
      </button>

      {connectionStatus !== 'connected' && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
          Connect your wallet to play
        </p>
      )}
    </div>
  )
}
