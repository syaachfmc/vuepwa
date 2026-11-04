/**
 * ============================================================================
 * MAIN WEB APP ROUTER (doGet & doPost)
 * ============================================================================
 */

/**
 * Main HTTP GET Endpoint Router.
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};

    // 1. Router ke GAS2 (RowDataApi) jika meminta spesifik RowID
    if (params.RowID !== undefined && params.RowID !== null && String(params.RowID).trim() !== "") {
      return handleRowApiDoGet_(e);
    }

    // 2. Router ke GAS1 (GSheetData API) jika terdapat GSheetID
    if (params.GSheetID || params.gsheetid) {
      return handleGSheetDataDoGet_(e);
    }

    // 3. Fallback ke GAS3 (Auth API status check)
    return jsonResponse_({
      success: true,
      message: "Authentication API is running."
    });

  } catch (err) {
    return createJsonResponse_({
      status: "error",
      error: "Terjadi kesalahan pada Server: " + (err.message || String(err)),
      code: "INTERNAL_ERROR"
    });
  }
}

/**
 * Main HTTP POST Endpoint (GAS3 Auth API).
 */
function doPost(e) {
  try {
    const body = JSON.parse(
      e && e.postData && e.postData.contents
        ? e.postData.contents
        : "{}"
    );

    const action = String(body.action || "");

    let result;

    switch (action) {
      case "login":
        result = login(body.username, body.password, body.projectCode);
        break;

      case "getProjectList":
        result = getProjectList(); // Public Endpoint - tanpa validasi token
        break;

      case "validateSession":
        result = validateSession(body.token);
        break;

      case "logout":
        result = logout(body.token);
        break;

      case "updateRow":
        return handleUpdateRow_(body);

      case "addNewRow":
        return handleAddNewRow_(body);

      case "me":
        result = validateSession(body.token);
        break;

      default:
        result = {
          success: false,
          message: "Action tidak dikenal."
        };
    }

    return jsonResponse_(result);

  } catch (err) {
    return jsonResponse_({
      success: false,
      message: "Request tidak valid atau terjadi kesalahan server."
    });
  }
}


/**
 * ============================================================================
 * SECTION 1: GAS1 - GSHEET DATA API LOGIC
 * ============================================================================
 */

function handleGSheetDataDoGet_(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};

    const token = params.token || params.authToken || "";
    const auth = validateAuthTokenWithAuthApi_(token);

    if (!auth || auth.success !== true || !auth.user) {
      return createJsonResponse_({
        status: "error",
        error: auth?.message || "Unauthorized. Token tidak valid.",
        code: "UNAUTHORIZED",
        columnIDs: [],
        columnTitles: [],
        columnDescriptions: [],
        columnTypes: [],
        data: [],
        rowIDs: []
      });
    }

    const gSheetID = params.GSheetID || params.gsheetid || "";
    const sheetName = params.sheetName || params.sheetname || "";
    const authenticatedProjectCode = String(auth.user.projectCode || "").trim();

    const accessCheck = checkWorkbookUserAccess_(gSheetID, auth.user.username, authenticatedProjectCode);
    if (!accessCheck.allowed) {
      return createJsonResponse_({
        status: "error",
        error: accessCheck.message,
        code: "FORBIDDEN",
        columnIDs: [],
        columnTitles: [],
        columnDescriptions: [],
        columnTypes: [],
        data: [],
        rowIDs: []
      });
    }

    const columnIDRow = parseInt(params.columnIDRow || params.columnidrow || "1", 10);
    const columnTitleRow = parseInt(params.columnTitleRow || params.columntitlerow || "2", 10);
    const columnTitleDescriptionRow = parseInt(params.columnTitleDescriptionRow || params.columntitledescriptionrow || "3", 10);
    const columnTypeRow = parseInt(params.columnTypeRow || params.columntyperow || "4", 10);

    const dataRange = params.dataRange || params.datarange || "A5:Z";
    const rowIDColumn = params.RowIDColumn || params.rowidcolumn || "";

    // ------------------------------------------------------------------------
    // PERBAIKAN LOGIKA PROJECT ID:
    // Cek apakah parameter ProjectID dari request dikirim dan bernilai "any" (case-insensitive)
    // ------------------------------------------------------------------------
    const requestedProjectID = String(params.ProjectID || params.projectid || "").trim();

    console.log("requestedProjectID", requestedProjectID)

    let projectID = "";
    if (requestedProjectID.toLowerCase() === "any") {
      projectID = "any"; // Menggunakan "any" khusus jika Vue mengirim "any"
    } else {
      projectID = authenticatedProjectCode // Default menginduk ke session user
    }

    const projectIDColumn = String(params.ProjectIDColumn || params.projectidcolumn || "").trim();

    if (!projectID || !projectIDColumn) {
      return createJsonResponse_({
        status: "error",
        error: "Project Code atau ProjectIDColumn tidak tersedia pada konfigurasi autentikasi.",
        code: "PROJECT_SCOPE_REQUIRED",
        columnIDs: [],
        columnTitles: [],
        columnDescriptions: [],
        columnTypes: [],
        data: [],
        rowIDs: []
      });
    }

    const result = getGSheetData(
      gSheetID,
      sheetName,
      columnIDRow,
      columnTitleRow,
      columnTitleDescriptionRow,
      columnTypeRow,
      dataRange,
      rowIDColumn,
      projectID,
      projectIDColumn
    );

    result.userRoleInWorkbook = accessCheck.role;
    // Tambahkan properti debug pada return JSON jika diperlukan
    return createJsonResponse_({
      ...result,
      debugInfo: {
        requestedProjectID: requestedProjectID,
        projectIDUsed: projectID
      }
    });

  } catch (err) {
    console.error("Data API request failed.");

    return createJsonResponse_({
      status: "error",
      error: "Terjadi kesalahan pada Data API: " + (err.message || String(err)),
      code: "INTERNAL_ERROR",
      columnIDs: [],
      columnTitles: [],
      columnDescriptions: [],
      columnTypes: [],
      data: [],
      rowIDs: []
    });
  }
}


function checkWorkbookUserAccess_(gSheetID, username, projectID) {
  console.log("gSheetID", gSheetID)
  console.log("username", username)
  console.log("projectID", projectID)
  const ALLOWED_ROLES = ["VIEWER", "EDITOR", "DEVELOPER"];

  // 1. Validasi parameter
  if (!gSheetID || !username || !projectID) {
    return {
      allowed: false,
      message: "GSheetID, username, dan ProjectID wajib dispesifikasikan."
    };
  }

  // 2. Buka Workbook
  let ss;
  try {
    ss = SpreadsheetApp.openById(gSheetID.trim());
  } catch (e) {
    return {
      allowed: false,
      message: "Spreadsheet target tidak ditemukan atau tidak dapat diakses."
    };
  }

  // 3. Cari sheet User Access
  const userAccessSheet = ss.getSheetByName("User Access");

  if (!userAccessSheet) {
    return {
      allowed: false,
      message: "Sheet 'User Access' tidak ditemukan pada Workbook ini."
    };
  }

  // 4. Periksa jumlah data
  const lastRow = userAccessSheet.getLastRow();

  if (lastRow < 2) {
    return {
      allowed: false,
      message: "Akses ditolak. Belum ada daftar pengguna di sheet 'User Access'."
    };
  }

  // 5. Ambil data kolom A sampai G
  const rows = userAccessSheet
    .getRange(2, 1, lastRow - 1, 7)
    .getDisplayValues();

  // 6. Normalisasi input
  const targetUsername = String(username).trim().toLowerCase();
  const targetProjectID = String(projectID).trim().toLowerCase();

  // 7. Cari kombinasi Username + Project ID
  const match = rows.find(function (row) {
    const rowUsername = String(row[1] || "").trim().toLowerCase();
    const rowProjectID = String(row[6] || "").trim().toLowerCase();

    return (
      rowUsername === targetUsername &&
      rowProjectID === targetProjectID
    );
  });

  if (!match) {
    return {
      allowed: false,
      message: "Pengguna '" + username +
        "' tidak memiliki hak akses ke Project '" + projectID + "'."
    };
  }

  // 8. Periksa Active
  const role = String(match[4] || "").trim();
  const active = String(match[5] || "").trim().toUpperCase();

  if (active !== "TRUE") {
    return {
      allowed: false,
      message: "Akses ditolak. Status akses pengguna pada Project ini tidak aktif (FALSE)."
    };
  }

  // 9. Periksa Role
  const normalizedRole = role.toUpperCase();

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return {
      allowed: false,
      message: "Akses ditolak. Role '" + role +
        "' tidak memiliki hak akses untuk melihat data."
    };
  }

  // 10. Akses diberikan
  return {
    allowed: true,
    role: normalizedRole,
    active: active,
    projectID: String(match[6]).trim()
  };
}


