import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Bomber, Ticket } from '../artifacts/ts' 
import { BuyTicket } from '../artifacts/ts/scripts'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { NodeProvider, ONE_ALPH, web3, binToHex , contractIdFromAddress } from "@alephium/web3"
import { PrivateKeyWallet } from '@alephium/web3-wallet'

dotenv.config({ path: path.resolve(__dirname, '../../.env.backend') }) 

const SHOULD_INITIALIZE = true;
const SHOULD_BUY_TEST_TICKET = false;

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
    console.log(`💰 Solde  : ~${balanceAlph} ALPH`)

    const oracleAddress = '217k7FMPgahEQWCfSA1BN5TaxPsFovjPagpujkyxKDvS3' 
    const targetGroup = 0

    // ── ÉTAPE 1 : TICKET ──────────────────────────────────────
    console.log("\n" + "─".repeat(60))
    console.log("📦 ÉTAPE 1 : Déploiement Template Ticket")
    console.log("─".repeat(60))
    const ticketTemplate = await deployer.deployContract(Ticket, {
        initialFields: {
            bomberContractId: '',
            owner: playerAddress,
            ticketIndex: 0n,
            uniqueId: 0n,
            gameId: 0n,
            claimed: false
        },
        deployAddressIndex: targetGroup
    })
    console.log(`✅ Ticket Template Address : ${ticketTemplate.contractInstance.address}`)
    console.log(`   Ticket Template ID      : ${ticketTemplate.contractInstance.contractId}`)
  
    // ── ÉTAPE 2 : BOMBER ──────────────────────────────────────
    console.log("\n" + "─".repeat(60))
    console.log("🚀 ÉTAPE 2 : Déploiement Contrat Bomber")
    console.log("─".repeat(60))
    const resultDeploy = await deployer.deployContract(Bomber, {
        initialFields: {
            platformAddress: playerAddress,
            oracle: oracleAddress,
            ticketTemplateId: ticketTemplate.contractInstance.contractId,
            initialTicketPrice: ONE_ALPH,
            maxTicketsFor50Percent: 0n,
            ticketCount: 0n,
            totalTicketsEver: 0n,
            currentGameId: 0n,
            totalPot: 0n,
            redistributionPool: 0n,
            lastPlayers: [playerAddress, playerAddress],
            lastPlayerIndex: 0n,
            isActive: false,
            currentPrice: ONE_ALPH
        },
        initialAttoAlphAmount: ONE_ALPH,
        deployAddressIndex: targetGroup
    } as any)
    
    const bomberInstance = resultDeploy.contractInstance
    console.log(`✅ Bomber Address : ${bomberInstance.address}`)
    console.log(`   Bomber ID      : ${bomberInstance.contractId}`)

    // ── ÉTAPE 3 : INITIALISATION ──────────────────────────────
    if (SHOULD_INITIALIZE) {
        console.log("\n" + "─".repeat(60))
        console.log("📞 ÉTAPE 3 : Appel de initialize()")
        console.log("─".repeat(60))
        const tx = await bomberInstance.transact.initialize({ signer: walletSigner })
        console.log(`⏳ TX envoyée : ${tx.txId}`)
        console.log("⏳ Attente de confirmation (30s)...")
        await new Promise(resolve => setTimeout(resolve, 30000))
        console.log("✅ Confirmation attendue.")

        // ✅ Lecture du state après initialize pour voir maxTicketsFor50Percent
        const stateAfterInit = await bomberInstance.fetchState()
        const maxTickets = stateAfterInit.fields.maxTicketsFor50Percent as bigint
        const initPrice = stateAfterInit.fields.currentPrice as bigint
        const isActive = stateAfterInit.fields.isActive as boolean

        console.log("\n📊 État après initialize() :")
        console.log(`   🎲 maxTicketsFor50Percent : ${maxTickets} tickets`)
        console.log(`   ⚠️  La bombe atteint 50% au ticket #${maxTickets}`)
        console.log(`   ⚠️  La bombe est à 100% max (cap) à partir du ticket #${maxTickets * 2n}`)
        console.log(`   💰 Prix initial           : ${Number(initPrice) / 1e18} ALPH`)
        console.log(`   🟢 Jeu actif              : ${isActive}`)

        // ✅ Simulation de la progression des prix et risques
        console.log("\n📈 Simulation progression (10 premiers tickets) :")
        console.log("   Ticket │ Prix (ALPH) │ Risque %")
        console.log("   ───────┼─────────────┼─────────")
        let simPrice = ONE_ALPH
        for (let i = 1; i <= 10; i++) {
            const risk = maxTickets > 0n
                ? (BigInt(i) * 50n) / maxTickets
                : 0n
            const cappedRisk = risk > 50n ? 50n : risk
            const priceAlph = (Number(simPrice) / 1e18).toFixed(4)
            console.log(`   #${String(i).padEnd(6)} │ ${priceAlph.padEnd(11)} │ ${cappedRisk}%`)
            simPrice = (simPrice * 10500n) / 10000n
        }
        console.log(`   ...`)
        console.log(`   #${maxTickets} → risque atteint 50% (cap)`)

    } else {
        console.log("\n⏭️  ÉTAPE 3 : initialize() ignorée (SHOULD_INITIALIZE = false)")
    }

    // ── ÉTAPE 4 : ACHAT DE TEST ───────────────────────────────
    if (SHOULD_BUY_TEST_TICKET) {
        console.log("\n" + "─".repeat(60))
        console.log("🛒 ÉTAPE 4 : Test d'achat manuel")
        console.log("─".repeat(60))
        
        try {
            const bomberHex = bomberInstance.contractId
            console.log(`   Bomber ID  : ${bomberHex}`)

            const gameInfo = await bomberInstance.view.getGameInfo()
            const price = gameInfo.returns[3] as bigint
            const ticketCount = gameInfo.returns[1] as bigint
            const totalAmount = price + ONE_ALPH / 10n + (price * 30n / 100n)

            console.log(`   Prix actuel   : ${(Number(price) / 1e18).toFixed(4)} ALPH`)
            console.log(`   Total envoyé  : ${(Number(totalAmount) / 1e18).toFixed(4)} ALPH (avec slippage 30%)`)
            console.log(`   Ticket #      : ${ticketCount}`)

            const buyTx = await BuyTicket.execute(walletSigner, {
                initialFields: { bomber: bomberHex, amount: totalAmount },
                attoAlphAmount: totalAmount
            })
            console.log(`✅ ACHAT RÉUSSI ! TxID: ${buyTx.txId}`)

        } catch (buyErr: any) {
            console.error("❌ Échec de l'achat :", buyErr.message || buyErr)
        }
    }

    // ── ÉTAPE 5 : VÉRIFICATION FINALE ─────────────────────────
    console.log("\n" + "─".repeat(60))
    console.log("🔍 ÉTAPE 5 : Status final du contrat")
    console.log("─".repeat(60))
    const finalState = await bomberInstance.fetchState()
    const finalInfo = await bomberInstance.view.getGameInfo()

    console.log(`   🟢 Statut              : ${finalInfo.returns[4] ? "ACTIF ✅" : "INACTIF ❌"}`)
    console.log(`   🎫 Tickets vendus      : ${finalInfo.returns[1]}`)
    console.log(`   💰 Total pot           : ${(Number(finalInfo.returns[2] as bigint) / 1e18).toFixed(4)} ALPH`)
    console.log(`   💵 Prix prochain ticket: ${(Number(finalInfo.returns[3] as bigint) / 1e18).toFixed(4)} ALPH`)
    console.log(`   🎲 maxTicketsFor50%    : ${finalState.fields.maxTicketsFor50Percent}`)
    console.log(`   🆔 Game ID             : ${finalInfo.returns[0]}`)

    console.log("\n" + "━".repeat(60))
    console.log("✅ DÉPLOIEMENT TERMINÉ")
    console.log("━".repeat(60))
    console.log(`\n📋 À copier dans ta config front :`)
    console.log(`   bomberContractId : "${bomberInstance.contractId}"`)
    console.log(`   bomberAddress    : "${bomberInstance.address}"`)

  } catch (error: any) {
    console.error("\n❌ ERREUR GÉNÉRALE :", error.message || error)
    if (error.stack) console.error("   → stack :", error.stack.split('\n').slice(0, 8).join('\n'))
  }
}

export default deployBomber