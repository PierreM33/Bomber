// contracts/alephium.config.ts
import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config({ path: path.resolve(__dirname, '../.env.backend') })
import { Configuration } from '@alephium/cli'
import { Number256 } from '@alephium/web3'

// Settings are usually for configuring
export type Settings = { issueTokenAmount: Number256 }
const defaultSettings: Settings = { issueTokenAmount: 100n }

// helpers
const parseKeys = (s?: string) =>
  (s ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)

const env = process.env

// URLs : on privilégie les variables spécifiques au réseau, puis un override générique NODE_URL
const DEVNET_URL  = env.DEVNET_NODE_URL  ?? 'http://127.0.0.1:22973'
const TESTNET_URL = env.TESTNET_NODE_URL ?? env.NODE_URL ?? 'https://node.testnet.alephium.org'
const MAINNET_URL = env.MAINNET_NODE_URL ?? env.NODE_URL ?? 'https://node.mainnet.alephium.org'

// Keys : on accepte <NETWORK>_PRIVATE_KEYS, PRIVATE_KEYS, ou PRIVATE_KEY (singulier)
const DEVNET_KEYS  = parseKeys(env.DEVNET_PRIVATE_KEYS  ?? env.PRIVATE_KEYS ?? env.PRIVATE_KEY)
const TESTNET_KEYS = parseKeys(env.TESTNET_PRIVATE_KEYS ?? env.PRIVATE_KEYS ?? env.PRIVATE_KEY)
const MAINNET_KEYS = parseKeys(env.MAINNET_PRIVATE_KEYS ?? env.PRIVATE_KEYS ?? env.PRIVATE_KEY)

const configuration: Configuration<Settings> = {
  networks: {
    devnet: {
      nodeUrl: DEVNET_URL,
      // garde ta clé hardcodée si rien n'est fourni via .env.backend
      privateKeys: DEVNET_KEYS.length
        ? DEVNET_KEYS
        : [
            'a642942e67258589cd2b1822c631506632db5a12aabcf413604e785300d762a5' // group 0 (fallback)
          ],
      settings: defaultSettings
    },

    testnet: {
      nodeUrl: TESTNET_URL,
      privateKeys: TESTNET_KEYS, // lira PRIVATE_KEY=... ou PRIVATE_KEYS=... depuis .env.backend
      settings: defaultSettings
    },

    mainnet: {
      nodeUrl: MAINNET_URL,
      privateKeys: MAINNET_KEYS,
      settings: defaultSettings
    }
  }
}

export default configuration
