/**
 * Configuration centralisée pour l'application Bomber
 *
 * Modifiez ce fichier pour changer les paramètres globaux
 */

import { NetworkId } from '@alephium/web3'

export const BOMBER_CONFIG = {
  // ===== CONFIGURATION DU CONTRAT =====
  CONTRACT_ADDRESS: '2A5PBHXi1T4cRznJzyzVq6U1RqcUteUtvbCijrFnSUuN7' as const,

  // ===== CONFIGURATION RÉSEAU =====
  NETWORK: 'testnet' as NetworkId,
  NODE_URL: 'https://node.testnet.alephium.org' as const,

  // ===== CONFIGURATION DE L'INTERFACE =====
  UI: {
    // Intervalle de rafraîchissement des données (en millisecondes)
    REFRESH_INTERVAL: 10000, // 10 secondes

    // Intervalle de polling des événements (en millisecondes)
    EVENT_POLLING_INTERVAL: 2000, // 2 secondes

    // Nombre maximum d'activités à afficher
    MAX_RECENT_ACTIVITIES: 10,

    // Thème du wallet (web95, retro, etc.)
    WALLET_THEME: 'web95' as const,

    // Activer les notifications navigateur
    ENABLE_BROWSER_NOTIFICATIONS: true,

    // Activer les sons
    ENABLE_SOUNDS: false,
  },

  // ===== CONFIGURATION DES COULEURS DU RISQUE =====
  RISK_COLORS: {
    LOW: '#4CAF50',      // Vert - risque < 20%
    MEDIUM: '#FFA726',   // Orange - risque 20-40%
    HIGH: '#ff4444',     // Rouge - risque > 40%
  },

  // ===== CONFIGURATION DES SEUILS =====
  RISK_THRESHOLDS: {
    LOW: 20,
    MEDIUM: 40,
  },

  // ===== LIENS EXTERNES =====
  LINKS: {
    EXPLORER_BASE: 'https://testnet.alephium.org',
    DOCS: 'https://docs.alephium.org',
    DISCORD: 'https://discord.gg/alephium',
  },

  // ===== FORMATAGE =====
  FORMAT: {
    // Nombre de décimales pour l'affichage des ALPH
    ALPH_DECIMALS: 2,

    // Nombre de caractères à afficher pour les adresses tronquées
    ADDRESS_PREFIX: 6,
    ADDRESS_SUFFIX: 4,
  },

  // ===== MESSAGES =====
  MESSAGES: {
    WALLET_NOT_CONNECTED: "Veuillez connecter votre wallet pour jouer",
    INSUFFICIENT_BALANCE: "Solde insuffisant pour acheter un ticket",
    TRANSACTION_PENDING: "Transaction en cours...",
    TRANSACTION_SUCCESS: "✅ Transaction réussie!",
    TRANSACTION_FAILED: "❌ Transaction échouée",
    LOADING: "Chargement...",
    NO_RECENT_ACTIVITY: "Aucune activité récente",
  },
} as const

// ===== FONCTIONS UTILITAIRES =====

/**
 * Formate une adresse Alephium pour l'affichage
 */
export function formatAddress(address: string): string {
  if (!address || address.length < BOMBER_CONFIG.FORMAT.ADDRESS_PREFIX + BOMBER_CONFIG.FORMAT.ADDRESS_SUFFIX) {
    return address
  }
  const prefix = address.slice(0, BOMBER_CONFIG.FORMAT.ADDRESS_PREFIX)
  const suffix = address.slice(-BOMBER_CONFIG.FORMAT.ADDRESS_SUFFIX)
  return `${prefix}...${suffix}`
}

/**
 * Formate un montant en ALPH pour l'affichage
 */
export function formatAlph(amount: bigint | string | number): string {
  const value = typeof amount === 'bigint'
    ? Number(amount) / 1e18
    : Number(amount)
  return value.toFixed(BOMBER_CONFIG.FORMAT.ALPH_DECIMALS)
}

/**
 * Obtient la couleur du risque selon le pourcentage
 */
export function getRiskColor(riskPercent: number | bigint): string {
  const risk = Number(riskPercent)
  if (risk < BOMBER_CONFIG.RISK_THRESHOLDS.LOW) {
    return BOMBER_CONFIG.RISK_COLORS.LOW
  } else if (risk < BOMBER_CONFIG.RISK_THRESHOLDS.MEDIUM) {
    return BOMBER_CONFIG.RISK_COLORS.MEDIUM
  } else {
    return BOMBER_CONFIG.RISK_COLORS.HIGH
  }
}

/**
 * Obtient le label du niveau de risque
 */
export function getRiskLabel(riskPercent: number | bigint): string {
  const risk = Number(riskPercent)
  if (risk < BOMBER_CONFIG.RISK_THRESHOLDS.LOW) {
    return 'Faible'
  } else if (risk < BOMBER_CONFIG.RISK_THRESHOLDS.MEDIUM) {
    return 'Moyen'
  } else {
    return 'Élevé'
  }
}

/**
 * Formate un timestamp en temps relatif ("il y a X minutes")
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) {
    return `Il y a ${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `Il y a ${minutes}min`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `Il y a ${hours}h`
  }

  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

/**
 * Génère le lien vers l'explorateur pour une transaction
 */
export function getExplorerTxUrl(txId: string): string {
  return `${BOMBER_CONFIG.LINKS.EXPLORER_BASE}/transactions/${txId}`
}

/**
 * Génère le lien vers l'explorateur pour une adresse
 */
export function getExplorerAddressUrl(address: string): string {
  return `${BOMBER_CONFIG.LINKS.EXPLORER_BASE}/addresses/${address}`
}

/**
 * Génère le lien vers l'explorateur pour le contrat
 */
export function getContractExplorerUrl(): string {
  return getExplorerAddressUrl(BOMBER_CONFIG.CONTRACT_ADDRESS)
}

/**
 * Demande la permission pour les notifications navigateur
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!BOMBER_CONFIG.UI.ENABLE_BROWSER_NOTIFICATIONS) {
    return false
  }

  if (!('Notification' in window)) {
    console.log('Les notifications ne sont pas supportées par ce navigateur')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Affiche une notification navigateur
 */
export function showNotification(title: string, body: string, icon?: string): void {
  if (!BOMBER_CONFIG.UI.ENABLE_BROWSER_NOTIFICATIONS) {
    return
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: icon || '💣' })
  }
}

// Export du type de configuration pour TypeScript
export type BomberConfig = typeof BOMBER_CONFIG
