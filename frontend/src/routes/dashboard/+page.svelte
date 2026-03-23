<script>
  import { onMount, onDestroy } from 'svelte'
  import { goto }               from '$app/navigation'
  import { get }                from 'svelte/store'
  import api                    from '$lib/api'
  import { authStore, marketStore, updateCandles, updateSignal, updateSymbol, updateInterval, updateWsStatus } from '$lib/stores'

  // components
  import CandlestickChart from '$lib/components/CandlestickChart.svelte'
  import SignalCard       from '$lib/components/SignalCard.svelte'
  import AIAdvicePanel    from '$lib/components/AIAdvicePanel.svelte'

  // ─────────────────────────────────────────────────────
  // AUTH GUARD
  // dashboard protected hai — login zaroori hai
  // ─────────────────────────────────────────────────────
  onMount(() => {
    const auth = get(authStore)
    if (!auth.isAuthenticated) {
      goto('/login')
      return
    }

    // WebSocket connect karo
    connectWS()

    // initial signal fetch karo
    fetchSignal()
  })

  onDestroy(() => {
    // page destroy hone pe WS disconnect karo
    disconnectWS()
  })

  // ─────────────────────────────────────────────────────
  // LOCAL STATE
  // ─────────────────────────────────────────────────────
  let aiData      = $state(null)
  let aiLoading   = $state(false)
  let signalLoading = $state(false)
  let error       = $state('')

  // allowed values — backend se match karna zaroori hai
  const SYMBOLS    = ['USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR']
  const INTERVALS  = ['1h', '4h', '1day']

  // ─────────────────────────────────────────────────────
  // WEBSOCKET
  // ─────────────────────────────────────────────────────
  let ws = null

  const connectWS = () => {
    // .env se WS URL lo
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'

    updateWsStatus('connecting')

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[WS] Connected')
      updateWsStatus('connected')

      // subscribe karo current symbol + interval ke liye
      const { symbol, interval } = get(marketStore)
      ws.send(JSON.stringify({
        type:     'SUBSCRIBE',
        symbol,
        interval
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'CANDLE_DATA') {
          // candles store mein save karo
          updateCandles(data.data)
        }
      } catch (err) {
        console.error('[WS] Parse error:', err.message)
      }
    }

    ws.onclose = () => {
      console.log('[WS] Disconnected')
      updateWsStatus('disconnected')
    }

    ws.onerror = (err) => {
      console.error('[WS] Error:', err)
      updateWsStatus('disconnected')
    }
  }

  const disconnectWS = () => {
    if (ws) {
      ws.close()
      ws = null
    }
  }

  // symbol ya interval change hone pe WS re-subscribe karo
  const resubscribeWS = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      const { symbol, interval } = get(marketStore)
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        symbol,
        interval
      }))
    }
  }

  // ─────────────────────────────────────────────────────
  // FETCH SIGNAL
  // ─────────────────────────────────────────────────────
  const fetchSignal = async () => {
    const { symbol, interval } = get(marketStore)

    signalLoading = true
    error         = ''
    aiData        = null

    try {
      const response = await api.get('/signal', {
        params: { symbol, interval }
      })

      updateSignal(response.data.data)

    } catch (err) {
      error = err.response?.data?.error || 'Signal fetch failed'
    } finally {
      signalLoading = false
    }
  }

  // ─────────────────────────────────────────────────────
  // FETCH AI ANALYSIS
  // ─────────────────────────────────────────────────────
  const fetchAI = async () => {
    const { symbol, interval } = get(marketStore)

    aiLoading = true
    error     = ''

    try {
      const response = await api.post('/ai/analyze', {
        symbol,
        interval
      })

      aiData = response.data.data.aiValidation

    } catch (err) {
      error = err.response?.data?.error || 'AI analysis failed'
    } finally {
      aiLoading = false
    }
  }

  // ─────────────────────────────────────────────────────
  // SYMBOL CHANGE
  // ─────────────────────────────────────────────────────
  const handleSymbolChange = (e) => {
    updateSymbol(e.target.value)
    resubscribeWS()
    fetchSignal()
    aiData = null
  }

  // ─────────────────────────────────────────────────────
  // INTERVAL CHANGE
  // ─────────────────────────────────────────────────────
  const handleIntervalChange = (e) => {
    updateInterval(e.target.value)
    resubscribeWS()
    fetchSignal()
    aiData = null
  }
</script>

<!-- ─────────────────────────────────────────────────────
     HTML
     ───────────────────────────────────────────────────── -->
