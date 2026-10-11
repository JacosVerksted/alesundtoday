// Reads the port's per-call mooring plan PDF: a one-page table of
// Vessel | Bay (berth) | ETA | ETD, times in local Norwegian time.
//
// The page is rotated, so rather than rely on coordinates this matches the
// table by pattern: a row is two consecutive date-time cells (ETA, ETD) with
// the vessel and berth cells directly before them.

const DATETIME_RE = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})(?::\d{2})?$/;

/** "06.10.2026 08:00:00" → "2026-10-06T08:00" (local time, no zone). */
function toLocalISO(s) {
  const m = s.match(DATETIME_RE);
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}` : null;
}

/**
 * Turn the PDF's text cells (in stream order) into visits.
 * Split out from the PDF reading so it can be tested without a PDF.
 * @param {string[]} cells
 * @returns {{ vessel: string; bay: string; eta: string; etd: string }[]}
 */
export function rowsFromCells(cells) {
  const visits = [];
  for (let i = 2; i < cells.length - 1; i++) {
    const eta = toLocalISO(cells[i]);
    const etd = toLocalISO(cells[i + 1]);
    if (!eta || !etd) continue;
    const vessel = cells[i - 2];
    const bay = cells[i - 1];
    // Guard against a missing cell shifting the row: neither may be a date or header text
    if (DATETIME_RE.test(vessel) || DATETIME_RE.test(bay)) continue;
    if (/^(vessel|bay|eta|etd)$/i.test(vessel) || /^(vessel|bay|eta|etd)$/i.test(bay)) continue;
    visits.push({ vessel, bay, eta, etd });
    i++; // the ETD cell is consumed
  }
  return visits;
}

/**
 * @param {Uint8Array} data  PDF bytes
 * @returns {Promise<{ vessel: string; bay: string; eta: string; etd: string }[]>}
 */
export async function parseMooringPdf(data) {
  // Loaded on demand so the rest of the scraper works even if pdf.js is unavailable
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false, // never evaluate anything from a downloaded file
    verbosity: 0,
  });
  try {
    const doc = await task.promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    const cells = content.items.map((it) => (it.str ?? '').trim()).filter(Boolean);
    return rowsFromCells(cells);
  } finally {
    await task.destroy();
  }
}
