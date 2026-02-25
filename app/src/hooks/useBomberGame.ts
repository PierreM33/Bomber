import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@alephium/web3-react'
import { web3 } from '@alephium/web3'
import { getGameInfo, hasTicketClaimed, BOMBER_CONTRACT_ADDRESS } from '@/services/bomber.service'

export interface GameData {
  maxTicketsFor50Percent: bigint
  ticketCount: bigint
  currentRisk: bigint
  currentPrice: bigint
  totalPot?: bigint
  redistributionPool?: bigint
  isActive: boolean
  isLoading: boolean
  error: string | null
}

export interface MyTicket {
  ticketIndex: bigint
  ticketContractId: string
  price: number
  claimed: boolean
}

export interface Activity {
  player: string
  action: 'bought_ticket' | 'exploded' | 'claimed_rewards'
  price?: number
  timestamp: number
  risk?: number
  ticketIndex?: number
  ticketContractId?: string
  amount?: number
}

const INITIAL_GAME_DATA: GameData = {
  maxTicketsFor50Percent: 0n,
  ticketCount: 0n,
  currentRisk: 0n,
  currentPrice: 0n,
  totalPot: 0n,
  redistributionPool: 0n,
  isActive: false,
  isLoading: true,
  error: null
}

const POLLING_INTERVAL = 15000

async function fetchContractEvents(contractAddress: string, start: number, limit = 20) {
  try {
    const nodeProvider = web3.getCurrentNodeProvider()
    const response = await nodeProvider.events.getEventsContractContractaddress(
      contractAddress,
      { start, limit }
    )
    return response
  } catch (e: any) {
    if (e.message?.includes('404') || e.message?.includes('429')) return null
    console.error('❌ fetchContractEvents error:', e)
    return null
  }
}

// ── Charge tous les events par batch ─────────────────────────────────────────
// On commence à start=0 et on incrémente jusqu'à ne plus avoir de réponse
async function loadAllEvents(contractAddress: string) {
  const allEvents: any[] = []
  let start = 0
  const batchSize = 100

  while (true) {
    const response = await fetchContractEvents(contractAddress, start, batchSize)
    // 404 ou null = plus d'events à cette position
    if (!response || !response.events || response.events.length === 0) break
    allEvents.push(...response.events)
    start += response.events.length
    // Si on a reçu moins que batchSize, on est à la fin
    if (response.events.length < batchSize) break
  }

  console.log(`📚 Loaded ${allEvents.length} events total (start index for polling: ${start})`)
  return { events: allEvents, count: start }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

async function checkTicketsSequentially(tickets: MyTicket[], isMounted: () => boolean): Promise<MyTicket[]> {
  const result: MyTicket[] = []
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i]
    if (!isMounted()) break
    try {
      const claimed = await hasTicketClaimed(ticket.ticketContractId)
      result.push({ ...ticket, claimed })
    } catch {
      result.push(ticket)
    }
    if (i < tickets.length - 1) await delay(400)
  }
  return result
}

