/**
 * ============================================================================
 * MAIN WEB APP ROUTER (doGet & doPost)
 * ============================================================================
 */

/**
 * Main HTTP GET Endpoint Router.
 * Memilih handler berdasarkan parameter request e.parameter.
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
        result = login(body.username, body.password);
        break;

      case "validateSession":
        result = validateSession(body.token);
        break;

      case "logout":
        result = logout(body.token);
        break;

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
    // Jangan mengirim detail internal ke client.
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

/**
 * Handler doGet khusus untuk mengambil seluruh data GSheet (GAS1).
 */
function handleGSheetDataDoGet_(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};

    // 1. Token wajib dikirim oleh client.
    const token = params.token || params.authToken || "";

    // 2. Validasi token global (Authentication)
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

    // 3. Validasi Otorisasi Spesifik pada Workbook Target (User Access Sheet)
    const accessCheck = checkWorkbookUserAccess_(gSheetID, auth.user.username);
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

    // 4. Baca parameter data setelah otorisasi workbook berhasil
    const columnIDRow = parseInt(
      params.columnIDRow || params.columnidrow || "1",
      10
    );

    const columnTitleRow = parseInt(
      params.columnTitleRow || params.columntitlerow || "2",
      10
    );

    const columnTitleDescriptionRow = parseInt(
      params.columnTitleDescriptionRow ||
      params.columntitledescriptionrow || "3",
      10
    );

    const columnTypeRow = parseInt(
      params.columnTypeRow || params.columntyperow || "4",
      10
    );

    const dataRange = params.dataRange || params.datarange || "A5:Z";
    const rowIDColumn = params.RowIDColumn || params.rowidcolumn || "";

    // 5. Ambil data dari Google Sheet
    const result = getGSheetData(
      gSheetID,
      sheetName,
      columnIDRow,
      columnTitleRow,
      columnTitleDescriptionRow,
      columnTypeRow,
      dataRange,
      rowIDColumn
    );

    // Lampirkan role user khusus di workbook ini pada response (opsional untuk dipakai Vue)
    result.userRoleInWorkbook = accessCheck.role;

    return createJsonResponse_(result);

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

/**
 * Memeriksa hak akses user di workbook target melalui sheet "User Access".
 */
function checkWorkbookUserAccess_(gSheetID, username) {
  // Daftar Role yang diizinkan melihat/akses data workbook ini
  const ALLOWED_ROLES = ["VIEWER", "EDITOR", "DEVELOPER"];

  if (!gSheetID || !username) {
    return { allowed: false, message: "GSheetID dan username wajib dispesifikasikan." };
  }

  let ss;
  try {
    ss = SpreadsheetApp.openById(gSheetID.trim());
  } catch (e) {
    return { allowed: false, message: "Spreadsheet target tidak ditemukan atau tidak dapat diakses." };
  }

  const userAccessSheet = ss.getSheetByName("User Access");
  if (!userAccessSheet) {
    return { allowed: false, message: "Sheet 'User Access' tidak ditemukan pada Workbook ini." };
  }

  const lastRow = userAccessSheet.getLastRow();
  if (lastRow < 2) {
    return { allowed: false, message: "Akses ditolak. Belum ada daftar pengguna di sheet 'User Access'." };
  }

  // Mengambil data dari sheet User Access (Kolom A-F: ID, User, Name, Password, Role, Active)
  const rows = userAccessSheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();
  
  const targetUsername = String(username).trim().toLowerCase();
  const match = rows.find(function(row) {
    return String(row[1] || "").trim().toLowerCase() === targetUsername;
  });

  if (!match) {
    return { allowed: false, message: "Pengguna '" + username + "' tidak memiliki hak akses ke Workbook ini." };
  }

  const role = String(match[4] || "").trim();
  const active = String(match[5] || "").trim().toUpperCase();

  if (active !== "TRUE") {
    return { allowed: false, message: "Akses ditolak. Status akses pengguna di Workbook ini tidak aktif (FALSE)." };
  }

  // Validasi Role berdasarkan daftar ALLOWED_ROLES
  const normalizedRole = role.toUpperCase();
  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return { allowed: false, message: "Akses ditolak. Role '" + role + "' tidak memiliki hak akses untuk melihat data." };
  }

  return {
    allowed: true,
    role: role,
    active: active
  };
}

