const input = document.getElementById('guess-input');
const messageEl = document.getElementById('message');
const guessesLeftEl = document.getElementById('guesses-left');
const winsEl = document.getElementById('wins');
const roundsEl = document.getElementById('rounds');
const clockEl = document.getElementById('clock');
const soundBtn = document.getElementById('sound-toggle');

let secret, guessesLeft;
let wins = 0;
let rounds = 0;
let soundOn = true;
const audio = new AudioContext();

function beep(freq) {
  if (!soundOn) return;
  const osc = audio.createOscillator();
  osc.frequency.value = freq;
  osc.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.2);
}

function say(text, kind) {
  messageEl.textContent = text;
  messageEl.className = 'message ' + (kind || '');
}

function showStats() {
  guessesLeftEl.textContent = guessesLeft;
  winsEl.textContent = wins;
  roundsEl.textContent = rounds;
}

function newGame() {
  secret = Math.floor(Math.random() * 100) + 1;
  guessesLeft = 10;
  input.value = '';
  showStats();
}

document.getElementById('guess-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const guess = Number(input.value);

  // Invalid guesses don't use up an attempt
  if (input.value.trim() === '' || !Number.isInteger(guess) || guess < 1 || guess > 100) {
    say('Enter a whole number from 1 to 100.', 'bad');
    beep(140);
    return;
  }

  guessesLeft--;

  if (guess === secret) {
    wins++;
    rounds++;
    say('Correct! ' + guess + ' was the number. New game started.', 'good');
    beep(800);
    newGame();
  } else if (guessesLeft === 0) {
    rounds++;
    say('Out of guesses! The number was ' + secret + '. New game started.', 'bad');
    beep(200);
    newGame();
  } else {
    const word = guess > secret ? 'high' : 'low';
    say(guess + ' is too ' + word + '. ' + guessesLeft + ' guesses left.');
    beep(guess > secret ? 300 : 600);
    showStats();
    input.select();
  }
});

soundBtn.addEventListener('click', function () {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? 'On' : 'Off';
  soundBtn.setAttribute('aria-pressed', soundOn);
});

function updateClock() {
  clockEl.textContent = new Date().toLocaleTimeString([], { hour12: false });
}

newGame();
updateClock();
setInterval(updateClock, 1000);
