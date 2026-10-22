
<template>
  <div>
    <Login
      v-if="currentView === 'login'"
      @login-success="handleLoginSuccess"
      @close="handleClose"
    />

    <SSRLayouts
      v-else-if="currentView === 'ssr-layouts'"
      :user="user"
      :token="token"
      @logout-success="handleLogoutSuccess"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import Login from "./components/Login.vue";
import SSRLayouts from "./Layouts/SSRLayouts.vue";

// Pulihkan sesi saat halaman di-refresh
const token = ref(sessionStorage.getItem("authToken") || "");

let savedUser = null;

try {
  savedUser = JSON.parse(
    sessionStorage.getItem("authUser") || "null"
  );
} catch {
  savedUser = null;
}

const user = ref(savedUser);

// Tentukan tampilan awal
const currentView = ref(
  token.value && user.value ? "ssr-layouts" : "login"
);

// Login berhasil
function handleLoginSuccess(data) {
  token.value = data.token;
  user.value = data.user;

  sessionStorage.setItem("authToken", data.token);
  sessionStorage.setItem("authUser", JSON.stringify(data.user));

  console.log("Login sukses");

  currentView.value = "ssr-layouts";
}

// Logout berhasil
function handleLogoutSuccess() {
  token.value = "";
  user.value = null;

  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("authUser");

  currentView.value = "login";
}

// Login ditutup
function handleClose() {
  currentView.value = "home";
}
</script>

<style>
body {
  margin: 0;
}

.myParents {
  background: grey;
}
</style>
