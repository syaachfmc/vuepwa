import { ref } from 'vue'

 
export const ShipmentsConfig = ref({
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw4ARc71H-V0lIBwp1ijTUiuzZnts0bzBXh30pcy-iaIqa-rYrLW7xsb9hlnpuqDPUI/exec',

  
  gsheetID: JSON.parse(sessionStorage.getItem("authProject") || "{}").ShipmentDataGSheetID || '', 
  sheetName: 'Shipments',
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: 'B5:BY',
  RowIDColumn: 'A',
  ProjectID: '',
  ProjectIDColumn: 'B',
  FrozenColumnIndex: ['2'],
  tableDateFormat: 'dd MMM yy',
  mainIDColumnID: '2',
  shipmentNoPrefix: JSON.parse(sessionStorage.getItem("authProject") || "{}").shipmentNoPrefix || '', 
})

 
export const RSRConfig = ref({
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw4ARc71H-V0lIBwp1ijTUiuzZnts0bzBXh30pcy-iaIqa-rYrLW7xsb9hlnpuqDPUI/exec',
  
  gsheetID: JSON.parse(sessionStorage.getItem("authProject") || "{}").ShipmentDataGSheetID || '', 
  sheetName: 'RSR',
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: 'B5:Z',
  RowIDColumn: 'A',
  ProjectID: '',
  ProjectIDColumn: 'B',
  FrozenColumnIndex: ['2'],
  tableDateFormat: 'dd MMM yy',
  mainIDColumnID: 'SerialNo',
  shipmentNoPrefix: JSON.parse(sessionStorage.getItem("authProject") || "{}").shipmentNoPrefix || '', 
  foreignKey :{'ShipmentRowID' : 'x'}
})