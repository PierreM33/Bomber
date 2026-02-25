import React, { useState } from 'react';
import styles from '../../styles/Rules.module.css';

const Rules = () => {
  const [language, setLanguage] = useState('EN');

  const content = {
    EN: {
      title: "Game Rules",
      howToPlay: "How to Play",
      howToStep: "Buy a ticket to 'Take the Bomb'. Each purchase increases the pot and resets the timer for your advantage. But be careful: each ticket bought increases the risk of explosion!",
      mechanics: "Key Mechanics",
      priceTitle: "Rising Price",
      priceDesc: "The ticket price increases by 4% with every purchase.",
      riskTitle: "Explosion Risk",
      riskDesc: "The risk starts at 0% and increases linearly up to a maximum of 50% as tickets are sold.",
      rewards: "Jackpot Distribution",
      rewardsDesc: "When the bomb explodes, the total pot (minus a 1% platform fee) is split among the last 3 players:",
      winner1: "Last player (Winner 1): 60% of the jackpot",
      winner2: "Previous player (Winner 2): 25% of the jackpot",
      winner3: "3rd to last player (Winner 3): 14% of the jackpot",
      consolation: "Consolation Pool",
      consolationDesc: "10% of the pot is reserved for the 'Redistribution Pool'. All players who didn't win the jackpot can claim a share based on their ticket index once the game is over."
    },
    FR: {
      title: "Règlement du Jeu",
      howToPlay: "Comment Jouer",
      howToStep: "Achetez un ticket pour 'Prendre la Bombe'. Chaque achat augmente le pot. Mais attention : chaque ticket acheté augmente le risque d'explosion !",
      mechanics: "Mécaniques Clés",
      priceTitle: "Prix Croissant",
      priceDesc: "Le prix du ticket augmente de 4% à chaque nouvel achat.",
      riskTitle: "Risque d'Explosion",
      riskDesc: "Le risque commence à 0% et augmente linéairement jusqu'à un maximum de 50% au fil des ventes.",
      rewards: "Distribution du Jackpot",
      rewardsDesc: "Lorsque la bombe explose, le pot total (moins 1% de frais) est divisé entre les 3 derniers joueurs :",
      winner1: "Dernier joueur (Gagnant 1) : 60% du jackpot",
      winner2: "Avant-dernier (Gagnant 2) : 25% du jackpot",
      winner3: "3ème avant la fin (Gagnant 3) : 14% du jackpot",
      consolation: "Pool de Consolation",
      consolationDesc: "10% du pot est réservé au 'Pool de Redistribution'. Tous les perdants peuvent réclamer une part proportionnelle à leur ancienneté une fois la partie terminée."
    }
  };

  const t = content[language];

  return (
    <div className={styles.rulesContainer}>
      <div className={styles.langSwitch}>
        <button
          className={language === 'FR' ? styles.activeLang : ''}
          onClick={() => setLanguage('FR')}
        >
          FR
        </button>
        <button
          className={language === 'EN' ? styles.activeLang : ''}
          onClick={() => setLanguage('EN')}
        >
          EN
        </button>
      </div>

      <h1>{t.title}</h1>

      <section>
        <h2>{t.howToPlay}</h2>
        <p>{t.howToStep}</p>
      </section>

      <section>
        <h2>{t.mechanics}</h2>
        <ul>
          <li><strong>{t.priceTitle}:</strong> {t.priceDesc}</li>
          <li><strong>{t.riskTitle}:</strong> {t.riskDesc}</li>
        </ul>
      </section>

      <section>
        <h2>{t.rewards}</h2>
        <p>{t.rewardsDesc}</p>
        <ul className={styles.winnerList}>
          <li>🥇 {t.winner1}</li>
          <li>🥈 {t.winner2}</li>
          <li>🥉 {t.winner3}</li>
        </ul>
      </section>

      <section className={styles.consolationBox}>
        <h2>{t.consolation}</h2>
        <p>{t.consolationDesc}</p>
      </section>
    </div>
  );
};

export default Rules;
