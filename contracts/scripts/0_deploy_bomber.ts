import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Bomber, Ticket } from '../artifacts/ts' 
import { BuyTicket } from '../artifacts/ts/scripts'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { NodeProvider, ONE_ALPH, web3, binToHex , contractIdFromAddress } from "@alephium/web3"
import { PrivateKeyWallet } from '@alephium/web3-wallet'

dotenv.config({ path: path.resolve(__dirname, '../../.env.backend') }) 

// ============================================================
// ⚙️ CONFIGURATION MANUELLE DES TESTS
// ============================================================
const SHOULD_INITIALIZE = false;
const SHOULD_BUY_TEST_TICKET = true;
// ============================================================

const deployBomber: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  
  console.log("\n" + "━".repeat(60))
  console.log("🚀 DÉMARRAGE DU SCRIPT : BOMBER GAME")
  console.log("━".repeat(60))

  try {
    const rawKey = process.env.PRIVATE_KEY || ''
    const privateKey = rawKey.includes(',') ? rawKey.split(',')[0].trim() : rawKey.trim()
    const walletSigner = new PrivateKeyWallet({ privateKey })
    const playerAddress = walletSigner.address

    const nodeProvider = new NodeProvider(network.nodeUrl)
    web3.setCurrentNodeProvider(nodeProvider)

    const balanceInfo = await nodeProvider.addresses.getAddressesAddressBalance(playerAddress)
    const balanceAlph = Number(BigInt(balanceInfo.balance) / 10n**14n) / 10000 
    
    console.log(`👤 Acteur : ${playerAddress}`)
    console.log(`💰 Solde : ~${balanceAlph} ALPH`)

    const oracleAddress = '217k7FMPgahEQWCfSA1BN5TaxPsFovjPagpujkyxKDvS3' 
    const targetGroup = 0

    // ── ÉTAPE 1 : TICKET ──────────────────────────────────────
    console.log("\n📦 ÉTAPE 1 : Template Ticket")
    const ticketTemplate = await deployer.deployContract(Ticket, {
        initialFields: { bomberContractId: '', owner: playerAddress, ticketIndex: 0n, claimed: false },
        deployAddressIndex: targetGroup
    })
    console.log(`✅ Ticket Template Address : ${ticketTemplate.contractInstance.address}`)
    console.log(`   Ticket Template ID      : ${ticketTemplate.contractInstance.contractId}`)
  
    // ── ÉTAPE 2 : BOMBER ──────────────────────────────────────
    console.log("\n🚀 ÉTAPE 2 : Contrat Bomber")
    const resultDeploy = await deployer.deployContract(Bomber, {
        initialFields: {
            platformAddress: playerAddress,
            oracle: oracleAddress,
            ticketTemplateId: ticketTemplate.contractInstance.contractId,
            initialTicketPrice: ONE_ALPH,
            maxTicketsFor50Percent: 0n,
            ticketCount: 0n,
            totalPot: 0n,
            redistributionPool: 0n,
            lastPlayers: [playerAddress, playerAddress, playerAddress],
            lastPlayerIndex: 0n,
            isActive: false
        },
        initialAttoAlphAmount: ONE_ALPH,
        deployAddressIndex: targetGroup
    } as any)
    
    const bomberInstance = resultDeploy.contractInstance
    console.log(`✅ Bomber Address : ${bomberInstance.address}`)
    console.log(`   Bomber ID      : ${bomberInstance.contractId}`)

    // ── ÉTAPE 3 : INITIALISATION ──────────────────────────────
    if (SHOULD_INITIALIZE) {
        console.log("\n📞 ÉTAPE 3 : Appel de initialize()...")
        const tx = await bomberInstance.transact.initialize({ signer: walletSigner })
        console.log(`⏳ TX envoyée : ${tx.txId}`)
        console.log("⏳ Attente de confirmation (30s)...")
        await new Promise(resolve => setTimeout(resolve, 30000))
        console.log("✅ Confirmation attendue.")
    } else {
        console.log("\n⏭️  ÉTAPE 3 : initialize() ignorée (SHOULD_INITIALIZE = false)")
    }

    // ── ÉTAPE 4 : ACHAT DE TEST ───────────────────────────────
    if (SHOULD_BUY_TEST_TICKET) {
        console.log("\n🛒 ÉTAPE 4 : Test d'achat manuel...")
        
        try {
            // Conversion adresse → contractId hex propre (sans group suffix)
            const bomberHex = binToHex(contractIdFromAddress(bomberInstance.address))
            console.log(`   [DEBUG] bomberInstance.address : ${bomberInstance.address}`)
            console.log(`   [DEBUG] bomberHex              : ${bomberHex}`)
            console.log(`   [DEBUG] bomberHex.length       : ${bomberHex.length}`)
            console.log(`   [DEBUG] bomberHex finit par    : ...${bomberHex.slice(-6)}`)

            const gameInfo = await bomberInstance.view.getGameInfo()
            const price = gameInfo.returns[3]
            const totalAmount = price + 1000000000000000n
            console.log(`   [DEBUG] price       : ${price.toString()} attoALPH`)
            console.log(`   [DEBUG] totalAmount : ${totalAmount.toString()} attoALPH`)

            console.log(`\n   ▶️  Envoi BuyTicket.execute...`)
            const buyTx = await BuyTicket.execute(walletSigner, {
                initialFields: {
                    bomber: bomberHex,
                    amount: totalAmount
                },
                attoAlphAmount: totalAmount
            })

            console.log(`✅ ACHAT RÉUSSI ! TxID: ${buyTx.txId}`)

        } catch (buyErr: any) {
            console.error("❌ Échec de l'achat :", buyErr.message || buyErr)
            if (buyErr.stack) console.error("   → stack :", buyErr.stack.split('\n').slice(0, 5).join('\n'))
        }
    }

    // ── ÉTAPE 5 : VÉRIFICATION FINALE ─────────────────────────
    console.log("\n🔍 ÉTAPE 5 : Status final")
    const finalInfo = await bomberInstance.view.getGameInfo()
    console.log(`   Statut         : ${finalInfo.returns[4] ? "ACTIF ✅" : "INACTIF ❌"}`)
    console.log(`   Tickets vendus : ${finalInfo.returns[1]}`)
    console.log(`   Total pot      : ${finalInfo.returns[2]?.toString() || '?'} attoALPH`)

  } catch (error: any) {
    console.error("\n❌ ERREUR GÉNÉRALE :", error.message || error)
    if (error.stack) console.error("   → stack :", error.stack.split('\n').slice(0, 8).join('\n'))
  }
}

export default deployBomber
