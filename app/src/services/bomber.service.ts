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

    const state = await bomber.fetchState()
    const redistributionPool = state.fields.redistributionPool as bigint

    const result = await bomber.view.getGameInfo()

    console.group('📊 [CONTRACT_VIEW] Bomber Stats')
    console.log('🔹 Ticket Count:', result.returns[1].toString())
    console.log('🔹 Is Active:', result.returns[4])
    console.log('🔹 Current Price:', result.returns[3].toString())
    console.log('🔹 Current Risk:', result.returns[2].toString())
    console.log('🔹 Redistribution Pool:', redistributionPool.toString())
    console.groupEnd()

    return {
      maxTicketsFor50Percent: result.returns[0],
      ticketCount: result.returns[1],
      currentRisk: result.returns[2],
      currentPrice: result.returns[3],
      isActive: result.returns[4],
      redistributionPool
    }
  } catch (error) {
    console.error('❌ [CONTRACT_ERROR]', error)
    throw error
  }
}

export async function buyTicket(signer: SignerProvider) {
  try {
    const info = await getGameInfo()
    const price = BigInt(info.currentPrice)
    const subContractDeposit = ONE_ALPH / 10n
    const totalAmount = price + subContractDeposit
    const attoAlphToSend = totalAmount + BigInt(DUST_AMOUNT)

    const result = await BuyTicketScript.execute(signer, {
      initialFields: { bomber: BOMBER_CONTRACT_ID, amount: totalAmount },
      attoAlphAmount: attoAlphToSend,
      gasAmount: 200000
    })

    console.log('✅ [TRANSACTION_SUCCESS] TxID:', result.txId)
    return result
  } catch (error: any) {
    console.error('❌ [BUY_TICKET_FAILED]', error)
    throw error
  }
}

// ── Vérifie si un ticket a déjà été claimé via son contractId (fourni par l'event) ──
// ✅ On utilise le contractId reçu directement depuis l'event TicketBought,
//    pas besoin de le recalculer (évite les bugs de groupIndex)
export async function hasTicketClaimed(ticketContractId: string): Promise<boolean> {
  try {
    const ticketAddress = addressFromContractId(ticketContractId)
    const ticketContract = Ticket.at(ticketAddress)
    const info = await ticketContract.view.getInfo()
    return info.returns[2] as boolean
  } catch (error: any) {
    const msg = error?.message ?? ''
    if (msg.includes('does not exist') || msg.includes('destroyed') || msg.includes('not found')) {
      console.warn(`Ticket contract ${ticketContractId.slice(0, 8)}... not found → already claimed`)
      return true
    }
    console.warn(`hasTicketClaimed error (assuming not claimed):`, msg)
    return false
  }
}

// ── Claim les rewards d'un ticket via son contractId (fourni par l'event) ──
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
