<script setup>
import { ref, onMounted } from "vue";
import { login, validateSession } from "../api/auth.js";
import Dashboard from "./Dashboard.vue";

// State Otentikasi & Aplikasi
const token = ref(sessionStorage.getItem("authToken") || "");
const user = ref(null);
const checkingSession = ref(true);

// State Form & Loading
const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

// --- Handlers / Akses API ---

async function handleLogin() {
  errorMessage.value = "";
  loading.value = true;

  try {
    const result = await login(username.value, password.value);

    if (!result.success) {
      errorMessage.value = result.message || "Login gagal.";
      return;
    }

    // Simpan token ke sessionStorage dan update state
    sessionStorage.setItem("authToken", result.token);
    token.value = result.token;
    user.value = result.user;

    // Reset form
    username.value = "";
    password.value = "";
  } catch (error) {
    console.error(error);
    errorMessage.value = "Gagal menghubungi server.";
  } finally {
    loading.value = false;
  }
}

function handleLogoutSuccess() {
  token.value = "";
  user.value = null;
}

// Cek sesi otomatis saat komponen dipasang
onMounted(async () => {
  if (!token.value) {
    checkingSession.value = false;
    return;
  }

  try {
    const result = await validateSession(token.value);

    if (result.success) {
      user.value = result.user;
    } else {
      sessionStorage.removeItem("authToken");
      token.value = "";
    }
  } catch (error) {
    errorMessage.value = "Sesi belum bisa diverifikasi.";
    console.error(error);
  } finally {
    checkingSession.value = false;
  }
});
</script>

<template>
  <!-- 1. Kondisi Memeriksa Sesi -->
  <p v-if="checkingSession" class="status-message">Memeriksa sesi...</p>

  <!-- 2. Form Login (jika belum login/user null) -->
  <main v-else-if="!user" class="container">
    <section class="card">
      <h1>Login</h1>
      <p>Masukkan username dan password.</p>

      <form @submit.prevent="handleLogin">
        <label for="username">Username</label>
        <input
          id="username"
          v-model.trim="username"
          autocomplete="username"
          required
        />

        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />

        <p v-if="errorMessage" class="error">
          {{ errorMessage }}
        </p>

        <button type="submit" :disabled="loading">
          {{ loading ? "Memproses..." : "Login" }}
        </button>
      </form>
    </section>
  </main>

  <!-- 3. Tampilkan Dashboard.vue jika user sudah terverifikasi -->
  <Dashboard
    v-else
    :user="user"
    :token="token"
    @logout-success="handleLogoutSuccess"
  />
</template>

<style scoped>
.status-message {
  padding: 20px;
  text-align: center;
}

/* Style Form Login */
.container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #f3f4f6;
  box-sizing: border-box;
}

.card {
  width: 100%;
  max-width: 400px;
  padding: 28px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 18px #00000012;
  box-sizing: border-box;
}

h1 {
  margin-top: 0;
}

label {
  display: block;
  margin: 16px 0 6px;
}

input {
  box-sizing: border-box;
  width: 100%;
  padding: 11px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
}

button {
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.error {
  color: #dc2626;
}
</style>