export function useBomberGame() {
  const { account } = useWallet()
  const [gameData, setGameData] = useState<GameData>(INITIAL_GAME_DATA)
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [myTickets, setMyTickets] = useState<MyTicket[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const lastEventIndexRef = useRef<number>(-1)
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const refreshGameData = useCallback(async () => {
    try {
      const info = await getGameInfo()
      if (info && isMountedRef.current) {
        setGameData({ ...info, isLoading: false, error: null })
      }
    } catch (e: any) {
      if (!e.message?.includes('429') && isMountedRef.current) {
        setGameData(prev => ({ ...prev, error: e.message, isLoading: false }))
      }
    }
  }, [])

  const refreshMyTicketsClaimed = useCallback(async (tickets: MyTicket[]) => {
    const updated = await checkTicketsSequentially(tickets, () => isMountedRef.current)
    if (isMountedRef.current) setMyTickets(updated)
  }, [])

  const pollEvents = useCallback(async () => {
    if (!isMountedRef.current) return

    const startIndex = lastEventIndexRef.current + 1
    const response = await fetchContractEvents(BOMBER_CONTRACT_ADDRESS, startIndex)

    if (response && response.events && response.events.length > 0) {
      let hasNewTicket = false
      let hasExplosion = false

      response.events.forEach((event, i) => {
        const absoluteIndex = startIndex + i

        if (event.eventIndex === 0) {
          const fields = event.fields
          const player = fields[0].value as string
          const ticketIndex = BigInt(fields[1].value as string)
          const price = BigInt(fields[2].value as string)
          const currentRisk = BigInt(fields[3].value as string)
          const ticketContractId = fields[4].value as string

          if (isMountedRef.current) {
            setRecentActivities(prev => {
              const exists = prev.some(a => a.ticketIndex === Number(ticketIndex) && a.action === 'bought_ticket')
              if (exists) return prev
              return [{
                player, action: 'bought_ticket',
                price: Number(price) / 1e18,
                timestamp: Date.now(),
                risk: Number(currentRisk),
                ticketIndex: Number(ticketIndex),
                ticketContractId
              }, ...prev.slice(0, 9)]
            })
          }

          if (account?.address && player === account.address && isMountedRef.current) {
            setMyTickets(prev => {
              const exists = prev.some(t => t.ticketIndex === ticketIndex)
              if (exists) return prev
              return [...prev, { ticketIndex, ticketContractId, price: Number(price) / 1e18, claimed: false }]
                .sort((a, b) => Number(a.ticketIndex - b.ticketIndex))
            })
          }
          hasNewTicket = true
        }

        if (event.eventIndex === 1) {
          const loser = event.fields[0].value as string
          if (isMountedRef.current) {
            setRecentActivities(prev => {
              const exists = prev.some(a => a.player === loser && a.action === 'exploded')
              if (exists) return prev
              return [{ player: loser, action: 'exploded' as const, timestamp: Date.now(), risk: 100 }, ...prev.slice(0, 9)]
            })
          }
          hasExplosion = true
        }

        lastEventIndexRef.current = absoluteIndex
      })

      if (hasNewTicket || hasExplosion) await refreshGameData()
      if (hasExplosion) {
        setMyTickets(prev => {
          if (prev.length > 0) refreshMyTicketsClaimed(prev)
          return prev
        })
      }
    }

    if (isMountedRef.current) {
      pollingTimerRef.current = setTimeout(pollEvents, POLLING_INTERVAL)
    }
  }, [account?.address, refreshGameData, refreshMyTicketsClaimed])

  useEffect(() => {
    isMountedRef.current = true

    const init = async () => {
      setIsLoadingHistory(true)

      await refreshGameData()

      // ✅ FIX : on part de start=0 et on charge par batch jusqu'au 404
      // Plus besoin de getEventCount qui retournait 0
      const { events, count } = await loadAllEvents(BOMBER_CONTRACT_ADDRESS)

      if (isMountedRef.current && events.length > 0) {
        const activities: Activity[] = []
        const myTicketsFromHistory: MyTicket[] = []

        // Trouve le début du round actuel (après la dernière explosion)
        let lastExplosionIndex = -1
        events.forEach((event, i) => {
          if (event.eventIndex === 1) lastExplosionIndex = i
        })
        const currentRoundStart = lastExplosionIndex + 1

        for (let i = 0; i < events.length; i++) {
          const event = events[i]
          const isCurrentRound = i >= currentRoundStart

          if (event.eventIndex === 0) {
            const fields = event.fields
            const player = fields[0].value as string
            const ticketIndex = BigInt(fields[1].value as string)
            const price = BigInt(fields[2].value as string)
            const currentRisk = BigInt(fields[3].value as string)
            const ticketContractId = fields[4].value as string

            activities.push({
              player, action: 'bought_ticket',
              price: Number(price) / 1e18,
              timestamp: 0,
              risk: Number(currentRisk),
              ticketIndex: Number(ticketIndex),
              ticketContractId
            })

            if (isCurrentRound && account?.address && player === account.address) {
              myTicketsFromHistory.push({
                ticketIndex, ticketContractId,
                price: Number(price) / 1e18,
                claimed: false
              })
            }
          }

          if (event.eventIndex === 1) {
            activities.push({
              player: event.fields[0].value as string,
              action: 'exploded', timestamp: 0, risk: 100
            })
          }
        }

        setRecentActivities(activities.slice(-10).reverse())

        if (myTicketsFromHistory.length > 0) {
          console.log(`🎫 ${myTicketsFromHistory.length} tickets found, checking claimed status...`)
          const withStatus = await checkTicketsSequentially(
            myTicketsFromHistory.sort((a, b) => Number(a.ticketIndex - b.ticketIndex)),
            () => isMountedRef.current
          )
          if (isMountedRef.current) setMyTickets(withStatus)
        }
      }

      lastEventIndexRef.current = count - 1
      if (isMountedRef.current) {
        setIsLoadingHistory(false)
        pollingTimerRef.current = setTimeout(pollEvents, POLLING_INTERVAL)
      }
    }

    init()

    return () => {
      isMountedRef.current = false
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current)
    }
  }, [refreshGameData, pollEvents, account?.address])

  useEffect(() => {
    setMyTickets([])
    setRecentActivities([])
  }, [account?.address])

  const markTicketClaimed = useCallback((ticketIndex: bigint) => {
    setMyTickets(prev =>
      prev.map(t => t.ticketIndex === ticketIndex ? { ...t, claimed: true } : t)
    )
  }, [])

  return { gameData, recentActivities, myTickets, isLoadingHistory, refreshGameData, markTicketClaimed }
}
