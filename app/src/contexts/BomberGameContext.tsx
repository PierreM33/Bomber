import React, { createContext, useContext } from 'react'
import { useBomberGame } from '@/hooks/useBomberGame'
import type { GameData, MyTicket, Activity } from '@/hooks/useBomberGame'

interface BomberGameContextType {
  gameData: GameData
  recentActivities: Activity[]
  myTickets: MyTicket[]
  isLoadingTickets: boolean
  refreshGameData: () => Promise<void>
  forceRefresh: () => Promise<void>  // ✅ ajouté
  markTicketClaimed: (ticketIndex: bigint) => void
}

const BomberGameContext = createContext<BomberGameContextType | null>(null)

export const BomberGameProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useBomberGame()
  return (
    <BomberGameContext.Provider value={value}>
      {children}
    </BomberGameContext.Provider>
  )
}

export const useBomberGameContext = (): BomberGameContextType => {
  const ctx = useContext(BomberGameContext)
  if (!ctx) throw new Error('useBomberGameContext must be used inside BomberGameProvider')
  return ctx
}
