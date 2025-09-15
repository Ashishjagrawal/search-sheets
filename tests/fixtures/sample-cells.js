export const sampleCells = [
  {
    id: "test_sheet_1_1",
    spreadsheetId: "test_sheet",
    sheetName: "Dashboard",
    row: 1,
    column: 1,
    cellRef: "A1",
    rawValue: "Revenue",
    formattedValue: "Revenue",
    formula: null,
    parsedFormula: null,
    note: null,
    type: "string",
    headers: { row: null, column: null }
  },
  {
    id: "test_sheet_2_1",
    spreadsheetId: "test_sheet",
    sheetName: "Dashboard",
    row: 2,
    column: 1,
    cellRef: "A2",
    rawValue: 15000,
    formattedValue: "15000",
    formula: "=B2*1.1",
    parsedFormula: { type: "formula", expression: "B2*1.1" },
    note: null,
    type: "number",
    headers: { row: "Revenue", column: "Q1" }
  },
  {
    id: "test_sheet_3_1",
    spreadsheetId: "test_sheet",
    sheetName: "Dashboard",
    row: 3,
    column: 1,
    cellRef: "A3",
    rawValue: "Profit",
    formattedValue: "Profit",
    formula: null,
    parsedFormula: null,
    note: null,
    type: "string",
    headers: { row: null, column: null }
  }
];

export const sampleSearchResults = [
  {
    id: "test_sheet_2_1",
    concept: "revenue",
    location: { sheet: "Dashboard", range: "A2" },
    formula: "=B2*1.1",
    value: 15000,
    relevance: 0.85,
    explanation: "Revenue calculation formula",
    reasons: ["header revenue", "formula calculation"]
  }
];

export const sampleExcelData = {
  workbook: {
    SheetNames: ['Sheet1', 'Sheet2'],
    Sheets: {
      Sheet1: { name: 'Sheet1' },
      Sheet2: { name: 'Sheet2' }
    }
  },
  "Sheet1": [
    ["Revenue", "Q1", "Q2"],
    [15000, 16000, 17000],
    ["Profit", "Margin", "Growth"]
  ]
};
