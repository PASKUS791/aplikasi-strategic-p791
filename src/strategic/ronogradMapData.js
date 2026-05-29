/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import mapImage from "../assets/strategic/ronograd-city.webp";

const ENEMY_CATEGORY_ID_MAP = {
  "1": "enemy-rocketeer",
  "2": "enemy-sniper",
  "3": "enemy-unit",
  "4": "enemy-vip-target",
  "5": "enemy-camp-ambush",
  "6": "enemy-mortar",
  "7": "enemy-anti-air-launcher",
  "8": "enemy-explosive-target",
  "9": "enemy-heli-landing",
  "10": "enemy-minefield",
  "11": "enemy-machine-gunner",
};

const ENEMY_CATEGORY_FALLBACK_DESCRIPTIONS = {
  "enemy-rocketeer":
    "Operator peluncur roket anti-kendaraan yang biasanya menjaga lane terbuka dan approach kendaraan.",
  "enemy-sniper":
    "Pos sniper jarak jauh yang mengunci jalur masuk, elevasi, atau titik overwatch sekitar area target.",
  "enemy-unit":
    "Kontak musuh umum di area ini; kemungkinan terdiri dari rifleman atau penjaga perimeter.",
  "enemy-vip-target":
    "Target VIP atau HVT prioritas tinggi yang perlu dieliminasi di sektor ini.",
  "enemy-camp-ambush":
    "Lokasi kamp atau ambush yang berpotensi dipakai sebagai penyergapan dan screening lane.",
  "enemy-mortar":
    "Pos mortar aktif yang memberi suppressive fire ke lane masuk dan objective sekitar.",
  "enemy-anti-air-launcher":
    "Peluncur anti-air yang menutup dukungan udara dan approach helikopter di sektor ini.",
  "enemy-explosive-target":
    "Target peledakan yang harus dihancurkan untuk melemahkan pertahanan atau menyelesaikan objective.",
  "enemy-heli-landing":
    "Titik pendaratan heli reinforcement yang dapat dipakai untuk memasukkan bala bantuan musuh.",
  "enemy-minefield":
    "Ladang ranjau aktif di jalur masuk; perlu diwaspadai sebelum rotasi kendaraan atau infantry.",
  "enemy-machine-gunner":
    "Pos machine gunner yang mengunci lane terbuka dan memberi suppressive fire kuat.",
};

const SUPPLEMENTAL_ENEMY_FILTER_CATEGORY = {
  id: "enemy-intel",
  listId: 8,
  name: "Enemy Intel",
  color: "#fa005a",
  symbol: "E",
  symbolColor: "#fff",
  iconKey: "enemy-unit",
};

const SUPPLEMENTAL_ENEMY_CATEGORIES = [
  {
    id: "enemy-rocketeer",
    listId: 101,
    name: "Rocketeer",
    color: "#fa005a",
    symbol: "R",
    symbolColor: "#fff",
    iconKey: "rocketeer",
  },
  {
    id: "enemy-sniper",
    listId: 102,
    name: "Sniper",
    color: "#fa005a",
    symbol: "S",
    symbolColor: "#fff",
    iconKey: "sniper",
  },
  {
    id: "enemy-unit",
    listId: 103,
    name: "Enemy",
    color: "#fa005a",
    symbol: "E",
    symbolColor: "#fff",
    iconKey: "enemy-unit",
  },
  {
    id: "enemy-vip-target",
    listId: 104,
    name: "VIP Target",
    color: "#fa005a",
    symbol: "V",
    symbolColor: "#fff",
    iconKey: "vip-target",
  },
  {
    id: "enemy-camp-ambush",
    listId: 105,
    name: "Camp / Ambush",
    color: "#fa005a",
    symbol: "C",
    symbolColor: "#fff",
    iconKey: "camp-ambush",
  },
  {
    id: "enemy-mortar",
    listId: 106,
    name: "Mortar",
    color: "#fa005a",
    symbol: "M",
    symbolColor: "#fff",
    iconKey: "enemy-mortar",
  },
  {
    id: "enemy-explosive-target",
    listId: 108,
    name: "Explosive Target",
    color: "#00e6fa",
    symbol: "X",
    symbolColor: "#001018",
    iconKey: "enemy-explosive-target",
  },
  {
    id: "enemy-heli-landing",
    listId: 109,
    name: "PoD Heli Landing Point",
    color: "#fa005a",
    symbol: "H",
    symbolColor: "#fff",
    iconKey: "enemy-heli-landing",
  },
  {
    id: "enemy-minefield",
    listId: 110,
    name: "Minefield",
    color: "#fa0000",
    symbol: "M",
    symbolColor: "#fff",
    iconKey: "enemy-minefield",
  },
  {
    id: "enemy-machine-gunner",
    listId: 111,
    name: "Machine Gunner",
    color: "#fa005a",
    symbol: "G",
    symbolColor: "#fff",
    iconKey: "enemy-machine-gunner",
  },
];

