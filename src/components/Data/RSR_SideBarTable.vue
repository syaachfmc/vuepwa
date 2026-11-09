<template>
    <main class="app-container">
        <!-- Tampilkan Login jika pengguna belum terotentikasi / melakukan relogin -->
        <Login v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

        <!-- Tampilkan DataTable jika pengguna sudah terotentikasi -->
        <DataTable v-else ref="dataTableRef" :config="RSRConfig" :tableDateFormat="RSRConfig.tableDateFormat"
            @row-selected="handleRowSelected" @relogin="handleRelogin" />
    </main>
</template>

<script setup>
import { ref } from 'vue';
import DataTable from './RSR_DataTable.vue';
import Login from './../Layouts/Login.vue';
import { RSRConfig } from '../../config/ssrConfig.js';

const isLoggedIn = ref(Boolean(sessionStorage.getItem("authToken")));

const selectedData = ref('');
const selectedRowID = ref('');
const selectedDataGSheet = ref('');

const dataTableRef = ref(null);

function handleLoginSuccess() {
    const authProject = JSON.parse(
        sessionStorage.getItem('authProject') || '{}'
    );

    RSRConfig.value.gsheetID = authProject.ShipmentDataGSheetID || '';
    RSRConfig.value.shipmentNoPrefix = authProject.shipmentNoPrefix || '';

    isLoggedIn.value = true;
}

function handleRelogin() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
    sessionStorage.removeItem("authProject");
    isLoggedIn.value = false;
}

async function handleRowSelected(payload) {
    selectedData.value = payload?.value ?? '';
    selectedRowID.value = payload?.rowID ?? '';
}

async function addAndSelectRow(rowID, mainIDColumnID, newMainIDValue) {
    if (!dataTableRef.value) {
        throw new Error('DataTable belum siap.');
    }

    return dataTableRef.value.addAndSelectRow(rowID, mainIDColumnID, newMainIDValue);
}

defineExpose({
    addAndSelectRow
});
</script>

<style scoped>
.app-container {
    display: flex;
    flex-direction: column;
    padding: 0;
    margin: 0;
    height: 100%;
    width: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

h1 {
    margin-bottom: 0.5rem;
    color: #333;
}

.selected-info {
    margin-bottom: 0.75rem;
    font-size: 1rem;
    color: #555;
    background-color: #f8f9fa;
    padding: 8px 12px;
    border-left: 4px solid #1a73e8;
    border-radius: 4px;
}

.selected-info strong {
    color: #1a73e8;
}

.multiline-data {
    display: block;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}
</style>