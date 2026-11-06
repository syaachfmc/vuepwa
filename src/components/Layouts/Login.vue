<script setup>
import { ref, onMounted } from "vue";
import { login, validateSession, getProjectList } from "../../api/auth.js";
import { config } from "../../config/ssrConfig.js";
import { APP_COLORS } from '../../constants/colors.js'

const emit = defineEmits(["login-success", "close"]);

// State Otentikasi & Aplikasi
const token = ref(sessionStorage.getItem("authToken") || "");
const user = ref(null);

// Jika tidak ada token sejak awal, set false secara synchronous agar form langsung tampil
const checkingSession = ref(!!token.value);

// State Form & Loading
const username = ref("");
const password = ref("");
const projectCode = ref("");
const loading = ref(false);
const errorMessage = ref("");
const projectError = ref("");

// State Dinamis Opsi Project
const projectOptions = ref([]);
const loadingProjects = ref(true);

// --- Handlers ---

function handleClose() {
  emit("close");
}

function saveAuthProject(projectCode) {
  const project = projectOptions.value.find(
    item => String(item.projectID).trim() === String(projectCode || '').trim()
  );

  if (!project) {
    console.error("Project tidak ditemukan:", projectCode);
    return;
  }

  const authProject = {
    projectID: project.projectID,
    projectName: project.projectName,
    shipmentNoPrefix: project.shipmentNoPrefix,
    regEx: project.regEx,
    prop1: project.prop1,
    prop2: project.prop2,
    prop3: project.prop3,

  };

  sessionStorage.setItem("authProject", JSON.stringify(authProject));
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
    sessionStorage.setItem("authUser", JSON.stringify(result.user));
    saveAuthProject(result.user.projectCode);

    token.value = result.token;
    user.value = result.user;

    // Set ProjectID di config secara dinamis saat Login Berhasil
    if (result.user && result.user.projectCode) {
      config.value.ProjectID = result.user.projectCode;
    }

    username.value = "";
    password.value = "";
    projectCode.value = "";

    emit("login-success", { token: result.token, user: result.user, projectOptions: projectOptions.value });
  } catch (error) {
    console.error(error);
    errorMessage.value = "Gagal menghubungi server.";
  } finally {
    loading.value = false;
  }
}

// Fungsi internal untuk memuat daftar project
async function fetchProjects() {
  try {
    loadingProjects.value = true;
    projectError.value = "";

    const projectRes = await getProjectList();

    if (projectRes.success && Array.isArray(projectRes.data)) {
      projectOptions.value = projectRes.data;

      if (projectOptions.value.length === 0) {
        projectError.value = "Daftar project kosong.";
      }
    } else {
      projectError.value =
        projectRes.message || "Gagal memuat daftar project.";
    }
  } catch (error) {
    console.error("Gagal mengambil daftar project:", error);
    projectError.value =
      "Koneksi gagal. Tidak dapat mengambil daftar project.";
  } finally {
    loadingProjects.value = false;
  }
}


onMounted(async () => {
  // 1. Jalankan pemanggilan daftar project secara independen (non-blocking)
  const projectsPromise = fetchProjects();

  // 2. Jika token TIDAK ada, langsung keluar (UI form login sudah aktif)
  if (!token.value) {
    return;
  }

  // 3. Hanya jika token ADA, lakukan validasi sesi di background/loading state
  try {
    const result = await validateSession(token.value);

    if (result.success) {
      user.value = result.user;
      sessionStorage.setItem("authUser", JSON.stringify(result.user));

      if (result.user && result.user.projectCode) {
        config.value.ProjectID = result.user.projectCode;
        await projectsPromise;
        saveAuthProject(result.user.projectCode);
      }

      emit("login-success", { token: token.value, user: result.user, projectOptions: projectOptions.value });
    } else {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("authUser");
      sessionStorage.removeItem("authProject");
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
 

      <h1>Login</h1>
      <p>Masukkan akun dan pilih Project Code.</p>

      <form @submit.prevent="handleLogin">
        <!-- Input Username -->
        <label for="username">Username</label>
        <input id="username" v-model.trim="username" autocomplete="username" required />

        <!-- Input Password -->
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required />

        <!-- Dropdown Project Code Dinamis -->
        <label for="projectCode">Project Code</label>

        <select id="projectCode" v-model="projectCode" :disabled="loadingProjects || projectOptions.length === 0"
          required>
          <option value="" disabled>
            {{ loadingProjects
              ? "Memuat daftar project..."
              : "-- Pilih Project Code --"
            }}
          </option>

          <option v-for="proj in projectOptions" :key="proj.projectID" :value="proj.projectID">
            {{ proj.projectID }}{{ proj.projectName ? ` - ${proj.projectName}` : '' }}
          </option>
        </select>

        <!-- Project Error -->
        <div v-if="projectError" class="project-error">
          <p>{{ projectError }}</p>

          <button type="button" class="retry-btn" :disabled="loadingProjects" @click="fetchProjects">
            {{ loadingProjects ? "Mencoba kembali..." : "↻ Retry" }}
          </button>
        </div>


        <p v-if="errorMessage" class="error">
          {{ errorMessage }}
        </p>

        <button type="submit" class="submit-btn" :disabled="loading || loadingProjects || projectOptions.length === 0">
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
  background: rgba(255, 255, 255, 0.4);
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
  background: v-bind('APP_COLORS.bgPrimaryGrad');

  /* Shadow */
  box-shadow:
    0 12px 25px rgba(0, 0, 0, 0.25),
    0 4px 10px rgba(0, 0, 0, 0.15);
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

.project-error {
  margin-top: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 13px;
}

.project-error p {
  margin: 0 0 8px;
}

.retry-btn {
  padding: 6px 12px;
  border: 1px solid #dc2626;
  border-radius: 5px;
  background: white;
  color: #dc2626;
  font-size: 13px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #fee2e2;
}

.retry-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}
</style>