
/**
 * Mengirim perubahan satu baris ke Google Sheets melalui GAS.
 *
 * Mengembalikan respons GAS jika berhasil.
 * Melempar error jika request atau penyimpanan gagal.
 */
export async function updateGSheetRow({
    webAppUrl,
    token,
    GSheetID,
    sheetName,
    dataRange,
    RowIDColumn,
    RowID,
    changes,
    columnIDRow,
    ProjectID,
    ProjectIDColumn 
  }) {
    if (!webAppUrl) {
      throw new Error('URL GAS belum tersedia.')
    }
  
    if (!token) {
      throw new Error('Token autentikasi tidak tersedia.')
    }
  
    if (!GSheetID) {
      throw new Error('GSheetID belum tersedia.')
    }
  
    if (RowID === undefined || RowID === null || RowID === '') {
      throw new Error('RowID tidak tersedia.')
    }
  
    if (!changes || Object.keys(changes).length === 0) {
      throw new Error('Tidak ada perubahan untuk disimpan.')
    }
  
    const payload = {
      action: 'updateRow',
      token,
      GSheetID,
      sheetName,
      dataRange,
      RowIDColumn,
      RowID: String(RowID),
      columnIDRow,
      changes
    }
  
    console.log('Payload untuk updateGSheetRow:', payload.changes)

    if (ProjectID !== undefined && ProjectID !== null && ProjectID !== '') {
      payload.ProjectID = ProjectID
      payload.ProjectIDColumn = ProjectIDColumn
    }
  
    const response = await fetch(webAppUrl, {
      method: 'POST',
      // Jangan menambahkan Content-Type: application/json.
      // Body tetap berupa JSON, dibaca GAS dari e.postData.contents.
      body: JSON.stringify(payload),
      redirect: 'follow'
    })
  


    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
  
    const result = await response.json()
  
    if (result.success !== true) {
      throw new Error(result.message || 'GAS gagal menyimpan data.')
    }
  
    return result
  }
  