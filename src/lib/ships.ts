const CAPACITY: Record<string, number> = {
  // AIDA fleet
  'aidanova': 5926,
  'aidaprima': 4954,
  'aidaperla': 4954,
  'aidasol': 2686,
  'aidaluna': 2686,
  'aidablu': 2192,
  'aidamar': 2192,
  'aidastella': 2192,
  'aidacara': 1180,
  'aidalife': 1180,
  'aidavita': 1266,
  'aidabell': 1266,
  'aidadiva': 2050,

  // MSC fleet
  'msc euribia': 6762,
  'msc preziosa': 3502,
  'msc magnifica': 2518,
  'msc orchestra': 2550,
  'msc armonia': 2087,
  'msc sinfonia': 2087,
  'msc opera': 2087,
  'msc lirica': 2087,
  'msc splendida': 3274,
  'msc fantasia': 3274,

  // P&O / Carnival group
  'iona': 5200,
  'britannia': 3647,
  'aurora': 1870,
  'arcadia': 1952,
  'arvia': 5200,
  'ventura': 3078,
  'azura': 3078,

  // Norwegian Cruise Line
  'norwegian star': 2348,
  'norwegian prima': 3099,
  'norwegian escape': 4266,
  'norwegian bliss': 4004,
  'norwegian joy': 3804,
  'norwegian epic': 4100,
  'norwegian jade': 2402,
  'norwegian gem': 2394,
  'norwegian breakaway': 4028,
  'norwegian getaway': 3969,

  // TUI Cruises
  'mein schiff 1': 2500,
  'mein schiff 2': 2500,
  'mein schiff 3': 2501,
  'mein schiff 4': 2501,
  'mein schiff 5': 2534,
  'mein schiff 6': 2786,
  'mein schiff 7': 4100,

  // Royal Caribbean / Celebrity
  'queen anne': 2996,
  'queen mary 2': 2691,
  'queen elizabeth': 2092,
  'queen victoria': 1990,

  // Costa / Carnival
  'costa diadema': 4947,
  'costa favolosa': 3780,
  'costa fascinosa': 3780,
  'costa fortuna': 3470,
  'costa magica': 3470,
  'costa serena': 3780,
  'costa luminosa': 2260,
  'costa firenze': 4232,
  'costa toscana': 6554,

  // Holland America
  'nieuw statendam': 2666,
  'koningsdam': 2650,
  'rotterdam': 2668,
  'oosterdam': 1916,
  'westerdam': 1916,
  'zuiderdam': 1916,
  'eurodam': 2104,
  'nieuw amsterdam': 2106,

  // Hurtigruten / small Norwegian
  'midnatsol': 1000,
  'trollfjord': 822,
  'finnmarken': 1000,
  'otto sverdrup': 500,
  'richard with': 691,
  'nordnorge': 691,
  'polarlys': 737,
  'nordkapp': 737,
  'kong harold': 737,
  'vesteralen': 490,
  'lofoten': 400,

  // Expedition / luxury small ships
  'europa 2': 516,
  'world navigator': 200,
  'world voyager': 200,
  'world explorer': 200,
  'aqua lares': 150,
  'sea spirit': 114,
  'seadream i': 112,
  'seadream ii': 112,
  'scenic eclipse': 228,
  'scenic eclipse ii': 228,
  'le laperouse': 184,
  'le bougainville': 184,
  'le champlain': 184,
  'le ponant': 64,
  'le boreal': 264,
  'l\'austral': 264,
  'silver whisper': 382,
  'silver wind': 296,
  'silver cloud': 296,
  'silver nova': 728,
  'silver endeavour': 200,
  'hanseatic nature': 230,
  'hanseatic inspiration': 230,
  'hanseatic spirit': 230,
  'artania': 1200,
  'deutschland': 520,
  'balmoral': 1350,
  'boudicca': 880,
  'braemar': 929,
  'black watch': 804,
  'renaissance': 700,
};

function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function getCapacity(shipName: string): number | null {
  return CAPACITY[normalize(shipName)] ?? null;
}

export function estimateCapacity(shipName: string): number {
  return getCapacity(shipName) ?? 2500;
}
