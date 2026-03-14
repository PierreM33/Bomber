import React, { useEffect, useState } from 'react'
import styles from '../../styles/Header.module.css'
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react'
import Link from 'next/link'
import { getPlatformAddress, restartGame, withdrawFunds } from '@/services/bomber.service'
import { useBomberGame } from '@/hooks/useBomberGame'

const OwnerButtons = () => {
  const { account, signer, connectionStatus } = useWallet()
  const { gameData, refreshGameData } = useBomberGame()
  const [platformAddress, setPlatformAddress] = useState<string | null>(null)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [txDone, setTxDone] = useState(false)

  useEffect(() => {
    getPlatformAddress()
      .then(setPlatformAddress)
      .catch(() => {})
  }, [])

  const isOwner = account?.address && platformAddress && account.address === platformAddress
  const gameTerminated = gameData && !gameData.isActive && !gameData.isLoading

  if (!isOwner) return null

  const handleRestart = async () => {
    if (!signer || connectionStatus !== 'connected') return
    try {
      setIsRestarting(true)
      setTxDone(false)
      await restartGame(signer)
      setTxDone(true)
      await new Promise(res => setTimeout(res, 8000))
      await refreshGameData()
      setTimeout(() => setTxDone(false), 3000)
    } catch (e: any) {
      console.error('❌ Restart failed:', e)
      alert(`Restart failed: ${e.message?.slice(0, 100) ?? 'Unknown error'}`)
    } finally {
      setIsRestarting(false)
    }
  }

  const handleWithdraw = async () => {
    if (!signer || connectionStatus !== 'connected') return
    const amountStr = prompt('Montant à retirer (en ALPH) :')
    if (!amountStr) return
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      alert('Montant invalide')
      return
    }
    try {
      setIsWithdrawing(true)
      const amountAtto = BigInt(Math.floor(amount * 1e18))
      await withdrawFunds(signer, amountAtto)
      alert(`✅ Retrait de ${amount} ALPH effectué !`)
      await refreshGameData()
    } catch (e: any) {
      console.error('❌ Withdraw failed:', e)
      alert(`Withdraw failed: ${e.message?.slice(0, 100) ?? 'Unknown error'}`)
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <>
      {gameTerminated && (
        <button
          className={`${styles.restartBtn} ${isRestarting ? styles.restartBtnLoading : ''} ${txDone ? styles.restartBtnDone : ''}`}
          onClick={handleRestart}
          disabled={isRestarting}
          title="Restart the game (owner only)"
        >
          {isRestarting ? '⏳ Restarting...' : txDone ? '✅ Done!' : '🔄 Restart Game'}
        </button>
      )}
      <button
        className={styles.restartBtn}
        onClick={handleWithdraw}
        disabled={isWithdrawing}
        title="Withdraw funds (owner only)"
        style={{ background: 'rgba(255,100,0,0.2)', marginRight: '8px' }}
      >
        {isWithdrawing ? '⏳ Retrait...' : '💰 Withdraw'}
      </button>
    </>
  )
}

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoGroup}>
          <Link href="/" className={styles.logo}>
            Bomber
          </Link>
          <nav className={styles.nav}>
            <Link href="/rules" className={styles.navLink}>Rules</Link>
          </nav>
        </div>

        <div className={styles.walletSection}>
          <OwnerButtons />
          <AlephiumConnectButton />
        </div>
      </div>
    </header>
  )
}
