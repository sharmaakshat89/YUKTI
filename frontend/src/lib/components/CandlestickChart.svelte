<script>
  // onMount — tab chalta hai jab component browser mein load ho
  // Vanilla JS mein: window.onload jaisa
  // chart DOM element chahiye — server pe DOM nahi hota
  // isliye onMount zaroori hai
  import { onMount, onDestroy } from 'svelte'

  // lightweight-charts v5 — named imports
  import {
    createChart,
    CandlestickSeries,
    LineSeries,
    HistogramSeries
  } from 'lightweight-charts'

  // ─────────────────────────────────────────────────────
  // PROPS — parent se data aayega
  // $props() — Svelte 5 syntax
  // Vanilla JS analogy:
  // function CandlestickChart({ candles, signal }) {}
  // ─────────────────────────────────────────────────────
  let {
    candles  = [],   // OHLC data array
    signal   = null  // quant signal object
  } = $props()

  // ─────────────────────────────────────────────────────
  // DOM REFERENCES
  // bind:this — Svelte ka tarika DOM element pakdne ka
  // Vanilla JS mein: document.getElementById('chart')
  // ─────────────────────────────────────────────────────
  let chartContainer  = $state(null) // main chart div
  let rsiContainer    = $state(null) // RSI panel div

  // ─────────────────────────────────────────────────────
  // CHART INSTANCES — cleanup ke liye store karo
  // ─────────────────────────────────────────────────────
  let chart    = null
  let rsiChart = null

  // ─────────────────────────────────────────────────────
  // SERIES REFERENCES — data update ke liye
  // ─────────────────────────────────────────────────────
  let candleSeries  = null
  let ma50Series    = null
  let hmaSeries     = null
  let bbUpperSeries = null
  let bbLowerSeries = null
  let rsiSeries     = null

  // ─────────────────────────────────────────────────────
  // INDICATOR TOGGLES
  // $state() — reactive variable
  // jab toggle change ho — chart automatically update ho
  // ─────────────────────────────────────────────────────
  let showMA50    = $state(true)
  let showHMA     = $state(true)
  let showBB      = $state(false)
  let showRSI     = $state(true)

  // ─────────────────────────────────────────────────────
  // CHART OPTIONS — dark theme
  // ─────────────────────────────────────────────────────
  const chartOptions = {
    layout: {
      background: { color: '#1a1a1a' },
      textColor:  '#a0a0a0',
      fontFamily: "'Be Vietnam Pro', sans-serif"
    },
    grid: {
      vertLines:  { color: '#2e2e2e' },
      horzLines:  { color: '#2e2e2e' }
    },
    crosshair: {
      // crosshair — vertical + horizontal dotted line
      // mouse follow karta hai realtime
      mode: 1,
      // mode 1 = CrosshairMode.Normal
      // vertical line
      vertLine: {
        width:    1,
        color:    'rgba(124, 106, 255, 0.5)',
        style:    3,
        // style 3 = dotted line
        labelBackgroundColor: '#7c6aff'
      },
      // horizontal line
      horzLine: {
        width:    1,
        color:    'rgba(124, 106, 255, 0.5)',
        style:    3,
        labelBackgroundColor: '#7c6aff'
      }
    },
    rightPriceScale: {
      borderColor: '#2e2e2e'
    },
    timeScale: {
      borderColor:     '#2e2e2e',
      timeVisible:     true,
      secondsVisible:  false
    }
  }

  // ─────────────────────────────────────────────────────
  // INIT CHART — chart banao aur series add karo
  // ─────────────────────────────────────────────────────
  const initChart = () => {
    if (!chartContainer) return

    // main chart banao
    chart = createChart(chartContainer, {
      ...chartOptions,
      // width: auto — container ki width le
      width:  chartContainer.clientWidth,
      height: 420
    })

    // ── CANDLESTICK SERIES ──
    candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:         '#00c896', // BUY color — green
      downColor:       '#ff4d4d', // SELL color — red
      borderUpColor:   '#00c896',
      borderDownColor: '#ff4d4d',
      wickUpColor:     '#00c896',
      wickDownColor:   '#ff4d4d'
    })

    // ── MA50 SERIES — overlay on main chart ──
    ma50Series = chart.addSeries(LineSeries, {
      color:       '#7c6aff', // purple
      lineWidth:   2,
      priceLineVisible: false
      // priceLineVisible: false — horizontal line mat dikhao current value pe
    })

    // ── HMA SERIES ──
    hmaSeries = chart.addSeries(LineSeries, {
      color:     '#f0a500', // yellow/orange
      lineWidth: 1,
      priceLineVisible: false
    })

    // ── BOLLINGER BANDS ──
    bbUpperSeries = chart.addSeries(LineSeries, {
      color:     'rgba(160, 160, 160, 0.5)',
      lineWidth: 1,
      lineStyle: 2,
      // lineStyle 2 = dashed
      priceLineVisible: false
    })

    bbLowerSeries = chart.addSeries(LineSeries, {
      color:     'rgba(160, 160, 160, 0.5)',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false
    })

    // ── RSI CHART — separate panel below ──
    if (rsiContainer) {
      rsiChart = createChart(rsiContainer, {
        ...chartOptions,
        width:  rsiContainer.clientWidth,
        height: 120,
        rightPriceScale: {
          borderColor: '#2e2e2e',
          scaleMargins: {
            top:    0.1,
            bottom: 0.1
          }
        }
      })

      rsiSeries = rsiChart.addSeries(LineSeries, {
        color:     '#7c6aff',
        lineWidth: 2,
        priceLineVisible: false
      })

      // RSI reference lines — 70 aur 30
      // overbought aur oversold zones
      rsiChart.addSeries(LineSeries, {
        color:     'rgba(255, 77, 77, 0.4)',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false
      }).setData(
        // flat line at 70
        candles.map(c => ({ time: c.time, value: 70 }))
      )

      rsiChart.addSeries(LineSeries, {
        color:     'rgba(0, 200, 150, 0.4)',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false
      }).setData(
        // flat line at 30
        candles.map(c => ({ time: c.time, value: 30 }))
      )
    }

    // data set karo
    updateChartData()

    // resize observer — container size change hone pe chart resize karo
    // Vanilla JS mein: window.addEventListener('resize', ...)
    // ResizeObserver zyada accurate hai — sirf container resize detect karta hai
    const resizeObserver = new ResizeObserver(() => {
      if (chart && chartContainer) {
        chart.applyOptions({ width: chartContainer.clientWidth })
      }
      if (rsiChart && rsiContainer) {
        rsiChart.applyOptions({ width: rsiContainer.clientWidth })
      }
    })

    resizeObserver.observe(chartContainer)

    // cleanup mein observer disconnect karo
    return resizeObserver
  }

  // ─────────────────────────────────────────────────────
  // UPDATE CHART DATA — candles change hone pe
  // ─────────────────────────────────────────────────────
  const updateChartData = () => {
    if (!candleSeries || !candles.length) return

    // candle data set karo
    candleSeries.setData(candles)

    // indicator series data — signal se aata hai
    if (signal?.indicatorSeries) {
      const { ma50, hma, bbUpper, bbLower, rsi } = signal.indicatorSeries

      // MA50 — candles ke saath align karo
      if (ma50Series && ma50?.length) {
        const ma50Data = candles
          .slice(-ma50.length)
          .map((c, i) => ({ time: c.time, value: ma50[i] }))
          .filter(d => d.value != null)
        ma50Series.setData(ma50Data)
      }

      // HMA
      if (hmaSeries && hma?.length) {
        const hmaData = candles
          .slice(-hma.length)
          .map((c, i) => ({ time: c.time, value: hma[i] }))
          .filter(d => d.value != null)
        hmaSeries.setData(hmaData)
      }

      // Bollinger Bands
      if (bbUpperSeries && bbUpper?.length) {
        const bbUpperData = candles
          .slice(-bbUpper.length)
          .map((c, i) => ({ time: c.time, value: bbUpper[i] }))
          .filter(d => d.value != null)
        bbUpperSeries.setData(bbUpperData)
      }

      if (bbLowerSeries && bbLower?.length) {
        const bbLowerData = candles
          .slice(-bbLower.length)
          .map((c, i) => ({ time: c.time, value: bbLower[i] }))
          .filter(d => d.value != null)
        bbLowerSeries.setData(bbLowerData)
      }

      // RSI — separate panel
      if (rsiSeries && rsi?.length) {
        const rsiData = candles
          .slice(-rsi.length)
          .map((c, i) => ({ time: c.time, value: rsi[i] }))
          .filter(d => d.value != null)
        rsiSeries.setData(rsiData)
      }
    }

    // chart scroll karke latest candle dikhao
    chart?.timeScale().scrollToRealTime()
  }

  // ─────────────────────────────────────────────────────
  // TOGGLE HANDLERS — indicator on/off
  // series visible/invisible karo
  // ─────────────────────────────────────────────────────
  const toggleMA50 = () => {
    showMA50 = !showMA50
    ma50Series?.applyOptions({ visible: showMA50 })
  }

  const toggleHMA = () => {
    showHMA = !showHMA
    hmaSeries?.applyOptions({ visible: showHMA })
  }

  const toggleBB = () => {
    showBB = !showBB
    bbUpperSeries?.applyOptions({ visible: showBB })
    bbLowerSeries?.applyOptions({ visible: showBB })
  }

  const toggleRSI = () => {
    showRSI = !showRSI
    // RSI panel show/hide
    if (rsiContainer) {
      rsiContainer.style.display = showRSI ? 'block' : 'none'
    }
  }

  // ─────────────────────────────────────────────────────
  // REACTIVE — candles change hone pe data update karo
  // $effect() — Svelte 5 syntax
  // Vanilla JS analogy: useEffect jaisa — dependency change pe run karo
  // ─────────────────────────────────────────────────────
  $effect(() => {
    // candles ya signal change hone pe
    if (candles.length && chart) {
      updateChartData()
    }
  })

  // ─────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────
  let resizeObserver = null

  onMount(() => {
    // chart initialize karo
    resizeObserver = initChart()
  })

  onDestroy(() => {
    // cleanup — memory leak prevent karo
    // component destroy hone pe chart bhi destroy karo
    resizeObserver?.disconnect()
    chart?.remove()
    rsiChart?.remove()
  })
