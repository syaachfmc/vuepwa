<template>
    <div class="data-table-container">
        <!-- Toolbar Table -->
        <div class="table-toolbar">
            <div class="table-info">
                <span>Total Data: <strong>{{ totalRows }}</strong></span>
                <span>Total Kolom: <strong>{{ totalColumns }}</strong></span>
                <span v-if="lastUpdated">
                    Update: <strong>{{ lastUpdated }}</strong>
                </span>
            </div>

            <div class="table-actions">
                <input v-model="searchText" type="text" class="table-search" placeholder="Cari data..."
                    :disabled="loading || sheetData.status !== 'success'" />

                <button type="button" class="filter-button" @click="toggleFilters">
                    {{ showFilters ? '✖ Hide Filter' : '🔍 Show Filter' }}
                </button>

                <button type="button" class="filter-button" @click="clearAllFilters">
                    🧹 Clear Filter
                </button>

                <button type="button" class="filter-button" :class="{ 'wrap-active': wrapText }" @click="toggleWrap">
                    {{ wrapText ? '↕ Wrap: ON' : '↔ Wrap: OFF' }}
                </button>

                <button type="button" class="refresh-button" :disabled="loading" @click="loadData">
                    {{ loading ? 'Memuat...' : 'Refresh' }}
                </button>
            </div>
        </div>

        <!-- Status Loading -->
        <div v-if="loading" class="loading">
            Memuat data Google Sheet...
        </div>

        <!-- Status Error -->
        <div v-else-if="sheetData.status === 'error'" class="error">
            <strong>Gagal memuat data</strong>
            <p>{{ sheetData.error }}</p>

            <button type="button" class="refresh-button" @click="loadData">
                Coba Lagi
            </button>
        </div>

        <!-- Status Empty -->
        <div v-else-if="sheetData.status === 'success' && totalRows === 0" class="empty-state">
            Tidak ada data untuk ditampilkan.
        </div>

        <!-- Container Tabulator -->
        <div v-show="sheetData.status === 'success' && totalRows > 0" class="table-wrapper">
            <div ref="tableElement" class="data-table"></div>
        </div>
    </div>
</template>

<script setup>
import {
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
    watch,
    nextTick
} from 'vue';

import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { fetchGSheetData } from './DataTable.js';
import { APP_COLORS } from '../constants/colors.js';

// ==========================================
// Props & Reaktivitas Utama
// ==========================================
const props = defineProps({
    config: {
        type: Object,
        required: true
    },
    // Format tampilan untuk kolom dengan columnTypes = 'date'.
    // Kosong berarti mempertahankan format asli dari sumber data.
    tableDateFormat: {
        type: String,
        default: ''
    }
});

const loading = ref(false);
const searchText = ref('');
const lastUpdated = ref('');
const tableElement = ref(null);
const showFilters = ref(false);

// Default Wrap: OFF
const wrapText = ref(false);

const sheetData = ref({
    status: 'loading',
    error: null,
    columnIDs: [],
    columnTitles: [],
    columnDescriptions: [],
    columnTypes: [],
    data: []
});

// Instance Tabulator & Pengontrol Request Async
let table = null;
let requestSequence = 0;

// Computed Properties
const totalRows = computed(() => sheetData.value.data.length);
const totalColumns = computed(() => sheetData.value.columnTitles.length);

// ==========================================
// Method Interaksi UI
// ==========================================

/**
 * Mengubah mode pembungkusan teks (Wrap ON / Wrap OFF).
 */
function toggleWrap() {
    wrapText.value = !wrapText.value;

    if (table) {
        // Perbarui formatter agar class wrap langsung berubah
        table.getRows().forEach(row => row.reformat());
        table.redraw(true);
    }
}

/**
 * Menampilkan atau menyembunyikan input filter header per kolom.
 * Saat filter disembunyikan, filter kolom dibersihkan.
 * Pencarian global tetap dipertahankan.
 */
