import React, { useState, useMemo } from 'react'
import Head from 'next/head'
import styles from '@/styles/Rules.module.css'
import { Header } from '@/components/layout/Header'
import Simulator from "@/pages/simulator";

// ── Simulation helpers ────────────────────────────────────────────────────────

function getTicketPrice(ticketIndex: number, initialPrice = 1): number {
  if (ticketIndex === 0) return initialPrice
  return initialPrice + (initialPrice * 4 * ticketIndex) / 100
}

function getTotalPot(totalTickets: number, initialPrice = 1): number {
  let pot = 0
  for (let i = 0; i < totalTickets; i++) pot += getTicketPrice(i, initialPrice)
  return pot
}

function computeShares(totalTickets: number) {
  // ticketsAfter = totalTickets - ticketIndex  (position 0 = first buyer → most shares)
  const shares: number[] = []
  for (let i = 0; i < totalTickets; i++) shares.push(totalTickets - i)
  return shares
}

function simulate(totalTickets: number, myTicketIndex: number, initialPrice = 10) {
  const pot = getTotalPot(totalTickets, initialPrice)
  const platformFee = pot * 0.01
  const afterPlatform = pot - platformFee
  const redistTotal = afterPlatform * 0.50
  const jackpot = afterPlatform - redistTotal

  // My redistribution share
  const shares = computeShares(totalTickets)
  const totalShares = shares.reduce((a, b) => a + b, 0)
  const myShares = shares[myTicketIndex]
  const myRedist = (redistTotal * myShares) / totalShares

  // Jackpot winners (last 3 safe = tickets totalTickets-3, totalTickets-2, totalTickets-1)
  const winner1 = jackpot * 0.60
  const winner2 = jackpot * 0.25
  const winner3 = jackpot * 0.14

  const ticketCost = getTicketPrice(myTicketIndex, initialPrice)
  const deposit = 0.1

  return {
    pot: pot.toFixed(2),
    redistTotal: redistTotal.toFixed(2),
    jackpot: jackpot.toFixed(2),
    myRedist: myRedist.toFixed(3),
    roi: ((myRedist - ticketCost) / ticketCost * 100).toFixed(1),
    ticketCost: ticketCost.toFixed(2),
    winner1: winner1.toFixed(2),
    winner2: winner2.toFixed(2),
    winner3: winner3.toFixed(2),
    myShares,
    totalShares,
  }
}

// ── Content ───────────────────────────────────────────────────────────────────