function getGSheetData(GSheetID, sheetName, columnIDRow, columnTitleRow, columnTitleDescriptionRow, columnTypeRow, dataRange, RowIDColumn, ProjectID, ProjectIDColumn) {
  try {
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

    let ss;
    try {
      ss = SpreadsheetApp.openById(GSheetID.trim());
    } catch (e) {
      return createErrorResult("Spreadsheet tidak ditemukan atau tidak dapat diakses.");
    }

    const sheet = ss.getSheetByName(sheetName.trim());
    if (!sheet) {
      return createErrorResult(`Sheet '${sheetName}' tidak ditemukan.`);
    }

    const lastSheetRow = Math.max(sheet.getLastRow(), 1);
    const lastSheetCol = Math.max(sheet.getLastColumn(), 1);
    const maxRows = sheet.getMaxRows();

    if (columnIDRow > maxRows || columnTitleRow > maxRows || columnTitleDescriptionRow > maxRows || columnTypeRow > maxRows) {
      return createErrorResult(`Salah satu baris header/metadata melebihi jumlah baris maksimum sheet.`);
    }

    const parsedRange = parseRangeInfo(dataRange.trim(), lastSheetRow, lastSheetCol);
    if (!parsedRange.success) {
      return createErrorResult(parsedRange.errorMessage);
    }

    const { startCol, startRow, endCol, endRow } = parsedRange;
    const numHeaderCols = endCol - startCol + 1;

    const idValues = sheet.getRange(columnIDRow, startCol, 1, numHeaderCols).getDisplayValues()[0];
    const titleValues = sheet.getRange(columnTitleRow, startCol, 1, numHeaderCols).getDisplayValues()[0];
    const descValues = sheet.getRange(columnTitleDescriptionRow, startCol, 1, numHeaderCols).getDisplayValues()[0];
    const typeValues = sheet.getRange(columnTypeRow, startCol, 1, numHeaderCols).getDisplayValues()[0];

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

    let data = [];
    let rowIDs = [];

    if (startRow <= endRow && startRow <= lastSheetRow) {
      const effectiveEndRow = Math.min(endRow, lastSheetRow);
      const numDataRows = effectiveEndRow - startRow + 1;

      if (numDataRows > 0) {
        const rawData = sheet.getRange(startRow, startCol, numDataRows, numHeaderCols).getDisplayValues();

        let rawRowIDs = [];
        if (RowIDColumn && typeof RowIDColumn === 'string' && RowIDColumn.trim() !== '') {
          const targetColIndex = colLetterToNumber(RowIDColumn.trim());
          if (targetColIndex >= 1 && targetColIndex <= lastSheetCol) {
            rawRowIDs = sheet.getRange(startRow, targetColIndex, numDataRows, 1).getDisplayValues().map(r => r[0]);
          }
        }

        const strProjectID = ProjectID !== undefined && ProjectID !== null ? String(ProjectID).trim() : "";
        const isFilterActive = strProjectID !== "" && strProjectID !== "*";

        if (isFilterActive) {
          if (!ProjectIDColumn || typeof ProjectIDColumn !== 'string' || ProjectIDColumn.trim() === '') {
            return createErrorResult("ProjectIDColumn harus dispesifikasikan saat melakukan filtering ProjectID.");
          }

          const projectColIndex = colLetterToNumber(ProjectIDColumn.trim());
          let projectValues = [];

          if (projectColIndex >= startCol && projectColIndex <= endCol) {
            const colOffset = projectColIndex - startCol;
            projectValues = rawData.map(row => row[colOffset]);
          } else if (projectColIndex >= 1 && projectColIndex <= lastSheetCol) {
            projectValues = sheet.getRange(startRow, projectColIndex, numDataRows, 1).getDisplayValues().map(r => r[0]);
          } else {
            return createErrorResult(`ProjectIDColumn '${ProjectIDColumn}' berada di luar batas kolom sheet.`);
          }

          const filterTarget = strProjectID.toLowerCase();
          for (let i = 0; i < numDataRows; i++) {
            const val = String(projectValues[i] || "").trim().toLowerCase();
            if (val === filterTarget) {
              data.push(rawData[i]);
              if (rawRowIDs.length > 0) {
                rowIDs.push(rawRowIDs[i]);
              }
            }
          }
        } else {
          data = rawData;
          rowIDs = rawRowIDs;
        }
      }
    }

    return createSuccessResult(columnIDs, columnTitles, columnDescriptions, columnTypes, data, rowIDs);

  } catch (err) {
    return createErrorResult(`Error Internal Server: ${err.message || err.toString()}`);
  }
}

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

function createJsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseRangeInfo(dataRange, lastSheetRow, lastSheetCol) {
  const rangeStr = dataRange.toUpperCase().trim();

  let startCol, startRow, endCol, endRow;

  const patCellToCell = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/;
  const patCellToCol = /^([A-Z]+)(\d+):([A-Z]+)$/;
  const patColToCol = /^([A-Z]+):([A-Z]+)$/;
  const patRowToRow = /^(\d+):(\d+)$/;

  let match;

  if ((match = rangeStr.match(patCellToCell))) {
    startCol = colLetterToNumber(match[1]);
    startRow = parseInt(match[2], 10);
    endCol = colLetterToNumber(match[3]);
    endRow = parseInt(match[4], 10);
  } else if ((match = rangeStr.match(patCellToCol))) {
    startCol = colLetterToNumber(match[1]);
    startRow = parseInt(match[2], 10);
    endCol = colLetterToNumber(match[3]);
    endRow = lastSheetRow;
  } else if ((match = rangeStr.match(patColToCol))) {
    startCol = colLetterToNumber(match[1]);
    startRow = 1;
    endCol = colLetterToNumber(match[2]);
    endRow = lastSheetRow;
  } else if ((match = rangeStr.match(patRowToRow))) {
    startCol = 1;
    startRow = parseInt(match[1], 10);
    endCol = lastSheetCol;
    endRow = parseInt(match[2], 10);
  } else {
    return {
      success: false,
      errorMessage: `Invalid dataRange: ${dataRange}`
    };
  }

  if (startCol > endCol) { const t = startCol; startCol = endCol; endCol = t; }
  if (startRow > endRow) { const t = startRow; startRow = endRow; endRow = t; }

  return {
    success: true,
    startCol,
    startRow,
    endCol,
    endRow
  };
}

function colLetterToNumber(letter) {
  let column = 0;
  const clean = letter.toUpperCase();
  for (let i = 0; i < clean.length; i++) {
    column = column * 26 + (clean.charCodeAt(i) - 64);
  }
  return column;
}

