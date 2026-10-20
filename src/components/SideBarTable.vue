<template>
    <main class="app-container">
        <!-- Tampilkan Login jika pengguna belum terotentikasi / melakukan relogin -->
        <Login v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

        <!-- Tampilkan DataTable jika pengguna sudah terotentikasi -->
        <DataTable 
            v-else
            :config="config" 
            :tableDateFormat="config.tableDateFormat" 
            @row-selected="handleRowSelected"
            @relogin="handleRelogin" />
    </main>
</template>

<script setup>
import { ref } from 'vue';
import DataTable from './DataTable.vue';
import Login from './Login.vue';

const isLoggedIn = ref(Boolean(sessionStorage.getItem("authToken")));

const selectedData = ref('');
const selectedRowID = ref('');
const selectedDataGSheet = ref('');

const config = ref({
    webAppUrl: 'https://script.google.com/macros/s/AKfycbwvyT0YNOAQLVydiESiBCq-j-kWqQ-95eSnzPI69kkdl8WiOS9fnT-cHbmriUIOgIws/exec',
    gsheetID:  '1QnTPM7t8dgnboekqkwq1su1ycyRS7BbW1uVj83qrtEo',// '1WbBy5Gy1rTn7S66oUqUA4BPFbTKq9Qw9xi_A35xMJJQ',
    sheetName: 'Data',
    columnIDRow: 1,
    columnTitleRow: 2,
    columnTitleDescriptionRow: 3,
    columnTypeRow: 4,
    dataRange: 'B5:BY',
    RowIDColumn: 'A',
    ProjectID: '25-1808',
    ProjectIDColumn: 'B',
    FrozenColumnIndex: [0, 2],
    tableDateFormat: 'dd MMM yy'
});

function handleLoginSuccess() {
    isLoggedIn.value = true;
}

function handleRelogin() {
    sessionStorage.removeItem("authToken");
    isLoggedIn.value = false;
}

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
            columnIDs: JSON.stringify(['1', '5', '8'])
        });

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
            .map(row => [row['1'], row['8'], row['5']].filter(
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

function handleRowSelected(payload) {
    selectedData.value = payload?.value ?? '';
    selectedRowID.value = payload?.rowID ?? '';
    console.log(selectedRowID.value);
    getSelectedDataGSheet(selectedRowID.value);
}
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