<script setup>
import { ref } from "vue";
import { logout } from "../api/auth.js";
import ShowData from "./ShowData.vue";

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  token: {
    type: String,
    required: true
  }
});

const emit = defineEmits(["logout-success"]);

// State Menu / Tab yang aktif: 'profile' atau 'showdata'
const activeMenu = ref("profile");

const loading = ref(false);
const errorMessage = ref("");

async function handleLogout() {
  loading.value = true;
  errorMessage.value = "";

  try {
    if (props.token) {
      await logout(props.token);
    }
  } catch (error) {
    console.error("Logout server gagal:", error);
  } finally {
    sessionStorage.removeItem("authToken");
    loading.value = false;
    emit("logout-success");
  }
}
</script>

<template>
  <div class="dashboard-layout">
    <!-- Navigation Bar / Menu -->
    <header class="navbar">
      <div class="nav-brand">Dashboard App</div>
      <nav class="nav-menu">
        <button
          :class="['nav-item', { active: activeMenu === 'profile' }]"
          @click="activeMenu = 'profile'"
        >
          Profil User
        </button>
        <button
          :class="['nav-item', { active: activeMenu === 'showdata' }]"
          @click="activeMenu = 'showdata'"
        >
          Show Data
        </button>
      </nav>
      <button
        @click="handleLogout"
        :disabled="loading"
        class="btn-logout"
      >
        {{ loading ? "Memproses..." : "Logout" }}
      </button>
    </header>

    <!-- Content Area berdasarkan Menu Aktif -->
    <main class="content-area">
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <!-- Menu 1: Profile Pengguna -->
      <section v-if="activeMenu === 'profile'" class="profile-card">
        <h1>Profil Pengguna</h1>
        <p>Login berhasil.</p>
        <div class="info-group">
          <p><strong>Nama:</strong> {{ user.name }}</p>
          <p><strong>Username:</strong> {{ user.username }}</p>
          <p><strong>Role:</strong> {{ user.role }}</p>
        </div>
      </section>

      <!-- Menu 2: Komponen ShowData.vue -->
      <ShowData v-else-if="activeMenu === 'showdata'" />
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background-color: #f9fafb;
}

/* Header & Menu Navigasi */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  padding: 12px 28px;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-brand {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.nav-item.active {
  background-color: #2563eb;
  color: #ffffff;
}

/* Tombol Logout */
.btn-logout {
  padding: 8px 16px;
  border: 1px solid #dc2626;
  border-radius: 6px;
  background: transparent;
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-logout:hover {
  background-color: #fee2e2;
}

.btn-logout:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* Area Konten Utama */
.content-area {
  padding: 24px;
}

.profile-card {
  max-width: 600px;
  background: white;
  padding: 28px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
}

.info-group p {
  margin: 8px 0;
  font-size: 16px;
}

.error {
  color: #dc2626;
  margin-bottom: 16px;
}
</style>