import React from 'react'
import styles from '../../styles/Header.module.css' 
import { AlephiumConnectButton } from '@alephium/web3-react'
import Link from 'next/link'

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoGroup}>
          <Link href="/" className={styles.logo}>
            💣 Bomber
          </Link>
          <nav className={styles.nav}>
            <Link href="/games" className={styles.navLink}>Games</Link>
            <Link href="/leaderboard" className={styles.navLink}>Leaderboard</Link>
            <Link href="/rules" className={styles.navLink}>Rules</Link>
          </nav>
        </div>

        <div className={styles.walletSection}>
          <AlephiumConnectButton />
        </div>
      </div>
    </header>
  )
}
