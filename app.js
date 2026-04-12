import { WORKOUT_PLAN, MEAL_PLAN } from './data.js';

// ── STATE ──
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

let state = loadState();
let workoutTimer = null;
let workoutStart = null;
let workoutElapsed = 0;
let isWorkoutRunning = false;
let restTimer = null;
let restRemaining = 0;
let currentRestEl = null;
let activeExerciseId = null;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem('grind_state') || 'null') || defaultState();
  } catch { return defaultState(); }
}

function defaultState() {
  return {
    logs: {},       // { "YYYY-MM-DD": { workoutDone, duration, sets, exercises: {exId: [{weight, reps, done}]}, prs: [] } }
    nutrition: {},  // { "YYYY-MM-DD": { protein, calories, burned, meals: [] } }
    bests: {}       // { exId: {weight, reps, date} }
  };
}

function save() {
  localStorage.setItem('grind_state', JSON.stringify(state));
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function todayDay() {
  return DAYS[new Date().getDay()];
}

function dateKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function getWeekDates() {
  const now = new Date();
  const dow = now.getDay();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dow + i);
    dates.push({ date: d.toISOString().split('T')[0], day: DAYS[i] });
  }
  return dates;
}

// ── GREETING ──
function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting-text').textContent = g;
}

// ── HOME ──
function renderHome() {
  setGreeting();
  const day = todayDay();
  const plan = WORKOUT_PLAN[day];

  const badge = document.getElementById('today-badge');
  badge.textContent = plan.type === 'rest' ? 'Rest Day' : plan.name;
  badge.className = `today-day-badge ${plan.type}`;

  document.getElementById('today-name').textContent = plan.name + (plan.focus ? ` — ${plan.focus}` : '');
  document.getElementById('today-muscles').textContent = plan.muscles;

  const totalSets = plan.exercises.reduce((a, e) => a + e.sets, 0);
  document.getElementById('today-exercises').textContent = plan.exercises.length;
  document.getElementById('today-sets').textContent = totalSets;
  document.getElementById('today-cardio').textContent = plan.cardio.split(' ')[0] + plan.cardio.split(' ')[1];

  const startBtn = document.getElementById('home-start-btn');
  const todayLog = state.logs[today()];
  if (plan.type === 'rest') {
    startBtn.textContent = 'Rest Day — Stretch & Recover';
    startBtn.className = 'start-workout-btn rest-day';
  } else if (todayLog?.workoutDone) {
    startBtn.textContent = '✓ Workout Logged — View Session';
    startBtn.className = 'start-workout-btn';
    startBtn.style.background = 'var(--accent-dim)';
    startBtn.style.color = 'var(--accent)';
    startBtn.style.border = '1px solid var(--accent)';
  } else {
    startBtn.textContent = 'Start Workout';
    startBtn.className = 'start-workout-btn';
    startBtn.style = '';
  }

  renderWeekStrip();
  renderQuickStats();
}

function renderWeekStrip() {
  const strip = document.getElementById('week-strip');
  const weekDates = getWeekDates();
  const todayStr = today();

  strip.innerHTML = weekDates.map(({ date, day }) => {
    const plan = WORKOUT_PLAN[day];
    const isToday = date === todayStr;
    const isDone = state.logs[date]?.workoutDone;
    const isPast = date < todayStr;
    let cls = plan.type;
    if (isToday) cls += ' today';
    if (isDone || (isPast && plan.type === 'rest')) cls += ' done';
    const label = plan.type === 'rest' ? 'OFF' : plan.name.split(' ')[1] || plan.type.substring(0,1).toUpperCase();
    return `<div class="week-day">
      <div class="wd-label">${DAY_SHORT[DAYS.indexOf(day)]}</div>
      <div class="wd-dot ${cls}">${isDone ? '✓' : label}</div>
    </div>`;
  }).join('');
}

