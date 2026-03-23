<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { authStore } from '$lib/stores'
  import { get } from 'svelte/store'

  onMount(() => {
    const auth = get(authStore)
    // sirf tab redirect karo jab logged IN ho
    // logged out hai toh landing page dikhao — redirect mat karo
    if (auth.isAuthenticated) {
      goto('/dashboard')
    }
  })

  const indicators = [
    'RSI — 14',
    'ADX — 14',
    'MACD — 12/26/9',
    'SuperTrend — 10/3',
    'HMA — 9',
    'Bollinger Bands — 20',
    'ATR — 10',
    'SMA — 50',
    'WMA — 9',
  ]

  const marqueeItems = [...indicators, ...indicators]
</script>

<!-- koi UI nahi — sirf redirect hoga -->
<!-- thodi der ke liye blank screen dikhegi -->
<div class="redirect">
  <p>Loading...</p>
</div>

<style>
  .redirect {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
</style>