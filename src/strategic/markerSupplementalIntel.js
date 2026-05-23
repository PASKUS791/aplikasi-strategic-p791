/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { getThreatIntelForMarker, isThreatIntelMarker } from "./threatIntelData";

const RAW_DESCRIPTION_TRANSLATIONS = {
  "Hostile city": "Kota musuh dengan kepadatan patroli tinggi dan beberapa sudut tembak jarak jauh.",
  "Hostile quarry": "Kompleks tambang musuh dengan pit terbuka, high-ground, dan jalur masuk bertingkat.",
  "Can be disabled manually":
    "Bisa dimatikan secara manual untuk mengurangi tekanan area dan membuka jalur serang.",
  "Unlocks a spawn when captured":
    "Membuka titik spawn friendly setelah sektor ini berhasil direbut.",
  "Friendly once captured":
    "Berubah menjadi posisi friendly setelah sektor ini berhasil direbut.",
};

const NON_HOSTILE_DESCRIPTION_BY_ID = {
  "4": "Peluncur anti-air Fort Ronograd yang menutup jalur udara sekitar command sector dan helipad.",
  "6": "Situs anti-air Naval Base yang melindungi pendekatan udara ke dockyard dan gedung komando.",
  "7": "Objective utama di sektor Naval Base yang harus dihancurkan untuk melemahkan pertahanan timur.",
  "8": "Titik resource Naval Base yang biasanya dipakai untuk resupply cepat sebelum push ke HQ atau dock.",
  "9": "Node resource kedua di Naval Base, dekat jalur logistik pelabuhan dan area parkir militer.",
  "10": "Titik resource Quarry yang berkaitan dengan suplai tambang, fuel, atau kendaraan logistik sekitar pit.",
  "11": "Node resource Ronograd City di area dalam kota, cocok untuk top-up sebelum assault apartemen.",
  "12": "Titik resource Ronograd City dekat perimeter compound, sering jadi resupply singkat saat city push.",
  "13": "Titik resource Kozlovka di sekitar blok kota kecil, berguna untuk resupply sebelum objective radar.",
  "14": "Node resource Depot di area gudang dan storage yard, biasanya dekat suplai bahan bakar atau material.",
  "15": "Basis operasi utama pemain untuk spawn, vehicle access, resupply, dan drop-off resource hasil curian.",
  "16": "Lokasi raid spesial Bunker yang baru terbuka setelah seluruh lokasi utama Ronograd diamankan.",
  "23": "Titik spawn friendly yang aktif setelah Ronograd City berhasil direbut dari pasukan hostile.",
  "29": "Objective radar Sochraina di area pier; menghancurkannya membantu menurunkan ancaman pertahanan udara.",
  "31": "Titik spawn friendly yang aktif setelah Department of Utilities sepenuhnya dikuasai.",
  "36": "Objective penghancuran di Fort Ronograd yang terkait asset berat atau instalasi penting perimeter.",
  "37": "Titik resource DOU di kompleks utilitas, biasanya terkait logistik industri atau kendaraan suplai.",
  "38": "Objective penghancuran Mountain Radar Station, biasanya terkait radar array atau artileri gun line.",
  "39": "Objective penghancuran tambahan di Mountain Radar Station untuk melumpuhkan pertahanan puncak.",
  "40": "Target VIP utama Fort Ronograd yang umumnya berada di gedung komando dengan pengawalan berat.",
  "41": "Node resource Fort Ronograd di sekitar perimeter, cocok untuk loot cepat setelah lane dibersihkan.",
  "42": "Titik resource Fort kedua yang dekat jalur command sector dan area amunisi luar.",
  "43": "Resource point Fort Ronograd di sisi luar kompleks, sering dikaitkan dengan kendaraan logistik.",
  "45": "Warhead strategis di raid Bunker yang menjadi inti ancaman misil dan objective berisiko tinggi.",
  "46": "Salah satu target VIP Mountain Radar Station yang biasanya berada dekat sector komando atau bunker bawah.",
  "47": "Node resource Quarry yang biasanya muncul di jalur produksi, warehouse, atau area kendaraan tambang.",
  "48": "Titik peledakan Bunker 4; salah satu bom point yang wajib dipasang sebelum bunker bisa dijebol penuh.",
  "49": "Objective Pushkino pada bangkai helikopter, biasa dipakai untuk menghancurkan data atau asset sensitif.",
  "50": "Titik spawn friendly yang aktif setelah Sochraina City berhasil dibersihkan dan direbut.",
  "51": "Target VIP Sochraina yang biasanya berada di bangunan inti dekat plaza atau jalur harbour.",
  "52": "Salah satu VIP Ronograd City di kompleks apartemen; tiap target punya pengamanan dan lantai berbeda.",
  "53": "Salah satu VIP Ronograd City di blok apartemen; jalur masuknya sering diproteksi mortar rooftop.",
  "54": "Target VIP Ronograd City di compound dalam kota, biasanya perlu clear room per lantai.",
  "55": "VIP Ronograd City lain di sektor apartemen atau courtyard, dijaga node security terpisah.",
  "56": "Target VIP Kozlovka yang umumnya berada di apartemen utama dekat tangga ke rooftop.",
  "58": "Objective penghancuran Fort Ronograd yang kemungkinan terkait artileri berat atau cannon line.",
  "59": "Objective penghancuran Fort Ronograd yang berkaitan dengan SAM atau node pertahanan udara.",
  "60": "Objective penghancuran Naval Base di sektor dermaga timur, biasanya radar atau asset dock penting.",
  "61": "Objective penghancuran Naval Base pada infrastruktur bawah tanah atau submarine support sector.",
  "62": "Objective penghancuran Naval Base di area elevated parking atau launcher defensive lane.",
  "63": "Target VIP Naval Base yang biasanya berada di HQ atau logistics building dengan penjagaan berlapis.",
  "64": "VIP Naval Base tambahan di sector komando yang sering berdekatan dengan mortar atau sniper support.",
  "65": "Target VIP Mountain tambahan di area radar/bunker bawah yang tersembunyi di jalur elevasi.",
  "66": "Pos mortar Depot yang mengawasi yard tengah dan gudang; sebaiknya dimatikan lebih dulu.",
  "73": "Target VIP utama Lesdolina di bangunan inti desa, terlindung oleh overwatch sekitar dan mortar support.",
  "75": "Pos mortar Quarry yang memberi tekanan ke pit dan approach road menuju processing plant.",
  "76": "Titik resource Quarry tambahan yang dekat route produksi atau storage yard tambang.",
  "77": "Pos mortar Naval Base yang menutup lane parkir dan jalur approach ke gedung komando.",
  "78": "Pos mortar Fort Ronograd di perimeter artileri luar; bisa dimatikan manual untuk kurangi suppressive fire.",
  "79": "Objective peledakan radar Kozlovka yang penting untuk mengurangi kemampuan deteksi dan air defense lokal.",
};