async function toggleFilters() {
    showFilters.value = !showFilters.value;

    if (!table || sheetData.value.status !== 'success') {
        return;
    }

    try {
        const columns = buildColumns(sheetData.value);
        await table.setColumns(columns);

        if (!showFilters.value) {
            // Hapus filter kolom saat header filter disembunyikan
            table.clearFilter(true);
        }

        // Terapkan kembali pencarian global jika ada
        applySearch();
    } catch (error) {
        console.error('Gagal memperbarui filter kolom:', error);
    }
}

/**
 * Menghapus teks pencarian global dan seluruh filter aktif di tabel.
 */
function clearAllFilters() {
    searchText.value = '';

    if (!table) return;

    table.clearFilter(true);
}

// ==========================================
// Helper Generator Konfigurasi Tabulator
// ==========================================

/**
 * Mengubah metadata kolom hasil Fetch menjadi skema kolom Tabulator.
 * @param {Object} result Data Sheet dari API
 * @returns {Array} List konfigurasi kolom Tabulator
 */
function buildColumns(result) {
    return result.columnTitles.map((title, index) => {
        const columnID = result.columnIDs[index] || `col_${index + 1}`;
        const description = result.columnDescriptions[index] || '';
        const type = String(result.columnTypes[index] || 'string').trim().toLowerCase();

        const column = {
            title: String(title || columnID),
            field: columnID,
            headerTooltip: description || String(title || columnID),
            headerFilter: showFilters.value ? 'input' : false,
            headerFilterPlaceholder: '',
            headerFilterFunc: 'like',
            headerSort: true,
            sorter: isDateColumn(result, index, type)
                ? sortDateValues
                : getSorter(type),
            headerHozAlign: 'center',
            maxWidth: 300,
            widthGrow: 0,
            tooltip: true,
            headerWordWrap: true,
            formatter: function (cell) {
                const value = cell.getValue() ?? '';
                const displayValue = type === 'date'
                    ? formatDateValue(value, props.tableDateFormat)
                    : value;

                const div = document.createElement('div');
                div.className = 'cell-scroll';
                div.textContent = String(displayValue);

                // Menerapkan class CSS sesuai state wrapText
                div.classList.toggle('wrap-text', wrapText.value);
                div.classList.toggle('nowrap-text', !wrapText.value);

                return div;
            }
        };

        // Konfigurasi khusus untuk kolom bertipe 'link'
        if (type === 'link') {
            column.hozAlign = 'center';
            column.width = 70;
            column.minWidth = 70;
            column.widthGrow = 0;
            column.headerSort = false;
            column.headerFilter = false;

            column.formatter = function (cell) {
                const url = String(cell.getValue() ?? '').trim();

                if (!url) return '';

                // Validasi protokol URL (hanya HTTP/HTTPS)
                try {
                    const parsedURL = new URL(url);
                    if (!['http:', 'https:'].includes(parsedURL.protocol)) {
                        return '';
                    }
                } catch {
                    return '';
                }

                // Sanitasi karakter HTML spesial
                const safeURL = url
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                return `
                    <a
                        href="${safeURL}"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka link"
                        style="text-decoration:none;font-size:18px;"
                    >📁</a>
                `;
            };
        }

        return column;
    });
}

/**
 * Menentukan tipe pengurutan (sorter) Tabulator berdasarkan tipe data kolom.
 * @param {string} type Tipe data kolom
 * @returns {string} Nama sorter Tabulator
 */
function getSorter(type) {
    const numericTypes = ['number', 'numeric', 'integer', 'float', 'decimal', 'currency'];

    if (numericTypes.includes(type)) {
        return 'number';
    }

    return 'string';
}

/**
 * Mendeteksi kolom tanggal berdasarkan metadata atau isi datanya.
 * Mendukung format seperti: 02 Dec 25.
 */
function isDateColumn(result, index, type) {
    if (['date', 'datetime'].includes(type)) return true;

    const values = (result.data || [])
        .map(row => row[index])
        .filter(value => value !== null && value !== undefined && String(value).trim() !== '');

    if (!values.length) return false;

    // Deteksi jika seluruh nilai non-kosong mengikuti format dd MMM yy/yyyy.
    return values.every(value => parseDateValue(value) !== null);
}

