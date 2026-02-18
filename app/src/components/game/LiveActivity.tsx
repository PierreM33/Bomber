import React from 'react'
import { useBomberGame } from '@/hooks/useBomberGame'

export const LiveActivity = () => {
  const { recentActivities } = useBomberGame()

  // Fonction pour formater l'adresse
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Fonction pour formater le temps écoulé
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `Il y a ${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Il y a ${minutes}min`
    const hours = Math.floor(minutes / 60)
    return `Il y a ${hours}h`
  }

  if (recentActivities.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        <p>Aucune activité récente...</p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          Soyez le premier à jouer ! 🎮
        </p>
      </div>
    )
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {recentActivities.map((activity, index) => (
        <li
          key={`${activity.player}-${activity.timestamp}-${index}`}
          style={{
            padding: '12px 8px',
            borderBottom: '1px solid #eee',
            fontSize: '14px'
          }}
        >
          {/* ✅ MISE À JOUR - Achat de ticket avec prix */}
          {activity.action === 'bought_ticket' && (
            <div>
              <span style={{ color: '#027ec0', fontWeight: 'bold' }}>
                {formatAddress(activity.player)}
              </span>
              {' '}
              <span style={{ color: '#4CAF50' }}>✅ a survécu</span>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                Ticket #{activity.ticketIndex} • {activity.price?.toFixed(2)} ALPH
                {' • '}Risque: {activity.risk}%
                {' • '}{formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          )}

          {/* Explosion */}
          {activity.action === 'exploded' && (
            <div>
              <span style={{ color: '#027ec0', fontWeight: 'bold' }}>
                {formatAddress(activity.player)}
              </span>
              {' '}
              <span style={{ color: '#ff4444', fontWeight: 'bold' }}>💥 BOUM!</span>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                {formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          )}

          {/* ✅ NOUVEAU - Claim de rewards */}
          {activity.action === 'claimed_rewards' && (
            <div>
              <span style={{ color: '#027ec0', fontWeight: 'bold' }}>
                {formatAddress(activity.player)}
              </span>
              {' '}
              <span style={{ color: '#FFD700', fontWeight: 'bold' }}>💎 a récupéré</span>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                Ticket #{activity.ticketIndex} • {activity.amount?.toFixed(4)} ALPH
                {' • '}{formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