/**
 * Mengambil data dari Google Sheet dan mengembalikannya sebagai Object terstruktur.
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
 * Standard JSON response.
 */
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

/**
 * Mengubah huruf kolom ke angka (1-based). A -> 1, Z -> 26, AA -> 27.
 */
function colLetterToNumber(letter) {
  let column = 0;
  const clean = letter.toUpperCase();
  for (let i = 0; i < clean.length; i++) {
    column = column * 26 + (clean.charCodeAt(i) - 64);
  }
  return column;
}

/**
 * Mengubah angka ke huruf kolom (1-based). 1 -> A, 26 -> Z, 27 -> AA.
 */
function numberToColLetter(num) {
  let letter = "";
  while (num > 0) {
    let remainder = (num - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
}

/**
 * Validate login token melalui internal Auth logic.
 */
function validateAuthTokenWithAuthApi_(token) {
  return validateSession(token);
}


/**
 * ============================================================================
 * SECTION 2: GAS2 - ROW DATA API LOGIC
 * ============================================================================
 */

/**
 * Handler doGet khusus untuk pencarian data per-baris (GAS2).
 */
function handleRowApiDoGet_(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};

    // 1. Validasi token sesi global
    const token = p.token || p.authToken || "";
    const auth = validateSession(token);

    if (!auth || auth.success !== true || !auth.user) {
      return createRowApiError_("Unauthorized. Sesi tidak valid atau telah habis.");
    }

    // 2. Validasi otorisasi di "User Access" sheet pada workbook target
    const gSheetID = p.GSheetID || "";
    const accessCheck = checkWorkbookUserAccess_(gSheetID, auth.user.username);
    if (!accessCheck.allowed) {
      return createRowApiError_("Forbidden: " + accessCheck.message);
    }

    // 3. Lanjutkan ke validasi parameter dan pencarian data
    const params = validateRowApiParams_(e);
    const result = getGSheetRowDataByIDs_(params);
    result.userRoleInWorkbook = accessCheck.role;

    return createRowApiSuccess_(result);
  } catch (error) {
    return createRowApiError_(
      error && error.message
        ? error.message
        : String(error)
    );
  }
}

/**
 * Validasi dan parsing parameter request Row API.
 */
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
    "RowID",
    "columnIDs"
  ];

  required.forEach(function (key) {
    if (
      p[key] === undefined ||
      p[key] === null ||
      String(p[key]).trim() === ""
    ) {
      throw new Error(
        "Parameter wajib tidak tersedia: " + key
      );
    }
  });

  const rowParams = [
    "columnIDRow",
    "columnTitleRow",
    "columnTitleDescriptionRow",
    "columnTypeRow"
  ];

  rowParams.forEach(function (key) {
    const value = Number(p[key]);

    if (
      !Number.isInteger(value) ||
      value < 1
    ) {
      throw new Error(
        "Parameter " + key +
        " harus berupa nomor baris positif."
      );
    }
  });

  let columnIDs;

  try {
    columnIDs = JSON.parse(p.columnIDs);
  } catch (error) {
    throw new Error(
      "Parameter columnIDs bukan JSON yang valid."
    );
  }

  if (
    !Array.isArray(columnIDs) ||
    columnIDs.length === 0
  ) {
    throw new Error(
      "columnIDs harus berupa JSON array yang tidak kosong."
    );
  }

  columnIDs = columnIDs.map(function (id) {
    if (
      typeof id !== "string" &&
      typeof id !== "number"
    ) {
      throw new Error(
        "Setiap columnID harus berupa string atau number."
      );
    }

    const normalized = String(id).trim();

    if (!normalized) {
      throw new Error(
        "columnIDs tidak boleh berisi ID kosong."
      );
    }

    return normalized;
  });

  if (new Set(columnIDs).size !== columnIDs.length) {
    throw new Error(
      "columnIDs tidak boleh berisi ID duplikat."
    );
  }

  const range = parseRowApiDataRange_(p.dataRange);

  const rowIDColumn = columnLetterToNumber_(
    p.RowIDColumn
  );

  return {
    GSheetID: String(p.GSheetID).trim(),
    sheetName: String(p.sheetName).trim(),

    columnIDRow: Number(p.columnIDRow),
    columnTitleRow: Number(p.columnTitleRow),
    columnTitleDescriptionRow:
      Number(p.columnTitleDescriptionRow),
    columnTypeRow: Number(p.columnTypeRow),

    dataRange: String(p.dataRange).trim(),
    range: range,

    RowIDColumn: String(p.RowIDColumn).trim(),
    rowIDColumnNumber: rowIDColumn,
    RowID: String(p.RowID),

    columnIDs: columnIDs
  };
}

