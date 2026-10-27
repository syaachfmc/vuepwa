import { ref, computed } from 'vue';
import { fetchGSheetData } from '../components/Data/DataTable.js'; // Sesuaikan path DataTable.js Anda

export const dropdownDataMap = ref({});
export const isDropdownLoading = ref(false);
export const isDropdownLoaded = ref(false);

const dropdownConfig = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbwvyT0YNOAQLVydiESiBCq-j-kWqQ-95eSnzPI69kkdl8WiOS9fnT-cHbmriUIOgIws/exec',
  gsheetID: '1QnTPM7t8dgnboekqkwq1su1ycyRS7BbW1uVj83qrtEo',
  sheetName: 'Dropdowns',
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: 'b5:Z',
  RowIDColumn: 'A',
  ProjectID: 'any',
  ProjectIDColumn: 'B'
};

export async function loadDropdownList() {
  if (isDropdownLoaded.value || isDropdownLoading.value) return;

  isDropdownLoading.value = true;
  try {
    const result = await fetchGSheetData(
      dropdownConfig.webAppUrl,
      dropdownConfig.gsheetID,
      dropdownConfig.sheetName,
      dropdownConfig.columnIDRow,
      dropdownConfig.columnTitleRow,
      dropdownConfig.columnTitleDescriptionRow,
      dropdownConfig.columnTypeRow,
      dropdownConfig.dataRange,
      dropdownConfig.RowIDColumn,
      dropdownConfig.ProjectID,
      dropdownConfig.ProjectIDColumn
    );
 console.log('Hasil fetchGSheetData:', result);
    if (result.status === 'success') {
      const map = {};

      // Normalize key columnIDs ke String rapi
      result.columnIDs.forEach(colID => {
        const key = String(colID).trim();
        map[key] = [];
      });

      // Map isi baris data ke masing-masing key columnID
      (result.data || []).forEach(row => {
        result.columnIDs.forEach((colID, colIndex) => {
          const key = String(colID).trim();
          const val = row[colIndex];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            map[key].push(String(val).trim());
          }
        });
      });

      dropdownDataMap.value = map;
      isDropdownLoaded.value = true;
    }
  } catch (err) {
    console.error('Gagal memuat Dropdown List:', err);
  } finally {
    isDropdownLoading.value = false;
  }
}

// Mengembalikan ComputedRef agar komponen yang memanggilnya selalu update
export function getDropdownOptions(columnID) {
    const key = String(columnID).trim();
    return dropdownDataMap.value[key] || [];
  }