/** Mengubah tanggal seperti "02 Dec 25" menjadi timestamp untuk sorting. */
function parseDateValue(value) {
    if (value === null || value === undefined) return null;

    const text = String(value).trim();
    const match = text.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2}|\d{4})$/);

    // Format tanggal lain (misalnya ISO yyyy-mm-dd) sebagai fallback.
    if (!match) {
        const timestamp = Date.parse(text);
        return Number.isNaN(timestamp) ? null : timestamp;
    }

    const day = Number(match[1]);
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = monthNames.indexOf(match[2].toLowerCase());
    let year = Number(match[3]);

    if (month < 0) return null;
    if (match[3].length === 2) year += year >= 50 ? 1900 : 2000;

    const date = new Date(year, month, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
    ) return null;

    return date.getTime();
}

/**
 * Memformat tampilan tanggal sesuai token tableDateFormat.
 * Token yang didukung: d, dd, M, MM, MMM, MMMM, yy, yyyy.
 * Contoh: dd MMM yy -> 02 Dec 25; dd/MM/yyyy -> 02/12/2025.
 * Nilai asli tidak diubah sehingga sorting tanggal tetap bekerja.
 */
function formatDateValue(value, format) {
    if (value === null || value === undefined || String(value).trim() === '') {
        return value ?? '';
    }

    if (!format || !String(format).trim()) return value;

    const timestamp = parseDateValue(value);
    if (timestamp === null) return value;

    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const tokens = {
        yyyy: String(year),
        yy: String(year).slice(-2),
        MMMM: longMonths[month - 1],
        MMM: shortMonths[month - 1],
        MM: String(month).padStart(2, '0'),
        M: String(month),
        dd: String(day).padStart(2, '0'),
        d: String(day)
    };

    return String(format).replace(
        /yyyy|MMMM|MMM|MM|M|dd|d|yy/g,
        token => tokens[token]
    );
}

/** Sorter tanggal Tabulator, bukan sorter alfabetis. */
function sortDateValues(a, b) {
    const dateA = parseDateValue(a);
    const dateB = parseDateValue(b);

    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;

    return dateA - dateB;
}

/**
 * Mengubah array 2D dari Google Sheet menjadi Array of Objects untuk Tabulator.
 * @param {Object} result Data Sheet dari API
 * @returns {Array<Object>}
 */
function buildTableData(result) {
    return result.data
        .filter(row =>
            row.some(value => {
                if (value === null || value === undefined) return false;

                const text = String(value)
                    .replace(/[\s\u00A0\u200B\uFEFF]/g, '')
                    .trim();

                // Mengabaikan baris kosong dan baris yang hanya bernilai 'FALSE'
                return text !== '' && text.toUpperCase() !== 'FALSE';
            })
        )
        .map((row, rowIndex) => {
            const record = {
                __rowIndex: rowIndex
            };

            result.columnIDs.forEach((columnID, columnIndex) => {
                const value = row[columnIndex] ?? '';

                // Mengubah string 'FALSE' menjadi string kosong
                record[columnID] = String(value).trim().toUpperCase() === 'FALSE'
                    ? ''
                    : value;
            });

            return record;
        });
}

// ==========================================
// Render & Integrasi Tabulator
// ==========================================

/**
 * Menginisialisasi baru atau memperbarui data pada tabel Tabulator.
 */