<div class="dashboard">

  <!-- ── TOP BAR — symbol, interval, buttons ── -->
  <div class="dashboard__topbar">

    <div class="topbar__left">

      <!-- Symbol Dropdown -->
      <select
        class="topbar__select"
        value={$marketStore.symbol}
        onchange={handleSymbolChange}
      >
        {#each SYMBOLS as sym}
          <option value={sym}>{sym}</option>
        {/each}
      </select>

      <!-- Interval Dropdown -->
      <select
        class="topbar__select"
        value={$marketStore.interval}
        onchange={handleIntervalChange}
      >
        {#each INTERVALS as int}
          <option value={int}>{int}</option>
        {/each}
      </select>

      <!-- WS Status dot -->
      <div class="ws-status">
        <div
          class="ws-dot"
          class:connected={$marketStore.wsStatus === 'connected'}
          class:connecting={$marketStore.wsStatus === 'connecting'}
        ></div>
        <span>{$marketStore.wsStatus}</span>
      </div>

    </div>

    <div class="topbar__right">

      <!-- Refresh Signal -->
      <button
        class="topbar__btn"
        onclick={fetchSignal}
        disabled={signalLoading}
      >
        {signalLoading ? 'Loading...' : '↻ Signal'}
      </button>

      <!-- Get AI Analysis -->
      <button
        class="topbar__btn topbar__btn--accent"
        onclick={fetchAI}
        disabled={aiLoading || !$marketStore.signal}
      >
        {aiLoading ? 'Analyzing...' : '🤖 AI Analysis'}
      </button>

    </div>

  </div>

  <!-- error message -->
  {#if error}
    <div class="dashboard__error">{error}</div>
  {/if}

  <!-- ── MAIN GRID ── -->
  <div class="dashboard__grid">

    <!-- LEFT — Chart -->
    <div class="dashboard__chart">
      <CandlestickChart
        candles={$marketStore.candles}
        signal={$marketStore.signal}
      />
    </div>

    <!-- RIGHT — Signal + AI -->
    <div class="dashboard__sidebar">

      <SignalCard signal={$marketStore.signal} />

      <AIAdvicePanel
        aiData={aiData}
        loading={aiLoading}
      />

    </div>

  </div>

</div>

<style>
  /* ═══════════════════════════════════════
     DASHBOARD
     ═══════════════════════════════════════ */
  .dashboard {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: calc(100vh - 60px);
    /* 60px = navbar height */
  }

  /* ═══════════════════════════════════════
     TOPBAR
     ═══════════════════════════════════════ */
  .dashboard__topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .topbar__left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .topbar__right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* ── SELECT DROPDOWN ── */
  .topbar__select {
    background: #1a1a1a;
    border: 1px solid #2e2e2e;
    border-radius: 8px;
    padding: 8px 12px;
    color: #f0f0f0;
    font-size: 0.875rem;
    font-family: 'Be Vietnam Pro', sans-serif;
    cursor: pointer;
    transition: border-color 0.15s ease;
    /* remove default arrow styling */
    appearance: none;
    -webkit-appearance: none;
    padding-right: 28px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23606060' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .topbar__select:focus {
    border-color: #7c6aff;
    outline: none;
  }

  /* ── WS STATUS ── */
  .ws-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #606060;
  }

  .ws-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #606060;
    transition: background 0.3s ease;
  }

  .ws-dot.connected  { background: #00c896; }
  .ws-dot.connecting { background: #f0a500; }

  /* ── BUTTONS ── */
  .topbar__btn {
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: 'Be Vietnam Pro', sans-serif;
    border-radius: 8px;
    border: 1px solid #2e2e2e;
    color: #a0a0a0;
    background: #1a1a1a;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .topbar__btn:hover {
    border-color: #7c6aff;
    color: #f0f0f0;
  }

  .topbar__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .topbar__btn--accent {
    background: rgba(124, 106, 255, 0.1);
    border-color: rgba(124, 106, 255, 0.3);
    color: #a89fff;
  }

  .topbar__btn--accent:hover {
    background: rgba(124, 106, 255, 0.2);
    border-color: rgba(124, 106, 255, 0.5);
    color: #f0f0f0;
  }

  /* ═══════════════════════════════════════
     ERROR
     ═══════════════════════════════════════ */
  .dashboard__error {
    background: rgba(255, 77, 77, 0.1);
    border: 1px solid #ff4d4d;
    color: #ff4d4d;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.875rem;
  }

  /* ═══════════════════════════════════════
     MAIN GRID
     ═══════════════════════════════════════ */
  .dashboard__grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    /* chart = flexible, sidebar = fixed 320px */
    gap: 16px;
    align-items: start;
  }

  /* tablet — sidebar neeche chali jaaye */
  @media (max-width: 1024px) {
    .dashboard__grid {
      grid-template-columns: 1fr;
    }
  }

  .dashboard__chart {
    min-width: 0;
    /* min-width: 0 — grid child ko shrink hone do */
    /* bina iske chart overflow kar sakta hai */
  }

  .dashboard__sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>