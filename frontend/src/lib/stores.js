
import { writable } from 'svelte/store' //built-in func, reactive var 
// that changes the component that is using this var , nothing to be done manually


// LOCALSTORAGE HELPER FUNCTIONS: will save in localstorage so shit is stored even if we close the tab


// localStorage se auth data padhna
// yeh function tab chalta hai jab app pehli baar load ho
const loadAuthFromStorage = () => {
  try {
    // pehle check karo — kya hum browser mein hain?
    // typeof window === 'undefined' matlab server pe hain
    // server pe localStorage access mat karo
    if (typeof window === 'undefined') return {
      user: null,
      token: null,
      isAuthenticated: false
    }

    const raw = localStorage.getItem('auth-store')
    if (raw) return JSON.parse(raw)

  } catch (err) {
    console.warn('[Store] Failed to load auth from storage:', err.message)
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false
  }
}

// auth data localStorage mein save karna
const saveAuthToStorage = (data) => {
  try {
    // JSON.stringify() — JS object ko string mein convert karta hai
    // localStorage sirf strings store kar sakta hai
    localStorage.setItem('auth-store', JSON.stringify(data))
  } catch (err) {
    console.warn('[Store] Failed to save auth to storage:', err.message)
  }
}


// AUTH STORE
// teen cheezein store karta hai:user(who's logged-in),token(JWT),isAutheticated

export const authStore = writable(loadAuthFromStorage())// store created with initial val, reads from localstorage on app load , restores state if logged in before


// login action — backend ne jo data bheja woh yahan save karo
// userData shape: { _id, email, role, token }
export const login = (userData) => {
  // naya state object banao
  const newState = {
    user: {
      id:    userData._id,
      email: userData.email,
      role:  userData.role
    },
    token:           userData.token,
    isAuthenticated: true
  }

  // authStore updated with newState on updating data
  authStore.set(newState)

  // localStorage mein bhi saved taaki page refresh pe bhi login state rahe 
  saveAuthToStorage(newState)
}

// logout action — sab kuch clear karo
export const logout = () => {
  const emptyState = {
    user:            null,
    token:           null,
    isAuthenticated: false
  }

  // store clear karo
  authStore.set(emptyState)

  // localStorage se bhi hataao
  localStorage.removeItem('auth-store')

  // login page pe bhejo
  window.location.href = '/login'
}

// ─────────────────────────────────────────────────────────────
// MARKET STORE
// live market data store karta hai
// WebSocket se jo candles aate hain woh yahan save honge
// dashboard pe chart yahan se data padhega
// ─────────────────────────────────────────────────────────────
export const marketStore = writable({
  // candles — chart ke liye OHLC data
  // shape: [{ time, open, high, low, close, volume }]
  candles:  [],

  // symbol — abhi kaun sa currency pair dekh rahe hain
  // default USD/INR
  symbol:   'USD/INR',

  // interval — kaun sa timeframe
  // default 1h
  interval: '1h',

  // signal — backend se aaya quant signal
  // shape: { signal, score, risk, indicators, indicatorSeries }
  signal:   null,

  // wsStatus — WebSocket connection ka status
  // 'connecting' | 'connected' | 'disconnected'
  wsStatus: 'disconnected'
})

// ─────────────────────────────────────────────────────────────
// MARKET STORE ACTIONS
// ─────────────────────────────────────────────────────────────

// candles update karo — WebSocket se naya data aaya
export const updateCandles = (candles) => {//reads old state and returns new one
  
  marketStore.update(state => ({ ...state, candles }))
}

// symbol change karo — user ne dropdown se select kiya
export const updateSymbol = (symbol) => {
  marketStore.update(state => ({ ...state, symbol }))
}

// interval change karo
export const updateInterval = (interval) => {
  marketStore.update(state => ({ ...state, interval }))
}

// signal save karo — API se aaya
export const updateSignal = (signal) => {
  marketStore.update(state => ({ ...state, signal }))
}

// WebSocket status update karo
export const updateWsStatus = (wsStatus) => {
  marketStore.update(state => ({ ...state, wsStatus }))
}

// ## Ab Poora Flow 

// USER NE LOGIN KIYA
//         ↓
// LoginPage — api.js se POST /auth/login
//         ↓
// Backend — { _id, email, role, token } return kiya
//         ↓
// LoginPage — login(userData) call kiya stores.js se
//         ↓
// authStore.set() — state update hua
//         ↓
// saveAuthToStorage() — localStorage mein save hua
//         ↓
        
// AB KOI PROTECTED API CALL HOGI:
//         ↓
// api.js ka request interceptor chala
//         ↓
// localStorage.getItem('auth-store') — token nikala
//         ↓
// config.headers.Authorization = Bearer token
//         ↓
// Backend ko request gayi — token valid — data mila
//         ↓

// USER NE PAGE REFRESH KIYA:
//         ↓
// app load hua — loadAuthFromStorage() chala
//         ↓
// localStorage se purana state mila
//         ↓
// authStore mein restore ho gaya
//         ↓
// user abhi bhi logged in hai




/*
STORE BANAO:
  writable(val)                    — simple store
  readable(val, fn)                — read-only store
  derived(store, fn)               — computed store
  createPersistentStore(key, val)  — localStorage wala

STORE UPDATE KARO:
  store.set(newValue)              — replace karo
  store.update(old => newVal)      — calculate karke replace

STORE PADHO:
  $storeName                       — template mein (reactive)
  get(storeName)                   — JS mein (snapshot)

SUBSCRIBE KARO:
  $storeName                       — auto (recommended)
  store.subscribe(fn)              — manual (onDestroy mein unsubscribe) 
  */