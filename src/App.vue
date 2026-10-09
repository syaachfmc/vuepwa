
<script setup>
import { ref, onMounted } from "vue";
import {
  login,
  validateSession,
  logout
} from "./api/auth.js";

const username = ref("");
const password = ref("");
const user = ref(null);
const token = ref(sessionStorage.getItem("authToken") || "");
const loading = ref(false);
const errorMessage = ref("");

async function handleLogin() {
  errorMessage.value = "";
  loading.value = true;

  try {
    const result = await login(
      username.value,
      password.value
    );

    if (!result.success) {
      errorMessage.value = result.message;
      return;
    }

    token.value = result.token;
    user.value = result.user;

    sessionStorage.setItem("authToken", result.token);
  } catch (error) {
    errorMessage.value =
      "Gagal menghubungi server. Coba lagi.";
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function handleLogout() {
  loading.value = true;

  try {
    if (token.value) {
      await logout(token.value);
    }
  } catch (error) {
    console.error("Logout server gagal:", error);
  } finally {
    token.value = "";
    user.value = null;
    password.value = "";

    sessionStorage.removeItem("authToken");
    loading.value = false;
  }
}

onMounted(async () => {
  if (!token.value) return;

  try {
    const result = await validateSession(token.value);

    if (result.success) {
      user.value = result.user;
    } else {
      sessionStorage.removeItem("authToken");
      token.value = "";
    }
  } catch (error) {
    errorMessage.value =
      "Sesi belum bisa diverifikasi. Periksa koneksi.";
    console.error(error);
  }
});
</script>

<template>
  <main class="container">
    <section v-if="!user" class="card">
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

    <section v-else class="card">
      <h1>Dashboard</h1>
      <p>Login berhasil.</p>

      <p><strong>Nama:</strong> {{ user.name }}</p>
      <p><strong>Username:</strong> {{ user.username }}</p>
      <p><strong>Role:</strong> {{ user.role }}</p>

      <button @click="handleLogout" :disabled="loading">
        {{ loading ? "Memproses..." : "Logout" }}
      </button>
    </section>
  </main>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f3f4f6;
  color: #1f2937;
}

.container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
}

.card {
  width: 100%;
  max-width: 400px;
  padding: 28px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 18px #00000012;
}

h1 {
  margin-top: 0;
}

label {
  display: block;
  margin: 16px 0 6px;
}

input {
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