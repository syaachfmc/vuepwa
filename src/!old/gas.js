/**
 * ============================================================================
 * ADD NEW ROW LOGIC (Generate UUID & Auto Increment Main ID per Project)
 * MainIDColumn ditentukan berdasarkan Column ID pada metadata row.
 * Mendukung penulisan ForeignKey opsional: {"ColumnID": "Value"}
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
  
      // Cache Metadata Header jika dibutuhkan (oleh mainIDColumnID atau foreignKey)
      var metadataValues = null;
      var rangeInfo = null;
      var columnIDRow = Number(body.columnIDRow || 1);
      var dataRange = String(body.dataRange || "").trim();
  
      function getMetadata_() {
        if (!metadataValues) {
          if (!dataRange) {
            throw new Error("Parameter dataRange wajib diisi untuk membaca metadata columnID.");
          }
          if (!Number.isInteger(columnIDRow) || columnIDRow < 1) {
            throw new Error("columnIDRow tidak valid.");
          }
          rangeInfo = parseRangeInfo(
            dataRange,
            sheet.getLastRow(),
            sheet.getMaxColumns()
          );
          if (!rangeInfo.success) {
            throw new Error("dataRange tidak valid: " + dataRange);
          }
          metadataValues = sheet.getRange(
            columnIDRow,
            rangeInfo.startCol,
            1,
            rangeInfo.endCol - rangeInfo.startCol + 1
          ).getDisplayValues()[0];
        }
        return { values: metadataValues, info: rangeInfo };
      }
  
      // 6. Tentukan Kolom Main ID berdasarkan Column ID
      var mainIDColumnNumber = 0;
      var mainIDColumnID = String(body.mainIDColumnID || "").trim();
  
      if (mainIDColumnID !== "") {
        var meta = getMetadata_();
        var matchedColumns = [];
  
        for (var m = 0; m < meta.values.length; m++) {
          var currentColumnID = String(meta.values[m] || "").trim();
          if (currentColumnID === mainIDColumnID) {
            matchedColumns.push(meta.info.startCol + m);
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
        // Fallback: huruf kolom MainIDColumn
        var mainIDColumnLetter = String(body.MainIDColumn || "").trim();
        if (mainIDColumnLetter !== "") {
          mainIDColumnNumber = columnLetterToNumber_(mainIDColumnLetter);
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
  
      // 7. Proses Mapping Foreign Key (jika diinputkan)
      var foreignKeyWrites = []; // Simpan pasangan {colIndex, value}
  
      if (body.foreignKey && typeof body.foreignKey === "object") {
        var metaFK = getMetadata_();
  
        for (var fkColumnID in body.foreignKey) {
          if (Object.prototype.hasOwnProperty.call(body.foreignKey, fkColumnID)) {
            var fkValue = body.foreignKey[fkColumnID];
            var targetColID = String(fkColumnID).trim();
            var fkColNumber = 0;
  
            for (var k = 0; k < metaFK.values.length; k++) {
              var colID = String(metaFK.values[k] || "").trim();
              if (colID === targetColID) {
                fkColNumber = metaFK.info.startCol + k;
                break;
              }
            }
  
            if (fkColNumber > 0) {
              foreignKeyWrites.push({
                colIndex: fkColNumber,
                value: fkValue
              });
            } else {
              console.warn("ForeignKey columnID tidak ditemukan pada metadata header:", targetColID);
            }
          }
        }
      }
  
      // 8. Gunakan LockService untuk Mencegah Race Condition
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
  
        // 9. Auto-Increment Main ID
        if (
          mainIDColumnNumber >= 1 &&
          mainIDColumnNumber <= sheet.getMaxColumns()
        ) {
  
          var startDataRow = Number(body.startRow || 5);
  
          if (!Number.isInteger(startDataRow) || startDataRow < 1) {
            throw new Error("startRow tidak valid.");
          }
  
          var totalRows = targetRowIndex - startDataRow;
          var maxSeq = 0;
          var detectedPrefix = "";
          var numDigits = 5;
  
          if (totalRows > 0) {
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
  
            var pattern = /^(.*?)(-?)(\d+)([A-Za-z]*)$/;
  
            for (var r = 0; r < totalRows; r++) {
              var rowProjectCode = String(projectIDValues[r][0] || "").trim();
  
              if (rowProjectCode !== authenticatedProjectCode) {
                continue;
              }
  
              var val = String(mainIDValues[r][0] || "").trim();
              if (!val) continue;
  
              var match = val.match(pattern);
  
              if (match) {
                var prefixPart = match[1] + match[2];
                var numberPartStr = match[3];
                var seqNum = parseInt(numberPartStr, 10);
  
                if (seqNum > maxSeq) {
                  maxSeq = seqNum;
                  detectedPrefix = prefixPart;
                  numDigits = numberPartStr.length;
                }
              }
            }
          }
  
          var nextSeq = maxSeq + 1;
          var formattedNumber = String(nextSeq).padStart(numDigits, "0");
          newMainIDValue = detectedPrefix + formattedNumber;
  
          // Tulis Main ID baru
          sheet.getRange(targetRowIndex, mainIDColumnNumber).setValue(newMainIDValue);
        }
  
        // 10. Tulis UUID dan ProjectCode pada baris baru
        sheet.getRange(targetRowIndex, rowIDColumnNumber).setValue(newRowID);
        sheet.getRange(targetRowIndex, projectIDColumnNumber).setValue(authenticatedProjectCode);
  
        // 11. Tulis Nilai Foreign Key (jika ada)
        for (var f = 0; f < foreignKeyWrites.length; f++) {
          var fk = foreignKeyWrites[f];
          sheet.getRange(targetRowIndex, fk.colIndex).setValue(fk.value);
        }
  
        SpreadsheetApp.flush();
  
      } finally {
        lock.releaseLock();
      }
  
      // 12. Kembalikan Response Berhasil
      return jsonResponse_({
        success: true,
        message: "Baris baru berhasil ditambahkan.",
        newRowID: newRowID,
        newMainIDValue: newMainIDValue,
        rowIndex: targetRowIndex,
        projectCode: authenticatedProjectCode,
        mainIDColumnID: mainIDColumnID,
        foreignKeyWritten: foreignKeyWrites.length
      });
  
    } catch (error) {
      console.error("handleAddNewRow_ error:", error);
  
      return jsonResponse_({
        success: false,
        message: "Gagal menambah baris baru: " + (error.message || String(error))
      });
    }
  }