function numberToColLetter(num) {
  let letter = "";
  while (num > 0) {
    let remainder = (num - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
}

function validateAuthTokenWithAuthApi_(token) {
  return validateSession(token);
}


/**
 * ============================================================================
 * SECTION 2: GAS2 - ROW DATA API LOGIC
 * ============================================================================
 */

function handleRowApiDoGet_(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};

    const token = p.token || p.authToken || "";
    const auth = validateSession(token);

    if (!auth || auth.success !== true || !auth.user) {
      return createRowApiError_("Unauthorized. Sesi tidak valid atau telah habis.");
    }

 
    const gSheetID = p.GSheetID || "";
    const projectCode = String(auth.user.projectCode || "").trim();

    const accessCheck = checkWorkbookUserAccess_(
      gSheetID,
      auth.user.username,
      projectCode
    );


    if (!accessCheck.allowed) {
      return createRowApiError_("Forbidden: " + accessCheck.message);
    }

    if (!projectCode) {
      return createRowApiError_("Project Code tidak tersedia pada session.");
    }

    const params = validateRowApiParams_(e);
    params.ProjectCode = projectCode;
    const result = getGSheetRowDataByIDs_(params);
    result.userRoleInWorkbook = accessCheck.role;

    return createRowApiSuccess_(result);
  } catch (error) {
    return createRowApiError_(
      error && error.message ? error.message : String(error)
    );
  }
}

function validateRowApiParams_(e) {
  const p = e && e.parameter ? e.parameter : {};

  const required = [
    "GSheetID",
    "sheetName",
    "columnIDRow",
    "columnTitleRow",
    "columnTitleDescriptionRow",
    "columnTypeRow",
    "dataRange",
    "RowIDColumn",
    "ProjectIDColumn",
    "RowID",
    "columnIDs"
  ];

  required.forEach(function (key) {
    if (p[key] === undefined || p[key] === null || String(p[key]).trim() === "") {
      throw new Error("Parameter wajib tidak tersedia: " + key);
    }
  });

  const rowParams = ["columnIDRow", "columnTitleRow", "columnTitleDescriptionRow", "columnTypeRow"];

  rowParams.forEach(function (key) {
    const value = Number(p[key]);
    if (!Number.isInteger(value) || value < 1) {
      throw new Error("Parameter " + key + " harus berupa nomor baris positif.");
    }
  });

  let columnIDs;
  try {
    columnIDs = JSON.parse(p.columnIDs);
  } catch (error) {
    throw new Error("Parameter columnIDs bukan JSON yang valid.");
  }

  if (!Array.isArray(columnIDs) || columnIDs.length === 0) {
    throw new Error("columnIDs harus berupa JSON array yang tidak kosong.");
  }

  columnIDs = columnIDs.map(function (id) {
    if (typeof id !== "string" && typeof id !== "number") {
      throw new Error("Setiap columnID harus berupa string atau number.");
    }

    const normalized = String(id).trim();
    if (!normalized) {
      throw new Error("columnIDs tidak boleh berisi ID kosong.");
    }
    return normalized;
  });

  if (new Set(columnIDs).size !== columnIDs.length) {
    throw new Error("columnIDs tidak boleh berisi ID duplikat.");
  }

  const rowIDColumn = columnLetterToNumber_(p.RowIDColumn);

  return {
    GSheetID: String(p.GSheetID).trim(),
    sheetName: String(p.sheetName).trim(),
    columnIDRow: Number(p.columnIDRow),
    columnTitleRow: Number(p.columnTitleRow),
    columnTitleDescriptionRow: Number(p.columnTitleDescriptionRow),
    columnTypeRow: Number(p.columnTypeRow),
    dataRange: String(p.dataRange).trim(),
    RowIDColumn: String(p.RowIDColumn).trim(),
    rowIDColumnNumber: rowIDColumn,
    ProjectIDColumn: String(p.ProjectIDColumn).trim(),
    projectIDColumnNumber: columnLetterToNumber_(p.ProjectIDColumn),
    ProjectCode: "",
    RowID: String(p.RowID),
    columnIDs: columnIDs
  };
}

function getGSheetRowDataByIDs_(params) {
  let spreadsheet;
  let sheet;

  try {
    spreadsheet = SpreadsheetApp.openById(params.GSheetID);
    sheet = spreadsheet.getSheetByName(params.sheetName);

    if (!sheet) {
      throw new Error("Worksheet tidak ditemukan: " + params.sheetName);
    }
  } catch (error) {
    throw new Error("Gagal membuka spreadsheet atau worksheet. " + error.message);
  }

  const lastSheetRow = Math.max(sheet.getLastRow(), 1);
  const lastSheetCol = Math.max(sheet.getLastColumn(), 1);

  const rangeInfo = parseRowApiDataRange_(params.dataRange, lastSheetRow, lastSheetCol);

  if (rangeInfo.endRow > sheet.getMaxRows() || rangeInfo.endColumn > sheet.getMaxColumns()) {
    throw new Error("dataRange berada di luar ukuran worksheet.");
  }

  if (params.rowIDColumnNumber > sheet.getMaxColumns()) {
    throw new Error("RowIDColumn berada di luar ukuran worksheet.");
  }

  if (
    params.projectIDColumnNumber < 1 ||
    params.projectIDColumnNumber > sheet.getMaxColumns()
  ) {
    throw new Error("ProjectIDColumn berada di luar ukuran worksheet.");
  }

  if (!params.ProjectCode) {
    throw new Error("Project Code tidak tersedia pada session.");
  }

  const metadataRows = [
    params.columnIDRow,
    params.columnTitleRow,
    params.columnTitleDescriptionRow,
    params.columnTypeRow
  ];

  metadataRows.forEach(function (row) {
    if (row > sheet.getMaxRows()) {
      throw new Error("Baris metadata " + row + " berada di luar ukuran worksheet.");
    }
  });

  const dataStartColumn = rangeInfo.startColumn;
  const dataColumnCount = rangeInfo.columnCount;
  const dataStartRow = rangeInfo.startRow;
  const dataRowCount = rangeInfo.rowCount;

  const metadataRange = sheet.getRange(
    Math.min.apply(null, metadataRows),
    dataStartColumn,
    Math.max.apply(null, metadataRows) - Math.min.apply(null, metadataRows) + 1,
    dataColumnCount
  );

  const metadataValues = metadataRange.getDisplayValues();
  const metadataStartRow = Math.min.apply(null, metadataRows);

  function getMetadataRow_(absoluteRow) {
    return metadataValues[absoluteRow - metadataStartRow];
  }

  const ids = getMetadataRow_(params.columnIDRow);
  const titles = getMetadataRow_(params.columnTitleRow);
  const descriptions = getMetadataRow_(params.columnTitleDescriptionRow);
  const types = getMetadataRow_(params.columnTypeRow);

  const columnMap = {};

  ids.forEach(function (id, index) {
    const key = String(id).trim();

    if (key && columnMap[key] === undefined) {
      columnMap[key] = {
        offset: index,
        absoluteColumn: dataStartColumn + index,
        title: titles[index],
        description: descriptions[index],
        type: types[index]
      };
    }
  });

  const selectedColumns = params.columnIDs.map(function (id) {
    if (columnMap[id] === undefined) {
      throw new Error("Column ID '" + id + "' tidak ditemukan di dataRange " + params.dataRange + ".");
    }
    return columnMap[id];
  });

  const dataValues = sheet.getRange(
    dataStartRow,
    dataStartColumn,
    dataRowCount,
    dataColumnCount
  ).getDisplayValues();

  let rowIDValues;

  if (
    params.rowIDColumnNumber >= dataStartColumn &&
    params.rowIDColumnNumber < dataStartColumn + dataColumnCount
  ) {
    const rowIDOffset = params.rowIDColumnNumber - dataStartColumn;

    rowIDValues = dataValues.map(function (row) {
      return row[rowIDOffset];
    });
  } else {
    rowIDValues = sheet.getRange(
      dataStartRow,
      params.rowIDColumnNumber,
      dataRowCount,
      1
    ).getDisplayValues().map(function (row) {
      return row[0];
    });
  }

  const resultData = [];

  for (let i = 0; i < dataValues.length; i++) {
    if (rowIDValues[i] !== params.RowID) {
      continue;
    }

    const actualProjectCode = String(
      sheet.getRange(
        dataStartRow + i,
        params.projectIDColumnNumber
      ).getDisplayValue() || ""
    ).trim();

    if (
      actualProjectCode.toLowerCase() !==
      String(params.ProjectCode).trim().toLowerCase()
    ) {
      throw new Error("RowID tidak termasuk Project Code yang diizinkan.");
    }

    const item = {};

    params.columnIDs.forEach(function (id, index) {
      item[id] = dataValues[i][selectedColumns[index].offset];
    });

    resultData.push(item);
  }

  return {
    status: "success",
    error: null,
    RowID: params.RowID,
    columnIDs: params.columnIDs,
    columnTitles: selectedColumns.map(function (col) { return col.title; }),
    columnDescriptions: selectedColumns.map(function (col) { return col.description; }),
    columnTypes: selectedColumns.map(function (col) { return col.type; }),
    data: resultData,
    rowCount: resultData.length
  };
}