async function renderTable() {
    await nextTick();

    if (!tableElement.value || sheetData.value.status !== 'success') {
        return;
    }

    if (totalRows.value === 0 || totalColumns.value === 0) {
        destroyTable();
        return;
    }

    const columns = buildColumns(sheetData.value);
    const data = buildTableData(sheetData.value);

    if (!table) {
        table = new Tabulator(tableElement.value, {
            data,
            columns,
            layout: 'fitDataStretch',
            height: '600px',
            index: '__rowIndex',
            placeholder: 'Tidak ada data',
            movableColumns: true,
            resizableColumnFit: true,
            columnDefaults: {
                headerSort: true,
                resizable: true
            },
            pagination: false,
            locale: 'id-id',
            langs: {
                'id-id': {
                    pagination: {
                        page_size: 'Baris',
                        first: 'Pertama',
                        first_title: 'Halaman pertama',
                        last: 'Terakhir',
                        last_title: 'Halaman terakhir',
                        prev: 'Sebelumnya',
                        prev_title: 'Halaman sebelumnya',
                        next: 'Berikutnya',
                        next_title: 'Halaman berikutnya',
                        all: 'Semua',
                        counter: {
                            showing: 'Menampilkan',
                            of: 'dari',
                            rows: 'baris',
                            pages: 'halaman'
                        }
                    }
                }
            }
        });

        table.on('tableBuilt', () => {
            applySearch();
        });
    } else {
        await table.setColumns(columns);
        await table.replaceData(data);
        applySearch();
    }
}

/**
 * Menjalankan filter pencarian global di seluruh kolom.
 */
function applySearch() {
    if (!table) return;

    const keyword = searchText.value.trim().toLowerCase();

    if (!keyword) {
        table.clearFilter(false);
        return;
    }

    table.setFilter(data => {
        return sheetData.value.columnIDs.some(columnID => {
            const value = data[columnID];
            return String(value ?? '').toLowerCase().includes(keyword);
        });
    });
}

// ==========================================
// Fetching Data API
// ==========================================

/**
 * Mengambil data terbaru dari Google Apps Script Web App.
 */
async function loadData() {
    const currentRequest = ++requestSequence;
    loading.value = true;

    try {
        const config = props.config;

        const result = await fetchGSheetData(
            config.webAppUrl,
            config.gsheetID,
            config.sheetName,
            config.columnIDRow ?? 1,
            config.columnTitleRow ?? 2,
            config.columnTitleDescriptionRow ?? 3,
            config.columnTypeRow ?? 4,
            config.dataRange ?? 'A5:Z'
        );

        // Abaikan hasil jika ada request yang lebih baru
        if (currentRequest !== requestSequence) return;

        if (result.status !== 'success') {
            sheetData.value = {
                status: 'error',
                error: result.error || 'Terjadi kesalahan saat mengambil data.',
                columnIDs: [],
                columnTitles: [],
                columnDescriptions: [],
                columnTypes: [],
                data: []
            };

            destroyTable();
            return;
        }

        sheetData.value = result;
        lastUpdated.value = new Date().toLocaleString('id-ID');

        await renderTable();
    } catch (error) {
        if (currentRequest !== requestSequence) return;

        sheetData.value = {
            status: 'error',
            error: error.message || String(error),
            columnIDs: [],
            columnTitles: [],
            columnDescriptions: [],
            columnTypes: [],
            data: []
        };

        destroyTable();
    } finally {
        if (currentRequest === requestSequence) {
            loading.value = false;
        }
    }
}

/**
 * Membersihkan instance Tabulator dari DOM.
 */
function destroyTable() {
    if (table) {
        table.destroy();
        table = null;
    }
}

// ==========================================
// Watcher & Lifecycle Hooks
// ==========================================

watch(searchText, () => {
    applySearch();
});

watch(
    () => props.config,
    () => {
        loadData();
    },
    { deep: true }
);

onMounted(() => {
    loadData();
});

onBeforeUnmount(() => {
    requestSequence++;
    destroyTable();
});
</script>

<style scoped>
/* ==========================================
   Layout Container & Toolbar
   ========================================== */
.data-table-container {
    width: 100%;
    min-width: 0;
    font-family: Arial, sans-serif;
    color: #333;
}

.table-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
}

.table-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #555;
}

.table-info strong {
    color: #222;
}

.table-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

/* ==========================================
   Inputs & Buttons
   ========================================== */
