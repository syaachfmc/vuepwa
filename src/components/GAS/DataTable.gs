/**
 * Mengambil data dari Google Sheet dan mengembalikannya sebagai Object terstruktur.
 *
 * @param {string} GSheetID - ID Google Spreadsheet.
 * @param {string} sheetName - Nama sheet / tab.
 * @param {number} columnIDRow - Nomor baris ID Kolom.
 * @param {number} columnTitleRow - Nomor baris Judul Kolom (Header Utama).
 * @param {number} columnTitleDescriptionRow - Nomor baris Deskripsi Judul.
 * @param {number} columnTypeRow - Nomor baris tipe kolom.
 * @param {string} dataRange - Range data (contoh: "A5:Z", "A2:G10").
 * @param {string} RowIDColumn - Kolom tempat RowID disimpan (contoh: "Z", "A", atau "BW").
 * @returns {Object} Result object dengan status, error, metadata kolom, data, rowIDs, dan helper method get().
 */
function getGSheetData(GSheetID, sheetName, columnIDRow, columnTitleRow, columnTitleDescriptionRow, columnTypeRow, dataRange, RowIDColumn) {
  try {
    // 1. Validasi Parameter Dasar
    if (!GSheetID || typeof GSheetID !== 'string' || GSheetID.trim() === '') {
      return createErrorResult("GSheetID tidak boleh kosong.");
    }
    if (!sheetName || typeof sheetName !== 'string' || sheetName.trim() === '') {
      return createErrorResult("sheetName tidak boleh kosong.");
    }
    if (typeof columnIDRow !== 'number' || isNaN(columnIDRow) || columnIDRow < 1) {
      return createErrorResult("columnIDRow harus berupa angka positif minimal 1.");
    }
    if (typeof columnTitleRow !== 'number' || isNaN(columnTitleRow) || columnTitleRow < 1) {
      return createErrorResult("columnTitleRow harus berupa angka positif minimal 1.");
    }
    if (typeof columnTitleDescriptionRow !== 'number' || isNaN(columnTitleDescriptionRow) || columnTitleDescriptionRow < 1) {
      return createErrorResult("columnTitleDescriptionRow harus berupa angka positif minimal 1.");
    }
    if (typeof columnTypeRow !== 'number' || isNaN(columnTypeRow) || columnTypeRow < 1) {
      return createErrorResult("columnTypeRow harus berupa angka positif minimal 1.");
    }
    if (!dataRange || typeof dataRange !== 'string' || dataRange.trim() === '') {
      return createErrorResult("dataRange tidak boleh kosong.");
    }

    // 2. Membuka Spreadsheet
    let ss;
    try {
      ss = SpreadsheetApp.openById(GSheetID.trim());
    } catch (e) {
      return createErrorResult("Spreadsheet tidak ditemukan atau tidak dapat diakses.");
    }

    // 3. Membuka Sheet
    const sheet = ss.getSheetByName(sheetName.trim());
    if (!sheet) {
      return createErrorResult(`Sheet '${sheetName}' tidak ditemukan.`);
    }

    // 4. Checking Total Row & Column Sheet
    const lastSheetRow = Math.max(sheet.getLastRow(), 1);
    const lastSheetCol = Math.max(sheet.getLastColumn(), 1);
    const maxRows = sheet.getMaxRows();

    if (columnIDRow > maxRows || columnTitleRow > maxRows || columnTitleDescriptionRow > maxRows || columnTypeRow > maxRows) {
      return createErrorResult(`Salah satu baris header/metadata melebihi jumlah baris maksimum sheet.`);
    }

    // 5. Parse dataRange
    const parsedRange = parseRangeInfo(dataRange.trim(), lastSheetRow, lastSheetCol);
    if (!parsedRange.success) {
      return createErrorResult(parsedRange.errorMessage);
    }

    const { startCol, startRow, endCol, endRow } = parsedRange;

    // 6. Ambil Column Headers/Metadata (Batch Call 1)
    const numHeaderCols = endCol - startCol + 1;

    const idValues = sheet.getRange(columnIDRow, startCol, 1, numHeaderCols).getDisplayValues()[0];
    const titleValues = sheet.getRange(columnTitleRow, startCol, 1, numHeaderCols).getDisplayValues()[0];
    const descValues = sheet.getRange(columnTitleDescriptionRow, startCol, 1, numHeaderCols).getDisplayValues()[0];
    const typeValues = sheet.getRange(columnTypeRow, startCol, 1, numHeaderCols).getDisplayValues()[0];

    // Clean metadata values
    const columnIDs = idValues.map((h, idx) => {
      const str = String(h).trim();
      return str !== "" ? str : `col_${startCol + idx}`;
    });

    const columnTitles = titleValues.map((h, idx) => {
      const str = String(h).trim();
      return str !== "" ? str : `Column_${numberToColLetter(startCol + idx)}`;
    });

    const columnDescriptions = descValues.map((h) => String(h).trim());

    const columnTypes = typeValues.map((h) => {
      const str = String(h).trim();
      return str !== "" ? str : `string`;
    });

    // 7. Ambil Data Utama
    let data = [];
    if (startRow <= endRow && startRow <= lastSheetRow) {
      const effectiveEndRow = Math.min(endRow, lastSheetRow);
      const numDataRows = effectiveEndRow - startRow + 1;

      if (numDataRows > 0) {
        data = sheet.getRange(startRow, startCol, numDataRows, numHeaderCols).getDisplayValues();
      }
    }

    // 8. Ambil Row ID dari Kolom yang Ditentukan
    let rowIDs = [];
    if (RowIDColumn && typeof RowIDColumn === 'string' && RowIDColumn.trim() !== '') {
      const targetColIndex = colLetterToNumber(RowIDColumn.trim());
      
      if (startRow <= endRow && startRow <= lastSheetRow) {
        const effectiveEndRow = Math.min(endRow, lastSheetRow);
        const numDataRows = effectiveEndRow - startRow + 1;

        if (numDataRows > 0 && targetColIndex >= 1 && targetColIndex <= lastSheetCol) {
          const rawRowIDs = sheet.getRange(startRow, targetColIndex, numDataRows, 1).getDisplayValues();
          rowIDs = rawRowIDs.map(r => r[0]);
        }
      }
    }

console.log({
  RowIDColumn: RowIDColumn,
  targetColIndex: colLetterToNumber(RowIDColumn),
  lastSheetCol: lastSheetCol,
  startRow: startRow,
  endRow: endRow,
  rowIDsLength: rowIDs.length,
  rowIDsSample: rowIDs.slice(0, 5)
});

    // 9. Kembalikan Response Sukses
    return createSuccessResult(columnIDs, columnTitles, columnDescriptions, columnTypes, data, rowIDs);

  } catch (err) {
    return createErrorResult(`Error Internal Server: ${err.message || err.toString()}`);
  }
}

