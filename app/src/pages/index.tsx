import React from 'react'
import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { Header } from '@/components/layout/Header'
import { GameLayout } from '@/components/layout/GameLayout'

export default function Home() {
  return (
    <div className={styles.appContainer}>
      <Head>
        <title>Bomber Game</title>
      </Head>

      <Header />

      <main className={styles.mainContent}>
        <GameLayout />
      </main>
    </div>
  )
}
