import React, { useCallback } from 'react'
import { FC, useState } from 'react'
import styles from '../styles/Home.module.css'
import { takeBomb, explodeBomb } from '@/services/bomber.service'
import { TxStatus } from './TxStatus'
import { useWallet } from '@alephium/web3-react'
import { node } from "@alephium/web3"
import { BomberConfig } from '@/services/utils'

export const TokenDapp: FC<{
  config: BomberConfig
}> = ({ config }) => {
  const { signer, account } = useWallet()
  const [ongoingTxId, setOngoingTxId] = useState<string>()

  // Action 1: Passer la bombe
  const handleTakeBomb = async () => {
    if (signer) {
      try {
        // On envoie le montant requis par le contrat (ex: "1000000000000000000" pour 1 ALPH)
        const result = await takeBomb(signer, "1000000000000000000")
        setOngoingTxId(result.txId)
      } catch (e) {
        console.error(e)
        alert("Erreur lors de l'achat du ticket")
      }
    }
  }

  // Action 2: Provoquer l'explosion
  const handleExplode = async () => {
    if (signer) {
      try {
        const result = await explodeBomb(signer, "1000000000000000000")
        setOngoingTxId(result.txId)
      } catch (e) {
        console.error(e)
        alert("Erreur lors de l'explosion")
      }
    }
  }

  const txStatusCallback = useCallback(async (status: node.TxStatus, numberOfChecks: number): Promise<unknown> => {
    if (
      (status.type === 'Confirmed' && numberOfChecks > 2) ||
      (status.type === 'TxNotFound' && numberOfChecks > 3)
    ) {
      setOngoingTxId(undefined)
    }
    return Promise.resolve()
  }, [setOngoingTxId])

  return (
    <>
      {ongoingTxId && <TxStatus txId={ongoingTxId} txStatusCallback={txStatusCallback} />}

      <div className={styles.container}>
        <h2 className={styles.title}>💣 Bomber Game on {config.network} 💣</h2>

        <div className={styles.card}>
          <p><strong>Ton Adresse :</strong> {account?.address ?? 'Non connecté'}</p>
          <p><strong>Contrat Bomber :</strong> {config.bomberAddress}</p>
          <p><strong>Prix du Ticket :</strong> 1 ALPH</p>
        </div>

        <div className="columns" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          
        </div>

        {!signer && <p style={{ color: 'orange', marginTop: '10px' }}>⚠️ Connecte ton wallet pour jouer !</p>}
      </div>
    </>
  )
}