function parseRowApiDataRange_(a1Range, lastSheetRow, lastSheetCol) {
  const rangeStr = String(a1Range).toUpperCase().trim();

  let startColumn, startRow, endColumn, endRow;

  const patCellToCell = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/;
  const patCellToCol = /^([A-Z]+)(\d+):([A-Z]+)$/;
  const patColToCol = /^([A-Z]+):([A-Z]+)$/;
  const patRowToRow = /^(\d+):(\d+)$/;

  let match;

  if ((match = rangeStr.match(patCellToCell))) {
    startColumn = columnLetterToNumber_(match[1]);
    startRow = Number(match[2]);
    endColumn = columnLetterToNumber_(match[3]);
    endRow = Number(match[4]);
  } else if ((match = rangeStr.match(patCellToCol))) {
    startColumn = columnLetterToNumber_(match[1]);
    startRow = Number(match[2]);
    endColumn = columnLetterToNumber_(match[3]);
    endRow = lastSheetRow || 1;
  } else if ((match = rangeStr.match(patColToCol))) {
    startColumn = columnLetterToNumber_(match[1]);
    startRow = 1;
    endColumn = columnLetterToNumber_(match[2]);
    endRow = lastSheetRow || 1;
  } else if ((match = rangeStr.match(patRowToRow))) {
    startColumn = 1;
    startRow = Number(match[1]);
    endColumn = lastSheetCol || 1;
    endRow = Number(match[2]);
  } else {
    throw new Error(
      "dataRange tidak valid: " + a1Range + ". Gunakan format seperti B5:BW20 atau B5:BY."
    );
  }

  if (endColumn < startColumn || endRow < startRow) {
    throw new Error("dataRange memiliki batas akhir sebelum batas awal.");
  }

  return {
    startColumn: startColumn,
    startRow: startRow,
    endColumn: endColumn,
    endRow: endRow,
    columnCount: endColumn - startColumn + 1,
    rowCount: endRow - startRow + 1
  };
}

function columnLetterToNumber_(letters) {
  const value = String(letters).trim().toUpperCase();

  if (!/^[A-Z]+$/.test(value)) {
    throw new Error("Huruf kolom tidak valid: " + letters);
  }

  let number = 0;
  for (let i = 0; i < value.length; i++) {
    number = number * 26 + value.charCodeAt(i) - 64;
  }
  return number;
}

function createRowApiSuccess_(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function createRowApiError_(message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "error",
      error: String(message),
      data: [],
      rowCount: 0
    }))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * ============================================================================
 * SECTION 3: GAS3 - AUTHENTICATION API LOGIC
 * ============================================================================
 */

const AUTH_CONFIG = {
  SPREADSHEET_ID: "1hcpqlhlVR5oEV_ASxPH4E1olaT6UplG8DlMSgp2iqsE",
  SHEET_USER_NAME: "Users",
  PROJECTS_SHEET_NAME: "ProjectList", // Sheet daftar project
  SESSION_HOURS: 8,
  SESSION_PREFIX: "AUTH_SESSION_"
};


function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * Mengambil daftar Project Code dan Project Name dari sheet "ProjectList".
 * Publik (tidak memerlukan token / login).
 */
function getProjectList() {
  try {
    const ss = SpreadsheetApp.openById(AUTH_CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(AUTH_CONFIG.PROJECTS_SHEET_NAME);

    if (!sheet) {
      return {
        success: false,
        message: `Sheet '${AUTH_CONFIG.PROJECTS_SHEET_NAME}' tidak ditemukan.`,
        data: []
      };
    }

    const lastRow = sheet.getLastRow();

    // Jika tidak ada data (hanya header atau kosong)
    if (lastRow < 2) {
      return {
        success: true,
        message: "Daftar project kosong.",
        data: []
      };
    }

    // Ambil Kolom A (Project Code) dan Kolom B (Project Name) mulai baris ke-2
    const rows = sheet.getRange(2, 1, lastRow - 1, 10).getDisplayValues();
    console.log(rows)

    const projects = rows
      .map(function (row) {
        return {
          projectID: String(row[0] || "").trim(),
          projectName: String(row[1] || "").trim(),
          shipmentNoPrefix: String(row[2] || "").trim(),
          regEx: String(row[3] || "").trim(),
          prop1: String(row[4] || "").trim(),
          prop2: String(row[5] || "").trim(),
          prop3: String(row[6] || "").trim(),
          prop4: String(row[7] || "").trim(),
          prop5: String(row[8] || "").trim(),
          prop6: String(row[9] || "").trim()

        };

      })
      .filter(function (item) {
        // Hanya ambil baris yang memiliki Project Code (tidak kosong)
       return item.projectID !== "";
      });

    return {
      success: true,
      message: "Berhasil mengambil daftar project.",
      data: projects
    };

  } catch (error) {
    return {
      success: false,
      message: "Gagal mengambil daftar project: " + (error.message || String(error)),
      data: []
    };
  }
}

/**
 * Fungsi Login yang Memvalidasi Username, Password, dan Project Code.
 */
function login(username, password, projectCode) {
  username = String(username || "").trim();
  password = String(password || "");
  projectCode = String(projectCode || "").trim();

  if (!username || !password) {
    return { success: false, message: "Username dan password wajib diisi." };
  }

  if (!projectCode) {
    return { success: false, message: "Project Code wajib dipilih." };
  }

  const sheet = getUserSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { success: false, message: "Belum ada akun user." };
  }

  // Mengambil 7 kolom: A(ID), B(User), C(Name), D(Password), E(Role), F(Active), G(Project Code)
  const rows = sheet.getRange(2, 1, lastRow - 1, 7).getDisplayValues();

  // 1. Filter baris berdasarkan Username DAN Project Code yang cocok
  const matches = rows.filter(function (row) {
    const rowUsername = String(row[1] || "").trim().toLowerCase();
    const rowProjectCode = String(row[6] || "").trim().toLowerCase();
    return rowUsername === username.toLowerCase() && rowProjectCode === projectCode.toLowerCase();
  });

  if (matches.length !== 1) {
    return { success: false, message: "Username, password, atau Project Code salah." };
  }

  // 2. Hash password input
  const suppliedHash = "SHA256$" + sha256Hex_(password);

  // 3. Verifikasi Password dan Status Aktif
  let validUserRow = null;
  for (let i = 0; i < matches.length; i++) {
    const row = matches[i];
    const storedHash = String(row[3] || "").trim();
    const activeStatus = String(row[5] || "").trim().toUpperCase();

    if (activeStatus === "TRUE" && storedHash === suppliedHash) {
      validUserRow = row;
      break;
    }
  }

  if (!validUserRow) {
    return { success: false, message: "Username, password, atau Project Code salah / akun tidak aktif." };
  }

  // 4. Ambil data spesifik dari baris terverifikasi
  const id = String(validUserRow[0] || "").trim();
  const role = String(validUserRow[4] || "").trim();
  const activeStatus = String(validUserRow[5] || "").trim().toUpperCase();
  const matchedProjectCode = String(validUserRow[6] || "").trim();

  if (
    !id ||
    !role ||
    !["VIEWER", "EDITOR", "DEVELOPER"].includes(role.toUpperCase())
  ) {
    return { success: false, message: "Konfigurasi akun tidak valid." };
  }

  const token = Utilities.getUuid() + Utilities.getUuid();
  const now = Date.now();

  const session = {
    userId: id,
    createdAt: now,
    expiresAt: now + AUTH_CONFIG.SESSION_HOURS * 60 * 60 * 1000
  };

  const key = AUTH_CONFIG.SESSION_PREFIX + sha256Hex_(token);

  PropertiesService.getScriptProperties().setProperty(
    key,
    JSON.stringify(session)
  );

  return {
    success: true,
    message: "Login berhasil.",
    token: token,
    expiresAt: session.expiresAt,
    user: {
      id: id,
      username: String(validUserRow[1]).trim(),
      name: String(validUserRow[2] || "").trim(),
      role: role,
      active: activeStatus,
      projectCode: matchedProjectCode
    }
  };
}

