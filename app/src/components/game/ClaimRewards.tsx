import React, { useState } from 'react'
import { useWallet } from '@alephium/web3-react'
import { useBomberGameContext } from '@/contexts/BomberGameContext'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { claimRewards } from '@/services/bomber.service'
import styles from '../../styles/ClaimRewards.module.css'

export const ClaimRewards = () => {
  const { connectionStatus, signer } = useWallet()
  const { gameData, myTickets, isLoadingTickets, markTicketClaimed } = useBomberGameContext()
  const { toasts, addToast, removeToast } = useToast()
  const [claimingIndex, setClaimingIndex] = useState<bigint | null>(null)
  const [claimedAmounts, setClaimedAmounts] = useState<Record<string, number>>({})

  // Jeu actif → invisible
  if (!gameData || gameData.isActive || gameData.isLoading) return null

  // ── Chargement en cours ───────────────────────────────────────────────────────
  if (isLoadingTickets) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>💎</span>
          <span className={styles.headerTitle}>Your Rewards</span>
        </div>
        <div className={styles.loadingMsg}>
          <span className={styles.loadingSpinner} />
          Checking your tickets...
        </div>
      </div>
    )
  }

  // Aucun ticket → invisible
  if (myTickets.length === 0) return null

  const estimateReward = (ticketIndex: bigint): number => {
    const totalTickets = Number(gameData.ticketCount)
    const idx = Number(ticketIndex)
    if (totalTickets === 0 || idx >= totalTickets) return 0
    const redistributionPool = gameData.redistributionPool ?? 0n
    if (redistributionPool === 0n) return 0
    const ticketsAfter = totalTickets - idx
    const totalShares = (totalTickets * (totalTickets + 1)) / 2
    return Math.max(0, (Number(redistributionPool) / 1e18 * ticketsAfter) / totalShares)
  }

  const handleClaim = async (ticketIndex: bigint, ticketContractId: string) => {
    if (!signer || connectionStatus !== 'connected') return
    const reward = estimateReward(ticketIndex)
    try {
      setClaimingIndex(ticketIndex)
      const result = await claimRewards(signer, ticketContractId)
      setClaimedAmounts(prev => ({ ...prev, [ticketIndex.toString()]: reward }))
      markTicketClaimed(ticketIndex)
      addToast(`Ticket #${ticketIndex} claimed!`, 'success', `+${reward.toFixed(3)} ALPH · Tx: ${result.txId.slice(0, 12)}...`)
    } catch (e: any) {
      addToast(`Claim failed`, 'error', e.message?.slice(0, 80))
    } finally {
      setClaimingIndex(null)
    }
  }

  const unclaimedTickets = myTickets.filter(t => !t.claimed)
  const claimedTickets   = myTickets.filter(t => t.claimed)
  const totalReward      = unclaimedTickets.reduce((sum, t) => sum + estimateReward(t.ticketIndex), 0)

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>💎</span>
          <span className={styles.headerTitle}>Your Rewards</span>
          {unclaimedTickets.length > 0 && (
            <span className={styles.ticketCount}>
              {unclaimedTickets.length} to claim
              {totalReward > 0 && <span className={styles.totalReward}> · ~{totalReward.toFixed(3)} ALPH</span>}
            </span>
          )}
        </div>

        <div className={styles.ticketList}>
          {unclaimedTickets.map(ticket => {
            const reward = estimateReward(ticket.ticketIndex)
            const isClaiming = claimingIndex === ticket.ticketIndex
            return (
              <div key={ticket.ticketIndex.toString()} className={styles.ticketRow}>
                <div className={styles.ticketInfo}>
                  <div className={styles.ticketIndex}>Ticket #{ticket.ticketIndex.toString()}</div>
                  <div className={styles.ticketMeta}>Bought at {ticket.price.toFixed(2)} ALPH</div>
                </div>
                <div className={styles.ticketRight}>
                  <div className={styles.ticketReward}>~{reward.toFixed(3)} ALPH</div>
                  <button
                    className={`${styles.claimBtn} ${isClaiming ? styles.claimBtnLoading : ''}`}
                    onClick={() => handleClaim(ticket.ticketIndex, ticket.ticketContractId)}
                    disabled={isClaiming || connectionStatus !== 'connected'}
                  >
                    {isClaiming ? '⏳' : '💎 Claim'}
                  </button>
                </div>
              </div>
            )
          })}

          {claimedTickets.map(ticket => {
            const amount = claimedAmounts[ticket.ticketIndex.toString()]
            return (
              <div key={ticket.ticketIndex.toString()} className={`${styles.ticketRow} ${styles.ticketRowClaimed}`}>
                <div className={styles.ticketInfo}>
                  <div className={styles.ticketIndex}>Ticket #{ticket.ticketIndex.toString()}</div>
                  <div className={styles.ticketMeta}>Bought at {ticket.price.toFixed(2)} ALPH</div>
                </div>
                <div className={styles.ticketRight}>
                  {amount !== undefined && <div className={styles.claimedAmount}>+{amount.toFixed(3)} ALPH</div>}
                  <div className={styles.claimedBadge}>✅ Claimed</div>
                </div>
              </div>
            )
          })}
        </div>

        {connectionStatus !== 'connected' && (
          <p className={styles.connectWarning}>Connect your wallet to claim</p>
        )}
      </div>
    </>
  )
}