/**
 * Mengambil seluruh baris dengan RowID yang cocok.
 * Nilai data dikembalikan menggunakan getDisplayValues().
 */
function getGSheetRowDataByIDs_(params) {
  let spreadsheet;
  let sheet;

  try {
    spreadsheet = SpreadsheetApp.openById(
      params.GSheetID
    );

    sheet = spreadsheet.getSheetByName(
      params.sheetName
    );

    if (!sheet) {
      throw new Error(
        "Worksheet tidak ditemukan: " +
        params.sheetName
      );
    }
  } catch (error) {
    throw new Error(
      "Gagal membuka spreadsheet atau worksheet. " +
      error.message
    );
  }

  const rangeInfo = params.range;

  if (
    rangeInfo.endRow > sheet.getMaxRows() ||
    rangeInfo.endColumn > sheet.getMaxColumns()
  ) {
    throw new Error(
      "dataRange berada di luar ukuran worksheet."
    );
  }

  if (
    params.rowIDColumnNumber > sheet.getMaxColumns()
  ) {
    throw new Error(
      "RowIDColumn berada di luar ukuran worksheet."
    );
  }

  const metadataRows = [
    params.columnIDRow,
    params.columnTitleRow,
    params.columnTitleDescriptionRow,
    params.columnTypeRow
  ];

  metadataRows.forEach(function (row) {
    if (row > sheet.getMaxRows()) {
      throw new Error(
        "Baris metadata " + row +
        " berada di luar ukuran worksheet."
      );
    }
  });

  const dataStartColumn = rangeInfo.startColumn;
  const dataColumnCount = rangeInfo.columnCount;
  const dataStartRow = rangeInfo.startRow;
  const dataRowCount = rangeInfo.rowCount;

  /*
   * Baca metadata dalam batch.
   * Metadata disejajarkan dengan kolom dataRange.
   */
  const metadataRange = sheet.getRange(
    Math.min.apply(null, metadataRows),
    dataStartColumn,
    Math.max.apply(null, metadataRows) -
    Math.min.apply(null, metadataRows) + 1,
    dataColumnCount
  );

  const metadataValues = metadataRange.getDisplayValues();
  const metadataStartRow = Math.min.apply(
    null,
    metadataRows
  );

  function getMetadataRow_(absoluteRow) {
    return metadataValues[
      absoluteRow - metadataStartRow
    ];
  }

  const ids = getMetadataRow_(params.columnIDRow);
  const titles = getMetadataRow_(params.columnTitleRow);
  const descriptions = getMetadataRow_(
    params.columnTitleDescriptionRow
  );
  const types = getMetadataRow_(params.columnTypeRow);

  /*
   * Buat mapping columnID ke indeks absolut spreadsheet.
   * Hanya kolom di dalam dataRange yang dapat diminta.
   */
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

  const selectedColumns = params.columnIDs.map(
    function (id) {
      if (columnMap[id] === undefined) {
        throw new Error(
          "Column ID '" + id +
          "' tidak ditemukan di dataRange " +
          params.dataRange + "."
        );
      }

      return columnMap[id];
    }
  );

  /*
   * Baca dataRange satu kali untuk memperoleh semua
   * nilai yang akan diproses.
   */
  const dataValues = sheet.getRange(
    dataStartRow,
    dataStartColumn,
    dataRowCount,
    dataColumnCount
  ).getDisplayValues();

  /*
   * RowIDColumn dapat berada di luar dataRange.
   * Jika berada di luar, baca kolom RowID secara batch.
   */
  let rowIDValues;

  if (
    params.rowIDColumnNumber >= dataStartColumn &&
    params.rowIDColumnNumber <
    dataStartColumn + dataColumnCount
  ) {
    const rowIDOffset =
      params.rowIDColumnNumber - dataStartColumn;

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
    /*
     * Perbandingan string mempertahankan leading zero
     * pada ID yang dikirim sebagai teks.
     */
    if (rowIDValues[i] !== params.RowID) {
      continue;
    }

    const item = {};

    params.columnIDs.forEach(function (id, index) {
      item[id] = dataValues[i][
        selectedColumns[index].offset
      ];
    });

    resultData.push(item);
  }

  /*
   * Metadata mengikuti urutan columnIDs yang diminta.
   * Jika RowID tidak ditemukan, metadata tetap tersedia
   * selama semua columnID valid.
   */
  return {
    status: "success",
    error: null,
    RowID: params.RowID,
    columnIDs: params.columnIDs,

    columnTitles: selectedColumns.map(function (col) {
      return col.title;
    }),

    columnDescriptions: selectedColumns.map(
      function (col) {
        return col.description;
      }
    ),

    columnTypes: selectedColumns.map(function (col) {
      return col.type;
    }),

    data: resultData,
    rowCount: resultData.length
  };
}