function validateSession(token) {
  token = String(token || "");

  if (!token || token.length < 60 || token.length > 200) {
    return { success: false, message: "Token tidak valid." };
  }

  const key = AUTH_CONFIG.SESSION_PREFIX + sha256Hex_(token);
  const properties = PropertiesService.getScriptProperties();
  const stored = properties.getProperty(key);

  if (!stored) {
    return { success: false, message: "Sesi tidak ditemukan." };
  }

  let session;

  try {
    session = JSON.parse(stored);
  } catch (err) {
    properties.deleteProperty(key);
    return { success: false, message: "Data sesi tidak valid." };
  }

  if (
    !session ||
    !session.userId ||
    !Number.isFinite(Number(session.expiresAt)) ||
    Date.now() >= Number(session.expiresAt)
  ) {
    properties.deleteProperty(key);
    return { success: false, message: "Sesi kedaluwarsa." };
  }

  const user = findUserById_(session.userId);

  if (!user) {
    properties.deleteProperty(key);
    return { success: false, message: "Akun tidak ditemukan atau tidak aktif." };
  }

  return {
    success: true,
    user: user,
    expiresAt: session.expiresAt
  };
}

function logout(token) {
  token = String(token || "");

  if (!token || token.length < 60 || token.length > 200) {
    return { success: false, message: "Token tidak valid." };
  }

  const key = AUTH_CONFIG.SESSION_PREFIX + sha256Hex_(token);
  PropertiesService.getScriptProperties().deleteProperty(key);

  return { success: true, message: "Logout berhasil." };
}

function findUserById_(userId) {
  const sheet = getUserSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return null;

  // Mengambil 7 kolom (A-G)
  const rows = sheet.getRange(2, 1, lastRow - 1, 7).getDisplayValues();
  const matches = rows.filter(function (row) {
    return String(row[0] || "").trim() === String(userId);
  });

  if (matches.length !== 1) return null;

  const row = matches[0];
  const username = String(row[1] || "").trim();
  const name = String(row[2] || "").trim();
  const role = String(row[4] || "").trim();
  const activeStatus = String(row[5] || "").trim().toUpperCase();
  const projectCode = String(row[6] || "").trim();

  const allowedRoles = ["VIEWER", "EDITOR", "DEVELOPER"];

  if (
    !username ||
    !role ||
    activeStatus !== "TRUE" ||
    !allowedRoles.includes(role.toUpperCase()) ||
    !projectCode
  ) return null;

  return {
    id: String(row[0]).trim(),
    username: username,
    name: name,
    role: role,
    active: activeStatus,
    projectCode: projectCode
  };
}

function getUserSheet_() {
  const ss = SpreadsheetApp.openById(AUTH_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(AUTH_CONFIG.SHEET_USER_NAME);

  if (!sheet) throw new Error("Sheet User tidak ditemukan.");

  return sheet;
}

function sha256Hex_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );

  return bytes.map(function (b) {
    return ((b + 256) % 256).toString(16).padStart(2, "0");
  }).join("");
}

function cleanupExpiredSessions() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();
  const now = Date.now();

  let deleted = 0;

  Object.keys(allProperties).forEach(function (key) {
    if (!key.startsWith(AUTH_CONFIG.SESSION_PREFIX)) {
      return;
    }

    try {
      const session = JSON.parse(allProperties[key]);

      if (!session || !Number.isFinite(Number(session.expiresAt)) || now >= Number(session.expiresAt)) {
        properties.deleteProperty(key);
        deleted++;
      }
    } catch (error) {
      properties.deleteProperty(key);
      deleted++;
    }
  });

  console.log("Session kedaluwarsa dihapus: " + deleted);
}

function createSessionCleanupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();

  const exists = triggers.some(function (trigger) {
    return trigger.getHandlerFunction() === "cleanupExpiredSessions";
  });

  if (exists) {
    console.log("Trigger sudah tersedia.");
    return;
  }

  ScriptApp.newTrigger("cleanupExpiredSessions")
    .timeBased()
    .everyHours(1)
    .create();

  console.log("Trigger cleanup dibuat.");
}

function migratePasswordsToHash() {
  var ss = SpreadsheetApp.openById(AUTH_CONFIG.SPREADSHEET_ID);

  var sheet = ss.getSheetByName(AUTH_CONFIG.SHEET_USER_NAME);
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    throw new Error("Tidak ada data user untuk dimigrasikan.");
  }

  var range = sheet.getRange(2, 4, lastRow - 1, 1);
  var passwords = range.getValues();

  var updated = passwords.map(function (row) {
    var password = String(row[0] || "");

    if (!password) {
      return [""];
    }

    if (password.indexOf("SHA256$") === 0) {
      return [password];
    }

    var bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password,
      Utilities.Charset.UTF_8
    );

    var hash = bytes.map(function (b) {
      var value = (b + 256) % 256;
      return value.toString(16).padStart(2, "0");
    }).join("");

    return ["SHA256$" + hash];
  });

  range.setValues(updated);

  Logger.log("Migrasi password selesai.");
}


/**
 * ============================================================================
 * SAVE SECTION
 * ============================================================================
 */

