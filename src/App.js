import { useState } from 'react';

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
    return (
      <div>
        <h2>Results</h2>
        <p>Calculate stay probs here</p>
        <button onClick={() => setScreen('welcome')}>Start Over</button>
      </div>
    );
  }
        
    
        
  return null;
}

export default App;