.table-search {
    box-sizing: border-box;
    width: 220px;
    max-width: 100%;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    outline: none;
}

.table-search:focus {
    border-color: #4285f4;
    box-shadow: 0 0 0 2px rgb(66 133 244 / 15%);
}

.refresh-button {
    padding: 8px 14px;
    border: 1px solid #1a73e8;
    border-radius: 4px;
    background: #1a73e8;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
}

.refresh-button:hover:not(:disabled) {
    background: #1558b0;
}

.refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.filter-button {
    padding: 8px 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: #333;
    font-size: 13px;
    cursor: pointer;
}

.filter-button:hover {
    background: #f2f2f2;
}

.filter-button.wrap-active {
    border-color: #1a73e8;
    background: #e8f0fe;
    color: #1a73e8;
}

/* ==========================================
   States (Loading, Error, Empty)
   ========================================== */
.table-wrapper,
.data-table {
    width: 100%;
    min-width: 0;
}

.loading,
.empty-state {
    padding: 24px;
    text-align: center;
    color: #666;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.error {
    padding: 16px;
    color: #b42318;
    background: #fff4f2;
    border: 1px solid #f1b5ae;
    border-radius: 4px;
}

.error p {
    overflow-wrap: anywhere;
}

/* ==========================================
   Kustomisasi Tabulator UI (:deep)
   ========================================== */

/* Header Tabulator */
.data-table :deep(.tabulator-col-content) {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    box-sizing: border-box;
}

.data-table :deep(.tabulator-col-title-holder) {
    width: 100%;
}

.data-table :deep(.tabulator-col-title) {
    width: 100%;
    font-weight: bold;
    text-align: center;
}

/* Styling Elemen Cell Text */
.data-table :deep(.cell-scroll) {
    display: block;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    line-height: 1.4;
    text-overflow: clip;
    scrollbar-width: none;
}

.data-table :deep(.cell-scroll::-webkit-scrollbar) {
    height: 0;
}

/* Mode Wrap: ON */
.data-table :deep(.cell-scroll.wrap-text) {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    overflow-x: hidden;
    overflow-y: hidden;
}

/* Mode Wrap: OFF */
.data-table :deep(.cell-scroll.nowrap-text) {
    display: block;
    width: 100%;
    max-width: 100%;
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: normal;
    overflow-x: auto;
    overflow-y: hidden;
    text-overflow: clip;
    line-height: 1.4;
    box-sizing: border-box;
}

/* Scrollbar kustom saat mouse hover di mode Wrap OFF */
.data-table :deep(.cell-scroll.nowrap-text:hover) {
    scrollbar-width: thin;
}

.data-table :deep(.cell-scroll.nowrap-text:hover::-webkit-scrollbar) {
    height: 6px;
}

.data-table :deep(.cell-scroll.nowrap-text:hover::-webkit-scrollbar-track) {
    background: #f1f1f1;
    border-radius: 3px;
}

.data-table :deep(.cell-scroll.nowrap-text:hover::-webkit-scrollbar-thumb) {
    background: #999;
    border-radius: 3px;
}

.data-table :deep(.cell-scroll.nowrap-text:hover::-webkit-scrollbar-thumb:hover) {
    background: #666;
}

/* Penyesuaian Tinggi Baris/Cell */
.data-table :deep(.tabulator-row),
.data-table :deep(.tabulator-row.tabulator-row-even),
.data-table :deep(.tabulator-row.tabulator-row-odd) {
    height: auto;
    min-height: 0;
    background: v-bind('APP_COLORS.bgTableCellGrad') !important;
}

.data-table :deep(.tabulator-cell) {
    height: auto;
    white-space: normal;
    background: transparent !important;
}

/* ==========================================
   Responsive Layout (Mobile)
   ========================================== */
@media (max-width: 600px) {
    .table-toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .table-actions {
        width: 100%;
    }

    .table-search {
        flex: 1;
        width: auto;
    }

    .table-info {
        gap: 8px 12px;
    }
}
</style>
