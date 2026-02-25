import { web3, NodeProvider } from '@alephium/web3'
const TESTNET_NODE_URL = 'https://node.testnet.alephium.org'

// Configuration bomber depuis les déploiements
import { loadDeployments } from '../../../contracts/artifacts/ts/deployments'

const deployments = loadDeployments('testnet')

export const bomberConfig = {
  bomberAddress: deployments.contracts.Bomber.contractInstance.address,
  bomberContractId: deployments.contracts.Bomber.contractInstance.contractId,
  ticketTemplateId: deployments.contracts.Ticket.contractInstance.contractId
}

// ✅ Initialiser le node provider immédiatement
web3.setCurrentNodeProvider(new NodeProvider(TESTNET_NODE_URL))

console.log('🌐 Node provider initialisé:', TESTNET_NODE_URL)
console.log('💣 Bomber address:', bomberConfig.bomberAddress)
