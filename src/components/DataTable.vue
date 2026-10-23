<template>
    <div class="data-table-container">
      <div v-show="sheetData.status === 'success' && totalRows > 0" class="table-wrapper">
        <div ref="tableElement" class="data-table"></div>
      </div>
  
      <div class="table-toolbar">
        <div class="table-info">
          <span v-if="lastUpdated">
            Last Refresh: <strong>{{ lastUpdated }}</strong>
          </span>
        </div>
  
        <div class="table-actions">
          <div v-if="loading" class="status-box loading-container">
            <div class="progress-bar-wrapper">
              <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <span class="progress-text">Memuat data... {{ progressPercent }}%</span>
          </div>
  
          <div v-else-if="sheetData.status === 'error'" class="status-box error">
            <span class="error-message">{{ sheetData.error }}</span>
            <button type="button" class="refresh-button" @click="loadData">
              Coba Lagi
            </button>
            <button type="button" class="relogin-button" @click="handleRelogin">
              Relogin
            </button>
          </div>
  
          <div v-else-if="sheetData.status === 'success' && totalRows === 0" class="status-box empty-state">
            Tidak ada data untuk ditampilkan.
          </div>
  
          <div v-else class="action-controls">
            <input v-model="searchText" type="text" class="table-search" placeholder="Cari data..." />
  
            <button type="button" class="filter-button" :class="{ 'filter-active': showFilters }" @click="toggleFilters"
              :title="showFilters ? 'Hide column filter' : 'Show column filter'">
              <AppIcon :name="showFilters ? 'funnel-x' : 'funnel'" :size="12" />
            </button>
  
            <button type="button" class="filter-button" @click="clearAllFilters" title="Clear filter">
              <AppIcon name="rotate-ccw" :size="12" />
            </button>
  
            <button type="button" class="filter-button" :class="{ 'wrap-active': wrapText }" @click="toggleWrap"
              :title="wrapText ? `Don't wrap text in data cell` : `Wrap text in data cell`">
              <AppIcon :name="!wrapText ? 'WrapText' : 'Text'" :size="12" />
              
            </button>
  
            <button type="button" class="refresh-button" :disabled="loading" @click="loadData"
              :title="loading ? 'Loading...' : 'Refresh'">
              <AppIcon :name="loading ? 'refresh-cw' : 'refresh-ccw'" :size="12" />
            </button>
          </div>
        </div>
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
  import AppIcon from './AppIcon.vue';
  import { SelectedRowStore } from '../stores/selectedRowStore.js';
  import { TableStore } from '../stores/tableStore.js';
  
  const props = defineProps({
    config: {
      type: Object,
      required: true
    },
    tableDateFormat: {
      type: String,
      default: ''
    }
  });
  
  const emit = defineEmits(['row-selected', 'relogin']);
  
  const loading = ref(false);
  const progressPercent = ref(0);
  let progressInterval = null;
  
  const searchText = ref('');
  const lastUpdated = ref('');
  const tableElement = ref(null);
  const showFilters = ref(false);
  const wrapText = ref(false);
  
  const sheetData = ref({
    status: 'loading',
    error: null,
    columnIDs: [],
    columnTitles: [],
    columnDescriptions: [],
    columnTypes: [],
    data: [],
    rowIDs: []
  });
  
  let table = null;
  let requestSequence = 0;
  
  const totalRows = computed(() => sheetData.value.data.length);
  const totalColumns = computed(() => sheetData.value.columnTitles.length);
  
  function handleRelogin() {
    sessionStorage.removeItem("authToken");
    emit('relogin');
  }
  
  function handleSidebarResize() {
    if (table) {
      table.redraw(true);
    }
  }
  
  function toggleWrap() {
    wrapText.value = !wrapText.value;
    if (table) {
      table.getRows().forEach(row => row.reformat());
      table.redraw();
    }
  }
  
  async function toggleFilters() {
    showFilters.value = !showFilters.value;
  
    if (!table || sheetData.value.status !== 'success') {
      return;
    }
  
    try {
      const columns = buildColumns(sheetData.value);
      await table.setColumns(columns);
  
      if (!showFilters.value) {
        table.clearFilter(true);
      }
  
      applySearch();
    } catch (error) {
      console.error('Gagal memperbarui filter kolom:', error);
    }
  }
  
  function clearAllFilters() {
    searchText.value = '';
    if (!table) return;
    table.clearFilter(true);
  }
  
  function buildColumns(result) {
    const frozenIndexes = Array.isArray(props.config.FrozenColumnIndex)
      ? props.config.FrozenColumnIndex
      : [];
  
    const generatedColumns = [];
  
    const tabulatorCols = result.columnTitles
      .map((title, index) => {
        const rawType = String(result.columnTypes[index] || 'string').trim().toLowerCase();
  
        if (rawType.includes('hidden')) {
          return null;
        }
  
        const columnID = result.columnIDs[index] || `col_${index + 1}`;
        const description = result.columnDescriptions[index] || '';
        const type = rawType.replace('hidden', '').trim() || 'string';
  
        generatedColumns.push({
          id: columnID,
          title: String(title || columnID)
        });
  
        const isFrozen = frozenIndexes.includes(index);
  
        const column = {
          title: String(title || columnID),
          field: columnID,
          frozen: isFrozen,
          headerTooltip: description || String(title || columnID),
          headerFilter: showFilters.value ? 'input' : false,
          headerFilterPlaceholder: '',
          headerFilterFunc: 'like',
          headerSort: true,
          sorter: isDateColumn(result, index, type)
            ? sortDateValues
            : getSorter(type),
          headerHozAlign: 'center',
          maxWidth: 500,
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
  
            div.classList.toggle('wrap-text', wrapText.value);
            div.classList.toggle('nowrap-text', !wrapText.value);
  
            return div;
          }
        };
  
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
  
            try {
              const parsedURL = new URL(url);
              if (!['http:', 'https:'].includes(parsedURL.protocol)) {
                return '';
              }
            } catch {
              return '';
            }
  
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
      })
      .filter(col => col !== null);
  
    SelectedRowStore.columns.value = generatedColumns;
    return tabulatorCols;
  }
  
  function getSorter(type) {
    const numericTypes = ['number', 'numeric', 'integer', 'float', 'decimal', 'currency'];
    return numericTypes.includes(type) ? 'number' : 'string';
  }
  
  function isDateColumn(result, index, type) {
    if (['date', 'datetime'].includes(type)) return true;
  
    const values = (result.data || [])
      .map(row => row[index])
      .filter(value => value !== null && value !== undefined && String(value).trim() !== '');
  
    if (!values.length) return false;
    return values.every(value => parseDateValue(value) !== null);
  }
  
  function parseDateValue(value) {
    if (value === null || value === undefined) return null;
  
    const text = String(value).trim();
    const match = text.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2}|\d{4})$/);
  
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
  
  function sortDateValues(a, b) {
    const dateA = parseDateValue(a);
    const dateB = parseDateValue(b);
  
    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;
  
    return dateA - dateB;
  }
  
  function buildTableData(result) {
    const validRows = [];
  
    (result.data || []).forEach((row, rowIndex) => {
      const hasValue = row.some(value => {
        if (value === null || value === undefined) return false;
        const text = String(value)
          .replace(/[\s\u00A0\u200B\uFEFF]/g, '')
          .trim();
        return text !== '' && text.toUpperCase() !== 'FALSE';
      });
  
      if (hasValue) {
        const record = {
          __rowIndex: rowIndex,
          __rowID: result.rowIDs && result.rowIDs[rowIndex] !== undefined ? result.rowIDs[rowIndex] : ''
        };
  
        result.columnIDs.forEach((columnID, columnIndex) => {
          const value = row[columnIndex] ?? '';
          record[columnID] = String(value).trim().toUpperCase() === 'FALSE'
            ? ''
            : value;
        });
  
        validRows.push(record);
      }
    });
  
    return validRows;
  }
  
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
        selectableRows: 1,
        layout: 'fitData',
        autoResize: false,
        height: "100%",
        renderVertical: "virtual",
        renderVerticalBuffer: 20,
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
  
      table.on('rowClick', (e, row) => {
        const rowData = row.getData();
        SelectedRowStore.selectedRow.value = { ...rowData };
  
        const firstColumnID = sheetData.value.columnIDs[4];
        const firstColumnValue = firstColumnID ? rowData[firstColumnID] : '';
        const rowID = rowData.__rowID || '';
  
        emit('row-selected', {
          value: firstColumnValue,
          rowID: rowID
        });
      });
    } else {
      await table.setColumns(columns);
      await table.replaceData(data);
      applySearch();
    }
  }
  
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
  
  function startProgressSimulation() {
    stopProgressSimulation();
    progressPercent.value = 5;
  
    progressInterval = setInterval(() => {
      if (progressPercent.value < 90) {
        const increment = Math.floor(Math.random() * 5) + 3;
        progressPercent.value = Math.min(progressPercent.value + increment, 90);
      }
    }, 200);
  }
  
  function stopProgressSimulation() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }
  
  async function loadData() {
    const currentRequest = ++requestSequence;
    loading.value = true;
    startProgressSimulation();
  
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
        config.dataRange ?? 'A5:Z',
        config.RowIDColumn ?? '',
        config.ProjectID ?? '',
        config.ProjectIDColumn ?? ''
      );
  
      if (currentRequest !== requestSequence) return;
  
      if (result.status !== 'success') {
        sheetData.value = {
          status: 'error',
          error: result.error || 'Terjadi kesalahan saat mengambil data.',
          columnIDs: [],
          columnTitles: [],
          columnDescriptions: [],
          columnTypes: [],
          data: [],
          rowIDs: []
        };
  
        TableStore.setTableData([]);
        destroyTable();
        return;
      }
  
      progressPercent.value = 100;
      sheetData.value = result;
  
      // SIMPAN DATA TERFORMAT KE TABLESTORE
      const formattedTableData = buildTableData(result);
      TableStore.setTableData(formattedTableData);
  
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
        data: [],
        rowIDs: []
      };
  
      TableStore.setTableData([]);
      destroyTable();
    } finally {
      if (currentRequest === requestSequence) {
        stopProgressSimulation();
        setTimeout(() => {
          loading.value = false;
        }, 150);
      }
    }
  }
  
  function destroyTable() {
    if (table) {
      table.destroy();
      table = null;
    }
  }
  
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
    window.addEventListener('sidebar-resized', handleSidebarResize);
    loadData();
  });
  
  onBeforeUnmount(() => {
    window.removeEventListener('sidebar-resized', handleSidebarResize);
    requestSequence++;
    stopProgressSimulation();
    destroyTable();
  });
  </script>
  
  <style scoped>
  .data-table-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  
  .table-wrapper {
    flex: 1 1 0%;
    width: 100%;
    min-width: 0;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  
  .data-table {
    width: 100%;
    height: 100%;
    min-width: 0;
    border: 1px solid v-bind('APP_COLORS.borderDefault');
    border-radius: 3px;
  }
  
  .table-toolbar {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 4px 0;
  }
  
  .table-info {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  
  .table-info span {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    font-size: 10px;
    color: v-bind('APP_COLORS.textSecondary');
    margin: 4px;
  }
  
  .table-info strong {
    color: v-bind('APP_COLORS.textPrimary');
    font-size: 10px;
  }
  
  .table-actions {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    justify-content: flex-end;
  }
  
  .table-search {
    box-sizing: border-box;
    width: 160px;
    max-width: 100%;
    padding: 2px 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 12px;
    outline: none;
  }
  
  .table-search:focus {
    border-color: #4285f4;
    box-shadow: 0 0 0 2px rgb(66 133 244 / 15%);
  }
  
  .refresh-button {
    padding: 2px 8px;
    border: 1px solid #1a73e8;
    border-radius: 4px;
    background: #1a73e8;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
  }
  
  .refresh-button:hover:not(:disabled) {
    background: #1558b0;
  }
  
  .refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .relogin-button {
    padding: 2px 8px;
    border: 1px solid #d93025;
    border-radius: 4px;
    background: #d93025;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    margin-left: 4px;
  }
  
  .relogin-button:hover {
    background: #a50e0e;
  }
  
  .filter-button {
    padding: 2px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: #333;
    font-size: 10px;
    cursor: pointer;
  }
  
  .filter-button:hover {
    background: #f2f2f2;
  }
  
  .filter-button.wrap-active {
    border-color: #1a73e8;
    background: #e8f1fe;
    color: #1a73e8;
  }

  .filter-button.filter-active {
    border-color: #1a73e8;
    background: #e8f1fe;
    color: #1a73e8;
  }
  
  .loading-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 8px;
    border: 1px solid #b3d4fc;
    border-radius: 4px;
    background: #f0f7ff;
  }
  
  .progress-bar-wrapper {
    flex: 1;
    height: 8px;
    background-color: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #4285f4 0%, #1a73e8 50%, #0d47a1 100%);
    transition: width 0.2s ease-in-out;
  }
  
  .progress-text {
    font-size: 11px;
    font-weight: 600;
    color: #1a73e8;
    white-space: nowrap;
  }
  
  .empty-state {
    flex: 1;
    text-align: center;
    color: #666;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    padding: 4px;
  }
  
  .error {
    flex: 1;
    text-align: center;
    color: #b42318;
    background: #fff4f2;
    border: 1px solid #f1b5ae;
    border-radius: 4px;
    font-size: 12px;
    padding: 4px;
  }
  
  .error p {
    overflow-wrap: anywhere;
  }
  
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
  
  .data-table :deep(.cell-scroll.wrap-text) {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    overflow-x: hidden;
    overflow-y: hidden;
  }
  
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
  
  .data-table :deep(.tabulator-row),
  .data-table :deep(.tabulator-row.tabulator-row-even),
  .data-table :deep(.tabulator-row.tabulator-row-odd) {
    height: auto;
    min-height: 0;
    background: v-bind('APP_COLORS.bgGradNormal');
    color:  v-bind('APP_COLORS.bgGradTextNormal');
  }
  
  .data-table :deep(.tabulator-row:hover) {
    background: v-bind('APP_COLORS.bgGradHover');
    color:  v-bind('APP_COLORS.bgGradTextHover');
    
  }
  
  .data-table :deep(.tabulator-row.tabulator-selected) {
    background: v-bind('APP_COLORS.bgGradSelected');
    color:  v-bind('APP_COLORS.bgGradTextSelected')
  }
  
  .data-table :deep(.tabulator-cell) {
    height: auto;
    white-space: normal;
    background: transparent !important;
    border: 1px dotted v-bind('APP_COLORS.borderDefault');
    
  }
  
  .data-table :deep(.tabulator-col-content) {
    background: v-bind('APP_COLORS.buttonBg');
  }
  
  .data-table :deep(.tabulator-header-filter input) {
    background: v-bind('APP_COLORS.bgPrimaryGrad');
    border-color: v-bind('APP_COLORS.borderDefault');
    border-style: solid;
    border-width: 1px;
    box-shadow: 0px 2px 4px 0px v-bind('APP_COLORS.shadowColorNormal');
    outline: none;
  }
  
  .data-table :deep(.tabulator-header-filter input:focus) {
    outline: none;
    border-style: solid;
    border-width: 1px;
    box-shadow: inset 0px 2px 4px 0px v-bind('APP_COLORS.shadowColorNormal');
  }
  
  .data-table :deep(.tabulator-cell.tabulator-frozen) {
    background: v-bind('APP_COLORS.bgGradNormal') !important;
    color:  v-bind('APP_COLORS.bgGradTextNormal') !important;
  }
  
  .data-table :deep(.tabulator-col.tabulator-frozen) {
    background: v-bind('APP_COLORS.buttonBg') !important;
  }
  
  .data-table :deep(.tabulator-row:hover .tabulator-cell.tabulator-frozen) {
    background: v-bind('APP_COLORS.bgGradHover') !important;
    color:  v-bind('APP_COLORS.bgGradTextHover') !important;
  }
  
  .data-table :deep(.tabulator-row.tabulator-selected .tabulator-cell.tabulator-frozen) {
    background: v-bind('APP_COLORS.bgGradSelected') !important;
    color:  v-bind('APP_COLORS.bgGradTextSelected') !important;
  }
  
  @media (max-width: 600px) {
    .table-toolbar {
      align-items: stretch;
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