import { WORKOUT_PLAN, MEAL_PLAN } from './data.js';
// import { db } from './firebase.js';
// import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── STATE ──
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const STATE_DOC = doc(db, 'users', 'default'); // swap 'default' for uid when you add auth

let state = defaultState();
let workoutTimer = null;
let workoutStart = null;
let workoutElapsed = 0;
let isWorkoutRunning = false;
let restTimer = null;
let restRemaining = 0;
let currentRestEl = null;
let activeExerciseId = null;


function defaultState() {
  return {
    logs: {},
    nutrition: {},
    bests: {},
    userWeight: 89,  // kg
    workoutPlan: JSON.parse(JSON.stringify(WORKOUT_PLAN))
  };
}

async function saveUserWeight() {
  const w = parseInt(document.getElementById('user-weight-input').value);
  if (!w || w < 30 || w > 250) { showToast('Enter a valid weight', ''); return; }
  state.userWeight = w;
  recalcNutrition();
  await save();
  renderMeals();
  showToast('Weight saved!', 'success');
}
window.saveUserWeight = saveUserWeight;

// ── FIREBASE LOAD / SAVE ──
async function loadFromFirebase() {
  try {
    const snap = await getDoc(STATE_DOC);
    if (snap.exists()) {
      const saved = snap.data();
      // Inject workoutPlan if missing (same guard as before)
      if (!saved.workoutPlan) {
        saved.workoutPlan = JSON.parse(JSON.stringify(WORKOUT_PLAN));
      }
      state = saved;
    }
    // If no doc exists yet, state stays as defaultState()
  } catch (err) {
    console.error('Firebase load failed, falling back to default state:', err);
  }
}

function cleanForFirestore(obj) {
  return JSON.parse(JSON.stringify(obj, (key, val) => 
    val === undefined ? null : val
  ));
}

// async function save() {
//   try {
//     await setDoc(STATE_DOC, cleanForFirestore(state));
//   } catch (err) {
//     console.error('Firebase save failed:', err);
//     showToast('Save failed — check connection', 'error');
//   }
// }

async function save() {
  try {
    // Ensure all nutrition arrays are clean dense arrays before saving
    Object.values(state.nutrition).forEach(nut => {
      if (nut.meals) nut.meals = Array.isArray(nut.meals)
        ? nut.meals.filter(x => x != null)
        : Object.values(nut.meals);
      if (nut.customMeals) nut.customMeals = Array.isArray(nut.customMeals)
        ? nut.customMeals.filter(x => x != null)
        : Object.values(nut.customMeals);
    });
    await setDoc(STATE_DOC, cleanForFirestore(state));
  } catch (err) {
    console.error('Firebase save failed:', err);
    showToast('Save failed — check connection', 'error');
  }
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
  const plan = state.workoutPlan[day];

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
    const plan = state.workoutPlan[day];
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

  weekDates.forEach(({ date }) => {
    const log = state.logs[date];
    const nut = state.nutrition[date];
    if (log?.workoutDone) sessions++;
    if (log?.prs) prs += log.prs.length;
    if (nut?.protein) { totalProtein += nut.protein; proteinDays++; }
  });

  document.getElementById('week-sessions').textContent = sessions;
  document.getElementById('avg-protein').textContent = proteinDays ? Math.round(totalProtein / proteinDays) + 'g' : '0g';
  document.getElementById('prs-count').textContent = prs;

  let streak = 0;
  for (let i = 0; i >= -30; i--) {
    const dk = dateKey(i);
    const dDay = DAYS[new Date(dk + 'T12:00:00').getDay()];
    if (state.workoutPlan[dDay].type === 'rest') continue;
    if (state.logs[dk]?.workoutDone) streak++;
    else if (dk < today()) break;
  }
  document.getElementById('streak-count').textContent = streak;
}

// ── WORKOUT ──
function renderWorkout() {
  const day = todayDay();
  const plan = state.workoutPlan[day];
  const todayKey = today();

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
  list.innerHTML += `<button class="add-ex-btn" onclick="openAddEx()">+ Add Exercise</button>`;
  updateWorkoutBtn();
}