function handleUpdateRow_(body) {
  try {
    if (!body || !body.token) {
      return updateRowJson_({
        success: false,
        message: "Token autentikasi wajib diisi."
      });
    }

    var requiredFields = [
      "GSheetID",
      "sheetName",
      "dataRange",
      "RowIDColumn",
      "ProjectIDColumn",
      "RowID"
    ];

    for (var i = 0; i < requiredFields.length; i++) {
      var field = requiredFields[i];

      if (
        body[field] === undefined ||
        body[field] === null ||
        String(body[field]).trim() === ""
      ) {
        return updateRowJson_({
          success: false,
          message: "Parameter wajib tidak tersedia: " + field
        });
      }
    }

    if (
      !body.changes ||
      typeof body.changes !== "object" ||
      Array.isArray(body.changes)
    ) {
      return updateRowJson_({
        success: false,
        message: "changes harus berupa object kolom dan nilai."
      });
    }

    var changedColumnIDs = Object.keys(body.changes);

    if (changedColumnIDs.length === 0) {
      return updateRowJson_({
        success: false,
        message: "Tidak ada perubahan untuk disimpan."
      });
    }

    var auth = validateSession(String(body.token));

    if (!auth || auth.success !== true || !auth.user) {
      return updateRowJson_({
        success: false,
        message: "Session tidak valid atau sudah kedaluwarsa."
      });
    }

    var authUser = auth.user;

    if (authUser.active === false) {
      return updateRowJson_({
        success: false,
        message: "Akun tidak aktif."
      });
    }

    var username = authUser.username;
    var authenticatedProjectCode = String(authUser.projectCode || "").trim();

    if (!authenticatedProjectCode) {
      return updateRowJson_({
        success: false,
        message: "Project Code tidak ditemukan pada session."
      });
    }

    if (!username) {
      return updateRowJson_({
        success: false,
        message: "Informasi username tidak ditemukan dalam session."
      });
    }

    var access = checkWorkbookUserAccess_(
      String(body.GSheetID),
      String(username),
      authenticatedProjectCode
    );

    if (!access || !access.allowed) {
      return updateRowJson_({
        success: false,
        message: "User tidak memiliki akses ke workbook ini."
      });
    }

    var role = String(access.role || authUser.role || "")
      .trim()
      .toUpperCase();

    if (role !== "EDITOR" && role !== "DEVELOPER") {
      return updateRowJson_({
        success: false,
        message: "Akses simpan ditolak. Role harus EDITOR atau DEVELOPER."
      });
    }

    var rangeMatch = String(body.dataRange)
      .trim()
      .toUpperCase()
      .match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)?$/);

    if (!rangeMatch) {
      return updateRowJson_({
        success: false,
        message: "Format dataRange tidak valid: " + body.dataRange
      });
    }

    var startColumn = updateRowColumnNumber_(rangeMatch[1]);
    var startRow = Number(rangeMatch[2]);
    var endColumn = updateRowColumnNumber_(rangeMatch[3]);

    if (
      startColumn < 1 ||
      endColumn < startColumn ||
      startRow < 1
    ) {
      return updateRowJson_({
        success: false,
        message: "Rentang data tidak valid."
      });
    }

    var spreadsheet = SpreadsheetApp.openById(String(body.GSheetID));
    var sheet = spreadsheet.getSheetByName(String(body.sheetName));

    if (!sheet) {
      return updateRowJson_({
        success: false,
        message: "Sheet tidak ditemukan: " + body.sheetName
      });
    }

    var lastRow = sheet.getLastRow();
    var endRow = rangeMatch[4]
      ? Math.min(Number(rangeMatch[4]), lastRow)
      : lastRow;

    if (endRow < startRow) {
      return updateRowJson_({
        success: false,
        message: "Tidak ada baris data pada rentang tersebut."
      });
    }

    var columnIDRow = Number(body.columnIDRow || 1);

    if (
      !Number.isInteger(columnIDRow) ||
      columnIDRow < 1 ||
      columnIDRow >= startRow
    ) {
      return updateRowJson_({
        success: false,
        message: "Posisi metadata columnIDRow tidak valid."
      });
    }

    var metadata = sheet
      .getRange(
        columnIDRow,
        startColumn,
        1,
        endColumn - startColumn + 1
      )
      .getDisplayValues()[0];

    var columnMap = {};

    metadata.forEach(function (value, index) {
      var columnID = String(value).trim();

      if (columnID !== "") {
        if (columnMap[columnID] !== undefined) {
          columnMap[columnID] = null;
        } else {
          columnMap[columnID] = startColumn + index;
        }
      }
    });

    var updates = [];

    for (var j = 0; j < changedColumnIDs.length; j++) {
      var changedID = String(changedColumnIDs[j]).trim();
      var physicalColumn = columnMap[changedID];

      if (
        changedID === "" ||
        physicalColumn === undefined ||
        physicalColumn === null
      ) {
        return updateRowJson_({
          success: false,
          message: "Column ID tidak valid atau duplikat: " + changedID
        });
      }

      updates.push({
        columnID: changedID,
        columnNumber: physicalColumn,
        value: body.changes[changedColumnIDs[j]]
      });
    }

    var rowIDColumn = updateRowColumnNumber_(
      String(body.RowIDColumn).trim().toUpperCase()
    );

    if (rowIDColumn < 1) {
      return updateRowJson_({
        success: false,
        message: "RowIDColumn tidak valid."
      });
    }

    var targetRowID = String(body.RowID).trim();

    var rowIDs = sheet
      .getRange(startRow, rowIDColumn, endRow - startRow + 1, 1)
      .getDisplayValues();

    var matchedRow = 0;
    var matchCount = 0;

    for (var k = 0; k < rowIDs.length; k++) {
      if (String(rowIDs[k][0]).trim() === targetRowID) {
        matchedRow = startRow + k;
        matchCount++;
      }
    }

    if (matchCount === 0) {
      return updateRowJson_({
        success: false,
        message: "RowID tidak ditemukan: " + targetRowID
      });
    }

    if (matchCount > 1) {
      return updateRowJson_({
        success: false,
        message: "RowID duplikat. Penyimpanan dibatalkan: " + targetRowID
      });
    }

    var projectColumnLetter = String(
      body.ProjectIDColumn || ""
    ).trim().toUpperCase();

    var projectColumnNumber = updateRowColumnNumber_(
      projectColumnLetter
    );

    if (
      projectColumnNumber < 1 ||
      projectColumnNumber > sheet.getMaxColumns()
    ) {
      return updateRowJson_({
        success: false,
        message: "ProjectIDColumn tidak valid: " + projectColumnLetter
      });
    }

    var actualProjectID = String(
      sheet.getRange(matchedRow, projectColumnNumber).getDisplayValue() || ""
    ).trim();

    if (
      actualProjectID.toLowerCase() !==
      authenticatedProjectCode.toLowerCase()
    ) {
      return updateRowJson_({
        success: false,
        message: "RowID tidak termasuk Project Code yang diizinkan."
      });
    }

    // Kolom ProjectID tidak boleh diubah melalui endpoint save.
    if (updates.some(function (item) {
      return item.columnNumber === projectColumnNumber;
    })) {
      return updateRowJson_({
        success: false,
        message: "Kolom ProjectID tidak boleh diubah melalui endpoint ini."
      });
    }

    var lock = LockService.getScriptLock();

    if (!lock.tryLock(10000)) {
      return updateRowJson_({
        success: false,
        message: "Sistem sedang memproses penyimpanan lain. Coba lagi."
      });
    }

    try {
      updates.forEach(function (item) {
        var cell = sheet.getRange(matchedRow, item.columnNumber);

        var valueToSave =
          item.value === null || item.value === undefined
            ? ""
            : item.value;

        if (
          typeof valueToSave === "string" &&
          /^\d{4}-\d{2}-\d{2}T/.test(valueToSave)
        ) {
          var datePart = valueToSave.substring(0, 10);
          var dateParts = datePart.split("-");

          valueToSave = new Date(
            Number(dateParts[0]),
            Number(dateParts[1]) - 1,
            Number(dateParts[2])
          );
        }

        cell.setValue(valueToSave);
      });

      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    return updateRowJson_({
      success: true,
      message: "Data berhasil disimpan.",
      RowID: targetRowID,
      updatedColumnIDs: updates.map(function (item) {
        return item.columnID;
      })
    });

  } catch (error) {
    return updateRowJson_({
      success: false,
      message: "Gagal menyimpan data: " + error.message
    });
  }
}

function updateRowColumnNumber_(columnLetters) {
  var letters = String(columnLetters || "").trim().toUpperCase();

  if (!/^[A-Z]+$/.test(letters)) {
    return 0;
  }

  var number = 0;
  for (var i = 0; i < letters.length; i++) {
    number = number * 26 + letters.charCodeAt(i) - 64;
  }
  return number;
}

function updateRowJson_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}



