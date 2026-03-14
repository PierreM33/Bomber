import React, { useState, useMemo } from 'react';

const BomberSimulator = () => {
  // --- Paramètres modifiables ---
  const [startPrice, setStartPrice] = useState(10);
  const [growthRate, setGrowthRate] = useState(5.5);
  const [totalTours, setTotalTours] = useState(30);
  const [redistribRate, setRedistribRate] = useState(40);
  const [tierPercentage, setTierPercentage] = useState(1.25);

  const simulation = useMemo(() => {
    // Calcul du nombre de early birds basé sur le % de tiers
    const nbEarlyBirds = Math.round((totalTours / 3) * tierPercentage);

    let tickets = [];
    let cumulativePot = 0;
    let currentPrice = startPrice;

    for (let i = 0; i < totalTours; i++) {
      tickets.push({ index: i + 1, price: currentPrice });
      cumulativePot += currentPrice;
      currentPrice = currentPrice * (1 + growthRate / 100);
    }

    const platformFee = cumulativePot * 0.01;
    const totalRedistribPool = cumulativePot * (redistribRate / 100);
    // Le reste du pot après frais et redistribution
    const winPot = cumulativePot - platformFee - totalRedistribPool;

    const redistribPerEarlyBird = nbEarlyBirds > 0 ? totalRedistribPool / nbEarlyBirds : 0;

    return {
      tickets,
      nbEarlyBirds,
      cumulativePot,
      platformFee,
      totalRedistribPool,
      winPot,
      redistribPerEarlyBird,
      w1: winPot * 0.70, // Gagnant 1
      w2: winPot * 0.29  // Gagnant 2 (25% + 4% récupérés du Random)
    };
  }, [startPrice, growthRate, totalTours, redistribRate, tierPercentage]);

  // Styles repris de la version précédente
  const containerStyle = { padding: '20px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', maxWidth: '950px', margin: 'auto' };
  const inputStyle = { padding: '10px', borderRadius: '6px', border: '2px solid #000', color: '#000', fontWeight: 'bold', width: '100%' };
  const cardStyle = (bg) => ({ flex: 1, padding: '15px', backgroundColor: bg, borderRadius: '8px', border: '2px solid #000', textAlign: 'center', minWidth: '150px' });
  const jackpotRow = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #ddd' };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', borderBottom: '4px solid #000', paddingBottom: '10px' }}>💣 BOMBER SIMULATOR</h1>

      {/* Inputs Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', margin: '20px 0' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Prix (ALPH)</label>
          <input type="number" value={startPrice} onChange={e => setStartPrice(+e.target.value)} style={inputStyle}/>
        </div>
        <div>
          <label style={{ fontWeight: 'bold' }}>Croissance %</label>
          <input type="number" step="0.1" value={growthRate} onChange={e => setGrowthRate(+e.target.value)} style={inputStyle}/>
        </div>
        <div>
          <label style={{ fontWeight: 'bold' }}>Tours</label>
          <input type="number" value={totalTours} onChange={e => setTotalTours(+e.target.value)} style={inputStyle}/>
        </div>
        <div>
          <label style={{ fontWeight: 'bold' }}>Tiers (ex 1.25)</label>
          <input type="number" step="0.05" value={tierPercentage} onChange={e => setTierPercentage(+e.target.value)} style={inputStyle}/>
        </div>
        <div>
          <label style={{ fontWeight: 'bold' }}>Redistrib %</label>
          <input type="number" value={redistribRate} onChange={e => setRedistribRate(+e.target.value)} style={inputStyle}/>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={cardStyle('#f3f4f6')}>
          <strong>POT TOTAL</strong><br/>
          <span style={{fontSize: '20px'}}>{simulation.cumulativePot.toFixed(2)} ALPH</span>
        </div>
        <div style={cardStyle('#dcfce7')}>
          <strong>GAIN EARLY (x{simulation.nbEarlyBirds})</strong><br/>
          <span style={{fontSize: '20px'}}>{simulation.redistribPerEarlyBird.toFixed(2)} ALPH</span>
        </div>
        <div style={cardStyle('#fee2e2')}>
          <strong>JACKPOT TOTAL</strong><br/>
          <span style={{fontSize: '20px'}}>{simulation.winPot.toFixed(2)} ALPH</span>
        </div>
      </div>

      {/* Jackpot Details Section */}
      <div style={{ border: '2px solid #000', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#fafafa' }}>
        <h3 style={{ marginTop: 0, borderBottom: '2px solid #000', paddingBottom: '5px' }}>🏆 Détails des Récompenses Finales</h3>
        <div style={jackpotRow}>
          <span>🏢 Plateforme (1%) :</span>
          <strong>{simulation.platformFee.toFixed(2)} ALPH</strong>
        </div>
        <div style={jackpotRow}>
          <span>🥇 Gagnant W1 (70%) :</span>
          <strong style={{fontSize: '18px', color: '#16a34a'}}>{simulation.w1.toFixed(2)} ALPH</strong>
        </div>
        <div style={jackpotRow}>
          <span>🥈 Second W2 (29%) :</span>
          <strong style={{fontSize: '18px'}}>{simulation.w2.toFixed(2)} ALPH</strong>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div style={{ border: '2px solid #000', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
          <tr style={{ backgroundColor: '#000', color: '#fff' }}>
            <th style={{padding: '12px'}}>Joueur</th>
            <th style={{padding: '12px'}}>Prix Payé</th>
            <th style={{padding: '12px'}}>Redistrib</th>
            <th style={{padding: '12px'}}>Bilan Net</th>
            <th style={{padding: '12px'}}>ROI %</th>
          </tr>
          </thead>
          <tbody>
          {simulation.tickets.map(t => {
            const isEarly = t.index <= simulation.nbEarlyBirds;
            const received = isEarly ? simulation.redistribPerEarlyBird : 0;
            const net = received - t.price;
            const roi = (net / t.price) * 100;

            return (
              <tr key={t.index} style={{ borderBottom: '1px solid #eee', textAlign: 'center', backgroundColor: isEarly ? '#f0fdf4' : '#fff' }}>
                <td style={{padding: '10px', fontWeight: 'bold'}}>J{t.index} {isEarly ? '💎' : ''}</td>
                <td>{t.price.toFixed(2)}</td>
                <td>{received.toFixed(2)}</td>
                <td style={{ color: net >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                  {net > 0 ? '+' : ''}{net.toFixed(2)}
                </td>
                <td style={{ fontWeight: 'bold' }}>{roi.toFixed(1)}%</td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BomberSimulator;
