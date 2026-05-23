/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

export const HOSTILE_INTEL_CATEGORY_IDS = new Set(["2", "3"]);

const SOURCES = {
  locations:
    "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Locations_%28Ronograd%29",
  sochraina:
    "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Sochraina_City",
  quarry: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Quarry",
  fort: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Fort_Ronograd",
  dou: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Department_of_Utilities",
  lesdolina: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Lesdolina",
  ronogradCity:
    "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Ronograd_City",
  naval: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Naval_Base",
  pushkino: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Pushkino",
  kozlovka: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Kozlovka",
  depot: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Depot",
  mountain:
    "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Mountain_Radar_Station",
  bunker4: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Bunker_4",
  bridge: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/Ronograd_Bridge",
  npcs: "https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/NPCs",
  creatureForum:
    "https://roblox-blackhawk-rescue-mission-5.fandom.com/f/p/4400000000000138476",
};

const THREAT_INTEL_BY_MARKER_ID = {
  "1": {
    classification: "Hostile Location",
    summary:
      "Sochraina adalah kota pesisir hostile dengan campuran PoD dan RLF, mortar tersebar, dan radar pier sebagai objective utama sebelum area benar-benar aman.",
    keyPoints: [
      "Pendekatan barat dan jalur dari Pushkino rawan ranjau serta tembakan silang.",
      "Lighthouse sniper jadi ancaman jarak jauh paling konsisten saat entry.",
      "Setelah direbut, area ini berubah jadi spawn point tim di sisi parkiran selatan pier.",
    ],
    hiddenIntel: [
      "Wiki Fort Ronograd menyebut key sewer Fort bisa spawn acak di VIP room Sochraina.",
      "Patch lama pernah menjadikan Sochraina safe zone; sekarang node ini sepenuhnya raid-oriented.",
      "Rute heliborne ke sisi harbor lebih aman untuk memotong jalan masuk utama.",
    ],
    suggestedKit: [
      "Primary: carbine / AR dengan optic 1x-4x.",
      "Support: smoke dan frag untuk putus LOS mortar.",
      "Reason: saran loadout ini adalah inferensi dari area urban-coastal dengan sniper dan mortar.",
    ],
    sources: [
      { label: "Sochraina City", url: SOURCES.sochraina },
      { label: "Fort Ronograd", url: SOURCES.fort },
    ],
  },
  "2": {
    classification: "Hostile Location",
    summary:
      "Quarry adalah site industri tambang dengan pit terbuka, processing plant bertingkat, dan banyak high-ground angle yang memaksa entry lebih sabar.",
    keyPoints: [
      "Excavation pits memberi cover batu, tapi juga membuka banyak sudut tembak ledge.",
      "HVT utama berada di processing plant yang penuh choke point dan conveyor.",
      "Office buildings di perimeter bagus untuk flank dan staging sebelum push tengah.",
    ],
    hiddenIntel: [
      "VIP room Quarry termasuk salah satu kandidat spawn key untuk sewer Fort Ronograd.",
      "Overwatch dari tebing sangat efektif sebelum turun ke pit utama.",
      "Outpost kecil di road approach kemungkinan berfungsi sebagai layar peringatan awal Quarry.",
    ],
    suggestedKit: [
      "Primary: DMR ringan atau AR stabil recoil.",
      "Support: smoke untuk transisi antar pit dan mid-range optic.",
      "Reason: inferensi dari medan terbuka, ledge tinggi, dan plant bertingkat.",
    ],
    sources: [
      { label: "Quarry", url: SOURCES.quarry },
      { label: "Fort Ronograd", url: SOURCES.fort },
    ],
  },
  "3": {
    classification: "Hostile Location",
    summary:
      "Fort Ronograd adalah hub operasi PoD dengan dua SAM battery, banyak plant explosive objective, dan command center yang paling padat pertahanannya di map utama.",
    keyPoints: [
      "Main gate dibentuk jadi kill zone dengan sniper, MG, mortar, dan minefield.",
      "Command center menumpuk PKP, mortar, VIP/HVT, dan reinforcement lewat helipad.",
      "Artillery strip dan SAM node membuat assault frontal cepat jadi sangat mahal.",
    ],
    hiddenIntel: [
      "Ada sewer entrance rahasia di belakang Fort yang hanya bisa dibuka dengan key acak dari VIP room compound besar lain.",
      "Heli reinforcement tetap datang saat raid dimulai walau stealth masih terjaga.",
      "Fort lebih mudah ditembus kalau force multiplier seperti mortar, SAM, dan roof gun lebih dulu dimatikan.",
    ],
    suggestedKit: [
      "Primary: battle rifle / AR 1x-6x, idealnya satu operator bawa long-range support.",
      "Support: smoke, explosive utility, dan anti-air capability jika tim punya.",
      "Reason: inferensi dari gabungan area terbuka, vertical strongpoint, dan heliborne reinforcement.",
    ],
    sources: [
      { label: "Fort Ronograd", url: SOURCES.fort },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
  },
  "17": {
    classification: "Hostile Outpost",
    summary:
      "Outpost ini kemungkinan jadi layar awal untuk menutup approach ke Lesdolina dan memecah operator sebelum masuk ke desa utama.",
    keyPoints: [
      "Posisi dekat sumbu tengah island membuat outpost ini bagus sebagai checkpoint bergerak.",
      "Kemungkinan besar dipakai untuk spotting kendaraan dan memberi warning ke village core.",
      "Kontrol outpost lebih dulu akan mengurangi tekanan saat push ke Lesdolina.",
    ],
    hiddenIntel: [
      "Ini inferensi dari lokasi marker dan pola pertahanan Lesdolina, bukan halaman wiki khusus.",
      "Lesdolina punya marksman di bukit dan watchtower; outpost ini selaras dengan pola screening itu.",
      "Arah ridge sekitar area masih berpotensi dipakai overwatch walau pos depan dibersihkan.",
    ],
    suggestedKit: [
      "Primary: suppressed rifle atau AR akurat.",
      "Support: smoke tipis untuk lanjut ke desa tengah.",
      "Reason: inferensi dari role outpost sebagai early warning node.",
    ],
    sources: [
      { label: "Lesdolina", url: SOURCES.lesdolina },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
    inferred: true,
  },
  "18": {
    classification: "Hostile Location",
    summary:
      "Department of Utilities adalah kompleks pembangkit / utilitas berat dengan bangunan vertikal, warehouse, dan reinforcement campuran RLF-PoD pada fase lanjut.",
    keyPoints: [
      "Main control building memaksa fight vertikal di corridor sempit dan tangga.",
      "Warehouse memberi cover bagus, tapi patrol sering bergerak silang antar bangunan.",
      "Infil rear road via helicopter diakui lebih aman, walau masih berisiko kena RPG atau AA.",
    ],
    hiddenIntel: [
      "Wiki lokasi menyebut area ini diduga punya fasilitas nuklir walau hall reaktor belum pernah ditampilkan jelas.",
      "Sesudah direbut, DOU bisa dipakai sebagai spawn point friendly.",
      "DOU Backup Post di selatan/sekitar road line kemungkinan dipakai sebagai ring reinforcement luar.",
    ],
    suggestedKit: [
      "Primary: AR modular dengan optic 1x-4x.",
      "Support: smoke, breaching utility, dan med supply lebih.",
      "Reason: inferensi dari fight campuran indoor-outer yard dan potensi reinforcement wave.",
    ],
    sources: [
      { label: "Department of Utilities", url: SOURCES.dou },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
  },
  "19": {
    classification: "Hostile Outpost",
    summary:
      "Outpost highway Kozlovka ini berfungsi seperti pos warning kecil yang menutup jalur masuk dari road sebelum operator mencapai cluster rumah utama.",
    keyPoints: [
      "Pos kecil seperti ini cocok untuk sniper / rifleman screening sebelum town center aktif.",
      "Membersihkan node ini lebih dulu biasanya membuka approach lebih tenang ke church dan apartment block.",
      "Coverage paling berbahaya biasanya datang dari arah rumah, bukit kecil, dan lane menuju village core.",
    ],
    hiddenIntel: [
      "Tidak ada halaman wiki khusus; ringkasan ini diinferensikan dari marker placement dan halaman Kozlovka.",
      "Kozlovka sendiri punya church sniper serta objective radar, jadi warning node seperti ini sangat masuk akal.",
      "Cocok dianggap area pre-contact untuk menahan kendaraan ringan.",
    ],
    suggestedKit: [
      "Primary: suppressed AR atau DMR ringan.",
      "Support: frag untuk cepat clear posisi cover rendah.",
      "Reason: inferensi dari konteks outpost kecil di suburban edge.",
    ],
    sources: [
      { label: "Kozlovka", url: SOURCES.kozlovka },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
    inferred: true,
  },
  "20": {
    classification: "Hostile Outpost",
    summary:
      "Road Quarry Outpost tampak disusun untuk mengunci approach ke quarry sebelum operator mencapai pit dan processing lane.",
    keyPoints: [
      "Kemungkinan dipakai sebagai ambush point awal dengan sudut tembak ke jalan dan kendaraan masuk.",
      "Membersihkannya lebih awal menurunkan risiko ditekan dari belakang saat push ke Quarry.",
      "Area ini efektif sebagai node cover bagi unit mortar / marksman yang menjaga jalur tengah.",
    ],
    hiddenIntel: [
      "Tidak ada article spesifik; poin ini diinferensikan dari posisi marker dan pola Quarry.",
      "Quarry sangat bergantung pada high-ground advantage, jadi outpost pendekat seperti ini sangat bernilai.",
      "Node ini kemungkinan juga memisah tempo operator sebelum HVT plant didekati.",
    ],
    suggestedKit: [
      "Primary: AR dengan recoil rendah atau DMR.",
      "Support: smoke untuk melanjutkan push ke pit terbuka.",
      "Reason: inferensi dari road ambush dan terrain terbuka berbatu.",
    ],
    sources: [
      { label: "Quarry", url: SOURCES.quarry },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
    inferred: true,
  },
  "21": {
    classification: "Hostile Location",
    summary:
      "Lesdolina adalah desa rural tengah pulau yang seluruhnya dikontrol RLF, ditopang marksman/sniper di elevasi dan satu mortar yang menjaga ritme fight.",
    keyPoints: [
      "Village core terdiri dari barns, watchtower, rumah, dan windmill dengan satu HVT utama.",
      "Mountain ring di sekeliling desa memberi vantage point kuat bagi penyerang maupun defender.",
      "Long-range pick dari lereng bisa mengurangi beban sebelum masuk ke rumah-rumah.",
    ],
    hiddenIntel: [
      "Wiki menyebut sekitar 44 militant menjaga area ini, menjadikannya cukup padat untuk ukuran village.",
      "Marksman di gunung dan watchtower bikin approach terbuka sangat mudah kebaca.",
      "Outpost-outpost kecil di road line kemungkinan jadi peringatan awal sebelum village core aktif penuh.",
    ],
    suggestedKit: [
      "Primary: DMR atau AR dengan optic menengah.",
      "Support: smoke dan sidearm/secondary cepat untuk clean house.",
      "Reason: inferensi dari kombinasi mountain overwatch dan house clearing.",
    ],
    sources: [
      { label: "Lesdolina", url: SOURCES.lesdolina },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
  },
  "22": {
    classification: "Hostile Location",
    summary:
      "Ronograd City adalah node urban terbesar di sisi timur map, berisi beberapa compound apartemen, 4 HVT, mortar rooftop, dan zona terbuka yang memaksa route discipline.",
    keyPoints: [
      "Apartment blocks jadi stronghold utama dan masing-masing HVT punya security detail sendiri.",
      "Jalur dekat tunnel dan playground adalah kill zone alami karena LOS panjang dan cover tipis.",
      "Setelah kota diamankan, garage section menjadi spawn point dan vehicle node tim.",
    ],
    hiddenIntel: [
      "Ada M1038 berisi equipment HQ yang bisa dicuri dari perimeter apartemen yang dikuasai.",
      "Road setelah tunnel diketahui mined, tapi bisa diakali dengan keluar jalan lebih awal.",
      "VIP room kota ini juga disebut sebagai salah satu lokasi potensial spawn sewer key Fort.",
    ],
    suggestedKit: [
      "Primary: AR urban / rifle serbaguna dengan optic low-mid.",
      "Support: smoke, frag, dan satu senjata CQC cadangan bila tim split floor-to-floor.",
      "Reason: inferensi dari pertarungan apartemen bertingkat dan roof mortar.",
    ],
    sources: [
      { label: "Ronograd City", url: SOURCES.ronogradCity },
      { label: "Fort Ronograd", url: SOURCES.fort },
    ],
  },
  "24": {
    classification: "Hostile Location",
    summary:
      "Naval Base adalah dockyard hostile yang padat level, dengan container lanes, barracks, dan command building yang mengawasi laut serta banyak sudut overwatch.",
    keyPoints: [
      "Docks adalah high-traffic lane dengan nest MG dan patrol yang mudah mengunci frontal push.",
      "Command building biasanya jadi inti objective dan roof overwatch marksman.",
      "Aerial insertion mungkin, tapi posisi anti-air dan exposure pesisir membuatnya mahal.",
    ],
    hiddenIntel: [
      "Halaman lokasi Ronograd menyebut base ini punya underground dockyard / submarine repair station.",
      "VIP room Naval Base termasuk kandidat spawn key untuk sewer Fort.",
      "Patrol boat di sekitar pesisir bisa menambah tekanan bila operator mendekat dari laut.",
    ],
    suggestedKit: [
      "Primary: battle rifle / AR akurat dengan optic menengah.",
      "Support: smoke, launcher atau LMG support bila tim main loud.",
      "Reason: inferensi dari dock lane terbuka, vertical command building, dan anti-air risk.",
    ],
    sources: [
      { label: "Naval Base", url: SOURCES.naval },
      { label: "Fort Ronograd", url: SOURCES.fort },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
  },
  "25": {
    classification: "Hostile Location",
    summary:
      "Pushkino adalah settlement kecil dengan apartemen, garasi, dan bangkai UH-60 yang jadi objective plant explosive sekaligus pusat fight close-quarters.",
    keyPoints: [
      "Crash site UH-60 ada di garage complex dan wajib dihancurkan untuk menutup info sensitif.",
      "Entry timur lebih ringan karena hanya disaring satu sniper nest dibanding approach lain.",
      "Apartemen dan garage sangat menghukum kesalahan kecil saat stealth maupun loud.",
    ],
    hiddenIntel: [
      "Wiki Locations menandai Pushkino sekarang relevan untuk jalur raid menuju Bunker pada GEN4.",
      "Crash Black Hawk mengisyaratkan insiden baru, jadi area ini sering terasa seperti salvage zone aktif.",
      "Reinforcement cenderung masuk dari eastern housing path sehingga lane itu bisa dijadikan trap.",
    ],
    suggestedKit: [
      "Primary: carbine/SMG atau AR pendek untuk CQB.",
      "Support: frag, flash, atau smoke pendek untuk crossing courtyard.",
      "Reason: inferensi dari apartemen sempit, garage fight, dan objective di bangkai heli.",
    ],
    sources: [
      { label: "Pushkino", url: SOURCES.pushkino },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
  },
  "26": {
    classification: "Hostile Location",
    summary:
      "Kozlovka adalah kota pantai kecil dengan church overwatch, objective radar P-80, dan apartment block belakang yang menjadi strongpoint utama.",
    keyPoints: [
      "Dua objective radar tersebar dekat church dan area belakang dekat fighter-jet hill.",
      "Church sniper memberi overwatch utara, sedangkan apartment block belakang jadi benteng terakhir.",
      "Banyak rumah bisa dibobol, jadi fight sering bergeser dari cover luar ke room clearing.",
    ],
    hiddenIntel: [
      "Church bell di area ini bisa ditembak dan benar-benar berbunyi menurut trivia wiki.",
      "Jumlah defender naik saat HVT hadir, jadi tempo fight bisa berubah cepat.",
      "Akses rotari-wing dari selatan disebut memberi sudut masuk yang jauh lebih nyaman.",
    ],
    suggestedKit: [
      "Primary: AR fleksibel atau shotgun cadangan untuk rumah/apartment.",
      "Support: smoke dan frag untuk split entry ke main block.",
      "Reason: inferensi dari layout suburban dengan mix sniper lane dan interior clearing.",
    ],
    sources: [
      { label: "Kozlovka", url: SOURCES.kozlovka },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
  },
  "27": {
    classification: "Hostile Location",
    summary:
      "Depot adalah fasilitas penyimpanan selatan dengan dua warehouse, watchtower sniper, dan pusat defensif berupa PKP nest plus mortar pit.",
    keyPoints: [
      "Tidak punya objective formal, tapi node ini tetap berbahaya karena mortar dan overwatch tower.",
      "Front checkpoint dijaga rifleman dan sniper yang menutup dirt road approach.",
      "MG dan mortar di tengah harus dipadamkan cepat agar lane selatan lebih aman.",
    ],
    hiddenIntel: [
      "Depot sering berfungsi seperti area attrition: bukan objective-heavy, tapi mahal jika diabaikan.",
      "Karena tanpa objective utama, area ini cocok dijadikan clear-fast sebelum bergerak ke node lain.",
      "Kontrol area tengah mengubah Depot dari kill box menjadi supply corridor yang lebih tenang.",
    ],
    suggestedKit: [
      "Primary: DMR / AR dengan optic menengah.",
      "Support: smoke atau precision shot untuk matikan tower dan mortar lebih awal.",
      "Reason: inferensi dari watchtower sniper dan open warehouse yard.",
    ],
    sources: [
      { label: "Depot", url: SOURCES.depot },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
  },
  "28": {
    classification: "Hostile Outpost",
    summary:
      "Outpost ini tampak jadi checkpoint transisi menuju Naval Base, kemungkinan untuk memperlambat push dari arah city-bridge axis ke pantai timur.",
    keyPoints: [
      "Pos seperti ini biasanya menyimpan watch element sebelum operator mencapai dockyard inti.",
      "Clear node ini lebih dulu akan mengurangi risiko sandwich saat fight di Naval Base.",
      "Cocok dianggap sebagai checkpoint resource / personnel staging sebelum base utama.",
    ],
    hiddenIntel: [
      "Tidak ada halaman khusus; analisis ini diinferensikan dari posisi marker dan layout Naval Base + bridge axis.",
      "Bridge dan Naval sama-sama memakai fortifikasi anti-vehicle, jadi checkpoint ini kemungkinan perpanjangan doktrin yang sama.",
      "Kemungkinan paling berbahaya adalah sniper / MG yang menutup road line lurus.",
    ],
    suggestedKit: [
      "Primary: AR stabil atau marksman ringan.",
      "Support: frag untuk clear fortification kecil dan smoke untuk lanjut ke base inti.",
      "Reason: inferensi dari fungsi checkpoint / staging post.",
    ],
    sources: [
      { label: "Naval Base", url: SOURCES.naval },
      { label: "Ronograd Bridge", url: SOURCES.bridge },
    ],
    inferred: true,
  },
  "32": {
    classification: "Hostile Location",
    summary:
      "Mountain Radar Station adalah kompleks high-altitude dengan radar array, artillery, bunker bawah tanah, dua HVT, dan objective penghancuran paling besar di north sector.",
    keyPoints: [
      "Radar array dan D-30 artillery membuat objective count tinggi dan area terbuka sangat berbahaya.",
      "Transformer station, radome, dan underground control room memberi pertarungan multi-layer.",
      "Mortar, sniper, RPG, dan heliborne response bisa membuat loud assault cepat kacau.",
    ],
    hiddenIntel: [
      "Underground HVT room bisa memegang key untuk drainage Fort Ronograd.",
      "Trivia wiki mengaitkan radar ini dengan Duga-style early warning array.",
      "Bunker bawah tanah sangat efektif dijadikan transit aman antar sub-area station.",
    ],
    suggestedKit: [
      "Primary: DMR/battle rifle untuk ridge fight.",
      "Support: smoke sangat direkomendasikan; siapkan senjata kedua untuk bunker CQB.",
      "Reason: inferensi dari campuran long-range ridge combat dan interior bunker.",
    ],
    sources: [
      { label: "Mountain Radar Station", url: SOURCES.mountain },
      { label: "Fort Ronograd", url: SOURCES.fort },
    ],
  },
  "33": {
    classification: "Hostile Location",
    summary:
      "Bunker 4 adalah lokasi rahasia utara Ronograd City yang seluruhnya indoor, tiga lantai, dan fokus pada plant explosive cepat sebelum extraction.",
    keyPoints: [
      "Sepuluh charge harus dipasang sambil bergerak dari floor bawah ke atas.",
      "Spec Ops bersenjata Saiga-12 dan Smoker membuat ruang sempit jadi sangat berbahaya.",
      "Mi-8 reinforcement bisa mendarat dan mengunci stairwell saat raid berjalan.",
    ],
    hiddenIntel: [
      "Node ini tidak wajib untuk progres utama Bunker dan kadang hanya muncul di kondisi tertentu.",
      "Wiki menyebut indikator termudah adalah munculnya explosive markers pada map.",
      "Stealth praktis nyaris mustahil untuk solo run menurut catatan taktik wiki.",
    ],
    suggestedKit: [
      "Primary: SMG atau shotgun / carbine pendek.",
      "Support: frag, flash, dan med supply untuk sustained CQB.",
      "Reason: inferensi langsung dari tata letak indoor padat dan reinforcement bunker.",
    ],
    sources: [
      { label: "Bunker 4", url: SOURCES.bunker4 },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
  },
  "34": {
    classification: "Hidden Hostile Entity",
    summary:
      "Ronograd Creature adalah ancaman tersembunyi komunitas yang bukan sekadar outpost biasa: lebih mirip secret hostile encounter dengan HP besar dan perilaku agresif dekat cave.",
    keyPoints: [
      "Wiki NPCs menyebut musuh komunitas ini spawn di gua rahasia dengan sekitar 8000 HP.",
      "Posting komunitas melaporkan area cave di timur laut FOB dengan danger sign sebagai titik masuk.",
      "Threat ini digambarkan cepat, sangat tahan tembak, dan lebih aman dihadapi dengan standoff firepower.",
    ],
    hiddenIntel: [
      "Sumber forum adalah komunitas, jadi detail koordinat bersifat community-sourced.",
      "Laporan komunitas menyebut ia kemungkinan membawa HK416 dan berada di cave dekat FOB.",
      "Bukan bagian normal dari raid loop besar, jadi banyak operator menganggapnya easter-egg / hidden hostile.",
    ],
    suggestedKit: [
      "Primary: rifle damage tinggi atau LMG, hindari setup terlalu ringan.",
      "Support: jaga jarak, cover, dan jangan duel sendirian di ruang sempit.",
      "Reason: saran ini adalah inferensi dari HP tinggi, kecepatan, dan ancaman melee-like.",
    ],
    sources: [
      { label: "NPCs", url: SOURCES.npcs },
      { label: "Community Post", url: SOURCES.creatureForum },
    ],
    inferred: true,
  },
  "35": {
    classification: "Hostile Outpost",
    summary:
      "DOU Backup Post tampak menjadi node support yang mengamankan route masuk atau fallback bagi defender dari Department of Utilities.",
    keyPoints: [
      "Pos cadangan seperti ini biasanya menjaga jalur reinforcement ke kompleks utama.",
      "Membersihkannya lebih awal membantu menahan gelombang yang mencoba retake perimeter.",
      "Sangat mungkin difungsikan sebagai buffer sebelum operator mencapai bangunan utama DOU.",
    ],
    hiddenIntel: [
      "Tidak ada artikel khusus; ringkasan ini diinferensikan dari nama marker dan taktik DOU.",
      "DOU punya rear-route helicopter insertion, jadi backup post di route itu masuk akal secara desain.",
      "Kemungkinan node ini lebih berbahaya untuk operator yang terlalu lama berada di luar bangunan utama.",
    ],
    suggestedKit: [
      "Primary: AR serbaguna dengan recoil ringan.",
      "Support: smoke atau frag untuk cut push balik dari kompleks utama.",
      "Reason: inferensi dari fungsi backup node dan fight perimeter.",
    ],
    sources: [
      { label: "Department of Utilities", url: SOURCES.dou },
      { label: "Locations (Ronograd)", url: SOURCES.locations },
    ],
    inferred: true,
  },
  "74": {
    classification: "Hostile Outpost",
    summary:
      "Ronograd Bridge adalah minor hostile checkpoint yang menghubungkan city ke island Fort/Naval dan sangat penting untuk kendaraan maupun rotasi cepat tim.",
    keyPoints: [
      "Bridge dipenuhi minefield, Czech hedgehogs, sniper tower, dan beberapa posisi MG.",
      "Walau tidak wajib untuk membuka Bunker raid, merebut bridge jelas mempermudah akses ke timur.",
      "City-side dip bridge menciptakan blind spot alami yang bisa dipakai buat matikan gunner awal.",
    ],
    hiddenIntel: [
      "Gap di median anti-vehicle obstacle memungkinkan kendaraan lewat jika line sudah relatif aman.",
      "Checkpoint belakang memiliki T-wall camp yang tidak langsung terlihat dari ujung bridge.",
      "Jika backup dipanggil, Ural gun-truck dapat muncul dari tunnel dan park dekat portal.",
    ],
    suggestedKit: [
      "Primary: rifle akurat / DMR untuk hapus tower sniper dan MG.",
      "Support: smoke dan explosive utility untuk fortification lane.",
      "Reason: inferensi dari corridor sempit dengan LOS panjang dan anti-vehicle defense.",
    ],
    sources: [
      { label: "Ronograd Bridge", url: SOURCES.bridge },
      { label: "Ronograd City", url: SOURCES.ronogradCity },
    ],
  },
};

function createFallbackThreatIntel(marker) {
  const isOutpost = marker.categoryId === "3";

  return {
    classification: isOutpost ? "Hostile Outpost" : "Hostile Location",
    summary:
      "Intel detail khusus untuk node ini belum dipetakan penuh. Data yang tampil diambil dari marker source dan pola raid Ronograd di wiki BRM5.",
    keyPoints: [
      "Gunakan marker ini sebagai titik reference untuk route planning dan split tim.",
      "Asumsikan ada overwatch atau patrol support di sekitar node sampai area dibersihkan langsung.",
      "Periksa objective dan reinforcement lane terdekat sebelum commit loud push.",
    ],
    hiddenIntel: [
      "Ringkasan fallback ini adalah inferensi dari marker map dan halaman lokasi Ronograd umum.",
      "Node seperti ini sering berfungsi sebagai warning post, checkpoint, atau reinforcement hinge.",
    ],
    suggestedKit: [
      "Primary: rifle serbaguna dengan optic low-mid.",
      "Support: smoke dan frag sebagai setup universal.",
      "Reason: rekomendasi fallback inferensial.",
    ],
    sources: [{ label: "Locations (Ronograd)", url: SOURCES.locations }],
    inferred: true,
  };
}

export function isThreatIntelMarker(marker) {
  return Boolean(marker && HOSTILE_INTEL_CATEGORY_IDS.has(marker.categoryId));
}

export function getThreatIntelForMarker(marker) {
  if (!isThreatIntelMarker(marker)) {
    return null;
  }

  return THREAT_INTEL_BY_MARKER_ID[marker.id] ?? createFallbackThreatIntel(marker);
}
