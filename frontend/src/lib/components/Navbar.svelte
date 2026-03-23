<script>
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { authStore, logout } from '$lib/stores'

  const handleLogout = () => {
    logout()
  }

  const isActive = (path) => $page.url.pathname === path
</script>

<nav class="navbar">

  <div class="navbar__logo">
    <button onclick={() => goto('/')}>
      YUKTI  <span class="navbar__logo-dot"><p>BETA</p></span>
    </button>
  </div>

  {#if $authStore.isAuthenticated}
    <div class="navbar__links">
      <a href="/dashboard" class:active={isActive('/dashboard')}>
        Dashboard
      </a>
      <a href="/backtest" class:active={isActive('/backtest')}>
        Backtest
      </a>
    </div>
  {/if}

  <div class="navbar__right">
    {#if $authStore.isAuthenticated}
      <span class="navbar__email">
        {$authStore.user?.email}
      </span>
      <button class="navbar__logout" onclick={handleLogout}>
        Logout
      </button>
    {:else}
      <a href="/login" class="navbar__login-btn">Login</a>
      <a href="/register" class="navbar__login-btn">Register</a>
    {/if}
  </div>

</nav>

<style>
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 48px;
    background-color: rgba(20, 20, 20, 0);;
    border-bottom: 1px solid #2e2e2e;
    z-index: var(--z-navbar);
  }

  .navbar__logo button {
    background: rgba(124, 106, 255, 0.08);
  border: 1px solid rgba(124, 106, 255, 0.2);
  display: flex;
  gap:13px;
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f0f0f0;
  cursor: pointer;
  letter-spacing: -0.5px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background 0.15s ease, border-color 0.15s ease;
  }

  .navbar__logo button:hover {
  background: rgba(124, 106, 255, 0.15);
  border-color: rgba(124, 106, 255, 0.4);
  }

  .navbar__logo-dot p {
    font-size: 9px;
  }

  .navbar__links {
    display: flex;
    gap: var(--space-6);
  }

  .navbar__links a {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-secondary);
    text-decoration: none;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast),
                background var(--transition-fast);
  }

  .navbar__links a:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }

  .navbar__links a.active {
    color: var(--accent);
    background: var(--bg-tertiary);
  }

  .navbar__right {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .navbar__email {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .navbar__logout {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--sell);
    background: none;
    border: 1px solid var(--sell);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast),
                color var(--transition-fast);
  }

  .navbar__logout:hover {
    background: var(--sell);
    color: white;
  }

  .navbar__login-btn {
  font-size: 0.875rem;
  font-weight: 500;
  color: #f0f0f0;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 20px;
  border-radius: 10px;
  margin-right: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background 0.15s ease,
              border-color 0.15s ease,
              transform 0.15s ease;
}

  .navbar__login-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  color: #f0f0f0;
}

/* ═══════════════════════════════════════
   REGISTER BUTTON — glassmorphic filled
   ═══════════════════════════════════════ */
.navbar__register-btn {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  background: rgba(124, 106, 255, 0.3);
  padding: 8px 20px;
  border-radius: 10px;
  border: 1px solid rgba(124, 106, 255, 0.4);
  text-decoration: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background 0.15s ease,
              border-color 0.15s ease,
              transform 0.15s ease;
}

.navbar__register-btn:hover {
  background: rgba(124, 106, 255, 0.5);
  border-color: rgba(124, 106, 255, 0.6);
  transform: translateY(-1px);
  color: #ffffff;
}



  .navbar__login-btn-outline {
  font-size: 0.875rem;
  font-weight: 500;
  color: #f0f0f0;
  background: transparent;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #2e2e2e;
  text-decoration: none;
  transition: border-color 0.15s ease;
  
}

.navbar__login-btn-outline:hover {
  border-color: #7c6aff;
  color: #f0f0f0;
}
</style>