import { useState, useEffect, useCallback } from 'react'
import { getGameInfo, getBomberContract } from '@/services/bomber.service'

export interface GameData {
  maxTicketsFor50Percent: bigint
  ticketCount: bigint
  currentRisk: bigint
  currentPrice: bigint
  isActive: boolean
  isLoading: boolean
  error: string | null
}

export function useBomberGame() {
  const [gameData, setGameData] = useState<GameData>({
    maxTicketsFor50Percent: 0n,
    ticketCount: 0n,
    currentRisk: 0n,
    currentPrice: 0n,
    isActive: false,
    isLoading: true,
    error: null
  })

  const [recentActivities, setRecentActivities] = useState<any[]>([])

  const refreshGameData = useCallback(async () => {
    try {
      const info = await getGameInfo()
      setGameData({ ...info, isLoading: false, error: null })
    } catch (e: any) {
      setGameData(prev => ({ ...prev, error: e.message, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    refreshGameData()
    const bomber = getBomberContract()

    const ticketSub = bomber.subscribeTicketBoughtEvent({
      pollingInterval: 4000,
      messageCallback: (event) => {
        setRecentActivities(prev => [{
          player: event.fields.player,
          action: 'bought_ticket',
          price: Number(event.fields.price) / 1e18,
          timestamp: Date.now(),
          risk: Number(event.fields.currentRisk),
          ticketContractId: event.fields.ticketContractId // ID nécessaire pour le claim !
        }, ...prev.slice(0, 9)])
        refreshGameData()
        return Promise.resolve()
      }
    })

    const explosionSub = bomber.subscribeBombExplodedEvent({
      pollingInterval: 4000,
      messageCallback: (event) => {
        setRecentActivities(prev => [{
          player: event.fields.loser,
          action: 'exploded',
          timestamp: Date.now(),
          risk: 100
        }, ...prev.slice(0, 9)])
        refreshGameData()
        return Promise.resolve()
      }
    })

    return () => {
      ticketSub.unsubscribe()
      explosionSub.unsubscribe()
    }
  }, [refreshGameData])

  return { gameData, recentActivities, refreshGameData }
}
