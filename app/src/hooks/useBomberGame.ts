import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@alephium/web3-react'
import { web3 } from '@alephium/web3'
import { getGameInfo, hasTicketClaimed, getTotalTransactions, BOMBER_CONTRACT_ADDRESS } from '@/services/bomber.service'

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

const EV_TICKET_BOUGHT    = 0
const EV_BOMB_EXPLODED    = 1
const EV_REWARDS_CLAIMED  = 2
const EV_GAME_INITIALIZED = 3

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

// ✅ Polling réduit à 5s pour une UI plus réactive
const POLLING_INTERVAL = 5000

async function fetchContractEvents(contractAddress: string, start: number, limit = 20) {
  try {
    const nodeProvider = web3.getCurrentNodeProvider()
    const response = await nodeProvider.events.getEventsContractContractaddress(
      contractAddress,
      { start, limit }
    )
    return response
  } catch (e: any) {
    if (e.message?.includes('429')) return null
    if (e.message?.includes('404')) {
      console.log(`📭 [POLL] Pas d'events à partir de l'index ${start} (404 normal)`)
      return null
    }
    // console.error('❌ fetchContractEvents error:', e)
    return null
  }
}

async function loadAllEvents(contractAddress: string) {
  const allEvents: any[] = []
  let start = 0
  const batchSize = 100

  while (true) {
    const response = await fetchContractEvents(contractAddress, start, batchSize)
    if (!response || !response.events || response.events.length === 0) break
    allEvents.push(...response.events)
    start += response.events.length
    if (response.events.length < batchSize) break
  }

  console.log(`📚 Loaded ${allEvents.length} events total`)
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
  const [roundNumber, setRoundNumber] = useState<number>(1)
  const [totalTransactions, setTotalTransactions] = useState<number>(0)

  const lastEventIndexRef = useRef<number>(-1)
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)
  // ✅ Flag pour forcer un poll immédiat (déclenché après un achat)
  const forceNextPollRef = useRef(false)

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
      let hasRestart = false

      response.events.forEach((event, i) => {
        const absoluteIndex = startIndex + i

        if (event.eventIndex === EV_TICKET_BOUGHT) {
          const fields = event.fields
          const player = fields[0].value as string
          const ticketIndex = BigInt(fields[1].value as string)
          const price = BigInt(fields[2].value as string)
          const currentRisk = BigInt(fields[3].value as string)
          const ticketContractId = fields[4].value as string
          const oracleValue = fields[5].value as string
          const rawOracle = fields[6].value as string
          const ticketsEver = fields[7].value as string

          console.log(`🎲 [POLL][ORACLE] Ticket #${ticketIndex} | Rand: ${oracleValue} | RawOracle%100: ${rawOracle} | TicketsEver%100: ${ticketsEver} | Risque: ${currentRisk}%`)
          
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

        if (event.eventIndex === EV_BOMB_EXPLODED) {
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

        if (event.eventIndex === EV_GAME_INITIALIZED) {
          hasRestart = true
          setRoundNumber(prev => prev + 1)
        }

        lastEventIndexRef.current = absoluteIndex
      })

      if (hasNewTicket || hasExplosion || hasRestart) {
        await refreshGameData()
        getTotalTransactions().then(n => {
          if (isMountedRef.current && n > 0) setTotalTransactions(n)
        })
      }

      if (hasExplosion) {
        setMyTickets(prev => {
          if (prev.length > 0) refreshMyTicketsClaimed(prev)
          return prev
        })
      }

      if (hasRestart) {
        setRecentActivities([])
        setMyTickets([])
      }
    }

    if (isMountedRef.current) {
      pollingTimerRef.current = setTimeout(pollEvents, POLLING_INTERVAL)
    }
  }, [account?.address, refreshGameData, refreshMyTicketsClaimed])

  // ✅ forceRefresh : annule le timer en cours, poll immédiatement, puis reprend le cycle normal
  const forceRefresh = useCallback(async () => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
    await refreshGameData()
    await pollEvents()
  }, [refreshGameData, pollEvents])

  useEffect(() => {
    isMountedRef.current = true

    const init = async () => {
      setIsLoadingHistory(true)
      await refreshGameData()

      getTotalTransactions().then(n => {
        if (isMountedRef.current && n > 0) setTotalTransactions(n)
      })

      const { events, count } = await loadAllEvents(BOMBER_CONTRACT_ADDRESS)

      if (isMountedRef.current && events.length > 0) {
        const activities: Activity[] = []
        const myTicketsFromHistory: MyTicket[] = []

        let gameInitCount = 0
        let currentRoundStart = 0

        events.forEach((event, i) => {
          if (event.eventIndex === EV_GAME_INITIALIZED) {
            gameInitCount++
            currentRoundStart = i + 1
          }
        })

        setRoundNumber(gameInitCount)

        for (let i = 0; i < events.length; i++) {
          const event = events[i]
          const isCurrentRound = i >= currentRoundStart

          if (event.eventIndex === EV_TICKET_BOUGHT && isCurrentRound) {
            const fields = event.fields
            const player = fields[0].value as string
            const ticketIndex = BigInt(fields[1].value as string)
            const price = BigInt(fields[2].value as string)
            const currentRisk = BigInt(fields[3].value as string)
            const ticketContractId = fields[4].value as string
            const oracleValue = fields[5].value as string
            const rawOracle = fields[6].value as string
            const ticketsEver = fields[7].value as string

            console.log(`🎲 [ORACLE] Rand: ${oracleValue} | RawOracle%100: ${rawOracle} | TicketsEver%100: ${ticketsEver} | Risque: ${currentRisk}`)

            if (BigInt(oracleValue) < currentRisk) {
              console.log("🧨 La bombe aurait dû exploser ici !")
            }
            
            activities.push({
              player, action: 'bought_ticket',
              price: Number(price) / 1e18,
              timestamp: 0,
              risk: Number(currentRisk),
              ticketIndex: Number(ticketIndex),
              ticketContractId
            })

            if (account?.address && player === account.address) {
              myTicketsFromHistory.push({
                ticketIndex, ticketContractId,
                price: Number(price) / 1e18,
                claimed: false
              })
            }
          }

          if (event.eventIndex === EV_BOMB_EXPLODED && isCurrentRound) {
            activities.push({
              player: event.fields[0].value as string,
              action: 'exploded', timestamp: 0, risk: 100
            })
          }
        }

        setRecentActivities(activities.slice(-10).reverse())

        if (myTicketsFromHistory.length > 0) {
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

  return {
    gameData,
    recentActivities,
    myTickets,
    isLoadingHistory,
    roundNumber,
    totalTransactions,
    refreshGameData,
    forceRefresh,   
    markTicketClaimed
  }
}