</script>

<!-- ─────────────────────────────────────────────────────
     HTML
     ───────────────────────────────────────────────────── -->
<div class="chart-wrapper">

  <!-- INDICATOR TOGGLES — pill buttons -->
  <div class="chart-toggles">

    <button
      class="toggle-btn"
      class:active={showMA50}
      onclick={toggleMA50}
    >
      MA50
    </button>

    <button
      class="toggle-btn"
      class:active={showHMA}
      onclick={toggleHMA}
    >
      HMA
    </button>

    <button
      class="toggle-btn"
      class:active={showBB}
      onclick={toggleBB}
    >
      BB Bands
    </button>

    <button
      class="toggle-btn"
      class:active={showRSI}
      onclick={toggleRSI}
    >
      RSI
    </button>

  </div>

  <!-- MAIN CHART -->
  <!-- bind:this — yeh div ka reference chartContainer mein store hoga -->
  <!-- Vanilla JS mein: document.getElementById('chart') -->
  <div bind:this={chartContainer} class="chart-container"></div>

  <!-- RSI PANEL — chart ke neeche -->
  <div bind:this={rsiContainer} class="rsi-container"></div>

</div>

<style>
  /* ═══════════════════════════════════════
     WRAPPER
     ═══════════════════════════════════════ */
  .chart-wrapper {
    background: #1a1a1a;
    border: 1px solid #2e2e2e;
    border-radius: 16px;
    overflow: hidden;
    /* overflow hidden — chart rounded corners ke andar rahe */
  }

  /* ═══════════════════════════════════════
     TOGGLE BUTTONS
     ═══════════════════════════════════════ */
  .chart-toggles {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid #2e2e2e;
    flex-wrap: wrap;
  }

  .toggle-btn {
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: 500;
    font-family: 'Be Vietnam Pro', sans-serif;
    border-radius: 100px;
    /* pill shape */
    border: 1px solid #2e2e2e;
    color: #606060;
    background: transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toggle-btn:hover {
    border-color: #7c6aff;
    color: #a89fff;
  }

  /* active — indicator on hai */
  .toggle-btn.active {
    background: rgba(124, 106, 255, 0.15);
    border-color: rgba(124, 106, 255, 0.4);
    color: #a89fff;
  }

  /* ═══════════════════════════════════════
     CHART
     ═══════════════════════════════════════ */
  .chart-container {
    width: 100%;
    /* height JS se set hoga — createChart mein height: 420 */
  }

  /* ═══════════════════════════════════════
     RSI PANEL
     ═══════════════════════════════════════ */
  .rsi-container {
    width: 100%;
    border-top: 1px solid #2e2e2e;
    /* height JS se set hoga — createChart mein height: 120 */
  }
</style>