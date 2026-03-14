import React, { useState } from 'react'
import { useWallet } from '@alephium/web3-react'
import { useBomberGameContext } from '@/contexts/BomberGameContext'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { buyTicket } from '@/services/bomber.service'
import styles from '../../styles/GameLayout.module.css'

type BuyState = 'idle' | 'signing' | 'confirming'

export const MainAction = () => {
  const { connectionStatus, signer } = useWallet()
  const { gameData, forceRefresh } = useBomberGameContext()
  const { toasts, addToast, removeToast } = useToast()
  const [buyState, setBuyState] = useState<BuyState>('idle')
  // ✅ Prix snapshotté au moment du clic pour éviter l'affichage d'un mauvais prix pendant la TX
  const [lockedPrice, setLockedPrice] = useState<string | null>(null)

  const handleBuy = async () => {
    if (!signer || connectionStatus !== 'connected' || buyState !== 'idle') return

    // Snapshot du prix affiché au moment où l'utilisateur clique
    const priceAtClick = gameData?.currentPrice
      ? (Number(gameData.currentPrice) / 1e18).toFixed(2)
      : '?'
    setLockedPrice(priceAtClick)

    try {
      setBuyState('signing')

      // Appel au service (qui renvoie txId, pricePaid et oracleValue)
      const result = await buyTicket(signer)

      setBuyState('confirming')
      addToast('⏳ Confirmation en cours...', 'info', `Transaction: ${result.txId.slice(0, 16)}...`)

      // Attente de 15s pour laisser le temps au bloc d'être miné sur le Testnet
      await new Promise(resolve => setTimeout(resolve, 15000))

      // Refresh forcé des données du jeu (pour voir le nouveau prix et le nouveau risque)
      await forceRefresh()

      const paid = (Number(result.pricePaid) / 1e18).toFixed(2)

      // ✅ Calcul du message Oracle pour le Toast
      // On compare la valeur tirée par l'oracle au risque actuel
      const currentRisk = Number(gameData?.currentRisk ?? 0)
      let oracleMsg = ''
      if (result.oracleValue) {
        oracleMsg = ` (Oracle: ${result.oracleValue} vs Risque: ${currentRisk}%)`
      }

      addToast(
        '🎫 Ticket acheté !',
        'success',
        `Payé ${paid} ALPH${oracleMsg} · Tx: ${result.txId.slice(0, 8)}...`
      )

      // Petit log console pour débugger si besoin
      if (result.oracleValue) {
        console.log(`🎲 [GAME_RESULT] Oracle: ${result.oracleValue} | Risk: ${currentRisk}%`)
      }

    } catch (e: any) {
      console.error('Erreur achat:', e)
      addToast('❌ Échec de l\'achat', 'error', (e?.message ?? 'Erreur inconnue').slice(0, 100))
    } finally {
      // Dans tous les cas on débloque le bouton
      setBuyState('idle')
      setLockedPrice(null)
    }
  }

  // Calcul du prix à afficher sur le bouton
  const displayPrice = buyState !== 'idle' && lockedPrice
    ? lockedPrice
    : gameData?.currentPrice
      ? (Number(gameData.currentPrice) / 1e18).toFixed(2)
      : '...'

  const currentRisk = Number(gameData?.currentRisk ?? 0)

  // Désactivation du bouton si chargement, non connecté ou jeu inactif
  const isDisabled =
    buyState !== 'idle' ||
    connectionStatus !== 'connected' ||
    !gameData?.isActive ||
    gameData?.isLoading

  // Libellés dynamiques du bouton
  const buttonLabel = {
    idle:       `🎯 PRENDRE LA BOMBE (${displayPrice} ALPH)`,
    signing:    `✍️ Signature du wallet... (${displayPrice} ALPH)`,
    confirming: '⏳ Confirmation sur la blockchain...',
  }[buyState]

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className={styles.actionCard}>
        <button
          className={styles.playButton}
          onClick={handleBuy}
          disabled={isDisabled}
        >
          {buttonLabel}
        </button>

        {/* Affichage du risque actuel sous le bouton */}
        {currentRisk > 0 && buyState === 'idle' && (
          <div className={styles.riskBadge}>
            ⚠️ Risque actuel : {currentRisk}%
          </div>
        )}

        {/* Message si le wallet n'est pas connecté */}
        {connectionStatus !== 'connected' && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '10px' }}>
            Connectez votre wallet pour jouer
          </p>
        )}
      </div>
    </>
  )
}
