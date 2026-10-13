/**
 * Memanggil GAS Web API dan mereturn result object ter-wrapper dengan method .get().
 *
 * @param {string} webAppUrl URL Web App Apps Script.
 * @param {string} gsheetID Spreadsheet ID.
 * @param {string} sheetName Nama tab.
 * @param {number} columnIDRow Baris ID Kolom.
 * @param {number} columnTitleRow Baris Judul Kolom (Header Tabel).
 * @param {number} columnTitleDescriptionRow Baris Deskripsi Judul.
 * @param {number} columnTypeRow Baris Tipe Kolom.
 * @param {string} dataRange Range data (misal: "A5:Z").
 * @param {string} rowIDColumn Kolom tempat RowID disimpan (misal: "Z").
 * @returns {Promise<Object>}
 */
export async function fetchGSheetData(
  webAppUrl,
  gsheetID,
  sheetName,
  columnIDRow = 1,
  columnTitleRow = 2,
  columnTitleDescriptionRow = 3,
  columnTypeRow = 4,
  dataRange = 'A5:Z',
  rowIDColumn = ''
) {
  const url = new URL(webAppUrl);

  // Ambil token dari sessionStorage
  const token = sessionStorage.getItem("authToken") || "";

  url.searchParams.append("token", token);
  url.searchParams.append("GSheetID", gsheetID);
  url.searchParams.append("sheetName", sheetName);
  url.searchParams.append("columnIDRow", columnIDRow);
  url.searchParams.append("columnTitleRow", columnTitleRow);
  url.searchParams.append("columnTitleDescriptionRow", columnTitleDescriptionRow);
  url.searchParams.append("columnTypeRow", columnTypeRow);
  url.searchParams.append("dataRange", dataRange);
  if (rowIDColumn) {
    url.searchParams.append("RowIDColumn", rowIDColumn);
  }

  console.log("rowIDColumn:", rowIDColumn);
  console.log("Request URL:", url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow"
    });

    if (!response.ok) {
      return attachClientWrapper({
        status: "error",
        error: `HTTP Error ${response.status}: ${response.statusText}`,
        columnIDs: [],
        columnTitles: [],
        columnDescriptions: [],
        columnTypes: [],
        data: [],
        rowIDs: []
      });
    }

    const rawResult = await response.json();
    return attachClientWrapper(rawResult);

  } catch (err) {
    return attachClientWrapper({
      status: "error",
      error: "Gagal terhubung ke API: " + err.message,
      columnIDs: [],
      columnTitles: [],
      columnDescriptions: [],
      columnTypes: [],
      data: [],
      rowIDs: []
    });
  }
}

/**
 * Menambahkan method .get(rowIndex, colIndex) secara non-enumerable pada objek client-side.
 */
function attachClientWrapper(obj) {
  const safeObj = {
    status: obj && obj.status ? obj.status : "error",
    error: obj && obj.error !== undefined ? obj.error : "Unknown client error",
    columnIDs: Array.isArray(obj && obj.columnIDs) ? obj.columnIDs : [],
    columnTitles: Array.isArray(obj && obj.columnTitles) 
      ? obj.columnTitles 
      : (Array.isArray(obj && obj.columnHeaders) ? obj.columnHeaders : []),
    columnDescriptions: Array.isArray(obj && obj.columnDescriptions) ? obj.columnDescriptions : [],
    columnTypes: Array.isArray(obj && obj.columnTypes) ? obj.columnTypes : [],
    data: Array.isArray(obj && obj.data) ? obj.data : [],
    rowIDs: Array.isArray(obj && obj.rowIDs) ? obj.rowIDs : []
  };

  Object.defineProperty(safeObj, 'get', {
    value: function(rowIndex, colIndex) {
      if (
        Array.isArray(this.data) &&
        rowIndex >= 0 &&
        rowIndex < this.data.length &&
        Array.isArray(this.data[rowIndex]) &&
        colIndex >= 0 &&
        colIndex < this.data[rowIndex].length
      ) {
        return this.data[rowIndex][colIndex];
      }
      return null;
    },
    writable: false,
    configurable: true,
    enumerable: false
  });

  return safeObj;
}