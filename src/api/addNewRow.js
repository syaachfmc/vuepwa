export async function addNewRow({
    webAppUrl,
    token,
    GSheetID,
    sheetName,
    RowIDColumn,
    ProjectIDColumn,
    mainIDColumnID,
    columnIDRow = 1,
    dataRange,
    startRow = 5
}) {
    if (!token) {
        throw new Error('Token autentikasi tidak tersedia.');
    }

    const payload = {
        action: 'addNewRow',
        token,
        GSheetID,
        sheetName,
        RowIDColumn,
        ProjectIDColumn,
        mainIDColumnID,
        columnIDRow,
        dataRange,
        startRow
    };

    const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success !== true) {
        throw new Error(result.message || 'Gagal menambahkan Shipment baru.');
    }

    return result;
}