/**
 * Membuat response Object Sukses
 */
function createSuccessResult(columnIDs, columnTitles, columnDescriptions, columnTypes, data, rowIDs) {
  return {
    status: "success",
    error: null,
    columnIDs: columnIDs,
    columnTitles: columnTitles,
    columnDescriptions: columnDescriptions,
    columnTypes: columnTypes,
    data: data,
    rowIDs: rowIDs || [],
    get: function (rowIndex, colIndex) {
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
    }
  };
}

/**
 * Membuat response Object Error
 */
function createErrorResult(errorMessage) {
  return {
    status: "error",
    error: errorMessage,
    columnIDs: [],
    columnTitles: [],
    columnDescriptions: [],
    columnTypes: [],
    data: [],
    rowIDs: [],
    get: function (rowIndex, colIndex) {
      return null;
    }
  };
}

/**
 * HTTP GET Web App Endpoint.
 */
function doGet(e) {
  let result;
  try {
    const params = (e && e.parameter) ? e.parameter : {};

    const gSheetID = params.GSheetID || params.gsheetid || "";
    const sheetName = params.sheetName || params.sheetname || "";
    const columnIDRowStr = params.columnIDRow || params.columnidrow || "1";
    const columnTitleRowStr = params.columnTitleRow || params.columntitlerow || "2";
    const columnTitleDescriptionRowStr = params.columnTitleDescriptionRow || params.columntitledescriptionrow || "3";
    const columnTypeRowStr = params.columnTypeRow || params.columntyperow || "4";
    const dataRange = params.dataRange || params.datarange || "A5:Z";
    const rowIDColumn = params.RowIDColumn || params.rowidcolumn || "";

    const columnIDRow = parseInt(columnIDRowStr, 10);
    const columnTitleRow = parseInt(columnTitleRowStr, 10);
    const columnTitleDescriptionRow = parseInt(columnTitleDescriptionRowStr, 10);
    const columnTypeRow = parseInt(columnTypeRowStr, 10);

    result = getGSheetData(
      gSheetID, 
      sheetName, 
      columnIDRow, 
      columnTitleRow, 
      columnTitleDescriptionRow, 
      columnTypeRow, 
      dataRange,
      rowIDColumn
    );

  } catch (err) {
    result = createErrorResult("Endpoint Error: " + (err.message || err.toString()));
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

