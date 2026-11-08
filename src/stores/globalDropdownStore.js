import { ref, computed } from 'vue';
import { fetchGSheetData } from '../components/Data/DataTable.js'; // Sesuaikan path DataTable.js Anda

export const globalDropdownDataMap = ref({});
export const globalDropdownisLoading = ref(false);
export const globalDropdownisLoaded = ref(false);

const dropdownConfig = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw4ARc71H-V0lIBwp1ijTUiuzZnts0bzBXh30pcy-iaIqa-rYrLW7xsb9hlnpuqDPUI/exec',

  gsheetID: '1QnTPM7t8dgnboekqkwq1su1ycyRS7BbW1uVj83qrtEo',
  sheetName: 'Dropdowns',
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: 'B5:BJ',
  RowIDColumn: 'A',
  ProjectID: 'any',
  ProjectIDColumn: 'B'
};

export async function globalDropdownLoadList(force = false) {
  

  // Jika sudah pernah load, hentikan hanya jika bukan force reload
  if (!force && globalDropdownisLoaded.value) return

  // Hindari request bersamaan
  if (globalDropdownisLoading.value) return

  globalDropdownisLoading.value = true

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
    )

    if (result.status === 'success') {
      const map = {}

      result.columnIDs.forEach(colID => {
        const key = String(colID).trim()
        map[key] = []
      })

      ;(result.data || []).forEach(row => {
        result.columnIDs.forEach((colID, colIndex) => {
          const key = String(colID).trim()
          const val = row[colIndex]

          if (
            val !== undefined &&
            val !== null &&
            String(val).trim() !== ''
          ) {
            map[key].push(String(val).trim())
          }
        })
      })

      globalDropdownDataMap.value = map
      globalDropdownisLoaded.value = true

 
    } else {
      
      throw result.error;
    }

  } catch (err) {   
    
    throw err;
  } finally {
    globalDropdownisLoading.value = false
  }
}

// Mengembalikan ComputedRef agar komponen yang memanggilnya selalu update
export function getGlobalDropdownOptions(columnID) {
  const key = String(columnID).trim();

  return computed(() => {
    return globalDropdownDataMap.value[key] || [];
  });
}