/**
 * Parse A1 range, misalnya B5:BW20.
 * Mendukung huruf kolom multi-karakter.
 */
function parseRowApiDataRange_(a1Range) {
  const match = String(a1Range).trim().match(
    /^([A-Za-z]+)([1-9]\d*):([A-Za-z]+)([1-9]\d*)$/
  );

  if (!match) {
    throw new Error(
      "dataRange tidak valid. " +
      "Gunakan format seperti B5:BW20."
    );
  }

  const startColumn = columnLetterToNumber_(match[1]);
  const startRow = Number(match[2]);
  const endColumn = columnLetterToNumber_(match[3]);
  const endRow = Number(match[4]);

  if (
    endColumn < startColumn ||
    endRow < startRow
  ) {
    throw new Error(
      "dataRange memiliki batas akhir sebelum batas awal."
    );
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

/**
 * Konversi huruf kolom A, Z, AA, BW menjadi angka.
 */
function columnLetterToNumber_(letters) {
  const value = String(letters).trim().toUpperCase();

  if (!/^[A-Z]+$/.test(value)) {
    throw new Error(
      "Huruf kolom tidak valid: " + letters
    );
  }

  let number = 0;

  for (let i = 0; i < value.length; i++) {
    number =
      number * 26 +
      value.charCodeAt(i) - 64;
  }

  return number;
}

/**
 * Response sukses untuk Row API.
 */
function createRowApiSuccess_(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Response error yang konsisten untuk Row API.
 */
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
  SHEET_NAME: "Users",
  SESSION_HOURS: 8,
  SESSION_PREFIX: "AUTH_SESSION_"
};

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function login(username, password) {
  username = String(username || "").trim();
  password = String(password || "");

  if (!username || !password) {
    return { success: false, message: "Username dan password wajib diisi." };
  }

  const sheet = getUserSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { success: false, message: "Belum ada akun user." };
  }

  // Mengambil kolom A sampai F (6 kolom: ID, User, Name, Password, Role, Active)
  const rows = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();
  const matches = rows.filter(function(row) {
    return String(row[1] || "").trim().toLowerCase() === username.toLowerCase();
  });

  if (matches.length !== 1) {
    return { success: false, message: "Username atau password salah." };
  }

  const row = matches[0];
  const id = String(row[0] || "").trim();
  const storedHash = String(row[3] || "").trim();
  const role = String(row[4] || "").trim();
  const activeStatus = String(row[5] || "").trim().toUpperCase();

  // Validasi status Active pengguna di sistem terpusat (Sheet Users)
  if (activeStatus !== "TRUE") {
    return { success: false, message: "Akun Anda tidak aktif." };
  }

  if (!id || !role || !storedHash.startsWith("SHA256$")) {
    return { success: false, message: "Konfigurasi akun tidak valid." };
  }

  const suppliedHash = "SHA256$" + sha256Hex_(password);

  if (suppliedHash !== storedHash) {
    return { success: false, message: "Username atau password salah." };
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
      username: String(row[1]).trim(),
      name: String(row[2] || "").trim(),
      role: role,
      active: activeStatus
    }
  };
}

