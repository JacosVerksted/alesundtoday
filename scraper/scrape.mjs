import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseMooringplan } from './parse.mjs';

const SOURCE_URL = 'https://alesund.havn.no/skipstrafikk/mooringplan-cruise/';
const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'schedule.json');

async function main() {
  console.log('Fetching mooringplan...');
  let html;
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'visit-alesund-scraper/1.0' },
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
  const calls = parseMooringplan(html);

  if (calls.length === 0) {
    console.error('Zero entries parsed — page structure may have changed');
    process.exit(1);
  }

  console.log(`Parsed ${calls.length} days with cruise calls`);

  const output = {
    generated: new Date().toISOString(),
    source: SOURCE_URL,
    calls,
  };

  writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Written to ${OUT}`);
}

main();
