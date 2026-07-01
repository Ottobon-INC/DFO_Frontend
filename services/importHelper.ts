import * as XLSX from 'xlsx';

// Fuzzy header synonym matching regex rules
const FUZZY_RULES: Record<string, RegExp> = {
    uhid: /uhid|patient\s*id|id|identifier/i,
    name: /name|full\s*name|patient\s*name|lead\s*name|customer|first\s*name|person/i,
    gender: /gender|sex/i,
    phone: /phone|mobile|contact|cell|tele/i,
    email: /email|mail/i,
    dob: /dob|date\s*of\s*birth|birth\s*date/i,
    age: /age|years/i,
    maritalStatus: /marital|marriage|relationship/i,
    bloodGroup: /blood|group|bg/i,
    aadhar: /aadhar|uidai|national\s*id/i,
    house: /house|home|flat|apartment/i,
    street: /street|address\s*1|address/i,
    area: /area|locality/i,
    city: /city|town/i,
    district: /district/i,
    state: /state/i,
    postalCode: /postal|zip|pin/i,
    date: /date|reg|registration|added|created/i,
    status: /status|stage/i,
    source: /source|origin|medium/i,
    problem: /problem|reason|visit\s*reason|complaint|issue|inquiry/i,
    doctor: /doctor|physician|consultant|doc/i,
    time: /time|start\s*time|slot/i,
    type: /type|visit\s*type|appointment\s*type/i
};

export interface ParsedRow {
    [key: string]: string;
}

/**
 * Parses a CSV or Excel file (.xlsx, .xls) and maps columns to internal keys using fuzzy matching.
 */
export function parseAndMapFile(file: File): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    resolve([]);
                    return;
                }

                // Read binary array or string with cellDates: true to parse Excel dates correctly
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Get raw 2D array of cells: sheet_to_json with header: 1
                const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

                if (rawRows.length === 0) {
                    resolve([]);
                    return;
                }

                // Find header row (usually first row, or search for a row with recognized keywords if empty/garbage rows precede it)
                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
                    const row = rawRows[i];
                    const matchCount = row.filter(cell => {
                        const cellStr = String(cell).trim().toLowerCase();
                        return Object.values(FUZZY_RULES).some(rx => rx.test(cellStr));
                    }).length;
                    
                    if (matchCount >= 2) {
                        headerRowIndex = i;
                        break;
                    }
                }

                const headers = rawRows[headerRowIndex].map(h => String(h).trim().toLowerCase());
                
                // Build a map of internalKey ->columnIndex
                const indexMap: Record<string, number> = {};
                Object.keys(FUZZY_RULES).forEach(key => {
                    const rx = FUZZY_RULES[key];
                    const idx = headers.findIndex(h => rx.test(h));
                    if (idx !== -1) {
                        indexMap[key] = idx;
                    }
                });

                const results: ParsedRow[] = [];

                // Helper to format values and handle Excel date objects
                const formatValue = (val: any): string => {
                    if (val instanceof Date) {
                        // Adjust for potential timezone shifts and format as YYYY-MM-DD
                        const yyyy = val.getFullYear();
                        const mm = String(val.getMonth() + 1).padStart(2, '0');
                        const dd = String(val.getDate()).padStart(2, '0');
                        return `${yyyy}-${mm}-${dd}`;
                    }
                    return val !== undefined && val !== null ? String(val).trim() : '';
                };

                // Parse subsequent rows
                for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
                    const row = rawRows[i];
                    // Skip empty rows
                    if (row.length === 0 || row.every(cell => String(cell).trim() === '')) {
                        continue;
                    }

                    const mappedRow: ParsedRow = {};
                    Object.keys(indexMap).forEach(key => {
                        const colIdx = indexMap[key];
                        if (colIdx < row.length) {
                            mappedRow[key] = formatValue(row[colIdx]);
                        }
                    });

                    // Add raw row elements as fallback indices (e.g. _col0, _col1) in case caller needs position-based lookup
                    row.forEach((cell, idx) => {
                        mappedRow[`_col${idx}`] = formatValue(cell);
                    });

                    results.push(mappedRow);
                }

                resolve(results);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}