function validateSession(token) {
  token = String(token || "");

  if (!token || token.length > 200) {
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

  if (!session.expiresAt || Date.now() >= session.expiresAt) {
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

  if (!token || token.length > 200) {
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

  // Mengambil kolom A sampai F (6 kolom)
  const rows = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();
  const matches = rows.filter(function(row) {
    return String(row[0] || "").trim() === String(userId);
  });

  if (matches.length !== 1) return null;

  const row = matches[0];
  const username = String(row[1] || "").trim();
  const name = String(row[2] || "").trim();
  const role = String(row[4] || "").trim();
  const activeStatus = String(row[5] || "").trim().toUpperCase();

  // Jika akun diubah menjadi FALSE di central Users sheet, batalkan sesi
  if (!username || !role || activeStatus !== "TRUE") return null;

  return {
    id: String(row[0]).trim(),
    username: username,
    name: name,
    role: role,
    active: activeStatus
  };
}

function getUserSheet_() {
  const ss = SpreadsheetApp.openById(AUTH_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(AUTH_CONFIG.SHEET_NAME);

  if (!sheet) throw new Error("Sheet User tidak ditemukan.");

  return sheet;
}

function sha256Hex_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );

  return bytes.map(function(b) {
    return ((b + 256) % 256).toString(16).padStart(2, "0");
  }).join("");
}

function cleanupExpiredSessions() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();
  const now = Date.now();

  let deleted = 0;

  Object.keys(allProperties).forEach(function(key) {
    if (!key.startsWith(AUTH_CONFIG.SESSION_PREFIX)) {
      return;
    }

    try {
      const session = JSON.parse(allProperties[key]);

      if (!session.expiresAt || now >= Number(session.expiresAt)) {
        properties.deleteProperty(key);
        deleted++;
      }
    } catch (error) {
      // Hapus data sesi yang rusak.
      properties.deleteProperty(key);
      deleted++;
    }
  });

  console.log("Session kedaluwarsa dihapus: " + deleted);
}

function createSessionCleanupTrigger() {
  // Hindari membuat trigger duplikat.
  const triggers = ScriptApp.getProjectTriggers();

  const exists = triggers.some(function(trigger) {
    return trigger.getHandlerFunction() ===
      "cleanupExpiredSessions";
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

  var sheet = ss.getSheetByName(AUTH_CONFIG.SHEET_NAME);
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    throw new Error("Tidak ada data user untuk dimigrasikan.");
  }

  var range = sheet.getRange(2, 4, lastRow - 1, 1);
  var passwords = range.getValues();

  var updated = passwords.map(function(row) {
    var password = String(row[0] || "");

    if (!password) {
      return [""];
    }

    // Hindari meng-hash ulang password yang sudah dimigrasikan.
    if (password.indexOf("SHA256$") === 0) {
      return [password];
    }

    var bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password,
      Utilities.Charset.UTF_8
    );

    var hash = bytes.map(function(b) {
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
 * SECTION 4: TEST FUNCTIONS
 * ============================================================================
 */

function testGetGSheetData() {
  const SPREADSHEET_ID = "1Gzo0l_7klJHcpOCXFsxQYlI75kWSjcP5w_GmgMASkb4";

  const result = getGSheetData(
    SPREADSHEET_ID,
    "data",
    1,          // columnIDRow
    2,          // columnTitleRow
    3,          // columnTitleDescriptionRow
    4,          // columnTypeRow
    "B5:E10",   // dataRange
    "A"         // RowIDColumn
  );

  Logger.log("========== TEST getGSheetData ==========");
  Logger.log("Status: " + result.status);
  Logger.log("Error: " + result.error);

  if (result.status !== "success") {
    Logger.log("TEST FAILED: " + result.error);
    return;
  }

  Logger.log("Column IDs: " + JSON.stringify(result.columnIDs));
  Logger.log("Column Titles: " + JSON.stringify(result.columnTitles));
  Logger.log("Column Descriptions: " + JSON.stringify(result.columnDescriptions));
  Logger.log("Column Types: " + JSON.stringify(result.columnTypes));

  Logger.log("Total Data Rows: " + result.data.length);
  Logger.log("Total Row IDs: " + result.rowIDs.length);

  Logger.log("Data Sample: " + JSON.stringify(result.data.slice(0, 5)));
  Logger.log("Row ID Sample: " + JSON.stringify(result.rowIDs.slice(0, 5)));

  // Test akses data
  Logger.log("Row 0 Col 0: " + result.get(0, 0));
  Logger.log("Row 1 Col 2: " + result.get(1, 2));

  // Test akses Row ID
  Logger.log("Row 0 ID: " + result.rowIDs[0]);
  Logger.log("Row 1 ID: " + result.rowIDs[1]);

  // Test jumlah baris
  Logger.log(
    "Data rows = Row ID count: " +
    (result.data.length === result.rowIDs.length)
  );

  // Test di luar range
  Logger.log("Row Out of Bounds: " + result.get(999, 0));

  Logger.log("========== END TEST ==========");
} 

function testToken(){
  validateAuthTokenWithAuthApi_("64c4ef215b97d68dd76dfe993220cb494a65aa8714d7a3b2bcf97c214688c93d");
}

function testDoGet() {
  const SPREADSHEET_ID = "1Gzo0l_7klJHcpOCXFsxQYlI75kWSjcP5w_GmgMASkb4";
  const dummyEvent = {
    parameter: {
      GSheetID: SPREADSHEET_ID,
      sheetName: "data",
      columnIDRow: "1",
      columnTitleRow: "2",
      columnTitleDescriptionRow: "3",
      columnTypeRow: "4",
      dataRange: "B5:Z100",
      RowIDColumn: "A",
      RowID: "5135.728397",
      columnIDs: JSON.stringify(["1","5","8"])
    }
  };

  const response = doGet(dummyEvent);
  Logger.log(response.getContent());
}

function testLogin() {
  const result = login("nana", "abc");

  Logger.log(JSON.stringify({
    success: result.success,
    message: result.message,
    user: result.user || null,
    expiresAt: result.expiresAt || null
  }));
}

function clearAllAuthSessions() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();

  let deleted = 0;

  Object.keys(allProperties).forEach(function(key) {
    if (key.indexOf("AUTH_SESSION_") === 0) {
      properties.deleteProperty(key);
      deleted++;
    }
  });

  Logger.log("Sesi dihapus: " + deleted);
}

function testAuthFlow() {
  const result = login("nana", "abc");

  Logger.log("Login berhasil: " + result.success);

  if (!result.success) {
    Logger.log("Pesan: " + result.message);
    return;
  }

  const check = validateSession(result.token);

  Logger.log("Sesi valid: " + check.success);

  const logoutResult = logout(result.token);

  Logger.log("Logout berhasil: " + logoutResult.success);

  const afterLogout = validateSession(result.token);

  Logger.log("Sesi setelah logout: " + afterLogout.success);
}

function testDoPostLogin() {
  const e = {
    postData: {
      contents: JSON.stringify({
        action: "login",
        username: "nana",
        password: "abc"
      })
    }
  };

  const response = doPost(e);
  const result = JSON.parse(response.getContent());

  Logger.log(JSON.stringify({
    success: result.success,
    message: result.message,
    user: result.user || null,
    tokenReceived: Boolean(result.token)
  }));
}