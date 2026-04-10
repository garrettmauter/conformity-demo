import { useState, useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

// Generate shuffled trial sequence
function generateTrials() {
  const conditions = [
    { reward: 'win', social: 'consensus' },
    { reward: 'win', social: 'dissent' },
    { reward: 'lose', social: 'consensus' },
    { reward: 'lose', social: 'dissent' },
  ];

  // Populate trials array with 4 of each outcome state
  const trials = [];
  conditions.forEach(condition => {
    for (let i = 0; i < 4; i++) {
      trials.push({ ...condition });
    }
  });

  // Shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }

  return trials;
}

function Circle() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="25" fill="#374151" />
    </svg>
  );
}

function Square() {
  return(
    <svg width="60" height="60" viewBox="0 0 60 60">
      <rect x="5" y="5" width="50" height="50" rx="4" fill="#374151" />
    </svg>
  );
}

function Avatar({ color = '#8c8c9e2b', label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="12" r="8" fill={color} />
        <circle cx="16" cy="35" r="14" fill={color} />
      </svg>
      {label && <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{label}</span>}
    </div>
  );
}

function calculateStayProbs(choices) {
  const conditions = {
    'win_consensus': { stayed: 0, total: 0 },
    'win_dissent': { stayed: 0, total: 0 },
    'lose_consensus': { stayed: 0, total: 0 },
    'lose_dissent': { stayed: 0, total: 0 },  
  };

  // loop through trials to calculate stay probability
  for (let i = 1; i < choices.length; i++) {
    const prev = choices[i - 1];
    const curr = choices[i];
    const key = `${prev.condition.reward}_${prev.condition.social}`;

    conditions[key].total++;
    if (prev.choice === curr.choice) {
      conditions[key].stayed++;
    }
  }

  // convert to probabilities
  const probs = {};
  for (const key in conditions) {
    const { stayed, total } = conditions[key];
    probs[key] = total > 0 ? Math.round((stayed / total) * 100) : 0;
  }
  return probs;
}

function ResultsChart({ probs }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: ['Win + Consensus', 'Win + Dissent', 'Lose + Consensus', 'Lose + Dissent'],
        datasets: [{
          label: 'Stay probability (%)',
          data: [
            probs.win_consensus,
            probs.win_dissent,
            probs.lose_consensus,
            probs.lose_dissent
          ],
          backgroundColor: ['#059669', '#10b981', '#dc2626', '#f87171'],
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100 }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [probs]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '250px', marginBottom: '24px' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}


function nelderMead(fn, x0, bounds, maxIter = 500, tol = 1e-6) {
  const n = x0.length;
  const alpha = 1, gamma = 2, rho = 0.5, sigma = 0.5;

  // initialize simplex
  let simplex = [{ x: x0, f: fn(x0) }];
  for (let i = 0; i < n; i++) {
    let xi = [...x0];
    xi[i] = xi[i] + (bounds.upper[i] - bounds.lower[i]) * 0.1;
    simplex.push({ x: xi, f: fn(xi) });
  }

  // clamp
  const clamp = (x) => x.map((v, i) => Math.max(bounds.lower[i], Math.min(bounds.upper[i], v)));

  // optimization loop
  for (let iter = 0; iter < maxIter; iter++) {
    simplex.sort((a, b) => a.f - b.f);
    if (Math.abs(simplex[n].f - simplex[0].f) < tol) break;
  
    // compute centroid - avg position of all vertices except worst
    let centroid = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        centroid[j] += simplex[i].x[j] / n;
      }
    }
    // reflection - reflect worst vertex through centroid to opposite side
    let xr = clamp(centroid.map((c, i) => c + alpha * (c - simplex[n].x[i])));
    let fr = fn(xr);

    if (fr < simplex[n - 1].f && fr >= simplex[0].f) {
      simplex[n] = { x: xr, f: fr };
      continue;
    }

    // expansion
    if (fr < simplex[0].f) {
      let xe = clamp(centroid.map((c, i) => c + gamma * (xr[i] - c)));
      let fe = fn(xe);
      simplex[n] = fe < fr ? { x: xe, f: fe } : { x: xr, f: fr };
      continue;
    }

    // contraction - if reflection didn't work
    let xc = clamp(centroid.map((c, i) => c + rho * (simplex[n].x[i] - c)));
    let fc = fn(xc);
    if (fc < simplex[n].f) {
      simplex[n] = { x: xc, f: fc };
      continue;
    }

    // shrink - last resort
    for (let i = 1; i <= n; i++) {
      simplex[i].x = clamp(simplex[0].x.map((v, j) => v + sigma * (simplex[i].x[j] - v)));
      simplex[i].f = fn(simplex[i].x);
    }
  }

  // final sort, return best vertex's params and func value (NLL)
  simplex.sort((a, b) => a.f - b.f);
  return { params: simplex[0].x, nll: simplex[0].f };
}

