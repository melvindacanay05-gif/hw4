const LIMITS = { 8: 120, 10: 150, 12: 180 }; // seconds allowed per pair count
const COLUMNS = { 8: 4, 10: 5, 12: 6 };
const EMOJIS = ['🦁', '🐘', '🦒', '🦓', '🐼', '🐸', '🐙', '🦊', '🐧', '🐢', '🦉', '🐬'];
const KEY = 'memory_leaderboard';

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const timerEl = $('timer');

let cards = [];      // { emoji, btn }
let picked = [];     // cards flipped this turn
let pairs, limit, matches, wrong;
let playing, busy;
let memorizeEnd, startTime, endTime;
let timer, mismatchTimer;

function say(text, kind) {
  $('message').textContent = text;
  $('message').className = 'message ' + (kind || '');
}

function elapsed() {
  return ((endTime || Date.now()) - startTime) / 1000;
}

function overtime() {
  return Math.max(0, Math.floor(elapsed() - limit));
}

function score() {
  return matches * 10 - wrong * 5 - overtime();
}

function update() {
  // Memorize phase: countdown, then flip everything over
  if (!playing) {
    const left = Math.ceil((memorizeEnd - Date.now()) / 1000);
    if (left > 0) {
      $('timer-label').textContent = 'Memorize';
      timerEl.textContent = left + 's';
      return;
    }
    playing = true;
    startTime = Date.now();
    cards.forEach((c) => c.btn.classList.remove('face-up'));
    say('Go! Find all ' + pairs + ' pairs.');
  }

  // Play phase
  if (elapsed() < limit) {
    $('timer-label').textContent = 'Time left';
    timerEl.textContent = Math.ceil(limit - elapsed()) + 's';
    timerEl.className = 'value';
  } else {
    $('timer-label').textContent = 'Overtime';
    timerEl.textContent = '+' + overtime() + 's';
    timerEl.className = 'value overtime';
  }
  $('score').textContent = score();
  $('matches').textContent = matches;
  $('wrong').textContent = wrong;
}

function buildBoard() {
  const chosen = EMOJIS.slice().sort(() => Math.random() - 0.5).slice(0, pairs);
  const deck = chosen.concat(chosen).sort(() => Math.random() - 0.5);

  boardEl.textContent = '';
  cards = [];
  let row;
  deck.forEach((emoji, i) => {
    if (i % COLUMNS[pairs] === 0) {
      row = boardEl.insertRow();
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card face-up';
    btn.innerHTML = '<span class="num">' + (i + 1) + '</span>';

    const img = document.createElement('img');
    img.alt = emoji;
    img.src = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<text x="50" y="75" font-size="70" text-anchor="middle">' + emoji + '</text></svg>');
    btn.appendChild(img);

    const card = { emoji, btn };
    btn.addEventListener('click', () => flip(card));
    row.insertCell().appendChild(btn);
    cards.push(card);
  });
}

function startGame(e) {
  e.preventDefault();
  clearInterval(timer);
  clearTimeout(mismatchTimer);

  pairs = Number($('pairs').value);
  limit = LIMITS[pairs];
  matches = 0;
  wrong = 0;
  picked = [];
  busy = false;
  playing = false;
  endTime = null;
  startTime = Date.now();
  memorizeEnd = Date.now() + Number($('difficulty').value) * 1000;

  buildBoard();
  say('Memorize the cards! They will flip over soon.');
  update();
  timer = setInterval(update, 200);
}

function flip(card) {
  if (!playing || busy || card.btn.classList.contains('face-up')) return;

  card.btn.classList.add('face-up');
  picked.push(card);
  if (picked.length < 2) return;

  const [a, b] = picked;
  picked = [];

  if (a.emoji === b.emoji) {
    a.btn.classList.add('matched');
    b.btn.classList.add('matched');
    matches++;
    update();
    if (matches === pairs) {
      finish();
    } else {
      say('Match! ' + (pairs - matches) + ' pairs to go.', 'good');
    }
  } else {
    wrong++;
    busy = true;
    say('Not a match (−5).', 'bad');
    update();
    mismatchTimer = setTimeout(() => {
      a.btn.classList.remove('face-up');
      b.btn.classList.remove('face-up');
      busy = false;
    }, 800);
  }
}

function finish() {
  endTime = Date.now();
  clearInterval(timer);
  update();
  say('All pairs matched! Final score: ' + score() + '.', 'good');
  setTimeout(() => saveScore(score()), 60); // let the board paint first
}

// ---------- leaderboard ----------
function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (e) {
    return [];
  }
}

function showScores() {
  const list = loadScores();
  $('leaderboard').textContent = '';
  if (list.length === 0) {
    $('leaderboard').innerHTML = '<li>No scores yet.</li>';
  }
  list.forEach((s) => {
    const li = document.createElement('li');
    li.textContent = s.name + ' — ' + s.score + ' pts';
    $('leaderboard').appendChild(li);
  });
}

function saveScore(points) {
  const list = loadScores();
  // A tie with 5th place doesn't replace it (earlier score ranks higher)
  if (list.length >= 5 && points <= list[4].score) {
    say('Final score ' + points + ' did not make the top 5.');
    return;
  }
  const name = prompt('Top 5 score (' + points + ')! Enter your name:');
  if (name === null) return;

  list.push({ name: name.trim().slice(0, 20) || 'Anonymous', score: points });
  list.sort((a, b) => b.score - a.score); // stable sort keeps earlier scores first on ties
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 5)));
  showScores();
}

$('clear-leaderboard').addEventListener('click', () => {
  if (confirm('Clear all saved leaderboard scores?')) {
    localStorage.removeItem(KEY);
    showScores();
  }
});

$('setup-form').addEventListener('submit', startGame);
showScores();
