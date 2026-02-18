import React, { useState, useEffect } from 'react'
import { useWallet } from '@alephium/web3-react'
import { useBomberGame } from '@/hooks/useBomberGame'
import { claimRewards, hasTicketClaimed } from '@/services/bomber.service'
import { TxStatus } from '../TxStatus'
import { node } from '@alephium/web3'

export const ClaimRewards = () => {
  const { connectionStatus, signer } = useWallet()
  const { gameData } = useBomberGame()
  const [ticketIndex, setTicketIndex] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  const [ongoingTxId, setOngoingTxId] = useState<string>()
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)
  const [estimatedReward, setEstimatedReward] = useState<number | null>(null)

  // Vérifier si un ticket a déjà été claim quand on change l'index
  useEffect(() => {
    if (ticketIndex && !isNaN(Number(ticketIndex))) {
      checkClaimStatus(BigInt(ticketIndex))
    } else {
      setAlreadyClaimed(false)
      setEstimatedReward(null)
    }
  }, [ticketIndex])

  const checkClaimStatus = async (index: bigint) => {
    setCheckingStatus(true)
    try {
      const claimed = await hasTicketClaimed(index)
      setAlreadyClaimed(claimed)

      // Calculer la récompense estimée si pas encore claim
      if (!claimed && !gameData.isActive) {
        const totalTickets = Number(gameData.ticketCount)
        const ticketIdx = Number(index)

        if (ticketIdx < totalTickets) {
          // Formule: ticketsAfter / totalShares * redistributionPool
          const ticketsAfter = totalTickets - ticketIdx
          const totalShares = (totalTickets * (totalTickets + 1)) / 2

          // On estime que redistributionPool = 10% du pot
          const estimatedPool = Number(gameData.potAmount) * 0.099 / 1e18 // 10% - 1% platform fee
          const reward = (estimatedPool * ticketsAfter) / totalShares

          setEstimatedReward(reward)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleClaim = async () => {
    if (connectionStatus !== 'connected' || !signer) {
      alert("Veuillez connecter votre wallet !")
      return
    }

    if (!ticketIndex || isNaN(Number(ticketIndex))) {
      alert("Veuillez entrer un numéro de ticket valide")
      return
    }

    if (gameData.isActive) {
      alert("Impossible de claim pendant qu'une partie est en cours !")
      return
    }

    if (alreadyClaimed) {
      alert("Ce ticket a déjà été claim !")
      return
    }

    try {
      setIsClaiming(true)
      const result = await claimRewards(signer, BigInt(ticketIndex))

      console.log("✅ Rewards claimed! TX ID:", result.txId)
      setOngoingTxId(result.txId)

      // Reset après claim
      setTimeout(() => {
        setTicketIndex('')
        setEstimatedReward(null)
      }, 3000)

    } catch (error: any) {
      console.error("❌ Erreur lors du claim:", error)
      alert(`Erreur: ${error.message || 'Claim échoué'}`)
    } finally {
      setIsClaiming(false)
    }
  }

  const txStatusCallback = async (status: node.TxStatus, numberOfChecks: number): Promise<unknown> => {
    if (status.type === 'Confirmed' && numberOfChecks > 2) {
      console.log("✅ Claim confirmé!")
      setOngoingTxId(undefined)
    }

    if (status.type === 'TxNotFound' && numberOfChecks > 3) {
      setOngoingTxId(undefined)
    }

    return Promise.resolve()
  }

  // N'afficher ce composant que si le jeu est terminé
  if (gameData.isActive) {
    return null
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '12px',
      border: '2px solid #FFD700',
      marginTop: '20px'
    }}>
      <h3 style={{
        margin: '0 0 15px 0',
        color: '#FFD700',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        💎 Claim Your Rewards
      </h3>

      {ongoingTxId && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <TxStatus txId={ongoingTxId} txStatusCallback={txStatusCallback} />
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Numéro de ticket (Index):
        </label>
        <input
          type="number"
          min="0"
          value={ticketIndex}
          onChange={(e) => setTicketIndex(e.target.value)}
          placeholder="Ex: 0, 1, 2..."
          disabled={isClaiming}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          💡 Les tickets #0 reçoivent le plus, #N le moins
        </div>
      </div>

      {checkingStatus && (
        <div style={{ padding: '10px', color: '#666', fontSize: '14px' }}>
          ⏳ Vérification du ticket...
        </div>
      )}

      {alreadyClaimed && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ff444420',
          border: '1px solid #ff4444',
          borderRadius: '6px',
          color: '#ff4444',
          fontSize: '14px',
          marginBottom: '10px'
        }}>
          ⚠️ Ce ticket a déjà été claim
        </div>
      )}

      {estimatedReward !== null && !alreadyClaimed && (
        <div style={{
          padding: '12px',
          backgroundColor: '#4CAF5020',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
            Récompense estimée
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
            ~{estimatedReward.toFixed(4)} ALPH
          </div>
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={
          isClaiming ||
          connectionStatus !== 'connected' ||
          !ticketIndex ||
          alreadyClaimed ||
          checkingStatus
        }
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: (isClaiming || !ticketIndex || alreadyClaimed || checkingStatus)
            ? '#ccc'
            : '#FFD700',
          color: (isClaiming || !ticketIndex || alreadyClaimed || checkingStatus)
            ? '#666'
            : '#000',
          border: 'none',
          borderRadius: '8px',
          cursor: (isClaiming || !ticketIndex || alreadyClaimed || checkingStatus)
            ? 'not-allowed'
            : 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        {isClaiming
          ? '⏳ Claim en cours...'
          : connectionStatus !== 'connected'
            ? '🔒 Connectez votre wallet'
            : alreadyClaimed
              ? '✅ Déjà récupéré'
              : '💎 Récupérer les rewards'
        }
      </button>

      <div style={{
        marginTop: '15px',
        padding: '12px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>ℹ️ Comment ça marche :</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>10% du pot total est redistribué proportionnellement</li>
          <li>Les premiers tickets (#0) reçoivent plus que les derniers</li>
          <li>Vous pouvez claim autant de tickets que vous avez achetés</li>
          <li>Les claims sont possibles après l'explosion de la bombe</li>
        </ul>
      </div>
    </div>
  )
}
