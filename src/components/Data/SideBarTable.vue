<template>
    <main class="app-container">
        <!-- Tampilkan Login jika pengguna belum terotentikasi / melakukan relogin -->
        <Login v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

        <!-- Tampilkan DataTable jika pengguna sudah terotentikasi -->
        <DataTable v-else ref="dataTableRef" :config="ShipmentsConfig" :tableDateFormat="ShipmentsConfig.tableDateFormat"
            @row-selected="handleRowSelected" @relogin="handleRelogin" />
    </main>
</template>

<script setup>
import { ref } from 'vue';
import DataTable from './DataTable.vue';
import Login from './../Layouts/Login.vue';
import { ShipmentsConfig } from '../../config/ssrConfig.js';

const isLoggedIn = ref(Boolean(sessionStorage.getItem("authToken")));

const selectedData = ref('');
const selectedRowID = ref('');
const selectedDataGSheet = ref('');

const dataTableRef = ref(null);

function handleLoginSuccess() {
    const authProject = JSON.parse(
        sessionStorage.getItem('authProject') || '{}'
    );

    ShipmentsConfig.value.gsheetID = authProject.ShipmentDataGSheetID || '';
    ShipmentsConfig.value.shipmentNoPrefix = authProject.shipmentNoPrefix || '';

    isLoggedIn.value = true;
}

function handleRelogin() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
    sessionStorage.removeItem("authProject");
    isLoggedIn.value = false;
}


/*TEST AMBIL DATA PER ROW
async function getSelectedDataGSheet(rowID) {
    if (!rowID) {
        selectedDataGSheet.value = '';
        return;
    }

    selectedDataGSheet.value = 'Loading...';

    const token = sessionStorage.getItem("authToken") || "";

    if (!token) {
        selectedDataGSheet.value = 'Error: Token tidak ditemukan, silakan login ulang.';
        return;
    }


    try {
        const params = new URLSearchParams({
            token: token,
            GSheetID: config.value.gsheetID,
            sheetName: config.value.sheetName,
            columnIDRow: String(config.value.columnIDRow),
            columnTitleRow: String(config.value.columnTitleRow),
            columnTitleDescriptionRow: String(config.value.columnTitleDescriptionRow),
            columnTypeRow: String(config.value.columnTypeRow),
            dataRange: config.value.dataRange,
            RowIDColumn: String(config.value.RowIDColumn),
            RowID: String(rowID),
            columnIDs: JSON.stringify(['8']),
        });
        console.log("aparams sidebartable ", params.toString())
        const response = await fetch(
            `${config.value.webAppUrl}?${params.toString()}`
        );



        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();



        if (result.status !== 'success') {
            throw new Error(result.error || 'Gagal mengambil data GAS.');
        }

        selectedDataGSheet.value = (result.data || [])
            .map(row => [row['1'], row['8'], row['8']].filter(
                value => value !== undefined && value !== null && value !== ''
            ).join(' '))
            .join('\r\n');

        if (!selectedDataGSheet.value) {
            selectedDataGSheet.value = 'Data kosong';
        }
    } catch (error) {
        console.error('Error mengambil data GAS kedua: ' + '(' + config.value.dataRange + ')', error);
        selectedDataGSheet.value = `Error: ${error.message}`;
    }
}
*/

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