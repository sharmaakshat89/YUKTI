<script>
  // $props() — parent se data aayega
  // aiData shape:
  // { aiSignal, reasoning, agreesWithQuant, source }
  let {
    aiData  = null,
    loading = false
  } = $props()

  // agrees color
  const agreesColor = $derived(() => {
    if (!aiData) return '#606060'
    return aiData.agreesWithQuant ? '#00c896' : '#ff4d4d'
  })

  const agreesText = $derived(() => {
    if (!aiData) return '—'
    return aiData.agreesWithQuant ? '✓ Agrees with Quant' : '✗ Disagrees with Quant'
  })

  // AI signal color
  const aiSignalColor = $derived(() => {
    if (!aiData) return '#606060'
    if (aiData.aiSignal === 'BUY')  return '#00c896'
    if (aiData.aiSignal === 'SELL') return '#ff4d4d'
    return '#f0a500'
  })
</script>

<div class="ai-panel">

  <!-- ── HEADER ── -->
  <div class="ai-panel__header">
    <div class="ai-panel__title">
      <span class="ai-icon">🤖</span>
      <h3>AI Analysis</h3>
    </div>

    {#if aiData?.source}
      <span class="ai-source">
        {aiData.source === 'cache' ? '⚡ cached' : '🔄 live'}
      </span>
    {/if}
  </div>

  <!-- ── LOADING STATE ── -->
  {#if loading}
    <div class="ai-loading">
      <div class="ai-loading__spinner"></div>
      <p>Analyzing with Gemini AI...</p>
    </div>

  <!-- ── EMPTY STATE ── -->
  {:else if !aiData}
    <div class="ai-empty">
      <p>Get a signal first to see AI analysis</p>
    </div>

  <!-- ── AI DATA ── -->
  {:else}

    <!-- AI Signal -->
    <div class="ai-signal-row">
      <span class="ai-signal-label">AI Signal</span>
      <span
        class="ai-signal-value"
        style="color: {aiSignalColor()}"
      >
        {aiData.aiSignal}
      </span>
    </div>

    <!-- Agrees/Disagrees -->
    <div
      class="ai-agrees"
      style="color: {agreesColor()}"
    >
      {agreesText()}
    </div>

    <!-- Reasoning -->
    <div class="ai-reasoning">
      <h4>Reasoning</h4>
      <p>{aiData.reasoning}</p>
    </div>

  {/if}

</div>

<style>
  /* ═══════════════════════════════════════
     PANEL
     ═══════════════════════════════════════ */
  .ai-panel {
    background: #1a1a1a;
    border: 1px solid #2e2e2e;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ═══════════════════════════════════════
     HEADER
     ═══════════════════════════════════════ */
  .ai-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ai-panel__title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ai-icon {
    font-size: 1rem;
  }

  .ai-panel__title h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #a0a0a0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .ai-source {
    font-size: 0.7rem;
    color: #606060;
    padding: 2px 8px;
    background: #242424;
    border-radius: 100px;
  }

  /* ═══════════════════════════════════════
     LOADING
     ═══════════════════════════════════════ */
  .ai-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 0;
  }

  .ai-loading__spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #2e2e2e;
    border-top-color: #7c6aff;
    border-radius: 50%;
    /* CSS spinner — pure CSS animation */
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .ai-loading p {
    font-size: 0.8rem;
    color: #606060;
  }

  /* ═══════════════════════════════════════
     EMPTY
     ═══════════════════════════════════════ */
  .ai-empty {
    text-align: center;
    padding: 32px 0;
  }

  .ai-empty p {
    font-size: 0.875rem;
    color: #606060;
  }

  /* ═══════════════════════════════════════
     AI SIGNAL ROW
     ═══════════════════════════════════════ */
  .ai-signal-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #242424;
    border-radius: 10px;
  }

  .ai-signal-label {
    font-size: 0.8rem;
    color: #606060;
  }

  .ai-signal-value {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 1px;
  }

  /* ═══════════════════════════════════════
     AGREES
     ═══════════════════════════════════════ */
  .ai-agrees {
    font-size: 0.8rem;
    font-weight: 600;
    text-align: center;
    padding: 8px;
    border-radius: 8px;
    background: #242424;
  }

  /* ═══════════════════════════════════════
     REASONING
     ═══════════════════════════════════════ */
  .ai-reasoning {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ai-reasoning h4 {
    font-size: 0.75rem;
    font-weight: 600;
    color: #606060;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .ai-reasoning p {
    font-size: 0.825rem;
    color: #a0a0a0;
    line-height: 1.7;
    /* reasoning text wrap ho — long text hai */
    white-space: pre-wrap;
    /* pre-wrap — newlines preserve karo */
  }
</style>