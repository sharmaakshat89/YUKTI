<script>
  // $props() — parent se data aayega
  // signal object shape:
  // { signal, score, risk: { stopLoss, takeProfit },
  //   indicators: { rsi, adx, supertrend, hma, macdHist, bbWidth } }
  let { signal = null } = $props()

  // signal ke hisaab se color decide karo
  // Vanilla JS mein: if/else chain
  // Svelte mein: derived value — $derived()
  const signalColor = $derived(() => {
    if (!signal) return '#606060'
    if (signal.signal === 'BUY')      return '#00c896'
    if (signal.signal === 'SELL')     return '#ff4d4d'
    return '#f0a500' // NO_TRADE
  })

  const signalBg = $derived(() => {
    if (!signal) return 'rgba(96, 96, 96, 0.1)'
    if (signal.signal === 'BUY')      return 'rgba(0, 200, 150, 0.1)'
    if (signal.signal === 'SELL')     return 'rgba(255, 77, 77, 0.1)'
    return 'rgba(240, 165, 0, 0.1)'
  })

  const signalBorder = $derived(() => {
    if (!signal) return 'rgba(96, 96, 96, 0.2)'
    if (signal.signal === 'BUY')      return 'rgba(0, 200, 150, 0.3)'
    if (signal.signal === 'SELL')     return 'rgba(255, 77, 77, 0.3)'
    return 'rgba(240, 165, 0, 0.3)'
  })

  // score percentage — 0 to 1 range hai
  // display ke liye 0 to 100 mein convert karo
  const scorePercent = $derived(() => {
    if (!signal) return 0
    return Math.abs(parseFloat((signal.score * 100).toFixed(1)))
  })

  // supertrend label
  const supertrendLabel = $derived(() => {
    if (!signal) return '—'
    return signal.indicators.supertrend === 1 ? '▲ Bullish' : '▼ Bearish'
  })

  const supertrendColor = $derived(() => {
    if (!signal) return '#606060'
    return signal.indicators.supertrend === 1 ? '#00c896' : '#ff4d4d'
  })
</script>

<div class="signal-card">

  <!-- ── HEADER ── -->
  <div class="signal-card__header">
    <h3>Signal</h3>
    {#if signal}
      <span class="signal-card__timestamp">
        {new Date(signal.timestamp).toLocaleTimeString()}
      </span>
    {/if}
  </div>

  <!-- ── SIGNAL BADGE ── -->
  <div
    class="signal-badge"
    style="
      color: {signalColor()};
      background: {signalBg()};
      border-color: {signalBorder()};
    "
  >
    {#if !signal}
      — Waiting
    {:else if signal.signal === 'BUY'}
      ▲ BUY
    {:else if signal.signal === 'SELL'}
      ▼ SELL
    {:else}
      ◆ NO TRADE
    {/if}
  </div>

  {#if signal}

    <!-- ── SCORE BAR ── -->
    <div class="score-section">
      <div class="score-label">
        <span>Confidence</span>
        <span>{scorePercent()}%</span>
      </div>
      <div class="score-bar">
        <div
          class="score-fill"
          style="
            width: {scorePercent()}%;
            background: {signalColor()};
          "
        ></div>
      </div>
    </div>

    <!-- ── RISK LEVELS ── -->
    <div class="risk-section">

      <div class="risk-row">
        <span class="risk-label">Stop Loss</span>
        <span class="risk-value risk-value--sell">
          {signal.risk.stopLoss}
        </span>
      </div>

      <div class="risk-row">
        <span class="risk-label">Take Profit</span>
        <span class="risk-value risk-value--buy">
          {signal.risk.takeProfit}
        </span>
      </div>

    </div>

    <!-- ── INDICATORS ── -->
    <div class="indicators-section">

      <h4>Indicators</h4>

      <div class="indicators-grid">

        <div class="indicator-item">
          <span class="indicator-label">RSI</span>
          <span
            class="indicator-value"
            style="color: {
              signal.indicators.rsi > 70 ? '#ff4d4d' :
              signal.indicators.rsi < 30 ? '#00c896' :
              '#f0f0f0'
            }"
          >
            {signal.indicators.rsi}
          </span>
        </div>

        <div class="indicator-item">
          <span class="indicator-label">ADX</span>
          <span
            class="indicator-value"
            style="color: {
              signal.indicators.adx > 25 ? '#00c896' : '#a0a0a0'
            }"
          >
            {signal.indicators.adx}
          </span>
        </div>

        <div class="indicator-item">
          <span class="indicator-label">SuperTrend</span>
          <span
            class="indicator-value"
            style="color: {supertrendColor()}"
          >
            {supertrendLabel()}
          </span>
        </div>

        <div class="indicator-item">
          <span class="indicator-label">MACD Hist</span>
          <span
            class="indicator-value"
            style="color: {
              signal.indicators.macdHist > 0 ? '#00c896' : '#ff4d4d'
            }"
          >
            {signal.indicators.macdHist}
          </span>
        </div>

        <div class="indicator-item">
          <span class="indicator-label">BB Width</span>
          <span class="indicator-value">
            {signal.indicators.bbWidth}
          </span>
        </div>

        <div class="indicator-item">
          <span class="indicator-label">HMA</span>
          <span class="indicator-value">
            {signal.indicators.hma}
          </span>
        </div>

      </div>

    </div>

  {:else}

    <!-- loading state — signal nahi aaya abhi -->
    <div class="signal-empty">
      <p>Select a symbol and interval to get signal</p>
    </div>

  {/if}

</div>

<style>
  /* ═══════════════════════════════════════
     CARD
     ═══════════════════════════════════════ */
  .signal-card {
    background: #1a1a1a;
    border: 1px solid #2e2e2e;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ═══════════════════════════════════════
     HEADER
     ═══════════════════════════════════════ */
  .signal-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .signal-card__header h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #a0a0a0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .signal-card__timestamp {
    font-size: 0.75rem;
    color: #606060;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ═══════════════════════════════════════
     SIGNAL BADGE
     ═══════════════════════════════════════ */
  .signal-badge {
    text-align: center;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 2px;
  }

  /* ═══════════════════════════════════════
     SCORE BAR
     ═══════════════════════════════════════ */
  .score-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .score-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #606060;
  }

  .score-bar {
    height: 4px;
    background: #242424;
    border-radius: 2px;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
    /* smooth animation jab score change ho */
  }

  /* ═══════════════════════════════════════
     RISK LEVELS
     ═══════════════════════════════════════ */
  .risk-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    background: #242424;
    border-radius: 10px;
  }

  .risk-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .risk-label {
    font-size: 0.8rem;
    color: #606060;
  }

  .risk-value {
    font-size: 0.875rem;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    /* monospace — numbers aligned rahenge */
  }

  .risk-value--buy  { color: #00c896; }
  .risk-value--sell { color: #ff4d4d; }

  /* ═══════════════════════════════════════
     INDICATORS
     ═══════════════════════════════════════ */
  .indicators-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .indicators-section h4 {
    font-size: 0.75rem;
    font-weight: 600;
    color: #606060;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .indicators-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .indicator-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    background: #242424;
    border-radius: 8px;
  }

  .indicator-label {
    font-size: 0.7rem;
    color: #606060;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .indicator-value {
    font-size: 0.875rem;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    color: #f0f0f0;
  }

  /* ═══════════════════════════════════════
     EMPTY STATE
     ═══════════════════════════════════════ */
  .signal-empty {
    text-align: center;
    padding: 40px 20px;
  }

  .signal-empty p {
    font-size: 0.875rem;
    color: #606060;
  }
</style>