/**
 * ============================================================================
 * ADD NEW ROW LOGIC (Generate UUID & Auto Increment Main ID per Project)
 * MainIDColumn ditentukan berdasarkan Column ID pada metadata row.
 * ============================================================================
 */
function handleAddNewRow_(body) {
  try {
    // 1. Validasi Token & Authenticated User
    if (!body || !body.token) {
      return jsonResponse_({
        success: false,
        message: "Token autentikasi wajib diisi."
      });
    }

    var auth = validateSession(String(body.token));

    if (!auth || auth.success !== true || !auth.user) {
      return jsonResponse_({
        success: false,
        message: "Session tidak valid atau sudah kedaluwarsa."
      });
    }

    var authUser = auth.user;

    if (authUser.active === false) {
      return jsonResponse_({
        success: false,
        message: "Akun tidak aktif."
      });
    }

    var username = authUser.username;
    var authenticatedProjectCode = String(authUser.projectCode || "").trim();

    if (!authenticatedProjectCode) {
      return jsonResponse_({
        success: false,
        message: "Project Code tidak ditemukan pada session."
      });
    }

    // 2. Validasi Hak Akses Workbook (Harus EDITOR atau DEVELOPER)
    var access = checkWorkbookUserAccess_(
      String(body.GSheetID || ""),
      String(username),
      authenticatedProjectCode
    );

    if (!access || !access.allowed) {
      return jsonResponse_({
        success: false,
        message: "User tidak memiliki akses ke workbook ini."
      });
    }

    var role = String(access.role || authUser.role || "")
      .trim()
      .toUpperCase();

    if (role !== "EDITOR" && role !== "DEVELOPER") {
      return jsonResponse_({
        success: false,
        message: "Akses tambah data ditolak. Role harus EDITOR atau DEVELOPER."
      });
    }

    // 3. Validasi Parameter Wajib
    var requiredFields = [
      "GSheetID",
      "sheetName",
      "RowIDColumn",
      "ProjectIDColumn"
    ];

    for (var i = 0; i < requiredFields.length; i++) {
      var field = requiredFields[i];

      if (
        body[field] === undefined ||
        body[field] === null ||
        String(body[field]).trim() === ""
      ) {
        return jsonResponse_({
          success: false,
          message: "Parameter wajib tidak tersedia: " + field
        });
      }
    }

    // 4. Buka Spreadsheet & Sheet
    var spreadsheet = SpreadsheetApp.openById(String(body.GSheetID));
    var sheet = spreadsheet.getSheetByName(String(body.sheetName));

    if (!sheet) {
      return jsonResponse_({
        success: false,
        message: "Sheet tidak ditemukan: " + body.sheetName
      });
    }

    // 5. Hitung Indeks Kolom UUID dan Project ID
    var rowIDColumnNumber = columnLetterToNumber_(
      String(body.RowIDColumn).trim()
    );

    var projectIDColumnNumber = columnLetterToNumber_(
      String(body.ProjectIDColumn).trim()
    );

    if (
      rowIDColumnNumber < 1 ||
      rowIDColumnNumber > sheet.getMaxColumns()
    ) {
      return jsonResponse_({
        success: false,
        message: "RowIDColumn berada di luar batas sheet."
      });
    }

    if (
      projectIDColumnNumber < 1 ||
      projectIDColumnNumber > sheet.getMaxColumns()
    ) {
      return jsonResponse_({
        success: false,
        message: "ProjectIDColumn berada di luar batas sheet."
      });
    }

    // 6. Tentukan Kolom Main ID berdasarkan Column ID
    var mainIDColumnNumber = 0;

    var mainIDColumnID = String(
      body.mainIDColumnID || ""
    ).trim();

    if (mainIDColumnID !== "") {

      var columnIDRow = Number(body.columnIDRow || 1);
      var dataRange = String(body.dataRange || "").trim();

      if (!dataRange) {
        return jsonResponse_({
          success: false,
          message: "Parameter dataRange wajib diisi untuk mencari mainIDColumnID."
        });
      }

      if (
        !Number.isInteger(columnIDRow) ||
        columnIDRow < 1
      ) {
        return jsonResponse_({
          success: false,
          message: "columnIDRow tidak valid."
        });
      }

      // Parse dataRange untuk mengetahui batas kolom metadata
      var rangeInfo = parseRangeInfo(
        dataRange,
        sheet.getLastRow(),
        sheet.getLastColumn()
      );

      if (!rangeInfo.success) {
        return jsonResponse_({
          success: false,
          message: "dataRange tidak valid: " + dataRange
        });
      }

      // Ambil metadata Column ID
      var metadataValues = sheet.getRange(
        columnIDRow,
        rangeInfo.startCol,
        1,
        rangeInfo.endCol - rangeInfo.startCol + 1
      ).getDisplayValues()[0];

      var matchedColumns = [];

      for (var m = 0; m < metadataValues.length; m++) {
        var currentColumnID = String(
          metadataValues[m] || ""
        ).trim();

        if (currentColumnID === mainIDColumnID) {
          matchedColumns.push(rangeInfo.startCol + m);
        }
      }

      if (matchedColumns.length === 0) {
        return jsonResponse_({
          success: false,
          message: "Column ID MainID tidak ditemukan: " + mainIDColumnID
        });
      }

      if (matchedColumns.length > 1) {
        return jsonResponse_({
          success: false,
          message: "Column ID MainID ditemukan lebih dari satu kali: " + mainIDColumnID
        });
      }

      mainIDColumnNumber = matchedColumns[0];

    } else {

      // Fallback: tetap mendukung parameter MainIDColumn berupa huruf kolom
      var mainIDColumnLetter = String(
        body.MainIDColumn || ""
      ).trim();

      if (mainIDColumnLetter !== "") {
        mainIDColumnNumber = columnLetterToNumber_(
          mainIDColumnLetter
        );
      }
    }

    if (
      mainIDColumnNumber > 0 &&
      mainIDColumnNumber > sheet.getMaxColumns()
    ) {
      return jsonResponse_({
        success: false,
        message: "MainIDColumn berada di luar batas sheet."
      });
    }

    // 7. Gunakan LockService untuk Mencegah Race Condition / Nomor Duplikat
    var lock = LockService.getScriptLock();

    if (!lock.tryLock(10000)) {
      return jsonResponse_({
        success: false,
        message: "Sistem sedang sibuk memproses penambahan baris lain. Coba lagi."
      });
    }

    var newRowID = "";
    var newMainIDValue = "";
    var targetRowIndex = 0;

    try {

      // Generate UUID v4
      newRowID = Utilities.getUuid();

      targetRowIndex = sheet.getLastRow() + 1;

      // 8. Auto-Increment Main ID
      if (
        mainIDColumnNumber >= 1 &&
        mainIDColumnNumber <= sheet.getMaxColumns()
      ) {

        var startDataRow = Number(body.startRow || 5);

        if (
          !Number.isInteger(startDataRow) ||
          startDataRow < 1
        ) {
          throw new Error("startRow tidak valid.");
        }

        var totalRows = targetRowIndex - startDataRow;

        var maxSeq = 0;
        var detectedPrefix = "";
        var numDigits = 5;

        if (totalRows > 0) {

          // Ambil Main ID dan Project ID dari seluruh baris data
          var mainIDValues = sheet.getRange(
            startDataRow,
            mainIDColumnNumber,
            totalRows,
            1
          ).getDisplayValues();

          var projectIDValues = sheet.getRange(
            startDataRow,
            projectIDColumnNumber,
            totalRows,
            1
          ).getDisplayValues();

          // Prefix + optional hyphen + angka + optional suffix huruf
          var pattern = /^(.*?)(-?)(\d+)([A-Za-z]*)$/;

          for (var r = 0; r < totalRows; r++) {

            var rowProjectCode = String(
              projectIDValues[r][0] || ""
            ).trim();

            // Hanya periksa baris dengan Project ID sesuai session
            if (rowProjectCode !== authenticatedProjectCode) {
              continue;
            }

            var val = String(
              mainIDValues[r][0] || ""
            ).trim();

            if (!val) continue;

            var match = val.match(pattern);

            if (match) {

              var prefixPart = match[1] + match[2];
              var numberPartStr = match[3];
              var seqNum = parseInt(numberPartStr, 10);

              if (seqNum > maxSeq) {

                maxSeq = seqNum;
                detectedPrefix = prefixPart;

                // Mengikuti jumlah digit Main ID existing
                numDigits = numberPartStr.length;
              }
            }
          }
        }

        // Generate nomor berikutnya
        var nextSeq = maxSeq + 1;

        var formattedNumber = String(nextSeq).padStart(
          numDigits,
          "0"
        );

        newMainIDValue = detectedPrefix + formattedNumber;

        console.log("Project Code:", authenticatedProjectCode);
        console.log("MainIDColumn:", mainIDColumnNumber);
        console.log("mainIDColumnID:", mainIDColumnID);
        console.log("Detected Prefix:", detectedPrefix);
        console.log("Max Sequence:", maxSeq);
        console.log("New Main ID:", newMainIDValue);

        // Tulis Main ID baru
        sheet.getRange(
          targetRowIndex,
          mainIDColumnNumber
        ).setValue(newMainIDValue);
      }

      // 9. Tulis UUID dan ProjectCode pada baris baru
      sheet.getRange(
        targetRowIndex,
        rowIDColumnNumber
      ).setValue(newRowID);

      sheet.getRange(
        targetRowIndex,
        projectIDColumnNumber
      ).setValue(authenticatedProjectCode);

      SpreadsheetApp.flush();

    } finally {
      lock.releaseLock();
    }

    // 10. Kembalikan Response Berhasil
    return jsonResponse_({
      success: true,
      message: "Baris baru berhasil ditambahkan.",
      newRowID: newRowID,
      newMainIDValue: newMainIDValue,
      rowIndex: targetRowIndex,
      projectCode: authenticatedProjectCode,
      mainIDColumnID: mainIDColumnID

    });

  } catch (error) {

    console.error("handleAddNewRow_ error:", error);

    return jsonResponse_({
      success: false,
      message: "Gagal menambah baris baru: " +
        (error.message || String(error))
    });
  }

}

