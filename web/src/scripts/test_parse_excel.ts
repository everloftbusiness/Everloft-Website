import ExcelJS from 'exceljs';
import { parseGoogleSheetCsv } from '../features/bookings/utils/csv-parser';

async function testParseExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('D:/Untitled spreadsheet.xlsx');
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    console.log('No worksheet found.');
    return;
  }

  const csvLines: string[] = [];
  worksheet.eachRow((row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    const line = values.map((val) => (val === null || val === undefined ? '' : String(val))).join(',');
    csvLines.push(line);
  });

  const parsed = parseGoogleSheetCsv(csvLines.join('\n'));
  console.log(`=== PARSED ${parsed.length} ROWS FROM D:\\Untitled spreadsheet.xlsx ===\n`);

  parsed.slice(0, 10).forEach((r) => {
    console.log(`Row #${r.rawLineIndex}: ${r.guestName} | Room ${r.roomLabel} | ${r.source} | Check-in: ${r.checkInDate} (${r.nights}n)`);
  });
}

testParseExcel().catch(console.error);