const SUPPLEMENTAL_ENEMY_CATEGORIES_BY_ID = Object.fromEntries(
  SUPPLEMENTAL_ENEMY_CATEGORIES.map((category) => [category.id, category]),
);

const SUPPLEMENTAL_ENEMY_MARKERS = [
  {
    categoryId: "2",
    position: [3459.3435480088942, 1803.0753787975411],
    popup: {
      title: "Sochraina sniper 1",
      description: "Located on top of the lighthouse.",
      link: { url: "", label: "" },
    },
    id: "1",
  },
  {
    categoryId: "2",
    position: [6256.259736742669, 3782.25],
    popup: {
      title: "Naval Sniper 1",
      description: "Located in a watchtower at the initial checkpoint",
      link: { url: "", label: "" },
    },
    id: "2",
  },
  {
    categoryId: "1",
    position: [2710.055187586185, 1779],
    popup: {
      title: "Sochraina anti-tank rocketeer",
      description:
        "Anti-tank rocketeer located on the western approach road to Sochraina.",
      link: { url: "", label: "" },
    },
    id: "3",
  },
  {
    categoryId: "4",
    position: [5073.496248160829, 3405.0727048038198],
    popup: {
      title: "Ronongrad City VIP 4",
      description: "",
      link: { url: "", label: "" },
    },
    id: "5",
  },
  {
    categoryId: "4",
    position: [6214.764699152964, 3275.75],
    popup: {
      title: "Naval VIP 1",
      description: "Located in this logistics area",
      link: { url: "", label: "" },
    },
    id: "6",
  },
  {
    categoryId: "5",
    position: [2896.3093757400984, 3476.1369363130675],
    popup: {
      title: "Roadway encampment",
      description:
        "Small RLF encampment blocking the roadway. Consists of 4 riflemen huddled around a campfire and one near the boulder.",
      link: { url: "", label: "" },
    },
    id: "7",
  },
  {
    categoryId: "5",
    position: [4265.268104117255, 3934.3421305219504],
    popup: {
      title: "RLF ambush",
      description:
        "Small RLF ambush on the approach road to Lesdolina/DOU/Mountain. Consists of 2 riflemen on the cliffs to the northeast, 1 in the trees to the west and 1 in the trees to the east.",
      link: { url: "", label: "" },
    },
    id: "8",
  },
  {
    categoryId: "5",
    position: [2992.4758979814687, 5003.48758367601],
    popup: {
      title: "RLF-occupied village",
      description: "Located in the small village near DOU and Mountain.",
      link: { url: "", label: "" },
    },
    id: "9",
  },
  {
    categoryId: "5",
    position: [5781.305042981212, 3832.518754031087],
    popup: {
      title: "PoD checkpoint",
      description: "",
      link: { url: "", label: "" },
    },
    id: "10",
  },
  {
    categoryId: "2",
    position: [3395.9876580144, 2623.158005400378],
    popup: {
      title: "Quarry sniper 4",
      description: "Located on the main road.",
      link: { url: "", label: "" },
    },
    id: "12",
  },
  {
    categoryId: "2",
    position: [3184.951078087941, 2634.6296141693815],
    popup: {
      title: "Quarry sniper 3",
      description: "Located in the back of the upper area on a watchtower.",
      link: { url: "", label: "" },
    },
    id: "13",
  },
  {
    categoryId: "4",
    position: [3214.507427274045, 2071.822868876584],
    popup: {
      title: "Sochraina VIP 1",
      description: "Top floor of this building.",
      link: { url: "", label: "" },
    },
    id: "14",
  },
  {
    categoryId: "4",
    position: [3119.7551185950474, 1782.6161953712863],
    popup: {
      title: "Sochraina VIP 2",
      description: "Located in this plaza",
      link: { url: "", label: "" },
    },
    id: "15",
  },
  {
    categoryId: "6",
    position: [3267.540435863036, 1905.6527752977454],
    popup: {
      title: "Sochraina Mortar 1",
      description: "",
      link: { url: "", label: "" },
    },
    id: "16",
  },
  {
    categoryId: "6",
    position: [2825.952251012037, 2042.8314908479356],
    popup: {
      title: "Sochraina Mortar 2",
      description: "On top of hill near houses",
      link: { url: "", label: "" },
    },
    id: "17",
  },
  {
    categoryId: "6",
    position: [3107.0271965336897, 2175.7675657110067],
    popup: {
      title: "Sochraina Mortar 3",
      description: "Located around the center of this farm area",
      link: { url: "", label: "" },
    },
    id: "18",
  },
  {
    categoryId: "6",
    position: [6253.75, 3560],
    popup: {
      title: "Naval Mortar 1",
      description:
        "Located at the far end of this parking lot near a sniper tower",
      link: { url: "", label: "" },
    },
    id: "19",
  },
  {
    categoryId: "2",
    position: [6303.75, 3561.875],
    popup: {
      title: "Naval Sniper 2",
      description: "Located in a watchtower in the parking lot.",
      link: { url: "", label: "" },
    },
    id: "20",
  },
  {
    categoryId: "4",
    position: [6143.697268339318, 3344.2615216217764],
    popup: {
      title: "Naval VIP 2",
      description: "Located in the top floor of the HQ building",
      link: { url: "", label: "" },
    },
    id: "21",
  },
  {
    categoryId: "6",
    position: [6132.737113230926, 3373.606453041018],
    popup: {
      title: "Naval Mortar 2",
      description: "Located on the rooftop of the HQ building",
      link: { url: "", label: "" },
    },
    id: "22",
  },
  {
    categoryId: "1",
    position: [6761.70859509636, 3168.191933106326],
    popup: {
      title: "Naval Anti-Air RPGer",
      description: "Armed with 9K38 Igla, stands on top of silo",
      link: { url: "", label: "" },
    },
    id: "23",
  },
  {
    categoryId: "2",
    position: [6384.467127333337, 2834.083978995682],
    popup: {
      title: "Naval Sniper 3",
      description: "On top of cell tower in this parking lot",
      link: { url: "", label: "" },
    },
    id: "24",
  },
  {
    categoryId: "6",
    position: [6308.806701746376, 2822.7702704966973],
    popup: {
      title: "Naval Mortar 3",
      description: "On elevated platform at far end of this parking lot",
      link: { url: "", label: "" },
    },
    id: "25",
  },
  {
    categoryId: "8",
    position: [7109, 2992],
    popup: {
      title: "Naval anti-air radar 1",
      description: "Located on this dock. Needs to be destroyed via explosive.",
      link: { url: "", label: "" },
    },
    id: "26",
  },
  {
    categoryId: "8",
    position: [5862, 2605],
    popup: {
      title: "Naval anti-air radar 2",
      description:
        "Located on the end of this dock. Needs to be destroyed via explosive charge.",
      link: { url: "", label: "" },
    },
    id: "27",
  },
  {
    categoryId: "8",
    position: [6385, 3279],
    popup: {
      title: "Enemy submarine 1",
      description:
        "Located inside the submarine dock in the cave. Needs to be destroyed via 8 explosive charges.",
      link: { url: "", label: "" },
    },
    id: "28",
  },
  {
    categoryId: "8",
    position: [6621, 2913],
    popup: {
      title: "Enemy submarine 2",
      description:
        "Located inside the submarine dock in this cave. Needs to be destroyed via 8 explosive charges.",
      link: { url: "", label: "" },
    },
    id: "29",
  },
  {
    categoryId: "8",
    position: [6334, 4574],
    popup: {
      title: "Unknown explosive target",
      description: "TBA",
      link: { url: "", label: "" },
    },
    id: "30",
  },
  {
    categoryId: "7",
    position: [6781.8611383601765, 4497.906235127629],
    popup: {
      title: "Fort SAM Launcher 1",
      description:
        "While all anti-air radars are active, this will shoot down any UNJTF helicopters in the area, including in Ronongrad City. Must be destroyed via explosive charges.",
      link: { url: "", label: "" },
    },
    id: "31",
  },
  {
    categoryId: "7",
    position: [6814.388050294758, 4943.3835072751535],
    popup: {
      title: "Fort SAM Launcher 2",
      description:
        "While anti-air radars are active, this will shoot down any UNJTF aircraft in the area, including in Ronongrad City. Must be destroyed via explosive charge.",
      link: { url: "", label: "" },
    },
    id: "32",
  },
  {
    categoryId: "4",
    position: [6737.313411145425, 4846.5098782525965],
    popup: {
      title: "Fort VIP",
      description:
        "Located in the top floor of the HQ building, in the auditorium.",
      link: { url: "", label: "" },
    },
    id: "33",
  },
  {
    categoryId: "8",
    position: [6672.259587276262, 4452.651401131689],
    popup: {
      title: "Fort artillery cannons",
      description:
        "A series of 4 artillery cannons in a line. All 4 must be destroyed via explosive charges. The 4 cannons are under the same objective, so the charges will not detonate until one is placed on every cannon.",
      link: { url: "", label: "" },
    },
    id: "34",
  },
  {
    categoryId: "9",
    position: [6558.415395505228, 4926.412944526676],
    popup: {
      title: "Fort helipad",
      description:
        "PoD heli will land here when deploying reinforcements.",
      link: { url: "", label: "" },
    },
    id: "35",
  },
  {
    categoryId: "4",
    position: [4997.123622645331, 3504.421207560529],
    popup: {
      title: "Ronongrad City VIP 1",
      description: "",
      link: { url: "", label: "" },
    },
    id: "36",
  },
  {
    categoryId: "4",
    position: [5073.491155013478, 3502.2998872169696],
    popup: {
      title: "Ronongrad City VIP 2",
      description: "",
      link: { url: "", label: "" },
    },
    id: "37",
  },
  {
    categoryId: "4",
    position: [4996.4165158641445, 3413.2044327874646],
    popup: {
      title: "Ronongrad City VIP 3",
      description: "",
      link: { url: "", label: "" },
    },
    id: "38",
  },
  {
    categoryId: "8",
    position: [3282, 2833],
    popup: {
      title: "Quarry generator",
      description:
        "A power generator inside a warehouse. Must be destroyed via 4 explosive charges.",
      link: { url: "", label: "" },
    },
    id: "39",
  },
  {
    categoryId: "4",
    position: [3261, 2695],
    popup: {
      title: "Quarry VIP",
      description: "Located in a small room in the mineshaft break area.",
      link: { url: "", label: "" },
    },
    id: "40",
  },
  {
    categoryId: "8",
    position: [3195, 1496],
    popup: {
      title: "Sochraina anti-air radar",
      description:
        "Located at the end of the pier. Must be destroyed via explosive charge. Provides target data to the SAM launchers at Fort Ronongrad.",
      link: { url: "", label: "" },
    },
    id: "41",
  },
  {
    categoryId: "9",
    position: [3156, 1579],
    popup: {
      title: "Heli landing area",
      description:
        "Heli will land in the parking lot and deploy reinforcements here.",
      link: { url: "", label: "" },
    },
    id: "42",
  },
  {
    categoryId: "10",
    position: [2547, 1453],
    popup: {
      title: "Sochraina/Pushkino minefield",
      description: "Series of mines laid on the western approach road to Sochraina",
      link: { url: "", label: "" },
    },
    id: "43",
  },
  {
    categoryId: "5",
    position: [1415, 2499],
    popup: {
      title: "RLF outpost",
      description:
        "A small lot occupied by RLF forces. Acts as an impromptu early warning post for Kozlovka.",
      link: { url: "", label: "" },
    },
    id: "44",
  },
  {
    categoryId: "2",
    position: [695, 1684],
    popup: {
      title: "Kozlovka sniper",
      description: "On top of the church steeple.",
      link: { url: "", label: "" },
    },
    id: "45",
  },
  {
    categoryId: "4",
    position: [623, 1430],
    popup: {
      title: "Kozlovka VIP",
      description:
        "Located on the top floor in a room next to the roof stairwell.",
      link: { url: "", label: "" },
    },
    id: "46",
  },
  {
    categoryId: "8",
    position: [578, 1622],
    popup: {
      title: "Kozlovka anti-air radar",
      description:
        "Anti-air radar located a short distance from the church. Needs to be destroyed via explosive charge. Provides target data to the SAM launchers at Fort Ronongrad.",
      link: { url: "", label: "" },
    },
    id: "47",
  },
  {
    categoryId: "2",
    position: [3506, 5735],
    popup: {
      title: "D.O.U. sniper 1",
      description: "Located on top of the tower here.",
      link: { url: "", label: "" },
    },
    id: "48",
  },
  {
    categoryId: "1",
    position: [3607, 5683],
    popup: {
      title: "D.O.U. anti-tank RPGer",
      description: "Armed with an RPG-7, stationed on top of this pipe.",
      link: { url: "", label: "" },
    },
    id: "49",
  },
  {
    categoryId: "8",
    position: [2505, 6072],
    popup: {
      title: "Mountain radar array",
      description:
        "The largest anti-air radar on the island. Requires 8 explosive charges to destroy. Provides target data to the SAM launchers at Fort Ronongrad.",
      link: { url: "", label: "" },
    },
    id: "50",
  },
  {
    categoryId: "8",
    position: [2403, 6032],
    popup: {
      title: "Mountain artillery cannons",
      description:
        "A group of artillery cannons. Non-functional but must be destroyed via explosive charges.",
      link: { url: "", label: "" },
    },
    id: "51",
  },
  {
    categoryId: "9",
    position: [2575, 6117],
    popup: {
      title: "Mountain helipad 1",
      description:
        "PoD heli will land here and deploy reinforcements.",
      link: { url: "", label: "" },
    },
    id: "52",
  },
  {
    categoryId: "10",
    position: [5362.697828518776, 3826.8618997815947],
    popup: {
      title: "Bridge minefield",
      description:
        "A minefield on the bridge from Ronongrad City. Located just before a set of tank traps.",
      link: { url: "", label: "" },
    },
    id: "53",
  },
  {
    categoryId: "10",
    position: [6298.907206809765, 4516.998118219665],
    popup: {
      title: "Fort minefield 1",
      description:
        "Visible minefield at the main gate to Fort Ronongrad.",
      link: { url: "", label: "" },
    },
    id: "54",
  },
  {
    categoryId: "10",
    position: [6407, 4516],
    popup: {
      title: "Fort minefield 2",
      description: "Small minefield concealed under a debris pile.",
      link: { url: "", label: "" },
    },
    id: "55",
  },
  {
    categoryId: "10",
    position: [6602, 4548],
    popup: {
      title: "Fort minefield 3",
      description:
        "Small minefield located just before the archway into the HQ compound.",
      link: { url: "", label: "" },
    },
    id: "56",
  },
  {
    categoryId: "2",
    position: [3620, 2957],
    popup: {
      title: "Quarry sniper 1",
      description: "Located in a watchtower near the barracks.",
      link: { url: "", label: "" },
    },
    id: "57",
  },
  {
    categoryId: "2",
    position: [3345, 2908],
    popup: {
      title: "Quarry sniper 2",
      description: "Located just before the warehouse.",
      link: { url: "", label: "" },
    },
    id: "58",
  },
  {
    categoryId: "10",
    position: [3606, 3019],
    popup: {
      title: "Quarry minefield 1",
      description:
        "Small minefield at the start of the approach road to the warehouse area.",
      link: { url: "", label: "" },
    },
    id: "59",
  },
  {
    categoryId: "10",
    position: [3381, 2934],
    popup: {
      title: "Quarry minefield 2",
      description:
        "Small minefield located at the end of the approach road.",
      link: { url: "", label: "" },
    },
    id: "60",
  },
  {
    categoryId: "11",
    position: [3424.850359196282, 5758.756919808563],
    popup: {
      title: "Machine Gunner",
      description: "On vehicle",
      link: { url: "", label: "" },
    },
    id: "61",
  },
  {
    categoryId: "7",
    position: [6314.378244145317, 2801.873297400216],
    popup: {
      title: "Naval Base SAM site",
      description:
        "While all anti-air radars are active, this will shoot down any UNJTF helicopters in the area, including in Ronongrad City. Must be destroyed via explosive charges.",
      link: { url: "", label: "" },
    },
    id: "62",
  },
  {
    categoryId: "6",
    position: [2994.75, 1686],
    popup: {
      title: "Sochraina Mortar 4",
      description: "",
      link: { url: "", label: "" },
    },
    id: "63",
  },
].map((marker) => {
  const visualCategoryId = ENEMY_CATEGORY_ID_MAP[marker.categoryId];

  return {
    ...marker,
    id: `enemy-${marker.id}`,
    categoryId: SUPPLEMENTAL_ENEMY_FILTER_CATEGORY.id,
    visualCategory:
      SUPPLEMENTAL_ENEMY_CATEGORIES_BY_ID[visualCategoryId] ?? null,
    popup: {
      ...marker.popup,
      description:
        marker.popup?.description ||
        ENEMY_CATEGORY_FALLBACK_DESCRIPTIONS[visualCategoryId] ||
        "",
    },
  };
});