function renderQuickStats() {
  const weekDates = getWeekDates();
  let sessions = 0, totalProtein = 0, proteinDays = 0, prs = 0;

  weekDates.forEach(({ date, day }) => {
    const log = state.logs[date];
    const nut = state.nutrition[date];
    if (log?.workoutDone) sessions++;
    if (log?.prs) prs += log.prs.length;
    if (nut?.protein) { totalProtein += nut.protein; proteinDays++; }
  });

  document.getElementById('week-sessions').textContent = sessions;
  document.getElementById('avg-protein').textContent = proteinDays ? Math.round(totalProtein / proteinDays) + 'g' : '0g';
  document.getElementById('prs-count').textContent = prs;

  // Streak
  let streak = 0;
  for (let i = 0; i >= -30; i--) {
    const dk = dateKey(i);
    const dDay = DAYS[new Date(dk + 'T12:00:00').getDay()];
    if (WORKOUT_PLAN[dDay].type === 'rest') continue;
    if (state.logs[dk]?.workoutDone) streak++;
    else if (dk < today()) break;
  }
  document.getElementById('streak-count').textContent = streak;
}

// ── WORKOUT ──
function renderWorkout() {
  const day = todayDay();
  const plan = WORKOUT_PLAN[day];
  const todayKey = today();

  // Init today's log if needed
  if (!state.logs[todayKey]) {
    state.logs[todayKey] = { workoutDone: false, duration: 0, sets: 0, exercises: {}, prs: [] };
  }

  document.getElementById('workout-day-name').textContent = plan.name;
  document.getElementById('workout-day-info').innerHTML = `<strong id="workout-day-name">${plan.name}</strong> — ${plan.muscles}`;

  const list = document.getElementById('exercise-list');
  if (plan.type === 'rest') {
    list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--muted)">
      <div style="font-size:48px;margin-bottom:16px">😴</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:8px">Rest Day</div>
      <div style="font-size:13px">Recovery is part of the program.</div>
    </div>`;
    return;
  }

  list.innerHTML = plan.exercises.map((ex, idx) => renderExerciseCard(ex, idx, todayKey)).join('');

  // Restore rest timer visibility
  updateWorkoutBtn();
}

function renderExerciseCard(ex, idx, todayKey) {
  const log = state.logs[todayKey]?.exercises?.[ex.id] || [];
  const allDone = log.length >= ex.sets && log.every(s => s.done);
  const best = state.bests[ex.id];

  const setsHtml = Array.from({ length: ex.sets }, (_, i) => {
    const setLog = log[i] || {};
    const isDone = setLog.done;
    return `<div class="set-row" id="set-${ex.id}-${i}">
      <div class="set-num">${i + 1}</div>
      <input class="set-input" type="number" placeholder="kg" value="${setLog.weight || ''}"
        onchange="updateSet('${ex.id}', ${i}, 'weight', this.value)"
        id="w-${ex.id}-${i}" />
      <input class="set-input" type="number" placeholder="${ex.reps}" value="${setLog.reps || ''}"
        onchange="updateSet('${ex.id}', ${i}, 'reps', this.value)"
        id="r-${ex.id}-${i}" />
      <button class="set-done-btn ${isDone ? 'done' : ''}" onclick="toggleSetDone('${ex.id}', ${i})"
        id="sd-${ex.id}-${i}">
        ${isDone ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
      </button>
    </div>`;
  }).join('');

  return `<div class="exercise-card ${allDone ? 'done-ex' : ''}" id="excard-${ex.id}">
    <div class="exercise-card-header" onclick="toggleExCard('${ex.id}')">
      <div class="ex-info">
        <div class="ex-name-row">
          <div class="ex-type-dot ${ex.type}"></div>
          <div class="ex-card-name">${ex.name}</div>
        </div>
        ${ex.notes ? `<div class="ex-card-note">${ex.notes}</div>` : ''}
      </div>
      <div class="ex-target">
        <strong>${ex.sets}×${ex.reps}</strong>
        ${best ? `Best: ${best.weight}kg` : 'No history'}
      </div>
      <div class="ex-check ${allDone ? 'checked' : ''}" id="excheck-${ex.id}">
        ${allDone ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
      </div>
    </div>
    <div class="sets-table" id="sets-${ex.id}" style="display:none">
      <div class="sets-header">
        <span>Set</span><span>Weight (kg)</span><span>Reps</span><span style="text-align:center">✓</span>
      </div>
      ${setsHtml}
    </div>
    <div class="rest-timer" id="rest-${ex.id}" style="display:none">
      <div>
        <div class="rest-label">Rest Timer</div>
        <div class="rest-time" id="rest-time-${ex.id}">1:30</div>
      </div>
      <button class="rest-skip" onclick="skipRest('${ex.id}')">Skip rest</button>
    </div>
  </div>`;
}

function toggleExCard(exId) {
  const setsEl = document.getElementById(`sets-${exId}`);
  const isOpen = setsEl.style.display !== 'none';
  setsEl.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) activeExerciseId = exId;
}

function updateSet(exId, setIdx, field, value) {
  const todayKey = today();
  if (!state.logs[todayKey]) state.logs[todayKey] = { workoutDone: false, duration: 0, sets: 0, exercises: {}, prs: [] };
  if (!state.logs[todayKey].exercises[exId]) state.logs[todayKey].exercises[exId] = [];
  if (!state.logs[todayKey].exercises[exId][setIdx]) state.logs[todayKey].exercises[exId][setIdx] = {};
  state.logs[todayKey].exercises[exId][setIdx][field] = parseFloat(value) || 0;
  save();
}

function toggleSetDone(exId, setIdx) {
  const todayKey = today();
  const log = state.logs[todayKey]?.exercises?.[exId]?.[setIdx];
  if (!log) return;

  log.done = !log.done;

  const btn = document.getElementById(`sd-${exId}-${setIdx}`);
  btn.className = `set-done-btn ${log.done ? 'done' : ''}`;
  btn.innerHTML = log.done ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : '';

  if (log.done) {
    // Check PR
    checkPR(exId, log.weight, log.reps);
    // Start rest timer
    startRestTimer(exId);
    // Count sets
    state.logs[todayKey].sets = Object.values(state.logs[todayKey].exercises)
      .flat().filter(s => s?.done).length;
  }

  // Check if all sets done
  const plan = WORKOUT_PLAN[todayDay()];
  const ex = plan.exercises.find(e => e.id === exId);
  const exLog = state.logs[todayKey].exercises[exId] || [];
  const allDone = exLog.length >= ex.sets && exLog.every(s => s?.done);

  const card = document.getElementById(`excard-${exId}`);
  const check = document.getElementById(`excheck-${exId}`);
  if (allDone) {
    card.classList.add('done-ex');
    check.className = 'ex-check checked';
    check.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
  }

  save();
}

function checkPR(exId, weight, reps) {
  if (!weight) return;
  const best = state.bests[exId];
  if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) {
    const wasPR = !!best;
    state.bests[exId] = { weight, reps, date: today() };
    const todayLog = state.logs[today()];
    if (wasPR && (!todayLog.prs.includes(exId))) {
      todayLog.prs.push(exId);
      showToast('🏆 New PR!', 'success');
    }
    save();
  }
}

function startRestTimer(exId) {
  // Clear any existing rest timer
  if (restTimer) { clearInterval(restTimer); restTimer = null; }
  if (currentRestEl) document.getElementById(`rest-${currentRestEl}`)?.style.setProperty('display', 'none');

  const restEl = document.getElementById(`rest-${exId}`);
  const restTimeEl = document.getElementById(`rest-time-${exId}`);
  if (!restEl || !restTimeEl) return;

  currentRestEl = exId;
  restRemaining = 60; // 1:00 default rest
  restEl.style.display = 'flex';
  restEl.classList.add('active');
  updateRestDisplay(restTimeEl, restRemaining);

  restTimer = setInterval(() => {
    restRemaining--;
    updateRestDisplay(restTimeEl, restRemaining);
    if (restRemaining <= 0) {
      clearInterval(restTimer);
      restTimer = null;
      restEl.classList.remove('active');
      restTimeEl.textContent = 'Done!';
      showToast('Rest done — next set!', 'success');
    }
  }, 1000);
}

function updateRestDisplay(el, secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

function skipRest(exId) {
  if (restTimer) { clearInterval(restTimer); restTimer = null; }
  const restEl = document.getElementById(`rest-${exId}`);
  if (restEl) { restEl.classList.remove('active'); restEl.style.display = 'none'; }
  currentRestEl = null;
}

// Workout timer
function toggleWorkout() {
  if (isWorkoutRunning) {
    pauseWorkout();
  } else {
    startWorkout();
  }
}

function startWorkout() {
  isWorkoutRunning = true;
  workoutStart = Date.now() - workoutElapsed * 1000;
  const elapsedEl = document.getElementById('workout-elapsed');
  elapsedEl.classList.remove('inactive');
  workoutTimer = setInterval(() => {
    workoutElapsed = Math.floor((Date.now() - workoutStart) / 1000);
    elapsedEl.textContent = formatTime(workoutElapsed);
  }, 1000);
  updateWorkoutBtn();
}

function pauseWorkout() {
  isWorkoutRunning = false;
  clearInterval(workoutTimer);
  updateWorkoutBtn();
}

function updateWorkoutBtn() {
  const btn = document.getElementById('workout-start-btn');
  btn.textContent = isWorkoutRunning ? 'Pause' : workoutElapsed > 0 ? 'Resume' : 'Start';
  btn.className = `ctrl-btn ${isWorkoutRunning ? 'pause' : 'start'}`;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function finishWorkout() {
  pauseWorkout();
  const todayKey = today();
  const log = state.logs[todayKey] || {};
  const mins = Math.floor(workoutElapsed / 60);
  const sets = Object.values(log.exercises || {}).flat().filter(s => s?.done).length;
  const prs = (log.prs || []).length;

  document.getElementById('modal-duration').textContent = mins + 'm';
  document.getElementById('modal-sets').textContent = sets;
  document.getElementById('modal-prs').textContent = prs;
  document.getElementById('modal-sub').textContent =
    sets > 15 ? 'Absolute beast mode today.' :
    sets > 8 ? 'Solid session. Keep it up.' : 'Every rep counts. Come back stronger.';

  document.getElementById('finish-modal').classList.add('open');
}

function saveWorkout() {
  const todayKey = today();
  if (!state.logs[todayKey]) state.logs[todayKey] = { exercises: {}, prs: [] };
  state.logs[todayKey].workoutDone = true;
  state.logs[todayKey].duration = workoutElapsed;
  workoutElapsed = 0;
  isWorkoutRunning = false;
  document.getElementById('workout-elapsed').textContent = '00:00';
  document.getElementById('workout-elapsed').classList.add('inactive');
  updateWorkoutBtn();
  save();
  closeModal();
  showToast('Workout saved! 💪', 'success');
  renderHome();
}

function closeModal() {
  document.getElementById('finish-modal').classList.remove('open');
}

// ── MEALS ──
function renderMeals() {
  const todayKey = today();
  if (!state.nutrition[todayKey]) {
    state.nutrition[todayKey] = { protein: 0, calories: 0, burned: 0, meals: [] };
  }
  const nut = state.nutrition[todayKey];

  // Protein bar
  const pct = Math.min((nut.protein / 160) * 100, 100);
  document.getElementById('protein-logged').textContent = nut.protein;
  document.getElementById('protein-fill').style.width = pct + '%';

  // Meal dots
  document.getElementById('meal-dots').innerHTML = MEAL_PLAN.map((m, i) => {
    const logged = nut.meals.includes(i);
    return `<div class="dpb-meal ${logged ? 'logged' : ''}">${m.icon}<br>${logged ? '✓' : '—'}</div>`;
  }).join('');

  // Meal cards
  document.getElementById('meal-cards').innerHTML = MEAL_PLAN.map((meal, i) => {
    const logged = nut.meals.includes(i);
    return `<div class="meal-card" style="margin-bottom:10px">
      <div class="meal-card-header">
        <div class="meal-icon-wrap">${meal.icon}</div>
        <div class="meal-card-info">
          <div class="meal-card-time">${meal.time}</div>
          <div class="meal-card-name">${meal.name}</div>
          <div class="meal-card-protein">~${meal.protein}g protein</div>
        </div>
        <button class="meal-log-btn ${logged ? 'logged' : ''}" onclick="toggleMeal(${i})">
          ${logged ? 'Logged ✓' : 'Log'}
        </button>
      </div>
      <div class="meal-items-list">
        ${meal.items.map(item => `<div class="meal-item">${item}</div>`).join('')}
        <div class="meal-note-text">${meal.note}</div>
      </div>
    </div>`;
  }).join('');

  // Calorie summary
  document.getElementById('cal-intake-display').textContent = nut.calories.toLocaleString();
  document.getElementById('cal-burned-display').textContent = nut.burned.toLocaleString();
  const net = nut.calories - nut.burned;
  const netEl = document.getElementById('cal-net-display');
  netEl.textContent = net.toLocaleString();
  netEl.className = `cl-sum-val ${net <= 2200 ? 'green' : 'red'}`;
}

function toggleMeal(idx) {
  const todayKey = today();
  const nut = state.nutrition[todayKey];
  const meal = MEAL_PLAN[idx];

  if (nut.meals.includes(idx)) {
    nut.meals = nut.meals.filter(i => i !== idx);
    nut.protein = Math.max(0, nut.protein - meal.protein);
  } else {
    nut.meals.push(idx);
    nut.protein += meal.protein;
  }

  save();
  renderMeals();
}

function logCalories() {
  const todayKey = today();
  const intake = parseInt(document.getElementById('cal-intake-input').value) || 0;
  const burned = parseInt(document.getElementById('cal-burned-input').value) || 0;

  state.nutrition[todayKey].calories = intake;
  state.nutrition[todayKey].burned = burned;
  save();
  renderMeals();
  showToast('Calories logged!', 'success');
  document.getElementById('cal-intake-input').value = '';
  document.getElementById('cal-burned-input').value = '';
}

// ── WEEKLY ──
function renderWeekly() {
  const weekDates = getWeekDates();
  const todayStr = today();
  let totalSessions = 0, missedSessions = 0, totalProtein = 0, proteinDays = 0;
  let totalTime = 0, totalPRs = 0, totalCalories = 0, totalBurned = 0, calDays = 0;
  let bestProtein = 0, worstProtein = 999;

  weekDates.forEach(({ date, day }) => {
    const plan = WORKOUT_PLAN[day];
    const log = state.logs[date];
    const nut = state.nutrition[date];
    const isPast = date <= todayStr;

    if (plan.type !== 'rest' && isPast) {
      if (log?.workoutDone) { totalSessions++; totalTime += log.duration || 0; }
      else if (date < todayStr) missedSessions++;
    }

    if (log?.prs) totalPRs += log.prs.length;
    if (nut?.protein) {
      totalProtein += nut.protein;
      proteinDays++;
      bestProtein = Math.max(bestProtein, nut.protein);
      worstProtein = Math.min(worstProtein, nut.protein);
    }
    if (nut?.calories) { totalCalories += nut.calories; totalBurned += nut.burned; calDays++; }
  });

  const avgProtein = proteinDays ? Math.round(totalProtein / proteinDays) : 0;
  const avgCal = calDays ? Math.round(totalCalories / calDays) : 0;
  const avgBurned = calDays ? Math.round(totalBurned / calDays) : 0;

  document.getElementById('w-sessions').textContent = `${totalSessions}/6`;
  document.getElementById('w-missed').textContent = missedSessions;
  document.getElementById('w-protein').textContent = avgProtein + 'g';
  document.getElementById('w-time').textContent = Math.round(totalTime / 60) + 'm';
  document.getElementById('w-prs').textContent = totalPRs;
  document.getElementById('w-calories').textContent = avgCal ? (avgCal - avgBurned).toLocaleString() : '—';
  document.getElementById('w-best-protein').textContent = bestProtein ? bestProtein + 'g' : '—';
  document.getElementById('w-worst-protein').textContent = (worstProtein < 999 && worstProtein > 0) ? worstProtein + 'g' : '—';
  document.getElementById('w-avg-calories').textContent = avgCal ? avgCal.toLocaleString() : '—';
  document.getElementById('w-avg-burned').textContent = avgBurned ? avgBurned.toLocaleString() : '—';

  // Sessions list
  document.getElementById('weekly-sessions-list').innerHTML = weekDates.map(({ date, day }) => {
    const plan = WORKOUT_PLAN[day];
    const log = state.logs[date];
    const isPast = date < todayStr;
    const isToday = date === todayStr;
    const done = log?.workoutDone;
    const missed = plan.type !== 'rest' && isPast && !done;

    return `<div class="missed-item">
      <div class="missed-dot ${done ? 'done' : missed ? 'missed' : ''}"></div>
      <div class="missed-info">
        <div class="missed-day">${day} ${isToday ? '(Today)' : ''}</div>
        <div class="missed-workout">${plan.name} — ${plan.focus || plan.muscles}</div>
      </div>
      <div class="missed-badge ${done ? 'done' : missed ? 'missed' : ''}">
        ${done ? `✓ ${Math.round((log.duration||0)/60)}m` : missed ? 'Missed' : plan.type === 'rest' ? 'Rest' : 'Upcoming'}
      </div>
    </div>`;
  }).join('');

  renderProgressSelector();
  renderProgressChart();
}

function renderProgressSelector() {
  const sel = document.getElementById('progress-ex-select');
  const allExercises = Object.values(WORKOUT_PLAN).flatMap(d => d.exercises || []);
  sel.innerHTML = allExercises.map(ex =>
    `<option value="${ex.id}">${ex.name}</option>`
  ).join('');
}

function renderProgressChart() {
  const exId = document.getElementById('progress-ex-select').value;
  const bars = document.getElementById('chart-bars');

  // Gather last 8 sessions where this exercise was logged
  const entries = [];
  for (let i = -60; i <= 0; i++) {
    const dk = dateKey(i);
    const log = state.logs[dk];
    if (!log?.exercises?.[exId]) continue;
    const sets = log.exercises[exId].filter(s => s?.done && s.weight);
    if (!sets.length) continue;
    const maxWeight = Math.max(...sets.map(s => s.weight));
    entries.push({ date: dk.slice(5), weight: maxWeight });
  }

  const recent = entries.slice(-8);
  if (!recent.length) {
    bars.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:20px;text-align:center;width:100%">No data yet — start logging sets!</div>`;
    return;
  }

  const maxW = Math.max(...recent.map(e => e.weight));
  bars.innerHTML = recent.map(e => {
    const pct = (e.weight / maxW) * 100;
    const isBest = e.weight === maxW;
    return `<div class="chart-bar-wrap">
      <div class="chart-bar-label">${e.weight}kg</div>
      <div class="chart-bar ${isBest ? 'best' : ''}" style="height:${pct}%"></div>
      <div class="chart-bar-date">${e.date}</div>
    </div>`;
  }).join('');
}

// ── NAVIGATION ──
function switchScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`screen-${name}`).classList.add('active');
  document.getElementById(`nav-${name}`).classList.add('active');

  if (name === 'home') renderHome();
  if (name === 'workout') renderWorkout();
  if (name === 'meals') renderMeals();
  if (name === 'weekly') renderWeekly();
}

function goToWorkout() {
  switchScreen('workout');
}

// ── TOAST ──
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── GLOBALS ──
window.switchScreen = switchScreen;
window.goToWorkout = goToWorkout;
window.toggleWorkout = toggleWorkout;
window.finishWorkout = finishWorkout;
window.saveWorkout = saveWorkout;
window.closeModal = closeModal;
window.toggleExCard = toggleExCard;
window.updateSet = updateSet;
window.toggleSetDone = toggleSetDone;
window.skipRest = skipRest;
window.toggleMeal = toggleMeal;
window.logCalories = logCalories;
window.renderProgressChart = renderProgressChart;

// ── INIT ──
renderHome();