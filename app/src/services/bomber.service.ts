import {
  SignerProvider, web3, NodeProvider, DUST_AMOUNT, ONE_ALPH,
  Script, ExecutableScript, HexString, subContractId, addressFromContractId,
  groupOfAddress
} from '@alephium/web3'
import { Bomber, BomberInstance, Ticket } from '../../../contracts/artifacts/ts'
import { getContractByCodeHash } from '../../../contracts/artifacts/ts/contracts'
import { AllStructs } from '../../../contracts/artifacts/ts/types'
import { bomberConfig } from '@/services/utils'
import BuyTicketJson from '../../../contracts/artifacts/BuyTicket.ral.json'

const TESTNET_NODE_URL = 'https://node.testnet.alephium.org'
web3.setCurrentNodeProvider(new NodeProvider(TESTNET_NODE_URL))

export const BOMBER_CONTRACT_ID = bomberConfig.bomberContractId
export const BOMBER_CONTRACT_ADDRESS = bomberConfig.bomberAddress

const BuyTicketScript = new ExecutableScript<{
  bomber: HexString
  amount: bigint
}>(Script.fromJson(BuyTicketJson as any, '', AllStructs), getContractByCodeHash)

export function getBomberContract(): BomberInstance {
  return Bomber.at(BOMBER_CONTRACT_ADDRESS)
}

export async function getGameInfo() {
  try {
    const bomber = getBomberContract()
    const result = await bomber.view.getGameInfo()

    // ✅ FIX : mapping correct des retours de getGameInfo()
    // Ralph : return (currentGameId, ticketCount, totalPot, getCurrentPrice(), isActive, redistributionPool)
    // Index :           [0]            [1]          [2]         [3]             [4]        [5]
    const currentGameId      = result.returns[0] as bigint
    const ticketCount        = result.returns[1] as bigint
    const totalPot           = result.returns[2] as bigint  // ✅ était confondu avec currentRisk
    const currentPrice       = result.returns[3] as bigint
    const isActive           = result.returns[4] as boolean
    const redistributionPool = result.returns[5] as bigint  // ✅ lu directement ici, plus besoin de fetchState()

    // ✅ currentRisk calculé côté front depuis ticketCount et maxTicketsFor50Percent
    // On lit maxTicketsFor50Percent depuis le state pour le calcul
    const state = await bomber.fetchState()
    const maxTickets = state.fields.maxTicketsFor50Percent as bigint
    const rawRisk = maxTickets > 0n
      ? (ticketCount * 50n) / maxTickets
      : 0n
    const currentRisk = rawRisk > 50n ? 50n : rawRisk

    console.group('📊 [CONTRACT_VIEW] Bomber Stats')
    console.log('🔹 Game ID:', currentGameId.toString())
    console.log('🔹 Ticket Count:', ticketCount.toString())
    console.log('🔹 Total Pot:', totalPot.toString(), 'attoALPH')
    console.log('🔹 Current Price:', currentPrice.toString())
    console.log('🔹 Is Active:', isActive)
    console.log('🔹 Current Risk:', currentRisk.toString(), '%')
    console.log('🔹 Redistribution Pool:', redistributionPool.toString())
    console.groupEnd()

    return {
      maxTicketsFor50Percent: maxTickets,
      ticketCount,
      currentRisk,   // ✅ maintenant un vrai % entre 0 et 50
      currentPrice,
      totalPot,      // ✅ maintenant correctement alimenté
      isActive,
      redistributionPool
    }
  } catch (error) {
    console.error('❌ [CONTRACT_ERROR]', error)
    throw error
  }
}

// ── Nb total de transactions on-chain du contrat ──────────────────────────────
const EXPLORER_BACKEND_URL = 'https://backend.testnet.alephium.org'