/**
 * ============================================================================
 * SECTION 4: TEST FUNCTIONS
 * ============================================================================
 */

function testDoPostLoginWithProjectCode() {
  const e = {
    postData: {
      contents: JSON.stringify({
        action: "login",
        username: "nana",
        password: "abc",
        projectCode: "25-1808"
      })
    }
  };

  const response = doPost(e);
  const result = JSON.parse(response.getContent());

  Logger.log("========== TEST LOGIN WITH PROJECT CODE ==========");
  Logger.log(JSON.stringify(result, null, 2));
}



/**
 * Test fungsi untuk membuat baris baru via action "addNewRow" (UUID + MainID Auto Increment).
 * Dijalankan langsung dari GAS Editor.
 */
function testDoPostAddNewRow() {
  // 1. Ambil/Buat sesi valid untuk testing
  const testUsername = "nana";
  const testPassword = "abc";
  const testProjectCode = "18-1206";

  Logger.log("1. Melakukan login untuk mendapatkan token tes...");
  const loginResult = login(testUsername, testPassword, testProjectCode);

  if (!loginResult || !loginResult.success) {
    Logger.log("❌ Gagal login untuk testing: " + (loginResult ? loginResult.message : "No response"));
    return;
  }

  const token = loginResult.token;
  Logger.log("✅ Token berhasil didapat: " + token);

  // 2. Siapkan payload simulasi e.postData.contents untuk "addNewRow"
  // SESUAIKAN GSheetID, sheetName, dan kolom-kolom target dengan sheet Anda
  const payload = {
    action: "addNewRow",
    token: token,
    GSheetID: "1QnTPM7t8dgnboekqkwq1su1ycyRS7BbW1uVj83qrtEo", // Ganti dengan GSheetID Anda
    sheetName: "Data",                              // Ganti dengan nama sheet target
    RowIDColumn: "A",                                       // Kolom tempat UUID disimpan
    ProjectIDColumn: "B",                                   // Kolom tempat ProjectCode disimpan
    mainIDColumnID: "2",                                      // Kolom tempat Nomor Shipment/Main ID disimpan
    columnIDRow: 1,
    dataRange: "B5:BY",
    startRow: 5                                             // Baris pertama data dimulai (opsional, default: 5)
  };

  const e = {
    postData: {
      contents: JSON.stringify(payload)
    }
  };

  // 3. Eksekusi fungsi doPost
  Logger.log("2. Memanggil doPost dengan action 'addNewRow'...");
  const response = doPost(e);
  const result = JSON.parse(response.getContent());

  // 4. Tampilkan Log Hasil Test
  Logger.log("========== TEST ADD NEW ROW RESULT ==========");
  Logger.log(JSON.stringify(result, null, 2));

  // 5. Bersihkan sesi tes
  logout(token);
  Logger.log("3. Sesi tes dibersihkan (logout).");
}





/**
 * Test fungsi untuk memverifikasi request doGet dengan ProjectID = "any" (Dropdown List).
 * Dijalankan langsung dari Google Apps Script Editor.
 */
function testDoGetFetchDropdowns() {
  // 1. Login terlebih dahulu untuk mendapatkan token sesi tes
  const testUsername = "nana";
  const testPassword = "abc";
  const testProjectCode = "18-1206";

  Logger.log("1. Melakukan login untuk mendapatkan token tes...");
  const loginResult = login(testUsername, testPassword, testProjectCode);

  if (!loginResult || !loginResult.success) {
    Logger.log("❌ Gagal login untuk testing: " + (loginResult ? loginResult.message : "No response"));
    return;
  }

  const token = loginResult.token;
  Logger.log("✅ Token berhasil didapat: " + token);

  // 2. Simulasi parameter HTTP GET e.parameter dari vue/globalDropdownStore.js
  const e = {
    parameter: {
      token: token,
      GSheetID: "1QnTPM7t8dgnboekqkwq1su1ycyRS7BbW1uVj83qrtEo",
      sheetName: "Dropdowns",
      columnIDRow: "1",
      columnTitleRow: "2",
      columnTitleDescriptionRow: "3",
      columnTypeRow: "4",
      dataRange: "b5:Z",
      RowIDColumn: "A",
      ProjectID: "any",          // Explicitly set "any"
      ProjectIDColumn: "B"
    }
  };

  // 3. Eksekusi handler doGet
  Logger.log("2. Memanggil doGet dengan ProjectID = 'any'...");
  const response = doGet(e);
  const result = JSON.parse(response.getContent());

  // 4. Log hasil pemeriksaan
  Logger.log("========== TEST FETCH DROPDOWNS RESULT ==========");
  Logger.log("Status Response : " + result.status);
  Logger.log("Jumlah Kolom    : " + (result.columnIDs ? result.columnIDs.length : 0));
  Logger.log("Jumlah Baris    : " + (result.data ? result.data.length : 0));

  if (result.status === "success" && result.data && result.data.length > 0) {
    Logger.log("✅ BERHASIL: Data dropdown dengan ProjectID 'any' berhasil ditarik!");
    Logger.log("Sample Data Baris Pertama: " + JSON.stringify(result.data[0]));
  } else {
    Logger.log("⚠️ PERHATIAN: Response success tetapi array data kosong. Pastikan di sheet 'Dropdowns' kolom B berisi teks 'any'.");
  }

  // 5. Cleanup sesi tes
  logout(token);
  Logger.log("3. Sesi tes dibersihkan (logout).");
}


function getprojlisttest() {
  const a = getProjectList()
  console.log(a)
}
