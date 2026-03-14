import crypto from 'crypto'

// ── Config ────────────────────────────────────────────────
const MAX_TICKETS_FOR_50_PERCENT = 30  // tiré aléatoirement à l'init
const DELAY_MS = 2000                  // 2 secondes entre chaque tirage

// ── Helpers ───────────────────────────────────────────────
function blake2bSeed(...parts) {
  const hash = crypto.createHash('blake2b512')
  for (const p of parts) hash.update(p)
  // on prend les 32 premiers bytes
  const digest = hash.digest()
  // convertir en BigInt
  let result = 0n
  for (let i = 0; i < 32; i++) {
    result = (result << 8n) | BigInt(digest[i])
  }
  return result
}

function calculateRisk(ticketIndex, maxTickets) {
  if (maxTickets === 0 || ticketIndex === 0) return 0n
  const risk = (BigInt(ticketIndex) * 50n) / BigInt(maxTickets)
  return risk > 50n ? 50n : risk
}

function fakeBlockHash(ticketIndex) {
  // Simule un blockHash différent à chaque bloc
  return crypto.randomBytes(32)
}

function fakeOracleRandomness(roundId) {
  // L'oracle NE CHANGE PAS pendant plusieurs minutes
  // On utilise le roundId pour simuler ça : même round = même randomness
  const seed = Buffer.alloc(8)
  seed.writeBigUInt64BE(BigInt(roundId))
  return crypto.createHash('sha256').update(seed).digest()
}

// ── Simulation ────────────────────────────────────────────
let ticketIndex = 0
let totalTicketsEver = 0
let totalPot = 0n
let currentGameId = 0n
let oracleRound = 1
let oracleRoundAge = 0  // compteur pour simuler le changement de round

const INITIAL_PRICE = 1_000_000_000_000_000_000n  // 1 ALPH
let currentPrice = INITIAL_PRICE

let exploded = false
let survivalStreak = 0
let totalExplosions = 0
let totalDraws = 0

console.log('━'.repeat(65))
console.log('🎲  SIMULATEUR BOMBER - blake2b avec blockHash')
console.log(`📋  maxTicketsFor50Percent = ${MAX_TICKETS_FOR_50_PERCENT}`)
console.log(`⏱️   Un tirage toutes les ${DELAY_MS / 1000}s`)
console.log('━'.repeat(65))
console.log()

function draw() {
  if (exploded) {
    // Reset après explosion
    console.log()
    console.log('─'.repeat(65))
    console.log(`🔄  NOUVEAU ROUND - Game ID: ${++currentGameId}`)
    console.log('─'.repeat(65))
    console.log()
    ticketIndex = 0
    totalPot = 0n
    currentPrice = INITIAL_PRICE
    exploded = false
    survivalStreak = 0
    oracleRound++
    oracleRoundAge = 0
  }

  // L'oracle change de round toutes les ~8 tickets (simule 5-10 min)
  oracleRoundAge++
  if (oracleRoundAge >= 8) {
    oracleRound++
    oracleRoundAge = 0
    console.log(`   🔔 [ORACLE] Nouveau round #${oracleRound} — nouvelle randomness`)
  }

  const blockHash   = fakeBlockHash(ticketIndex)
  const randomness  = fakeOracleRandomness(oracleRound)
  const risk        = calculateRisk(ticketIndex + 1, MAX_TICKETS_FOR_50_PERCENT)

  // Même formule que ton contrat Ralph
  const seed = blake2bSeed(
    blockHash,
    randomness,
    Buffer.from(ticketIndex.toString()),
    Buffer.from(totalTicketsEver.toString()),
    Buffer.from(totalPot.toString())
  )

  const rand = seed % 100n
  const explodes = rand < risk

  totalPot += currentPrice
  const potAlph = (Number(totalPot) / 1e18).toFixed(2)
  const priceAlph = (Number(currentPrice) / 1e18).toFixed(4)

  // Affichage
  const riskBar = '█'.repeat(Number(risk)) + '░'.repeat(50 - Number(risk))
  const emoji = explodes ? '💥' : '✅'
  const verdict = explodes ? 'EXPLOSION !' : 'Survie'

  console.log(`Ticket #${String(ticketIndex).padEnd(3)} │ Prix: ${priceAlph} ALPH │ Pot: ${potAlph} ALPH`)
  console.log(`           │ Oracle round: #${oracleRound} │ BlockHash: ${blockHash.slice(0,4).toString('hex')}...`)
  console.log(`           │ Rand: ${String(rand).padEnd(3)} │ Risque: ${String(risk).padEnd(3)}% │ ${emoji} ${verdict}`)
  console.log(`           │ [${riskBar}] ${risk}%`)

  if (explodes) {
    totalExplosions++
    console.log()
    console.log(`   💣 BOOM ! La bombe a explosé au ticket #${ticketIndex} !`)
    console.log(`   📊 Survie streak avant explosion : ${survivalStreak} tickets`)
    console.log(`   💰 Pot total distribué : ${potAlph} ALPH`)
    exploded = true
  } else {
    survivalStreak++
  }

  totalDraws++
  console.log()

  // Mise à jour pour le prochain ticket
  ticketIndex++
  totalTicketsEver++
  currentPrice = (currentPrice * 10500n) / 10000n
}

// Lancement
setInterval(draw, DELAY_MS)
draw() // premier tirage immédiat