function computeNLL(params, trials, modelType) {
  // model types: hybrid, imitation, social, baseline

  //initialize values for shapes
  let freqVals = { A: 1, B: 1 }; // for UCB

  let actVals, payVals, sumVals;

  if (modelType === 'hybrid' || modelType === 'imitation') {
    actVals = { A: 0, B: 0 };
    payVals = { A: 0.5, B: 0.5 };
  } else {
    sumVals = { A: 0.5, B: 0.5 };
  }

  let nll = 0;
  
  // trial loop
  for (let i = 0; i < trials.length; i++) {
    const trial = trials[i];
    const choice = trial.choice;

    // get current values for each option
    let valA, valB;
    if (modelType === 'hybrid' || modelType === 'imitation') {
      valA = actVals.A + payVals.A;
      valB = actVals.B + payVals.B;
    } else {
      valA = sumVals.A;
      valB = sumVals.B;
    }

    // add UCB exploration bonus
    valA += Math.sqrt(2 * Math.log(i + 1) / freqVals.A);
    valB += Math.sqrt(2 * Math.log(i + 1) / freqVals.B);

    // softmax choice probability
    const beta = params[params.length - 1]; //decision noise 
    const probA = Math.exp(beta * valA) / (Math.exp(beta * valA) + Math.exp(beta * valB));    const probChosen = choice === 'A' ? probA : 1 - probA;

    // nll
    nll -= Math.log(Math.max(probChosen, 1e-10));  // clamp to avoid log(0)
  
    // update vals on feedback trials
    const reward = trial.outcome === 'win' ? 1 : 0;
    const consensus = trial.condition.social === 'consensus' ? 2 : 0;

    // update freq for UCB
    freqVals[choice] += 1;

    if (modelType === 'hybrid') {
      // params: [alpha_money, alpha_imitation, alpha_social, beta]
      actVals[choice] += params[1] * (consensus - actVals[choice]);
      payVals[choice] += params[0] * (reward - payVals[choice]) + params[2] * (consensus - payVals[choice]);
    } else if (modelType === 'imitation') {
      // params: [alpha_money, alpha_imitation, beta]
      actVals[choice] += params[1] * (consensus - actVals[choice]);
      payVals[choice] += params[0] * (reward - payVals[choice]);
    } else if (modelType === 'social') {
      // params: [alpha_money, alpha_social, beta]
      sumVals[choice] += params[0] * (reward - sumVals[choice]) + params[1] * (consensus - sumVals[choice]);
    } else if (modelType === 'baseline') {
      // params: [alpha_money, beta]
      sumVals[choice] += params[0] * (reward - sumVals[choice]);
    }
  }

  return nll;
}


function fitModels(trials) {
  const models = {
    hybrid: {
      x0: [0.5, 0.5, 0.5, 5],
      bounds: {
        lower: [0.01, 0.01, 0.01, 1],
        upper: [0.99, 0.99, 0.99, 10]
      },
      k: 4
    },
    imitation: {
      x0: [0.5, 0.5, 5],
      bounds: {
        lower: [0.01, 0.01, 1],
        upper: [0.99, 0.99, 10]
      },
      k: 3
    },
    social: {
      x0: [0.5, 0.5, 5],
      bounds: {
        lower: [0.01, 0.01, 1],
        upper: [0.99, 0.99, 10]
      },
      k: 3
    },
    baseline: {
      x0: [0.5, 5],
      bounds: {
        lower: [0.01, 1],
        upper: [0.99, 10]
      },
      k: 2
    }
  }

  const results = {};

  for (const [modelType, config] of Object.entries(models)) {
    const { params, nll } = nelderMead(
      (p) => computeNLL(p, trials, modelType),
      config.x0,
      config.bounds
    );

    const aic = 2 * config.k + 2 * nll;

    results[modelType] = { params, nll, aic };
  }

  // get best model fit (lowest AIC)
  const best = Object.entries(results).reduce((a, b) =>
    a[1].aic < b[1].aic ? a : b
  )[0];

  return { results, best };
}


