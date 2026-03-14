import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { web3, NodeProvider } from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { RandomTester } from '../artifacts/ts'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.backend') })

const TESTNET_NODE_URL = 'https://node.testnet.alephium.org'
const ORACLE_ADDRESS   = '217k7FMPgahEQWCfSA1BN5TaxPsFovjPagpujkyxKDvS3'

const deployAndTest: DeployFunction<any> = async (deployer: Deployer): Promise<void> => {
  // const nodeProvider = new NodeProvider(TESTNET_NODE_URL)
  // web3.setCurrentNodeProvider(nodeProvider)

  // const signer = new PrivateKeyWallet({
  //   privateKey: process.env.PRIVATE_KEY!,
  //   nodeProvider
  // })

  // console.log('━'.repeat(55))
  // console.log('🎲 RANDOM TESTER')
  // console.log('━'.repeat(55))

  // const result = await deployer.deployContract(RandomTester, {
  //   initialFields: {
  //     oracle: ORACLE_ADDRESS,
  //     callCount: 0n
  //   }
  // })

  // const address = result.contractInstance.address
  // console.log(`✅ Déployé : ${address}`)
  // console.log()

  // console.log('📊 10 tirages avec risk=50 :')
  // console.log('─'.repeat(55))
  // console.log('Call │ Round │ Raw │ Simple │ Blake │ Explode?')
  // console.log('─'.repeat(55))

  // for (let i = 0; i < 10; i++) {
  //   await new Promise(r => setTimeout(r, 3000))

  //   const tx = await RandomTester.at(address).transact.test({
  //     signer,
  //     args: { risk: 50n }
  //   })

  //   await new Promise(r => setTimeout(r, 15000))

  //   const events = await nodeProvider.events.getEventsTxIdTxid(tx.txId)
  //   const ev = events.events[0]

  //   if (ev) {
  //     const call          = ev.fields[0].value
  //     const round         = ev.fields[1].value
  //     const raw           = ev.fields[2].value
  //     const randSimple    = ev.fields[3].value
  //     const randBlake     = ev.fields[4].value
  //     const wouldExplodeS = ev.fields[6].value
  //     const wouldExplodeB = ev.fields[7].value

  //     console.log(
  //       `#${String(call).padEnd(3)} │ ${String(round).padEnd(5)} │ ${String(raw).padEnd(3)} │ ` +
  //       `${String(randSimple).padEnd(6)} │ ${String(randBlake).padEnd(5)} │ ` +
  //       `S:${wouldExplodeS ? '💥' : '✅'} B:${wouldExplodeB ? '💥' : '✅'}`
  //     )
  //   }
  // }

  // console.log()
  // console.log('━'.repeat(55))
  // console.log('✅ Test terminé')
}

export default deployAndTest