export async function getTotalTransactions(): Promise<number> {
  try {
    const res = await fetch(
      `${EXPLORER_BACKEND_URL}/addresses/${BOMBER_CONTRACT_ADDRESS}`
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.txNumber ?? 0
  } catch (e: any) {
    console.warn('getTotalTransactions error:', e.message)
    return 0
  }
}

export async function getPlatformAddress(): Promise<string> {
  const bomber = getBomberContract()
  const state = await bomber.fetchState()
  return state.fields.platformAddress as string
}


export async function buyTicket(signer: SignerProvider): Promise<{ txId: string; pricePaid: bigint; oracleValue: string | null }> {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 5000 // 5s entre chaque tentative

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔄 [BUY_RETRY] Tentative ${attempt}/${MAX_RETRIES} dans ${RETRY_DELAY/1000}s...`)
        await new Promise(r => setTimeout(r, RETRY_DELAY))
      }

      const info = await getGameInfo()
      const price = BigInt(info.currentPrice)
      const subContractDeposit = ONE_ALPH / 10n
      const slippage = (price * 30n) / 100n
      const mapDeposit = ONE_ALPH / 10n  // 0.1 ALPH pour le storage des mappings
      const totalAmount = price + subContractDeposit + slippage + mapDeposit
      const attoAlphToSend = totalAmount + BigInt(DUST_AMOUNT)

      const result = await BuyTicketScript.execute(signer, {
        initialFields: { bomber: BOMBER_CONTRACT_ID, amount: totalAmount },
        attoAlphAmount: attoAlphToSend,
        gasAmount: 950000
      })

      console.log(`✅ [TRANSACTION_SUCCESS] TxID: ${result.txId} (tentative ${attempt})`)

      // Récupération Oracle
      let oracleValue: string | null = null
      try {
        const node = web3.getCurrentNodeProvider()
        for (let o = 0; o < 20; o++) {
          await new Promise(r => setTimeout(r, 3000))
          try {
            const events = await node.events.getEventsTxIdTxid(result.txId)
            const boughtEvent = events.events.find(e => e.eventIndex === 0)
            if (boughtEvent) {
              oracleValue = boughtEvent.fields[5].value.toString()
              const risk = boughtEvent.fields[3].value.toString()
              console.log(`🎲 [ORACLE_LOG] Tentative ${o + 1} | Valeur tirée : ${oracleValue} | Risque : ${risk}% | ${Number(oracleValue) < Number(risk) ? '💥 EXPLOSION' : '✅ SURVIE'}`)
              break
            }
            console.log(`⏳ [ORACLE_WAIT] Tentative ${o + 1}/20 - event pas encore indexé...`)
          } catch (e) {
            console.log(`⏳ [ORACLE_WAIT] Tentative ${o + 1}/20 - erreur fetch:`, e)
          }
        }
      } catch (e) {
        console.warn('Impossible de fetch l\'oracle value:', e)
      }

      return { txId: result.txId, pricePaid: price, oracleValue }

    } catch (error: any) {
      const msg = error?.message ?? ''
      const isRetryable = msg.includes('does not exist') || msg.includes('Execution error')

      console.error(`❌ [BUY_TICKET_FAILED] Tentative ${attempt}/${MAX_RETRIES}:`, msg.slice(0, 150))

      if (isRetryable && attempt < MAX_RETRIES) {
        console.log(`⏳ Erreur récupérable, on réessaie...`)
        continue
      }

      throw error
    }
  }

  throw new Error('Échec après ' + MAX_RETRIES + ' tentatives')
}

export async function hasTicketClaimed(ticketContractId: string): Promise<boolean> {
  try {
    const ticketAddress = addressFromContractId(ticketContractId)
    const ticketContract = Ticket.at(ticketAddress)
    const state = await ticketContract.fetchState()
    // Accès direct au champ 'claimed' qui est le dernier champ mutable
    return state.fields.claimed as boolean
  } catch (error: any) {
    const msg = error?.message ?? ''
    if (
      msg.includes('does not exist') ||
      msg.includes('destroyed') ||
      msg.includes('not found') ||
      msg.includes('ByteVec') ||   // ← ajout
      msg.includes('Address')      // ← ajout
    ) {
      return false  // pas claimed, juste inaccessible
    }
    console.warn(`hasTicketClaimed error:`, msg)
    return false
  }
}

export async function claimRewards(signer: SignerProvider, ticketContractId: string) {
  try {
    const ticketAddress = addressFromContractId(ticketContractId)
    console.log(`💎 Claim → contractId: ${ticketContractId} → address: ${ticketAddress}`)
    const ticketContract = Ticket.at(ticketAddress)
    const result = await ticketContract.transact.claimRewards({ signer })
    console.log('✅ Claim envoyé ! TxId:', result.txId)
    return result
  } catch (error: any) {
    console.error('Erreur claimRewards:', error)
    throw error
  }
}

export async function restartGame(signer: SignerProvider) {
  try {
    const bomber = getBomberContract()
    console.log('🔄 Restarting game...')
    const result = await bomber.transact.restartGame({ signer })
    console.log('✅ Game restarted ! TxId:', result.txId)
    return result
  } catch (error: any) {
    console.error('❌ restartGame failed:', error)
    throw error
  }
}

export async function withdrawFunds(signer: SignerProvider, amount: bigint) {
  try {
    const bomber = getBomberContract()
    console.log('💰 Withdrawing', amount.toString(), 'attoALPH...')
    const result = await bomber.transact.withdrawFunds({
      signer,
      args: { amount }
    })
    console.log('✅ Withdraw envoyé ! TxId:', result.txId)
    return result
  } catch (error: any) {
    console.error('❌ withdrawFunds failed:', error)
    throw error
  }
}
