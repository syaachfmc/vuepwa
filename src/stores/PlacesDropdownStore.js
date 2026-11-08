import { ref, computed } from 'vue';
import { fetchGSheetData } from '../components/Data/DataTable.js'; // Sesuaikan path DataTable.js Anda

export const PlacesDropdownDataMap = ref({});
export const PlacesDropdownisLoading = ref(false);
export const PlacesDropdownisLoaded = ref(false);
const authProject = JSON.parse(sessionStorage.getItem("authProject") || "{}");

const dropdownConfig = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw4ARc71H-V0lIBwp1ijTUiuzZnts0bzBXh30pcy-iaIqa-rYrLW7xsb9hlnpuqDPUI/exec',

  gsheetID: authProject.PlacesGSheetID || '',
  sheetName: 'Places',
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: 'B5:J',
  RowIDColumn: 'A',
  ProjectID: "any",
  ProjectIDColumn: 'B'
};


export async function PlacesDropdownLoadList(force = false) {
  if (!force && PlacesDropdownisLoaded.value) return
  if (PlacesDropdownisLoading.value) return

  PlacesDropdownisLoading.value = true;
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

      PlacesDropdownDataMap.value = map;
      PlacesDropdownisLoaded.value = true;

    }
  } catch (err) {
   
    throw err;    
  } finally {
    PlacesDropdownisLoading.value = false;
  }
}

// Mengembalikan ComputedRef agar komponen yang memanggilnya selalu update
export function PlacesDropdownOptions(columnID) {
  const key = String(columnID).trim();

  return computed(() => {
    return PlacesDropdownDataMap.value[key] || [];
  });
}