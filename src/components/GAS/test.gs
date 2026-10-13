
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