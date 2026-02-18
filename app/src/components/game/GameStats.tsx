import React from 'react'
import { useBomberGame } from '@/hooks/useBomberGame'

export const GameStats = () => {
  const { gameData } = useBomberGame()

  // Convertir les bigint en nombres lisibles (1 ALPH = 10^18 wei)
  const potInAlph = gameData.potAmount
    ? (Number(gameData.potAmount) / 1e18).toFixed(2)
    : '0.00'

  const ticketCount = gameData.ticketCount.toString()
  const maxTickets = gameData.maxTicketsFor50Percent.toString()

  // ✅ NOUVEAU - Prix dynamique du prochain ticket
  const nextTicketPrice = (Number(gameData.currentPrice) / 1e18).toFixed(2)

  if (gameData.isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Chargement des données...</p>
      </div>
    )
  }

  if (gameData.error) {
    return (
      <div style={{ padding: '20px', color: '#ff4444' }}>
        <p>❌ Erreur: {gameData.error}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px' }}>
      {/* ✅ NOUVEAU - Badge d'état du jeu */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <span style={{
          display: 'inline-block',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: gameData.isActive ? '#4CAF50' : '#ff4444',
          color: 'white'
        }}>
          {gameData.isActive ? '🟢 Jeu Actif' : '🔴 Jeu Terminé'}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong style={{ display: 'block', marginBottom: '5px' }}>💰 Pot Actuel</strong>
        <span style={{ fontSize: '24px', color: '#027ec0', fontWeight: 'bold' }}>
          {potInAlph} ALPH
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong style={{ display: 'block', marginBottom: '5px' }}>🎫 Tickets Vendus</strong>
        <span style={{ fontSize: '20px' }}>
          {ticketCount} / {maxTickets}
        </span>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#eee',
          borderRadius: '4px',
          marginTop: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min((Number(ticketCount) / Number(maxTickets)) * 100, 100)}%`,
            height: '100%',
            backgroundColor: '#027ec0',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong style={{ display: 'block', marginBottom: '5px' }}>⚠️ Risque Actuel</strong>
        <span style={{
          fontSize: '20px',
          color: Number(gameData.currentRisk) > 30 ? '#ff4444' : '#027ec0'
        }}>
          {gameData.currentRisk.toString()}%
        </span>
      </div>

      {/* ✅ NOUVEAU - Prix du prochain ticket (dynamique) */}
      <div>
        <strong style={{ display: 'block', marginBottom: '5px' }}>
          💵 Prochain Ticket
        </strong>
        <span style={{ fontSize: '18px', color: '#027ec0' }}>
          {nextTicketPrice} ALPH
        </span>
        {Number(ticketCount) > 0 && (
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            +4% par ticket
          </div>
        )}
      </div>
    </div>
  )
}