const content = {
  en: {
    title: 'How to Play',
    subtitle: 'A high-stakes onchain game where every ticket could be your last.',
    sections: [
      {
        icon: '🎫',
        heading: 'Ticket Price',
        body: 'The first ticket costs <strong>1 ALPH</strong>. Each new ticket is <strong>4% more expensive</strong> than the previous one. The longer the round lasts, the higher the stakes.'
      },
      {
        icon: '💣',
        heading: 'The Bomb',
        body: 'With every purchase, the bomb\'s fuse gets shorter. The explosion risk starts at <strong>0%</strong> and climbs up to a hard cap of <strong>50%</strong>. The game ends when the bomb explodes — and it can happen at any time.'
      },
      {
        icon: '🏆',
        heading: 'Last 3 Survivors',
        body: 'The <strong>3 players who bought right before the explosion</strong> split the <strong>Jackpot (59% of the pot)</strong>:',
        list: [
          '🥇 Last safe player — 60% of the Jackpot',
          '🥈 Second to last — 25% of the Jackpot',
          '🥉 Third to last — 14% of the Jackpot',
        ]
      },
      {
        icon: '💎',
        heading: 'Redistribution Pool (40%)',
        body: '<strong>40% of the total pot</strong> is redistributed to <em>all ticket holders</em>. Your share depends on your position: <strong>the earlier you bought, the more you receive.</strong> This is the early-adopter advantage.',
        highlight: true
      },
      {
        icon: '🔒',
        heading: 'Safety Deposit',
        body: 'A small deposit of <strong>0.1 ALPH</strong> is locked when you buy. It is <strong>always refunded</strong> when you claim — win or lose.'
      },
      {
        icon: '🔄',
        heading: 'New Round',
        body: 'After each explosion, the game restarts with a <strong>fresh pot</strong> and new random difficulty. Previous round rewards remain claimable anytime.'
      },
    ],
    fees: '1% platform fee is deducted from the total pot before any distribution.',
    sim: {
      title: '🧮 Payout Simulator',
      subtitle: 'Adjust the sliders to see your estimated earnings.',
      totalTickets: 'Total tickets sold',
      myTicket: 'My ticket position',
      earlyLabel: 'Early buyer',
      lateLabel: 'Late buyer',
      pot: 'Total pot',
      jackpot: 'Jackpot pool (59%)',
      redistPool: 'Redistrib. pool (40%)',
      myCost: 'My ticket cost',
      myGain: 'My redistrib. share',
      roi: 'ROI on redistrib.',
      winners: 'Jackpot winners',
      w1: '🥇 1st',
      w2: '🥈 2nd',
      w3: '🥉 3rd',
      shares: 'shares',
      disclaimer: 'Simulation only. Actual results depend on when the bomb explodes.',
    }
  },
  fr: {
    title: 'Comment Jouer',
    subtitle: 'Un jeu onchain à fort enjeu où chaque ticket peut être le dernier.',
    sections: [
      {
        icon: '🎫',
        heading: 'Prix du Ticket',
        body: 'Le premier ticket coûte <strong>1 ALPH</strong>. Chaque nouveau ticket est <strong>4% plus cher</strong> que le précédent. Plus la partie dure, plus les enjeux sont élevés.'
      },
      {
        icon: '💣',
        heading: 'La Bombe',
        body: 'À chaque achat, la mèche raccourcit. Le risque d\'explosion part de <strong>0%</strong> et monte jusqu\'à un maximum de <strong>50%</strong>. Le jeu se termine quand la bombe explose — et ça peut arriver à tout moment.'
      },
      {
        icon: '🏆',
        heading: 'Les 3 Derniers Survivants',
        body: 'Les <strong>3 joueurs qui ont acheté juste avant l\'explosion</strong> se partagent le <strong>Jackpot (59% du pot)</strong> :',
        list: [
          '🥇 Dernier survivant — 60% du Jackpot',
          '🥈 Avant-dernier — 25% du Jackpot',
          '🥉 Troisième — 14% du Jackpot',
        ]
      },
      {
        icon: '💎',
        heading: 'Pool de Redistribution (40%)',
        body: '<strong>40% du pot total</strong> est redistribué à <em>tous les détenteurs de tickets</em>. Ta part dépend de ta position : <strong>plus tu achètes tôt, plus tu reçois.</strong> C\'est l\'avantage de l\'early adopter.',
        highlight: true
      },
      {
        icon: '🔒',
        heading: 'Dépôt de Sécurité',
        body: 'Un petit dépôt de <strong>0.1 ALPH</strong> est bloqué à l\'achat. Il est <strong>toujours remboursé</strong> lors du claim — que tu gagnes ou non.'
      },
      {
        icon: '🔄',
        heading: 'Nouveau Round',
        body: 'Après chaque explosion, le jeu redémarre avec un <strong>pot vierge</strong> et un nouveau seuil aléatoire. Les gains des rounds précédents restent claimables à tout moment.'
      },
    ],
    fees: '1% de frais de plateforme est prélevé sur le pot total avant toute distribution.',
    sim: {
      title: '🧮 Simulateur de Gains',
      subtitle: 'Ajuste les curseurs pour estimer tes gains.',
      totalTickets: 'Tickets vendus au total',
      myTicket: 'Ma position d\'achat',
      earlyLabel: 'Premier entrant',
      lateLabel: 'Dernier entrant',
      pot: 'Pot total',
      jackpot: 'Jackpot (59%)',
      redistPool: 'Pool redistrib. (40%)',
      myCost: 'Coût de mon ticket',
      myGain: 'Ma part de redistrib.',
      roi: 'ROI redistrib.',
      winners: 'Gagnants du Jackpot',
      w1: '🥇 1er',
      w2: '🥈 2ème',
      w3: '🥉 3ème',
      shares: 'parts',
      disclaimer: 'Simulation uniquement. Les résultats réels dépendent du moment où la bombe explose.',
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Rules() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const [totalTickets, setTotalTickets] = useState(30)
  const [myTicketIndex, setMyTicketIndex] = useState(0)

  const t = content[lang]
  const sim = t.sim

  // Clamp myTicketIndex when totalTickets changes
  const safeMyIndex = Math.min(myTicketIndex, totalTickets - 1)

  const result = useMemo(
    () => simulate(totalTickets, safeMyIndex),
    [totalTickets, safeMyIndex]
  )

  const roiNum = parseFloat(result.roi)
  const roiColor = roiNum >= 0 ? 'var(--prize-green)' : 'var(--danger-red)'

  return (
    <div className={styles.page}>
      <Head><title>Rules — Bomber Game</title></Head>
      <Header />

      <main className={styles.main}>
        {/* Lang switch */}
        <div className={styles.langSwitch}>
          <button className={lang === 'en' ? styles.active : ''} onClick={() => setLang('en')}>EN</button>
          <button className={lang === 'fr' ? styles.active : ''} onClick={() => setLang('fr')}>FR</button>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.bombGlyph}>💣</div>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </div>

        {/* Rules grid */}
        <div className={styles.grid}>
          {t.sections.map((s, i) => (
            <div key={i} className={`${styles.card} ${s.highlight ? styles.highlighted : ''}`}>
              <div className={styles.cardIcon}>{s.icon}</div>
              <h2 className={styles.cardHeading}>{s.heading}</h2>
              <p className={styles.cardBody} dangerouslySetInnerHTML={{ __html: s.body }} />
              {s.list && (
                <ul className={styles.winnerList}>
                  {s.list.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* ── Simulator ── */}
        <div className={styles.simCard}>
          <h2 className={styles.simTitle}>{sim.title}</h2>
          <p className={styles.simSubtitle}>{sim.subtitle}</p>

          <div className={styles.sliders}>
            {/* Total tickets */}
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>{sim.totalTickets}</span>
                <span className={styles.sliderValue}>{totalTickets}</span>
              </div>
              <input
                type="range" min={5} max={100} value={totalTickets}
                onChange={e => setTotalTickets(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            {/* My ticket */}
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>{sim.myTicket}</span>
                <span className={styles.sliderValue}>#{safeMyIndex + 1}</span>
              </div>
              <input
                type="range" min={0} max={totalTickets - 1} value={safeMyIndex}
                onChange={e => setMyTicketIndex(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles.sliderHints}>
                <span>{sim.earlyLabel}</span>
                <span>{sim.lateLabel}</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className={styles.simResults}>
            {/* Pot breakdown */}
            <div className={styles.simSection}>
              <div className={styles.simRow}>
                <span>{sim.pot}</span>
                <strong>{result.pot} ALPH</strong>
              </div>
              <div className={styles.simRow}>
                <span>{sim.redistPool}</span>
                <strong style={{ color: 'var(--prize-green)' }}>{result.redistTotal} ALPH</strong>
              </div>
              <div className={styles.simRow}>
                <span>{sim.jackpot}</span>
                <strong style={{ color: 'var(--warning-amber)' }}>{result.jackpot} ALPH</strong>
              </div>
            </div>

            <div className={styles.simDivider} />

            {/* My ticket */}
            <div className={styles.simSection}>
              <div className={styles.simRow}>
                <span>{sim.myCost} <em className={styles.dimNote}>(ticket #{safeMyIndex + 1})</em></span>
                <strong>−{result.ticketCost} ALPH</strong>
              </div>
              <div className={styles.simRow}>
                <span>
                  {sim.myGain}
                  <em className={styles.dimNote}> ({result.myShares}/{result.totalShares} {sim.shares})</em>
                </span>
                <strong style={{ color: 'var(--prize-green)' }}>+{result.myRedist} ALPH</strong>
              </div>
              <div className={styles.simRow}>
                <span>{sim.roi}</span>
                <strong style={{ color: roiColor }}>{roiNum >= 0 ? '+' + result.roi + '%' : result.roi + '%'}</strong>
              </div>
            </div>

            <div className={styles.simDivider} />

            {/* Jackpot winners */}
            <div className={styles.simSection}>
              <div className={styles.simSectionLabel}>{sim.winners}</div>
              <div className={styles.simRow}>
                <span>{sim.w1}</span>
                <strong style={{ color: 'var(--warning-amber)' }}>{result.winner1} ALPH</strong>
              </div>
              <div className={styles.simRow}>
                <span>{sim.w2}</span>
                <strong style={{ color: 'var(--warning-amber)' }}>{result.winner2} ALPH</strong>
              </div>
              <div className={styles.simRow}>
                <span>{sim.w3}</span>
                <strong style={{ color: 'var(--warning-amber)' }}>{result.winner3} ALPH</strong>
              </div>
            </div>
          </div>

          <p className={styles.simDisclaimer}>{sim.disclaimer}</p>
        </div>

        <p className={styles.feeNote}>⚙️ {t.fees}</p>
        <Simulator />
      </main>
    </div>
  )
}
