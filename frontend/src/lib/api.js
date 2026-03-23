// src/lib/api.js

// axios import karo — HTTP requests bhejne ke liye
// jaise browser ka fetch() ka upgraded version
import axios from 'axios'

// ─────────────────────────────────────────────────────────────
// axios.create() — ek pre-configured axios object banata hai
// socho isko ek pre-set form ki tarah
// jisme base URL aur default settings pehle se bhari hain
// har baar poora URL nahi likhna padta
// ─────────────────────────────────────────────────────────────
const api = axios.create({

  // import.meta.env.VITE_API_URL — .env file se value aati hai
  // .env mein likha hai: VITE_API_URL=http://localhost:5000/api/v1
  // agar .env mein nahi mili toh fallback use hoga
  baseURL:'http://localhost:5000/api/v1',

  // 10 seconds mein server respond nahi kiya toh cancel
  // bina timeout ke request forever pending reh sakti hai
  timeout: 10000,

  headers: {
    'Content-Type': 'application/json'
  }
})

// ─────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR
// security guard ki tarah — har request jaane se PEHLE
// yahan se guzarti hai
// hum yahan JWT token automatically attach karte hain
// ─────────────────────────────────────────────────────────────
api.interceptors.request.use(

  (config) => {
    // localStorage — browser ka built-in small database
    // humara auth store apna data yahan save karta hai
    // 'auth-store' — yeh key hum stores.js mein define karenge
    const raw = localStorage.getItem('auth-store')

    if (raw) {
      try {
        // JSON.parse() — string ko JS object mein convert karta hai
        const parsed = JSON.parse(raw)

        // token nikalo
        // ?. optional chaining — agar parsed ya parsed.token
        // undefined ho toh crash nahi hoga
        const token = parsed?.token

        if (token) {
          // Bearer prefix zaroori hai
          // backend ka auth.middleware.js startsWith('Bearer') check karta hai
          config.headers.Authorization = `Bearer ${token}`
        }

      } catch (err) {
        console.warn('[API] Token parse failed:', err.message)
      }
    }

    // config return karna ZAROORI hai
    // warna request rok jaayegi — response kabhi nahi aayega
    return config
  },

  (error) => {
    return Promise.reject(error)
  }
)

// ─────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// har response aane ke BAAD yahan se guzarta hai
// 401 = token expire — auto logout
// ─────────────────────────────────────────────────────────────
api.interceptors.response.use(

  (response) => {
    // successful response — seedha return karo
    return response
  },

  (error) => {
    const status = error?.response?.status

    // 401 — token expire ya invalid
    if (status === 401) {
      console.warn('[API] 401 — clearing auth')

      // localStorage clear karo
      localStorage.removeItem('auth-store')

      // login pe redirect
      // SvelteKit mein bhi window.location chalti hai
      // kyunki yeh file Svelte component ke bahar hai
      window.location.href = '/login'
    }

    if (error.code === 'ECONNABORTED') {
      console.error('[API] Timeout — server too slow')
    }

    if (status >= 500) {
      console.error('[API] Server error:', status)
    }

    // error propagate karo — component ke catch mein jaayega
    return Promise.reject(error)
  }
)

export default api