<script setup>
  import { ref, computed, onBeforeMount, onMounted } from 'vue';
  import { storeToRefs } from 'pinia';
  import { Notyf } from 'notyf';
  import 'notyf/notyf.min.css';

  import { useRouter } from 'vue-router';
  import { useGlobalStore } from '../stores/global';
  import api from '../api.js';

  const router = useRouter();
  const globalStore = useGlobalStore();
  const { user } = storeToRefs(globalStore);

  const email = ref("");
  const password = ref("");

  let notyf = null;
  onMounted(() => {
    notyf = new Notyf();
  });

  const canSubmit = computed(() => {
    return email.value.trim() !== "" && password.value !== "";
  });

  async function handleSubmit() {
    if (!canSubmit.value) return;

    try {
      const response = await api.post('/users/login', {
        email: email.value,
        password: password.value
      });

      if (response.status === 200) {
        notyf?.success("Login Successful");

        // Store token in localStorage
        const token = response.data?.access || response.data?.token;
        if (token) {
          localStorage.setItem('token', token);
        }

        let userData = response.data?.user || response.data;

        // If the login payload doesn't contain user flags (like isAdmin), fetch user details
        if (userData.isAdmin === undefined) {
          try {
            const userDetailsRes = await api.get('/users/details');
            userData = userDetailsRes.data?.user || userDetailsRes.data;
          } catch (err) {
            console.error("Could not fetch user details", err);
          }
        }

        // Update global store state
        if (globalStore.setUser) {
          globalStore.setUser(userData);
        } else {
          user.value = userData;
        }

        // Role-based redirection logic
        if (userData?.isAdmin) {
          router.push({ name: 'Dashboard' });
        } else {
          router.push({ path: '/profile' });
        }
      } else {
        notyf?.error("Login Failed. Please check your credentials.");
      }
    } catch (e) {
      if (e?.response && [400, 401, 404].includes(e.response.status)) {
        notyf?.error(e.response.data.message || "Invalid email or password.");
      } else {
        console.error(e);
        notyf?.error("Login Failed. Please contact admin.");
      }
    }
  }

  onBeforeMount(() => {
    if (user.value?.token) {
      if (user.value?.isAdmin) {
        router.push({ name: 'Dashboard' });
      } else {
        router.push({ path: '/profile' });
      }
    }
  });
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <a class="navbar-brand" href="#">
          <img src="/logo-main.png" alt="logo">
        </a>
        <p class="login-subtitle">Welcome back! Log in to access your K-Reviewers account.</p>
      </div>
      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="you@example.com"
            required
          >
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            v-model="password"
            placeholder="Enter your password"
            required
          >
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="!canSubmit">
          Log In
        </button>
        <p class="register-redirect">
          Don't have an account?
          <router-link :to="{ name: 'Register' }">Sign up</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Shanti&family=Shalimar&display=swap');

  .login-page {
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(24px, 5vw, 48px) 16px;
    background-color: #D9FFF4;
  }
  .login-card {
    width: 100%;
    max-width: 440px;
    background-color: white;
    border-radius: 16px;
    padding: clamp(28px, 5vw, 48px);
    box-shadow: 0 12px 32px rgba(50, 30, 72, 0.16);
  }
  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }
  .navbar-brand {
    display: inline-flex;
    align-items: center;
    font-size: 20px;
    text-decoration: none;
  }
  .navbar-brand img {
    height: 44px;
  }
  .login-subtitle {
    font-family: 'Shanti', sans-serif;
    font-size: 14px;
    color: #43637E;
    margin-top: 12px;
  }
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-group label {
    font-family: 'Shanti', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #321E48;
  }
  .form-group input[type="email"],
  .form-group input[type="password"] {
    font-family: 'Shanti', sans-serif;
    font-size: 15px;
    padding: 12px 14px;
    border: 1px solid #ccc;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .form-group input[type="email"]:focus,
  .form-group input[type="password"]:focus {
    border-color: #65DCD5;
  }
  .btn {
    font-family: 'Shanti', sans-serif;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    padding: 14px 28px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.15s ease;
  }
  .btn-primary {
    background-color: #321E48;
    color: white;
  }
  .btn-primary:hover:not(:disabled) {
    background-color: #43637E;
    transform: translateY(-2px);
  }
  .btn-primary:disabled {
    background-color: #b8aec4;
    cursor: not-allowed;
  }
  .btn-block {
    width: 100%;
  }
  .register-redirect {
    text-align: center;
    font-family: 'Shanti', sans-serif;
    font-size: 14px;
    color: #43637E;
    margin: 4px 0 0 0;
  }
  .register-redirect a {
    color: #321E48;
    font-weight: 700;
    text-decoration: none;
  }
  .register-redirect a:hover {
    text-decoration: underline;
  }
  @media (max-width: 480px) {
    .login-card {
      padding: 28px 20px;
    }
  }
</style>