function openAddMeal() {
  document.getElementById('add-meal-name').value = '';
  document.getElementById('add-meal-protein').value = '';
  document.getElementById('add-meal-calories').value = '';
  document.getElementById('add-meal-modal').classList.add('open');
}

async function saveAddMeal() {
  const name = document.getElementById('add-meal-name').value.trim();
  if (!name) { showToast('Enter a meal name', ''); return; }

  const protein  = parseInt(document.getElementById('add-meal-protein').value) || 0;
  const calories = parseInt(document.getElementById('add-meal-calories').value) || 0;

  const todayKey = today();
  if (!state.nutrition[todayKey]) {
    state.nutrition[todayKey] = { protein: 0, calories: 0, burned: 0, meals: [], customMeals: [] };
  }
  if (!state.nutrition[todayKey].customMeals) {
    state.nutrition[todayKey].customMeals = [];
  }

  state.nutrition[todayKey].customMeals.push({ name, protein, calories, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  state.nutrition[todayKey].protein   += protein;
  state.nutrition[todayKey].calories  += calories;

  await save();
  closeAddMeal();
  renderMeals();
  showToast('Meal logged!', 'success');
}

async function deleteCustomMeal(idx) {
  const todayKey = today();
  const nut = state.nutrition[todayKey];
  const meal = nut.customMeals[idx];
  nut.protein   = Math.max(0, nut.protein   - meal.protein);
  nut.calories  = Math.max(0, nut.calories  - meal.calories);
  nut.customMeals.splice(idx, 1);
  await save();
  renderMeals();
  showToast('Meal removed', '');
}

function closeAddMeal() {
  document.getElementById('add-meal-modal').classList.remove('open');
}

window.openAddMeal    = openAddMeal;
window.saveAddMeal    = saveAddMeal;
window.deleteCustomMeal = deleteCustomMeal;
window.closeAddMeal   = closeAddMeal;

function renderExerciseCard(ex, idx, todayKey) {
  const log = state.logs[todayKey]?.exercises?.[ex.id] || [];
  const allDone = log.length >= ex.sets && log.every(s => s.done);
  const best = state.bests[ex.id];

  const setsHtml = Array.from({ length: ex.sets }, (_, i) => {
    const setLog = log[i] || {};
    const isDone = setLog.done;
    return `<div class="set-row" id="set-${ex.id}-${i}">
      <div class="set-num">${i + 1}</div>
      <input class="set-input" type="number" placeholder="lb" value="${setLog.weight || ''}"
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
        ${best ? `Best: ${best.weight}lb` : 'No history'}
      </div>
      <button class="ex-edit-btn" onclick="openEditEx(event,'${ex.id}')">✎</button>
      <div class="ex-check ${allDone ? 'checked' : ''}" id="excheck-${ex.id}">
        ${allDone ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
      </div>
    </div>
    <div class="sets-table" id="sets-${ex.id}" style="display:none">
      <div class="sets-header">
        <span>Set</span><span>Weight (lb)</span><span>Reps</span><span style="text-align:center">✓</span>
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

async function updateSet(exId, setIdx, field, value) {
  const todayKey = today();
  if (!state.logs[todayKey]) state.logs[todayKey] = { workoutDone: false, duration: 0, sets: 0, exercises: {}, prs: [] };
  if (!state.logs[todayKey].exercises[exId]) state.logs[todayKey].exercises[exId] = [];
  if (!state.logs[todayKey].exercises[exId][setIdx]) state.logs[todayKey].exercises[exId][setIdx] = {};
  state.logs[todayKey].exercises[exId][setIdx][field] = parseFloat(value) || 0;
  await save();
}

async function toggleSetDone(exId, setIdx) {
  const todayKey = today();
  const log = state.logs[todayKey]?.exercises?.[exId]?.[setIdx];
  if (!log) return;

  log.done = !log.done;

  const btn = document.getElementById(`sd-${exId}-${setIdx}`);
  btn.className = `set-done-btn ${log.done ? 'done' : ''}`;
  btn.innerHTML = log.done ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : '';

  if (log.done) {
    checkPR(exId, log.weight, log.reps);
    startRestTimer(exId);
    state.logs[todayKey].sets = Object.values(state.logs[todayKey].exercises)
      .flat().filter(s => s?.done).length;
  }

  const plan = state.workoutPlan[todayDay()];
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

  await save();
}

async function checkPR(exId, weight, reps) {
  if (!weight) return;
  const best = state.bests[exId];
  if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) {
    const wasPR = !!best;
    state.bests[exId] = { weight, reps, date: today() };
    const todayLog = state.logs[today()];
    if (wasPR && !todayLog.prs.includes(exId)) {
      todayLog.prs.push(exId);
      showToast('🏆 New PR!', 'success');
    }
    await save();
  }
}

function startRestTimer(exId) {
  if (restTimer) { clearInterval(restTimer); restTimer = null; }
  if (currentRestEl) document.getElementById(`rest-${currentRestEl}`)?.style.setProperty('display', 'none');

  const restEl = document.getElementById(`rest-${exId}`);
  const restTimeEl = document.getElementById(`rest-time-${exId}`);
  if (!restEl || !restTimeEl) return;

  currentRestEl = exId;
  restRemaining = 60;
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

// ── WORKOUT TIMER ──
function toggleWorkout() {
  isWorkoutRunning ? pauseWorkout() : startWorkout();
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
    sets > 8  ? 'Solid session. Keep it up.' : 'Every rep counts. Come back stronger.';

  document.getElementById('finish-modal').classList.add('open');
}

async function saveWorkout() {
  const todayKey = today();
  if (!state.logs[todayKey]) state.logs[todayKey] = { exercises: {}, prs: [] };
  state.logs[todayKey].workoutDone = true;
  state.logs[todayKey].duration = workoutElapsed;
  workoutElapsed = 0;
  isWorkoutRunning = false;
  document.getElementById('workout-elapsed').textContent = '00:00';
  document.getElementById('workout-elapsed').classList.add('inactive');
  updateWorkoutBtn();
  recalcNutrition();
  await save();
  closeModal();
  showToast('Workout saved! 💪', 'success');
  renderHome();
}

function closeModal() {
  document.getElementById('finish-modal').classList.remove('open');
}

// ── MEALS ──
function renderMeals() {
    recalcNutrition();
    const weightInput = document.getElementById('user-weight-input');
    if (weightInput) weightInput.value = state.userWeight || 80;
  const todayKey = today();
  if (!state.nutrition[todayKey]) {
    state.nutrition[todayKey] = { protein: 0, calories: 0, burned: 0, meals: [] };
  }
  const nut = state.nutrition[todayKey];

  const pct = Math.min((nut.protein / 160) * 100, 100);
  document.getElementById('protein-logged').textContent = nut.protein;
  document.getElementById('protein-fill').style.width = pct + '%';

  document.getElementById('meal-dots').innerHTML = MEAL_PLAN.map((m, i) => {
    const logged = nut.meals.includes(i);
    return `<div class="dpb-meal ${logged ? 'logged' : ''}">${m.icon}<br>${logged ? '✓' : '—'}</div>`;
  }).join('');

  document.getElementById('meal-cards').innerHTML = MEAL_PLAN.map((meal, i) => {
    // Custom logged meals
const customMeals = nut.customMeals || [];
const customHtml = customMeals.length ? customMeals.map((m, i) => `
  <div class="meal-card" style="margin-bottom:10px">
    <div class="meal-card-header">
      <div class="meal-icon-wrap">🍴</div>
      <div class="meal-card-info">
        <div class="meal-card-time">${m.time}</div>
        <div class="meal-card-name">${m.name}</div>
        <div class="meal-card-protein">${m.protein}g protein · ${m.calories} kcal</div>
      </div>
      <button class="ex-edit-btn" style="color:var(--red)" onclick="deleteCustomMeal(${i})">✕</button>
    </div>
  </div>`).join('') : '';

document.getElementById('custom-meal-cards').innerHTML = customHtml;
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
  

  document.getElementById('cal-intake-display').textContent = nut.calories.toLocaleString();
  document.getElementById('cal-burned-display').textContent = nut.burned.toLocaleString();
  const net = nut.calories - nut.burned;
  const netEl = document.getElementById('cal-net-display');
  netEl.textContent = net.toLocaleString();
  netEl.className = `cl-sum-val ${net <= 2200 ? 'green' : 'red'}`;
}

async function toggleMeal(idx) {
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

  await save();
  renderMeals();
}

function calcBurned() {
  const todayKey = today();
  const log = state.logs[todayKey];
  const weightKg = state.userWeight || 80; // fallback 80kg
  const durationHrs = (log?.duration || 0) / 3600;
  const MET = 5; // moderate weightlifting
  return Math.round(MET * weightKg * durationHrs);
}

function recalcNutrition() {
  const todayKey = today();
  if (!state.nutrition[todayKey]) return;
  const nut = state.nutrition[todayKey];

  // from preset meal plan
  const mealPlanCals = (nut.meals || []).reduce((sum, i) => {
    return sum + (MEAL_PLAN[i]?.calories || 0);
  }, 0);
  const mealPlanProtein = (nut.meals || []).reduce((sum, i) => {
    return sum + (MEAL_PLAN[i]?.protein || 0);
  }, 0);

  // from custom logged meals
  const customCals    = (nut.customMeals || []).reduce((sum, m) => sum + (m.calories || 0), 0);
  const customProtein = (nut.customMeals || []).reduce((sum, m) => sum + (m.protein  || 0), 0);

  nut.calories = mealPlanCals + customCals;
  nut.protein  = mealPlanProtein + customProtein;
  nut.burned   = calcBurned();
}

// ── WEEKLY ──
function renderWeekly() {
  const weekDates = getWeekDates();
  const todayStr = today();
  let totalSessions = 0, missedSessions = 0, totalProtein = 0, proteinDays = 0;
  let totalTime = 0, totalPRs = 0, totalCalories = 0, totalBurned = 0, calDays = 0;
  let bestProtein = 0, worstProtein = 999;

  weekDates.forEach(({ date, day }) => {
    const plan = state.workoutPlan[day];
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

  document.getElementById('weekly-sessions-list').innerHTML = weekDates.map(({ date, day }) => {
    const plan = state.workoutPlan[day];
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
  const allExercises = Object.values(state.workoutPlan).flatMap(d => d.exercises || []);
  sel.innerHTML = allExercises.map(ex =>
    `<option value="${ex.id}">${ex.name}</option>`
  ).join('');
}

function renderProgressChart() {
  const exId = document.getElementById('progress-ex-select').value;
  const bars = document.getElementById('chart-bars');

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
      <div class="chart-bar-label">${e.weight}lb</div>
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

function openAddEx() {
  document.getElementById('add-ex-name').value = '';
  document.getElementById('add-ex-sets').value = '3';
  document.getElementById('add-ex-reps').value = '10–12';
  document.getElementById('add-ex-notes').value = '';
  document.getElementById('add-ex-type').value = 'compound';
  document.getElementById('add-ex-modal').classList.add('open');
}

async function saveAddEx() {
  const name = document.getElementById('add-ex-name').value.trim();
  if (!name) { showToast('Enter a name', ''); return; }

  const day = todayDay();
  const plan = state.workoutPlan[day];

  const newEx = {
    id: 'custom_' + Date.now(),
    name,
    sets: parseInt(document.getElementById('add-ex-sets').value) || 3,
    reps: document.getElementById('add-ex-reps').value.trim() || '10–12',
    notes: document.getElementById('add-ex-notes').value.trim(),
    type: document.getElementById('add-ex-type').value,
  };

  plan.exercises.push(newEx);
  await save();
  closeAddEx();
  renderWorkout();
  showToast('Exercise added!', 'success');
}

function closeAddEx() {
  document.getElementById('add-ex-modal').classList.remove('open');
}

window.openAddEx  = openAddEx;
window.saveAddEx  = saveAddEx;
window.closeAddEx = closeAddEx;

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
window.renderProgressChart = renderProgressChart;

// ── EXERCISE EDITOR ──
// Add this edit button to renderExerciseCard, inside .exercise-card-header, before the closing div:
// <button class="ex-edit-btn" onclick="openEditEx(event,'${ex.id}')">✎</button>

function openEditEx(e, exId) {
  e.stopPropagation(); // don't toggle the card open
  const day = todayDay();
  const plan = state.workoutPlan[day];
  const ex = plan.exercises.find(e => e.id === exId);
  if (!ex) return;

  document.getElementById('edit-ex-id').value = exId;
  document.getElementById('edit-ex-name').value = ex.name;
  document.getElementById('edit-ex-sets').value = ex.sets;
  document.getElementById('edit-ex-reps').value = ex.reps;
  document.getElementById('edit-ex-notes').value = ex.notes || '';

  document.getElementById('edit-ex-modal').classList.add('open');
}

async function saveEditEx() {
  const day = todayDay();
  const plan = state.workoutPlan[day];
  const exId = document.getElementById('edit-ex-id').value;
  const ex = plan.exercises.find(e => e.id === exId);
  if (!ex) return;

  ex.name  = document.getElementById('edit-ex-name').value.trim() || ex.name;
  ex.sets  = parseInt(document.getElementById('edit-ex-sets').value) || ex.sets;
  ex.reps  = document.getElementById('edit-ex-reps').value.trim() || ex.reps;
  ex.notes = document.getElementById('edit-ex-notes').value.trim();

  await save();
  closeEditEx();
  renderWorkout();
  showToast('Exercise updated!', 'success');
}

async function deleteEditEx() {
  const day = todayDay();
  const plan = state.workoutPlan[day];
  const exId = document.getElementById('edit-ex-id').value;
  plan.exercises = plan.exercises.filter(e => e.id !== exId);

  await save();
  closeEditEx();
  renderWorkout();
  showToast('Exercise removed', '');
}

function closeEditEx() {
  document.getElementById('edit-ex-modal').classList.remove('open');
}

window.openEditEx  = openEditEx;
window.saveEditEx  = saveEditEx;
window.deleteEditEx = deleteEditEx;
window.closeEditEx = closeEditEx;

// ── INIT — load from Firebase first, then render ──
// async function init() {
//   // Show a loading indicator while fetching from Firestore
//   document.getElementById('greeting-text').textContent = 'Loading...';
//   await loadFromFirebase();
//   renderHome();
// }
async function init() {
  document.getElementById('greeting-text').textContent = 'Loading...';
  await loadFromFirebase();
  
  // Fix: convert any exercise set objects back to arrays after loading
  Object.values(state.logs).forEach(log => {
    if (!log.exercises) return;
    Object.keys(log.exercises).forEach(exId => {
      const sets = log.exercises[exId];
      if (!Array.isArray(sets)) {
        // Firestore turned the array into an object — convert it back
        const max = Math.max(...Object.keys(sets).map(Number));
        const arr = [];
        for (let i = 0; i <= max; i++) arr[i] = sets[i] || null;
        log.exercises[exId] = arr;
      }
    });
  });

  // Fix nutrition arrays corrupted by Firestore
Object.values(state.nutrition).forEach(nut => {
  if (nut.meals && !Array.isArray(nut.meals)) {
    nut.meals = Object.values(nut.meals);
  }
  if (nut.customMeals && !Array.isArray(nut.customMeals)) {
    nut.customMeals = Object.values(nut.customMeals);
  }
});

  renderHome();
}

init();
