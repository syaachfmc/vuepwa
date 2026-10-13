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