import { createThrottle } from "@/lib/throttle";

// Bank of England Interactive Statistical Database (IADB). Keyless CSV.
// https://www.bankofengland.co.uk/boeapps/database/
//
// Response shape (checked 2026-09-19):
//   DATE,IUDMNPY
//   01 Sep 2026,5.1333
// Data is published with a lag of a few working days.

const URL_BASE = "https://www.bankofengland.co.uk/boeapps/database/_iadb-FromShowColumns.asp";
const throttle = createThrottle(500);

export interface DatedValue {
  /** YYYY-MM-DD */
  date: string;
  value: number;
}

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/** "01 Sep 2026" -> "2026-09-01", or null if it doesn't parse. */
export function parseBoeDate(text: string): string | null {
  const match = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/.exec(text.trim());
  if (!match || !MONTHS[match[2]]) return null;
  return `${match[3]}-${MONTHS[match[2]]}-${match[1].padStart(2, "0")}`;
}

/** Parse IADB CSV into one series per column, keyed by series code. */
export function parseBoeCsv(csv: string): Record<string, DatedValue[]> {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift()?.split(",").map((h) => h.trim()) ?? [];
  if (header[0] !== "DATE") throw new Error("Bank of England: unexpected CSV format");
  const codes = header.slice(1);
  const out: Record<string, DatedValue[]> = Object.fromEntries(codes.map((c) => [c, []]));

  for (const line of lines) {
    const cells = line.split(",");
    const date = parseBoeDate(cells[0] ?? "");
    if (!date) continue;
    codes.forEach((code, i) => {
      const raw = cells[i + 1]?.trim();
      const value = raw ? Number(raw) : NaN;
      if (Number.isFinite(value)) out[code].push({ date, value });
    });
  }
  for (const code of codes) out[code].sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

function boeDate(d: Date): string {
  const month = Object.keys(MONTHS)[d.getUTCMonth()];
  return `${String(d.getUTCDate()).padStart(2, "0")}/${month}/${d.getUTCFullYear()}`;
}

/** Fetch one or more IADB series between two dates. */
export async function fetchBoeSeries(
  codes: string[],
  from: Date,
  to: Date = new Date(),
): Promise<Record<string, DatedValue[]>> {
  const params = new URLSearchParams({
    "csv.x": "yes",
    Datefrom: boeDate(from),
    Dateto: boeDate(to),
    SeriesCodes: codes.join(","),
    CSVF: "TN", // tabular, no titles
    UsingCodes: "Y",
    VPD: "Y",
    VFD: "N",
  });
  const csv = await throttle(async () => {
    const res = await fetch(`${URL_BASE}?${params}`, {
      cache: "no-store",
      headers: { "User-Agent": "finance-career-hub (personal learning project)" },
    });
    if (!res.ok) throw new Error(`Bank of England HTTP ${res.status}`);
    return res.text();
  });
  // An invalid request returns an HTML error page rather than CSV.
  if (!csv.startsWith("DATE")) throw new Error("Bank of England: no CSV data returned");
  return parseBoeCsv(csv);
}
