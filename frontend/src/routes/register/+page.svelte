<script>
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { login } from '$lib/stores'

  let email    = $state('')
  let password = $state('')
  let confirm  = $state('')
  let loading  = $state(false)
  let error    = $state('')

  const handleRegister = async () => {

    // basic validation
    if (!email || !password || !confirm) {
      error = 'Sab fields required hain'
      return
    }

    if (password !== confirm) {
      error = 'Passwords match nahi kar rahe'
      return
    }

    if (password.length < 6) {
      error = 'Password minimum 6 characters ka hona chahiye'
      return
    }

    loading = true
    error   = ''

    try {
      const response = await api.post('/auth/register', {
        email,
        password
      })

      // register successful — backend token bhi deta hai
      // seedha login kar do — alag se login nahi karna
      login(response.data.data)
      goto('/dashboard')

    } catch (err) {
      error = err.response?.data?.error || 'Registration failed — try again'
    } finally {
      loading = false
    }
  }
</script>

<div class="register-page">
  <div class="register-card">

    <div class="register-header">
      <h1>Yukti<span class="dot">.</span></h1>
      <p>Create your account</p>
    </div>

    {#if error}
      <div class="error-box">
        {error}
      </div>
    {/if}

    <div class="register-form">

      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          bind:value={email}
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="minimum 6 characters"
          bind:value={password}
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="confirm">Confirm Password</label>
        <input
          id="confirm"
          type="password"
          placeholder="••••••••"
          bind:value={confirm}
          disabled={loading}
        />
      </div>

      <button
        class="register-btn"
        onclick={handleRegister}
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

    </div>

    <p class="login-link">
      Already have an account?
      <a href="/login">Sign In</a>
    </p>

  </div>
</div>

<style>
  /* ═══════════════════════════════════════
     PAGE
     ═══════════════════════════════════════ */
  .register-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background-image:url('./wimmel4.jpg');
    opacity:(0.75);
    background-repeat: no-repeat;
    background-size: cover;       /* fills full width */
  background-position: center;  /* keeps it centered */
  }

  /* ═══════════════════════════════════════
     CARD
     ═══════════════════════════════════════ */
  .register-card {
    width: 100%;
    max-width: 400px;
    background: #1a1a1a;
    border: 1px solid #2e2e2e;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    opacity:0.95;
  }

  /* ═══════════════════════════════════════
     HEADER
     ═══════════════════════════════════════ */
  .register-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .register-header h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #f0f0f0;
    margin-bottom: 8px;
  }

  .dot {
    color: #7c6aff;
  }

  .register-header p {
    color: #606060;
    font-size: 0.875rem;
  }

  /* ═══════════════════════════════════════
     ERROR BOX
     ═══════════════════════════════════════ */
  .error-box {
    background: rgba(255, 77, 77, 0.1);
    border: 1px solid #ff4d4d;
    color: #ff4d4d;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 0.875rem;
    margin-bottom: 16px;
  }

  /* ═══════════════════════════════════════
     FORM
     ═══════════════════════════════════════ */
  .register-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #a0a0a0;
  }

  .form-group input {
    background: #242424;
    border: 1px solid #2e2e2e;
    border-radius: 10px;
    padding: 12px 16px;
    color: #f0f0f0;
    font-size: 1rem;
    font-family: 'Be Vietnam Pro', sans-serif;
    transition: border-color 0.15s ease;
    width: 100%;
  }

  .form-group input:focus {
    border-color: #7c6aff;
  }

  .form-group input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-group input::placeholder {
    color: #606060;
  }

  /* ═══════════════════════════════════════
     REGISTER BUTTON
     ═══════════════════════════════════════ */
  .register-btn {
    width: 100%;
    padding: 12px;
    background: #7c6aff;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    font-family: 'Be Vietnam Pro', sans-serif;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: background 0.15s ease,
                opacity 0.15s ease,
                transform 0.15s ease;
    margin-top: 8px;
  }

  .register-btn:hover {
    background: #6b58f0;
    transform: translateY(-1px);
  }

  .register-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* ═══════════════════════════════════════
     LOGIN LINK
     ═══════════════════════════════════════ */
  .login-link {
    text-align: center;
    margin-top: 24px;
    font-size: 0.875rem;
    color: #606060;
  }

  .login-link a {
    color: #7c6aff;
    font-weight: 500;
    text-decoration: none;
  }

  .login-link a:hover {
    color: #6b58f0;
  }
</style>