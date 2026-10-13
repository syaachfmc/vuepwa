
/**
 * RowDataApi.gs
 * Standalone Google Apps Script Web App.
 *
 * GET parameters:
 * GSheetID
 * sheetName
 * columnIDRow
 * columnTitleRow
 * columnTitleDescriptionRow
 * columnTypeRow
 * dataRange
 * RowIDColumn
 * RowID
 * columnIDs = JSON encoded array
 */

function doGet(e) {
  try {
    const params = validateRowApiParams_(e);
    const result = getGSheetRowDataByIDs_(params);

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
 * Validasi dan parsing parameter request.
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
 * Response sukses.
 */
function createRowApiSuccess_(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Response error yang konsisten.
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
 * Fungsi untuk testing doGet secara manual dari editor.
 * Jangan tambahkan akhiran _ agar muncul di menu Run.
 */
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