function ModelComparison({ results, best }) {
  const modelNames = {
    hybrid: 'Hybrid',
    imitation: 'Imitation',
    social: 'Social Reward',
    baseline: 'Baseline (Money Only)'
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Model Comparison</h3>
      <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '0.5rem' }}>
        Lower AIC = better fit to your choices.
      </p>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {Object.entries(results).map(([model, { aic }]) => (
          <div 
            key={model}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: model === best ? '#10b981' : '#f3f4f6',
              color: model === best ? 'white' : '#374151',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: model === best ? 600 : 400 }}>
              {modelNames[model]}
              {model === best && ' ✓'}
            </span>
            <span style={{ fontSize: '0.875rem' }}>
              AIC: {aic.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


function App() {
  const [screen, setScreen] = useState('welcome');
  const [trials, setTrials] = useState(() => generateTrials());
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentChoice, setCurrentChoice] = useState(null);
  const [leftShape, setLeftShape] = useState('A');
  const [trialPhase, setTrialPhase] = useState('choice');
  const [choices, setChoices] = useState([]);
  const [userPosition, setUserPosition] = useState(null);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    card: {
      background: '#ffffff',
      borderRadius: '24px',
      padding: '48px',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      textAlign: 'center',
      minHeight: '450px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '16px'
    },
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      lineHeight: '1.6',
      marginBottom: '32px',
    },
    button: {
      background: '#6366f1',
      color: '#ffffff',
      border: 'none',
      borderRadius: '12px',
      padding: '14px 32px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    feedback: {
      padding: '16px 24px',
      borderRadius: '12px',
      marginTop: '16px',
      fontSize: '16px',
      fontWeight: '500',
    },
  };
  
  function startGame() {
    setTrials(generateTrials());
    setCurrentTrial(0);
    setCurrentChoice(null);
    setScreen('trial');
    setLeftShape(Math.random() > 0.5 ? 'A' : 'B');
    setTrialPhase('choice');
    setChoices([]);
    setScreen('trial');
  }

  function handleChoice(shape) {
    setCurrentChoice(shape);
    setTrialPhase('social');
  

    // Show reward after 1.5s
    setTimeout(() => {
      setTrialPhase('reward');
    }, 1500);
  } 

  function nextTrial() {
    const trial = trials[currentTrial];
    
    const stayed = choices.length > 0
      ? choices[choices.length - 1].choice === currentChoice
      : null;
      
    const prevCondition = choices.length > 0
      ? choices[choices.length - 1].condition
      : null;

    setChoices([...choices, {
      choice: currentChoice,
      condition: trial,
      stayed: stayed,
      prevCondition: prevCondition
    }]);

    if (currentTrial < trials.length - 1) {
      setCurrentTrial(currentTrial + 1);
      setCurrentChoice(null);
      setLeftShape(Math.random() > 0.5 ? 'A' : 'B');
      setTrialPhase('choice');
    } else {
      setScreen('results');
    }
  }


  if (screen === 'welcome') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Social Conformity</h1>
          <p style={styles.subtitle}>
            Do you follow the crowd because belonging is intrinsically rewarding, or are you just copying?          </p>
          <button style={styles.button} onClick={() => setScreen('instructions')}>
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'instructions') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>How it works</h2>
          <p>1. You'll see two gambling choices</p>
          <p>2. Pick one</p>
          <p>3. See what the other players picked</p>
          <p>4. See which machine paid more</p>
          <button style={styles.button} onClick={startGame}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'trial') {
    const trial = trials[currentTrial];

    if (!trial) {
      return <div>Loading...</div>;
    }

    const rightShape = leftShape === 'A' ? 'B' : 'A';

    return (
      <div style={styles.container}>
        <div style={styles.card}> 
          <p style={{
            background: '#f1f5f9',
            color: '#64748b',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '32px',
            display: 'inline-block',
          }}>
            Round {currentTrial + 1} of {trials.length}
          </p>
          
          {trialPhase === 'choice' && (
            <div style={{ height: '52px', marginBottom: '16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <Avatar color="#6366f1" label="You" />
            </div>
          )}

          {trialPhase !== 'choice' && (
            <div style={{ height: '68px' }}></div>
          )}

          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>       
              <div style={{ height: '52px', display: 'flex', alignItems: 'flex-end' }}>
                {trialPhase !== 'choice' && currentChoice === leftShape && <Avatar color="#6366f1" label="You" />}
                {trialPhase !== 'choice' && trial.social === 'consensus' && currentChoice === leftShape && (
                  <>
                    <Avatar color="#94a3b8" label="P2" />
                    <Avatar color="#94a3b8" label="P3" />
                  </>
                )}
                {trialPhase !== 'choice' && trial.social === 'dissent' && currentChoice !== leftShape && (
                  <>
                    <Avatar color="#94a3b8" label="P2" />
                    <Avatar color="#94a3b8" label="P3" />
                  </>
                )}
              </div>
              <button
                onClick={() => trialPhase === 'choice' && handleChoice(leftShape)}
                style={{
                  width: '100px',
                  height: '100px',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  borderRadius: '16px',
                  border: currentChoice === leftShape ? '3px solid #6366f1' : '3px solid #cbd5e1',
                  background: currentChoice === leftShape ? '#eef2ff' : '#ffffff',
                  cursor: trialPhase === 'choice' ? 'pointer' : 'default',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {leftShape === 'A' ? <Circle /> : <Square />}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>   
              <div style={{ height: '52px', display: 'flex', alignItems: 'flex-end' }}>
                {trialPhase !== 'choice' && currentChoice === rightShape && <Avatar color="#6366f1" label="You" />}
                {trialPhase !== 'choice' && trial.social === 'consensus' && currentChoice === rightShape && (
                  <>
                    <Avatar color="#94a3b8" label="P2" />
                    <Avatar color="#94a3b8" label="P3" />
                  </>
                )}
                {trialPhase !== 'choice' && trial.social === 'dissent' && currentChoice !== rightShape && (
                  <>
                    <Avatar color="#94a3b8" label="P2" />
                    <Avatar color="#94a3b8" label="P3" />
                  </>
                )}
              </div>           
              <button
                onClick={() => trialPhase === 'choice' && handleChoice(rightShape)}
                style={{
                  width: '100px',
                  height: '100px',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  borderRadius: '16px',
                  border: currentChoice === rightShape ? '3px solid #6366f1' : '3px solid #cbd5e1',
                  background: currentChoice === rightShape ? '#eef2ff' : '#ffffff',
                  cursor: trialPhase === 'choice' ? 'pointer' : 'default',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {rightShape === 'A' ? <Circle /> : <Square />}
              </button>
            </div>
          </div>
          {trialPhase === 'social' && (
            <p style={{
              ...styles.feedback,
              background: trial.social === 'consensus' ? '#f1f5f9' : '#f1f5f9',
              color: trial.social === 'consensus' ? '#475569' : '#475569',
            }}>
              {trial.social === 'consensus'
                ? "The other players chose the same"
                : "The other players chose differently"}
            </p>
          )}
          
          {trialPhase === 'reward' && (
            <div>
              <p style={{
                ...styles.feedback,
                background: trial.reward === 'win' ? '#ecfdf5' : '#fef2f2',
                color: trial.reward === 'win' ? '#059669' : '#dc2626',
              }}>
                {trial.reward === 'win'
                  ? "You picked the winner!"
                  : "The other machine paid more"}
              </p>
              <button style={styles.button} onClick={nextTrial}>
                {currentTrial < trials.length - 1 ? 'Next Round' : 'See Results'}

              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'results') {
    const probs = calculateStayProbs(choices);


    const consensusEffect = ((probs.win_consensus + probs.lose_consensus) / 2) - 
                        ((probs.win_dissent + probs.lose_dissent) / 2);
    const rewardEffect = ((probs.win_consensus + probs.win_dissent) / 2) - 
                     ((probs.lose_consensus + probs.lose_dissent) / 2);
    let interpretation;
    if (rewardEffect > 10 && consensusEffect <= 10) {
      interpretation = "Your decision pattern is consistent with imitation: you stayed more with winning choices regardless of what others chose. This suggests you're copying successful actions rather than seeking social agreement."; 
    } else if (consensusEffect > 10 && rewardEffect <= 10) {
      interpretation = "Your decision pattern is consistent with the social reward model: you stayed more with consensus choices regardless of winning. This suggests agreement itself feels rewarding to you.";
    } else if (rewardEffect > 10 && consensusEffect > 10) {
      interpretation = "Your decision pattern shows both effects: you stayed more after wins AND after consensus. Both monetary reward and social agreement seem to influence your choices.";
    } else {
      interpretation = "Your decision pattern doesn't show a strong effect in either direction. With only 16 trials, this isn't unusual. The real experiment uses many more trials to detect these effects reliably.";
    }

    // model fitting
    const { results: modelFitResults, best: bestModel } = fitModels(choices);

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Your results</h2>
          <p style={styles.subtitle}>Stay probability by previous trial condition</p>
          

          <ResultsChart probs={probs} />

          <ModelComparison results={modelFitResults} best={bestModel} />
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '0.5rem' }}>

  Note: 16 trials provides limited statistical power. 
  <br></br>
  The full study uses 150 trials per participant.
</p>
          <button style={styles.button} onClick={() => setScreen('welcome')}>
            Start over
          </button>
        </div>
      </div>
    );
  }
        
    
        
  return null;
}

export default App;