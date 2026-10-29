<script setup>
import { ref, onMounted } from "vue";
import { login, validateSession, getProjectList } from "../../api/auth.js";
import { config } from "../../config/ssrConfig.js";

const emit = defineEmits(["login-success", "close"]);

// State Otentikasi & Aplikasi
const token = ref(sessionStorage.getItem("authToken") || "");
const user = ref(null);
const checkingSession = ref(true);

// State Form & Loading
const username = ref("");
const password = ref("");
const projectCode = ref("");
const loading = ref(false);
const errorMessage = ref("");

// State Dinamis Opsi Project
const projectOptions = ref([]);
const loadingProjects = ref(true);

// --- Handlers ---

function handleClose() {
  emit("close");
}

async function handleLogin() {
  errorMessage.value = "";

  if (!projectCode.value) {
    errorMessage.value = "Silakan pilih Project Code.";
    return;
  }

  loading.value = true;

  try {
    const result = await login(username.value, password.value, projectCode.value);

    if (!result.success) {
      errorMessage.value = result.message || "Login gagal.";
      return;
    }

    sessionStorage.setItem("authToken", result.token);
    token.value = result.token;
    user.value = result.user;

    // Set ProjectID di config secara dinamis saat Login Berhasil
    if (result.user && result.user.projectCode) {
      config.value.ProjectID = result.user.projectCode;
    }

    username.value = "";
    password.value = "";
    projectCode.value = "";

    emit("login-success", { token: result.token, user: result.user });
  } catch (error) {
    console.error(error);
    errorMessage.value = "Gagal menghubungi server.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  // 1. Ambil daftar project dari GAS
  try {
    loadingProjects.value = true;
    const projectRes = await getProjectList();
    
    if (projectRes.success && Array.isArray(projectRes.data)) {
      projectOptions.value = projectRes.data;
    } else {
      console.warn("Daftar project gagal dimuat:", projectRes.message);
    }
  } catch (error) {
    console.error("Gagal mengambil daftar project:", error);
  } finally {
    loadingProjects.value = false;
  }

  // 2. Validasi sesi aktif jika token tersedia
  if (!token.value) {
    checkingSession.value = false;
    return;
  }

  try {
    const result = await validateSession(token.value);

    if (result.success) {
      user.value = result.user;

      // Set ProjectID di config saat pemulihan/validasi Sesi
      if (result.user && result.user.projectCode) {
        config.value.ProjectID = result.user.projectCode;
      }

      emit("login-success", { token: token.value, user: result.user });
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
  <div class="modal-overlay" @click.self="handleClose">
    <p v-if="checkingSession" class="status-message">Memeriksa sesi...</p>

    <div v-else class="card">
      <!-- Tombol Close (X) -->
      <button type="button" class="close-btn" @click="handleClose" aria-label="Tutup">
        &times;
      </button>

      <h1>Login</h1>
      <p>Masukkan akun dan pilih Project Code.</p>

      <form @submit.prevent="handleLogin">
        <!-- Input Username -->
        <label for="username">Username</label>
        <input
          id="username"
          v-model.trim="username"
          autocomplete="username"
          required
        />

        <!-- Input Password -->
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />

        <!-- Dropdown Project Code Dinamis -->
        <label for="projectCode">Project Code</label>
        <select id="projectCode" v-model="projectCode" :disabled="loadingProjects" required>
          <option value="" disabled>
            {{ loadingProjects ? "Memuat daftar project..." : "-- Pilih Project Code --" }}
          </option>
          <option 
            v-for="proj in projectOptions" 
            :key="proj.code" 
            :value="proj.code"
          >
            {{ proj.code }}{{ proj.name ? ` - ${proj.name}` : '' }}
          </option>
        </select>

        <p v-if="errorMessage" class="error">
          {{ errorMessage }}
        </p>

        <button type="submit" class="submit-btn" :disabled="loading || loadingProjects">
          {{ loading ? "Memproses..." : "Login" }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
select {
  box-sizing: border-box;
  width: 100%;
  padding: 11px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  background-color: white;
  cursor: pointer;
}

select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.status-message {
  padding: 20px;
  text-align: center;
  background: white;
  border-radius: 8px;
  font-weight: 500;
}

.card {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 28px;
  border-radius: 12px;
  box-sizing: border-box;
  background: var(--color-bgPrimaryGrad, #ffffff);
  box-shadow: 10px 12px 14px 0px var(--color-shadowColorNormal, rgba(0,0,0,0.2));
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.close-btn:hover {
  color: #111827;
  background: #f3f4f6;
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

.submit-btn {
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

.submit-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.error {
  color: #dc2626;
  margin-top: 10px;
}
</style>