export const RONOGRAD_MAP_DATA = {
  mapImage,
  pageCategories: [],
  defaultSort: "",
  description: "Gravity_Defier's 16k orthographic map.",
  coordinateOrder: "xy",
  mapBounds: [
    [0, 0],
    [7187, 7382],
  ],
  origin: "bottom-left",
  useMarkerClustering: true,
  categories: [
    {
      id: "2",
      listId: 1,
      name: "Hostile Locations",
      color: "#ff005e",
      symbol: "H",
      symbolColor: "#fff",
      iconKey: "hostile-location",
    },
    {
      id: "3",
      listId: 2,
      name: "Hostile Outposts",
      color: "#9b0039",
      symbol: "P",
      symbolColor: "#fff",
      iconKey: "hostile-outpost",
    },
    {
      id: "4",
      listId: 3,
      name: "Objective",
      color: "#fa8800",
      symbol: "O",
      symbolColor: "#000",
      iconKey: "objective",
    },
    {
      id: "5",
      listId: 4,
      name: "Anti-Air",
      color: "#9c00fa",
      symbol: "A",
      symbolColor: "#fff",
      icon: "File:Warning-icon.png",
      iconKey: "anti-air",
    },
    {
      id: "6",
      listId: 5,
      name: "Resources",
      color: "#079704",
      symbol: "R",
      symbolColor: "#fff",
      iconKey: "resources",
    },
    {
      id: "7",
      listId: 6,
      name: "Friendly Positions",
      color: "#00fa29",
      symbol: "F",
      symbolColor: "#000",
      iconKey: "friendly",
    },
    {
      id: "8",
      listId: 7,
      name: "Bunker",
      color: "#0001fa",
      symbol: "B",
      symbolColor: "#fff",
      iconKey: "bunker",
    },
    ...SUPPLEMENTAL_ENEMY_CATEGORIES,
    SUPPLEMENTAL_ENEMY_FILTER_CATEGORY,
  ],
  markers: [
    {
      id: "1",
      categoryId: "2",
      position: [3167.107487002409, 1781.8932497832432],
      popup: {
        title: "Sochraina City",
        description: "Hostile city",
        link: {
          url: "Sochraina City",
          label: "Sochrania City",
        },
        image: "File:RobloxScreenShot20240607 203351985.png",
      },
    },
    {
      id: "2",
      categoryId: "2",
      position: [3389.928557527516, 2743.9463347770766],
      popup: {
        title: "Quarry",
        description: "Hostile quarry",
        link: {
          url: "Quarry",
          label: "Quarry",
        },
        image: "File:RobloxScreenShot20240607 203632601.png",
      },
    },
    {
      id: "3",
      categoryId: "2",
      position: [6633.787932497691, 4708.957651342561],
      popup: {
        title: "Fort Ronograd",
        description: "",
        link: {
          url: "Fort Ronograd",
          label: "Fort Ronograd",
        },
        image: "File:Fort Ronograd.png",
      },
    },
    {
      id: "4",
      categoryId: "5",
      position: [6813.240888171495, 4977.73233250812],
      popup: {
        title: "Anti-Air",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "5",
      categoryId: "5",
      position: [6736.48568422967, 4718.47894441653],
      popup: {
        title: "Mortar",
        description: "Can be disabled manually",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "6",
      categoryId: "5",
      position: [6301.585474137823, 2798.934669642356],
      popup: {
        title: "Anti-Air",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "7",
      categoryId: "4",
      position: [6557.480737464673, 2767.9828234280244],
      popup: {
        title: "Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "8",
      categoryId: "6",
      position: [5839.272224081837, 3227.2243232058336],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "9",
      categoryId: "6",
      position: [5936.147170124111, 3183.3784129412707],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "10",
      categoryId: "6",
      position: [3194.9797961774075, 2664.976965329033],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "11",
      categoryId: "6",
      position: [4905.893510432961, 3369.3518066259967],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "12",
      categoryId: "6",
      position: [5107.7805826795475, 3465.5135148412746],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "13",
      categoryId: "6",
      position: [690.4778222165857, 1316.6194214152595],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "14",
      categoryId: "6",
      position: [421.2424688917014, 533.6926879710829],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "15",
      categoryId: "7",
      position: [1463.811933266242, 3367.822689020255],
      popup: {
        title: "Forward Operating Base",
        description: "",
        link: {
          url: "Forward Operating Base",
          label: "Forward Operating Base",
        },
        image: "File:Forward Operating Base.png",
      },
    },
    {
      id: "16",
      categoryId: "8",
      position: [3855.479535821355, 6449.98591080452],
      popup: {
        title: "Bunker",
        description: "",
        link: {
          url: "Bunker",
          label: "Bunker",
        },
        image: "File:Bunker.png",
      },
    },
    {
      id: "17",
      categoryId: "3",
      position: [4294.237253979021, 4026.2492776365834],
      popup: {
        title: "Hostile Outpost",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "18",
      categoryId: "2",
      position: [3583.9638782159855, 5715.976413092034],
      popup: {
        title: "Department of Utilities",
        description: "Unlocks a spawn when captured",
        link: {
          url: "Locations",
          label: "Department of Utilities",
        },
        image: "File:DoU.png",
      },
    },
    {
      id: "19",
      categoryId: "3",
      position: [1276.687794129517, 2236.1074198376123],
      popup: {
        title: "Hostile Outpost",
        description: "",
        link: {
          url: "",
          label: "",
        },
        image: "File:Hostile Outpost between Kozlovka and highway.png",
      },
    },
    {
      id: "20",
      categoryId: "3",
      position: [2891.0095049604033, 3460.17886142026],
      popup: {
        title: "Hostile Outpost",
        description: "",
        link: {
          url: "",
          label: "",
        },
        image: "File:Enemy Outpost Road Quarry.png",
      },
    },
    {
      id: "21",
      categoryId: "2",
      position: [3560.938212970528, 3913.070716352083],
      popup: {
        title: "Lesdolina",
        description: "",
        link: {
          url: "Locations",
          label: "Lesdolina",
        },
        image: "File:Villagemap.png",
      },
    },
    {
      id: "22",
      categoryId: "2",
      position: [5076.921462201208, 3676.8426471407415],
      popup: {
        title: "Ronograd City",
        description: "Friendly once captured",
        link: {
          url: "Ronograd City",
          label: "Ronograd City",
        },
        image: "File:Ronograd City Compound 2.png",
      },
    },
    {
      id: "23",
      categoryId: "7",
      position: [5058.735996472876, 3929.108533282545],
      popup: {
        title: "Friendly spawn once captured",
        description: "",
        link: {
          url: "",
          label: "",
        },
        image: "File:Ronograd-City Friendly.png",
      },
    },
    {
      id: "24",
      categoryId: "2",
      position: [6222.959111697487, 3382.9785505065306],
      popup: {
        title: "Naval Base",
        description: "",
        link: {
          url: "Naval Base",
          label: "Locations",
        },
        image: "File:Naval Base Resources.png",
      },
    },
    {
      id: "25",
      categoryId: "2",
      position: [2064.584398595373, 1108.462225794303],
      popup: {
        title: "Pushkino",
        description: "",
        link: {
          url: "Pushkino",
          label: "Locations",
        },
        image: "File:Pushkino top-down view.png",
      },
    },
    {
      id: "26",
      categoryId: "2",
      position: [848.5053711198868, 1518.14337201047],
      popup: {
        title: "Kozlovka",
        description: "",
        link: {
          url: "Kozlovka",
          label: "Locations",
        },
        image: "File:Kozlovka.png",
      },
    },
    {
      id: "27",
      categoryId: "2",
      position: [376.20929458959506, 559.9647704419799],
      popup: {
        title: "Depot",
        description: "",
        link: {
          url: "Depot",
          label: "Locations",
        },
        image: "File:Depot.png",
      },
    },
    {
      id: "28",
      categoryId: "3",
      position: [6237.367595015802, 3777.3417011148267],
      popup: {
        title: "Hostile Outpost",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "29",
      categoryId: "4",
      position: [3197.490739239027, 1499.7392742995153],
      popup: {
        title: "Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "30",
      categoryId: "4",
      position: [3275.3669723584917, 2820.237952529041],
      popup: {
        title: "Objective",
        description: "Plant 4 Explosives",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "31",
      categoryId: "7",
      position: [3728.486144859609, 5949.491452249512],
      popup: {
        title: "Friendly position when captured",
        description: "",
        link: {
          url: "",
          label: "",
        },
        image: "File:DoU Friendly.png",
      },
    },
    {
      id: "32",
      categoryId: "2",
      position: [2499, 6204.346352941176],
      popup: {
        title: "Mountain Radar Station",
        description: "",
        link: {
          url: "",
          label: "",
        },
        image: "File:Mountain Outpost.png",
      },
    },
    {
      id: "33",
      categoryId: "2",
      position: [4826.75072546641, 4395.091071502068],
      popup: {
        title: "Bunker 4",
        description: "",
        link: {
          url: "Bunker 4",
          label: "Bunker 4",
        },
        image: "File:Bunker4 operation cryo.png",
      },
    },
    {
      id: "34",
      categoryId: "3",
      position: [2421.375, 4495.3749046720595],
      popup: {
        title: "Ronograd Creature",
        description: "",
        link: {
          url: "",
          label: "",
        },
        image: "File:Ronocreature.png",
      },
    },
    {
      id: "35",
      categoryId: "3",
      position: [2984.408010661672, 5003.9921875],
      popup: {
        title: "DOU Backup Post",
        description: "",
        link: {
          url: "",
          label: "",
        },
        image: "File:DoU Backup Post top-down view.png",
      },
    },
    {
      id: "36",
      categoryId: "4",
      position: [6305.814780533589, 4650.130995263047],
      popup: {
        title: "Destroy Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "37",
      categoryId: "6",
      position: [3591.6067680005763, 5639.998046875],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "38",
      categoryId: "4",
      position: [2445.9477436990737, 6136.978372850113],
      popup: {
        title: "Destroy Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "39",
      categoryId: "4",
      position: [2407.437541388029, 6080.40983035519],
      popup: {
        title: "Destroy Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "40",
      categoryId: "4",
      position: [6719.838387422109, 4833.998046875],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "41",
      categoryId: "6",
      position: [6787.578402910348, 4735.498046875],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "42",
      categoryId: "6",
      position: [6859.368321971522, 4767.245970717666],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "43",
      categoryId: "6",
      position: [6389.559150555596, 4498.588195800781],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "44",
      categoryId: "5",
      position: [6574.507851235745, 4593.406748148383],
      popup: {
        title: "Mortar",
        description: "Can be disabled manually",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "45",
      categoryId: "5",
      position: [4002.450671757375, 7039.9921875],
      popup: {
        title: "Nuclear Warhead",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "46",
      categoryId: "4",
      position: [2696.2437750629438, 6394.148804470083],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "47",
      categoryId: "6",
      position: [3322.6947647955867, 2882.874346897554],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "48",
      categoryId: "4",
      position: [4831.660635847679, 4398.204178980325],
      popup: {
        title: "Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "49",
      categoryId: "4",
      position: [2047, 1147.5],
      popup: {
        title: "Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "50",
      categoryId: "7",
      position: [3158, 1579],
      popup: {
        title: "Friendly spawn once captured",
        description: "",
        link: {
          url: "",
          label: "",
        },
        image: "File:Sochraina Freindly.png",
      },
    },
    {
      id: "51",
      categoryId: "4",
      position: [3254.5343392086256, 1699.363886692289],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "52",
      categoryId: "4",
      position: [4992.945321786431, 3417.182986178058],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "53",
      categoryId: "4",
      position: [5065.609427029833, 3413.9041802557704],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "54",
      categoryId: "4",
      position: [4997.512709941857, 3529.677304214939],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "55",
      categoryId: "4",
      position: [5071.366155013478, 3500.688974513496],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "56",
      categoryId: "4",
      position: [650.3478211169846, 1391.2273881644892],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "57",
      categoryId: "4",
      position: [3245.1248246817127, 2731.75],
      popup: {
        title: "Eliminate VIP",
        description: "Underground, needs breaching charge",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "58",
      categoryId: "4",
      position: [6672.966694057449, 4459.015362162369],
      popup: {
        title: "Destroy Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "59",
      categoryId: "4",
      position: [6813.75, 4989],
      popup: {
        title: "Destroy Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "60",
      categoryId: "4",
      position: [7112, 2992],
      popup: {
        title: "Destroy Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "61",
      categoryId: "4",
      position: [6050.5, 2561.25],
      popup: {
        title: "Destroy Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "62",
      categoryId: "4",
      position: [6315.170662777055, 2813.5778823412725],
      popup: {
        title: "Destroy Objective",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "63",
      categoryId: "4",
      position: [6193.375, 3339.625],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "64",
      categoryId: "4",
      position: [6218.875, 3274.75],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "65",
      categoryId: "4",
      position: [2551.2412665210627, 6214.407946457973],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "66",
      categoryId: "5",
      position: [377.9448035022408, 545.4453187411776],
      popup: {
        title: "Mortar",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "67",
      categoryId: "5",
      position: [3269.29477750191, 1919.2189898856004],
      popup: {
        title: "Mortar",
        description: "Can be disabled manually",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "68",
      categoryId: "5",
      position: [5002.1522463461415, 3422.079088902655],
      popup: {
        title: "Mortar",
        description: "Can be disabled manually",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "69",
      categoryId: "5",
      position: [4999.803786771754, 3507.517449224716],
      popup: {
        title: "Mortar",
        description: "Can be disabled manually",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "70",
      categoryId: "5",
      position: [5071.63092966995, 3506.930230982023],
      popup: {
        title: "Mortar",
        description: "Can be disabled manually",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "71",
      categoryId: "5",
      position: [5012.94995638547, 3323.617910517611],
      popup: {
        title: "Mortar",
        description: "Can be disabled manually",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "72",
      categoryId: "5",
      position: [3494.7049023133277, 3829.738242389079],
      popup: {
        title: "Mortar",
        description: "Can be disabled manually",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "73",
      categoryId: "4",
      position: [3514.86028928548, 3814.1723463666203],
      popup: {
        title: "Eliminate VIP",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "74",
      categoryId: "3",
      position: [5775.57538745614, 3833.1679628598486],
      popup: {
        title: "Hostile Outpost",
        description: "",
        link: {
          url: "Ronograd Bridge",
          label: "Ronograd Bridge",
        },
        image: "File:Bridge Outpost between Ronograd and Naval.png",
      },
    },
    {
      id: "75",
      categoryId: "5",
      position: [3309.570081546536, 2745.5],
      popup: {
        title: "Mortar",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "76",
      categoryId: "6",
      position: [3254.070081546536, 2566.5],
      popup: {
        title: "Resources",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "77",
      categoryId: "5",
      position: [6325.833513944132, 2840.094386635768],
      popup: {
        title: "Mortar",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "78",
      categoryId: "5",
      position: [6762.030196636199, 4485],
      popup: {
        title: "Mortar",
        description: "",
        link: {
          url: "",
          label: "",
        },
      },
    },
    {
      id: "79",
      categoryId: "4",
      position: [1090.041154029149, 1355.5],
      popup: {
        title: "Objective",
        description: "Plant Explosive",
        link: {
          url: "",
          label: "",
        },
      },
    },
    ...SUPPLEMENTAL_ENEMY_MARKERS,
  ],
  markerProgress: true,
};

export const SUPPLEMENTAL_ENEMY_CATEGORIES_FOR_MARKERS = SUPPLEMENTAL_ENEMY_CATEGORIES;
export const SUPPLEMENTAL_ENEMY_CATEGORY_IDS_FOR_MARKERS = SUPPLEMENTAL_ENEMY_CATEGORIES_FOR_MARKERS.map((cat) => cat.id);
