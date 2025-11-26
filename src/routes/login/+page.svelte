<script lang="ts">
  import { goto } from "$app/navigation";
  import { login, isAuthenticated } from "$lib/auth";
  import { onMount } from "svelte";

  let username = "";
  let password = "";
  let error = "";
  let loading = false;

  // Redirect if already authenticated
  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe((authenticated) => {
      if (authenticated) {
        goto("/");
      }
    });

    return unsubscribe;
  });

  async function handleLogin() {
    error = "";
    loading = true;

    try {
      await login(username, password);
      // User will be redirected by the onMount handler
    } catch (err) {
      error = err instanceof Error ? err.message : "Login failed. Please try again.";
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter") {
      handleLogin();
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <h1>VibeForge</h1>
      <p>AI-Powered Creative Workbench</p>
    </div>

    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          bind:value={username}
          placeholder="Enter username"
          disabled={loading}
          on:keypress={handleKeyPress}
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Enter password"
          disabled={loading}
          on:keypress={handleKeyPress}
          required
        />
      </div>

      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}

      <button type="submit" class="login-button" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>

    <div class="login-footer">
      <p class="dev-note">
        Development Mode: Any non-empty username/password will work
      </p>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
  }

  .login-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 2.5rem;
    width: 100%;
    max-width: 420px;
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 0.5rem 0;
  }

  .login-header p {
    font-size: 0.95rem;
    color: #718096;
    margin: 0;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  input:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
  }

  .error-message {
    background-color: #fff5f5;
    color: #c53030;
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    border: 1px solid #feb2b2;
  }

  .login-button {
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .login-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .login-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .login-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .login-footer {
    margin-top: 1.5rem;
    text-align: center;
  }

  .dev-note {
    font-size: 0.8rem;
    color: #a0aec0;
    background-color: #f7fafc;
    padding: 0.5rem;
    border-radius: 6px;
    margin: 0;
  }
</style>
