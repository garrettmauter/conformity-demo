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

function App() {
  const [screen, setScreen] = useState('welcome');
  const [trials, setTrials] = useState(() => generateTrials());
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentChoice, setCurrentChoice] = useState(null);
  const [leftShape, setLeftShape] = useState('A');
  const [trialPhase, setTrialPhase] = useState('choice');
  const [choices, setChoices] = useState([]);

  
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
      ? choices[choice.length - 1].condition
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
      <div>
        <h1>Social Conformity Demo</h1>
        <p>Do you follow the crowd because belonging is intrinsically rewarding, or are you just copying?</p>
        <button onClick={() => setScreen('instructions')}>
          Start
        </button>
      </div>
    );
  }

  if (screen === 'instructions') {
    return (
      <div>
        <h2>How it works</h2>
        <p>1. You'll see two gambling choices</p>
        <p>2. Pick one</p>
        <p>3. See what the other players picked</p>
        <p>4. See which machine paid more</p>
        <button onClick={() => setScreen('trial')}>
          Got it
        </button>
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
      <div>
        <p>Round {currentTrial + 1} of {trials.length}</p>

        <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', margin: '40px 0' }}>
          <button
            onClick={() => trialPhase === 'choice' && handleChoice(leftShape)}
            style={{
              padding: '40px',
              fontSize: '24px',
              border: currentChoice === leftShape ? '3px solid blue' : '1px solid gray',
              cursor: trialPhase === 'choice' ? 'pointer' : 'default'
            }}
          >
            {leftShape}
          </button>

          <button
            onClick={() => trialPhase === 'choice' && handleChoice(rightShape)}
            style = {{
              padding: '40px',
              fontSize: '24px',
              border: currentChoice === rightShape ? '3px solid blue' : '1px solid gray',
              cursor: trialPhase === 'choice' ? 'pointer' : 'default'
            }}
          >
            {rightShape}
          </button>
        </div>
        {trialPhase === 'social' && (
          <p>
            {trial.social === 'consensus'
              ? "The other players chose the same"
              : "The other players chose differently"}
          </p>
        )}
        
        {trialPhase === 'reward' && (
          <div>
            <p>
              {trial.social === 'consensus'
                ? "The other players chose the same"
                : "The other players chose differently"}
            </p>
            <p>
              {trial.reward === 'win'
                ? "You picked the winner!"
                : "The other machine paid more"}
            </p>
            <button onClick={nextTrial}>
              {currentTrial < trials.length - 1 ? 'Next Round' : 'See Results'}

            </button>
          </div>
        )}
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