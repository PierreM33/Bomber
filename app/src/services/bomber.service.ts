import {
  SignerProvider,
  web3,
  NodeProvider,
  DUST_AMOUNT,
  addressFromContractId,
  Script,
  ExecutableScript,
  HexString,
} from '@alephium/web3'
import { Bomber, BomberInstance } from '../../../contracts/artifacts_backup/ts'
import { getContractByCodeHash } from '../../../contracts/artifacts_backup/ts/contracts'
import { AllStructs } from '../../../contracts/artifacts_backup/ts/types'

// Import direct du JSON
import BuyTicketJson from '../../../contracts/artifacts_backup/BuyTicket.ral.json'

const TESTNET_NODE_URL = 'https://node.testnet.alephium.org'
web3.setCurrentNodeProvider(new NodeProvider(TESTNET_NODE_URL))

export const BOMBER_CONTRACT_ID = '4a08b8675e97f41e129d652b07d843c8e29ebad0f65c603a8288a92fa339be00'
export const BOMBER_CONTRACT_ADDRESS = addressFromContractId(BOMBER_CONTRACT_ID)

// ✅ Reconstruit le script directement ici
const BuyTicketScript = new ExecutableScript<{
  bomberId: HexString;
  amount: bigint;
}>(Script.fromJson(BuyTicketJson as any, "", AllStructs), getContractByCodeHash)

export function getBomberContract(): BomberInstance {
  return Bomber.at(BOMBER_CONTRACT_ADDRESS)
}

export async function getGameInfo() {
  try {
    const bomber = getBomberContract()
    const result = await bomber.view.getGameInfo()
    return {
      maxTicketsFor50Percent: result.returns[0],
      ticketCount: result.returns[1],
      currentRisk: result.returns[2],
      currentPrice: result.returns[3],
      isActive: result.returns[4]
    }
  } catch (error) {
    console.error("Erreur getGameInfo:", error)
    throw error
  }
}

export async function buyTicket(signer: SignerProvider) {
  try {
    const info = await getGameInfo()
    const price = BigInt(info.currentPrice)
    const dust = BigInt(DUST_AMOUNT)
    const totalAmount = price + dust
    const attoAlphToSend = price + dust * 2n

    console.log("bomberId:", BOMBER_CONTRACT_ID)
    console.log("bomberId length:", BOMBER_CONTRACT_ID.length)

    // ✅ Utilise BuyTicketScript local au lieu de l'import depuis scripts_backup.ts
    const result = await BuyTicketScript.execute(signer, {
      initialFields: {
        bomberId: BOMBER_CONTRACT_ID,
        amount: totalAmount
      },
      attoAlphAmount: attoAlphToSend,
      gasAmount: 200000
    })

    console.log("✅ Transaction envoyée ! ID:", result.txId)
    return result

  } catch (error: any) {
    console.error("Échec de la transaction:", error)
    throw error
  }
}
