import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseMooringplan } from './parse.mjs';
import { parseMooringPdf } from './pdf.mjs';

const SOURCE_URL = 'https://alesund.havn.no/skipstrafikk/mooringplan-cruise/';
const USER_AGENT = 'visit-alesund-scraper/1.0 github.com/JacosVerksted/alesundtoday';
const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'schedule.json');

const MAX_PDF_FETCHES = 120;   // per run — a first run needs ~60; this only guards against runaway
const MAX_PDF_BYTES = 2_000_000;
const PDF_DELAY_MS = 300;      // be gentle with the port's server

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9æøå]/g, '');
const osloToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });

/** Previous run's output, used as a cache so unchanged plans aren't downloaded again. */
function loadPrevious() {
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8'));
    return new Map((prev.calls ?? []).map((c) => [c.date, c]));
  } catch {
    return new Map();
  }
}

async function fetchPdf(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length > MAX_PDF_BYTES) throw new Error(`too large (${buf.length} bytes)`);
  if (String.fromCharCode(...buf.slice(0, 5)) !== '%PDF-') throw new Error('not a PDF');
  return buf;
}

/** Match a PDF vessel name ("MEIN SCHIFF 3") to the page's spelling ("Mein Schiff 3"). */
function canonicalShip(vessel, ships) {
  const hit = ships.find((s) => norm(s) === norm(vessel));
  return hit ?? vessel;
}

/**
 * Add berth + arrival/departure times to upcoming calls from the mooring plan PDFs.
 * Past days are skipped; a call whose PDF link hasn't changed keeps its cached times.
 * A PDF that can't be read just leaves that day without times — it never fails the run.
 */
async function addVisits(calls, previous) {
  const today = osloToday();
  let fetched = 0, reused = 0, failed = 0;

  for (const call of calls) {
    const prev = previous.get(call.date);
    const pdfs = call.pdfs;
    delete call.pdfs;
    if (call.date < today || pdfs.length === 0) {
      // Not worth fetching — keep whatever we already had for history
      if (prev?.visits?.length) { call.visits = prev.visits; call.pdfs = prev.pdfs; }
      continue;
    }

    const unchanged = prev?.visits?.length && prev.pdfs && pdfs.length === prev.pdfs.length && pdfs.every((u) => prev.pdfs.includes(u));
    if (unchanged) { call.visits = prev.visits; call.pdfs = prev.pdfs; reused++; continue; }

    const visits = [];
    let ok = true;
    for (const url of pdfs) {
      if (fetched >= MAX_PDF_FETCHES) { ok = false; break; }
      try {
        fetched++;
        const rows = await parseMooringPdf(await fetchPdf(url));
        if (rows.length === 0) throw new Error('no rows found in PDF');
        for (const r of rows) visits.push({ ship: canonicalShip(r.vessel, call.ships), bay: r.bay, eta: r.eta, etd: r.etd });
      } catch (err) {
        ok = false; failed++;
        console.warn(`  PDF failed for ${call.date}: ${err.message}`);
      }
      await sleep(PDF_DELAY_MS);
    }
    // Only keep complete results so a partly-read day is retried on the next run
    if (ok && visits.length) {
      visits.sort((a, b) => a.eta.localeCompare(b.eta));
      call.visits = visits;
      call.pdfs = pdfs;
    }
  }
  console.log(`Mooring plan PDFs: ${fetched} downloaded, ${reused} reused from cache, ${failed} failed`);
}

async function main() {
  console.log('Fetching mooringplan...');
  let html;
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) {
      console.error(`HTTP ${res.status} from ${SOURCE_URL}`);
      process.exit(1);
    }
    html = await res.text();
  } catch (err) {
    console.error('Fetch failed:', err.message);
    process.exit(1);
  }

  console.log('Parsing...');
  const calls = parseMooringplan(html, SOURCE_URL);

  if (calls.length === 0) {
    console.error('Zero entries parsed — page structure may have changed');
    process.exit(1);
  }

  console.log(`Parsed ${calls.length} days with cruise calls`);

  try {
    await addVisits(calls, loadPrevious());
  } catch (err) {
    // Times are a bonus: never lose the schedule itself over them
    console.warn('Could not add arrival times:', err.message);
    for (const c of calls) delete c.pdfs;
  }

  const output = {
    generated: new Date().toISOString(),
    source: SOURCE_URL,
    calls,
  };

  writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Written to ${OUT}`);
}

main();