const SECRET_INTEL_BY_ID = {
  "4": [
    "Pertahanan udara Fort terhubung ke jaringan radar lain di Ronograd; hancurkan radar lebih dulu jika mau buka ruang helikopter.",
  ],
  "6": [
    "Naval Base menyembunyikan dockyard bawah tanah dan sektor perbaikan kapal selam, jadi AA di sini melindungi asset yang jauh lebih besar.",
  ],
  "15": [
    "FOB juga berfungsi sebagai drop-off semua resource hasil curian dan sering jadi tempat briefing awal tim sebelum split route.",
  ],
  "16": [
    "Bunker hanya terbuka sesudah seluruh lokasi hostile direbut dan gerbang luarnya tidak terbuka lama setelah trigger aktif.",
    "Setelah Bunker tertutup kembali, operator yang masih tertinggal di luar biasanya harus mengulang siklus pembukaan dari awal.",
  ],
  "23": [
    "Ronograd City yang sudah direbut membuat rotasi ke bridge, Naval, dan Fort jauh lebih singkat dibanding spawn awal.",
  ],
  "29": [
    "Radar Sochraina memberi data target ke sistem SAM Fort Ronograd, jadi objective ini punya dampak lebih luas dari sekadar sektor selatan.",
  ],
  "31": [
    "Saat DOU sudah jadi spawn friendly, jalur rear insertion ke sektor utara pulau menjadi jauh lebih aman dan cepat.",
  ],
  "40": [
    "VIP room di Fort termasuk titik yang sering dikaitkan komunitas dengan sewer-key chain untuk akses rahasia belakang Fort.",
  ],
  "45": [
    "Warhead ini terkait raid Bunker paling akhir dan sering dianggap salah satu node lore paling sensitif di Ronograd.",
  ],
  "49": [
    "Pushkino dikenal dengan bangkai Black Hawk; objective di sana sering dikaitkan dengan pembersihan data dan asset penerbangan yang jatuh.",
  ],
  "58": [
    "Fort tetap berbahaya walau objective ini dihancurkan karena helipad reinforcement dan gate kill-zone masih bisa aktif bersamaan.",
  ],
  "59": [
    "Jika objective SAM Fort ini hancur, rotari-wing punya ruang manuver lebih besar untuk transport atau spotting.",
  ],
  "60": [
    "Objective dermaga timur Naval sering dikaitkan dengan asset radar yang menopang pertahanan udara sektor timur.",
  ],
  "61": [
    "Naval Base punya dock/submarine sector tersembunyi; objective ini kemungkinan melindungi infrastruktur bawah tanah itu.",
  ],
  "63": [
    "VIP Naval kadang berada di HQ/logistics floor atas, membuat rooftop control jadi lebih penting dari sekadar firefight ground lane.",
  ],
  "64": [
    "Compound VIP Naval sering berdekatan dengan mortar dan sniper support, jadi tempo clear building sangat menentukan.",
  ],
  "66": [
    "Depot punya watchtower dan yard terbuka; mortar di sini biasanya jadi pengunci agar operator tidak nyaman terlalu lama di cover rendah.",
  ],
  "77": [
    "Mortar Naval sangat efektif mengunci lane parkir dan approach ke command building, terutama bila tim masuk terlalu frontal.",
  ],
};

function translateRawDescription(description) {
  if (!description) {
    return "";
  }

  return RAW_DESCRIPTION_TRANSLATIONS[description] ?? description;
}

export function getSupplementalMarkerIntel(marker) {
  const translatedRawDescription = translateRawDescription(marker.popup?.description);
  const threatIntel = isThreatIntelMarker(marker) ? getThreatIntelForMarker(marker) : null;
  const resolvedDescription =
    translatedRawDescription ||
    threatIntel?.summary ||
    NON_HOSTILE_DESCRIPTION_BY_ID[marker.id] ||
    "";
  const secretIntel = [
    ...(threatIntel?.hiddenIntel ?? []),
    ...(SECRET_INTEL_BY_ID[marker.id] ?? []),
  ];

  return {
    resolvedDescription,
    secretIntel,
    hasThreatIntel: Boolean(threatIntel),
  };
}
