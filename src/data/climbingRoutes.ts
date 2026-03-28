// =============================================================================
// data/climbingRoutes.ts — Voies d'alpinisme et de ski classiques
// Tracés WGS84 simplifiés (4–10 waypoints) — suffisants pour le rendu 3D
// Les altitudes sont indicatives ; le rendu snap sur le terrain par raycast.
// =============================================================================

import type { ClimbingRoute } from "@/types/routes";

// ---------------------------------------------------------------------------
// Couleur par grade (F→bleu, AD→vert, D→jaune, TD→orange, ED→rouge)
// ---------------------------------------------------------------------------
export function gradeToColor(grade: string): string {
  if (grade.startsWith("ED") || grade === "EX") return "#ef4444";
  if (grade.startsWith("TD"))  return "#f97316";
  if (grade.startsWith("D"))   return "#eab308";
  if (grade.startsWith("AD"))  return "#22c55e";
  return "#3b82f6"; // F, PD et dérivés
}

// ---------------------------------------------------------------------------
// Voies classiques — keyed par summit ID (correspondant au MOUNTAIN_TREE)
// ---------------------------------------------------------------------------
export const CLIMBING_ROUTES: Record<string, ClimbingRoute[]> = {

  // ==========================================================================
  // AIGUILLE DU TOUR — 46.028°N 7.005°E (3540m)
  // Tuiles : 1010_6552
  // ==========================================================================
  tour: [
    {
      id: "tour-normale",
      name: "Voie normale — Col du Tour",
      activity: "alpinisme",
      grade: "F+",
      gradeText: "classique glaciaire d'initiation, 1000m D+, glacier du Tour",
      description: "L'Aiguille du Tour est l'une des premières grandes courses glaciaires du massif. La voie normale passe par le Refuge Albert 1er puis remonte le glacier du Tour jusqu'au col éponyme avant de rejoindre le sommet par une courte arête.",
      c2cUrl: "https://www.camptocamp.org/routes/53937/fr/aiguille-du-tour-voie-normale",
      c2cId: "53937",
      track: [
        { lon: 7.0180, lat: 45.9970, altM: 2702 }, // Bas du glacier du Tour
        { lon: 7.0150, lat: 45.9990, altM: 2900 }, // Glacier du Tour
        { lon: 7.0120, lat: 46.0010, altM: 3100 }, // Mi-glacier
        { lon: 7.0095, lat: 46.0030, altM: 3289 }, // Col du Tour
        { lon: 7.0082, lat: 46.0045, altM: 3450 }, // Arête sommitale
        { lon: 7.0075, lat: 46.0055, altM: 3540 }, // Sommet
      ],
    },
    {
      id: "tour-ski",
      name: "Ski de randonnée — Col du Tour",
      activity: "ski",
      grade: "F",
      gradeText: "itinéraire ski de rando classique, 1200m D+, glacier du Tour",
      description: "Grande classique de ski de randonnée du massif du Mont-Blanc, souvent réalisée en traversée avec la Tête Blanche. Glacier du Tour idéal pour l'initiation.",
      c2cUrl: "https://www.camptocamp.org/routes/53938/fr/aiguille-du-tour-ski",
      c2cId: "53938",
      track: [
        { lon: 7.0180, lat: 45.9970, altM: 2702 }, // Bas glacier
        { lon: 7.0150, lat: 45.9990, altM: 2900 }, // Glacier bas
        { lon: 7.0120, lat: 46.0010, altM: 3100 }, // Mi-glacier
        { lon: 7.0095, lat: 46.0030, altM: 3289 }, // Col du Tour
      ],
    },
  ],

  // ==========================================================================
  // AIGUILLE DU CHARDONNET — 45.988°N 6.979°E (3824m)
  // Tuiles : 1009_6549, 1009_6550, 1010_6549, 1010_6550, 1011_6550
  // ==========================================================================
  chardonnet: [
    {
      id: "chardonnet-forbes",
      name: "Arête Forbes",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "longue arête neigeuse S-N, 1000m D+, exposition modérée",
      description: "L'Arête Forbes est la grande classique du Chardonnet. Longue et aérienne, elle escalade l'arête frontière entre la France et la Suisse depuis le Col d'Argentière. Vue exceptionnelle sur le glacier d'Argentière et le massif.",
      c2cUrl: "https://www.camptocamp.org/routes/182214/fr/aiguille-du-chardonnet-arete-forbes",
      c2cId: "182214",
      track: [
        { lon: 6.9778, lat: 45.9630, altM: 2771 }, // Refuge d'Argentière
        { lon: 6.9762, lat: 45.9694, altM: 3100 }, // Glacier d'Argentière
        { lon: 6.9743, lat: 45.9756, altM: 3552 }, // Col d'Argentière
        { lon: 6.9757, lat: 45.9798, altM: 3650 }, // Pied arête Forbes
        { lon: 6.9772, lat: 45.9840, altM: 3750 }, // Mi-arête
        { lon: 6.9792, lat: 45.9884, altM: 3824 }, // Sommet
      ],
    },
    {
      id: "chardonnet-normale",
      name: "Voie normale versant S",
      activity: "alpinisme",
      grade: "PD+",
      gradeText: "glacier du Chardonnet, 900m D+, crevasses",
      description: "Voie normale depuis le Col du Passon par le glacier SW du Chardonnet. Itinéraire moins classique que l'arête Forbes mais plus direct, avec un court passage en glace en fin de course.",
      c2cUrl: "https://www.camptocamp.org/routes/182213/fr/aiguille-du-chardonnet-voie-normale",
      c2cId: "182213",
      track: [
        { lon: 7.0253, lat: 45.9999, altM: 2702 }, // Refuge Albert 1er
        { lon: 7.0050, lat: 45.9960, altM: 3200 }, // Col du Passon
        { lon: 6.9920, lat: 45.9910, altM: 3500 }, // Glacier SW
        { lon: 6.9850, lat: 45.9895, altM: 3700 }, // Haut glacier
        { lon: 6.9792, lat: 45.9884, altM: 3824 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // LES DROITES — 45.938°N 7.001°E (4001m)
  // Tuiles : 1008_6545, 1008_6546, 1009_6545, 1009_6546
  // ==========================================================================
  droites: [
    {
      id: "droites-arete-ne",
      name: "Arête NE",
      activity: "alpinisme",
      grade: "D",
      gradeText: "arête mixte 900m, rocher et glace, exposition soutenue",
      description: "L'Arête NE des Droites est une grande classique du bassin d'Argentière. Elle remonte la longue arête frontière franco-suisse sur un terrain mixte varié avant de rejoindre le sommet de ce beau 4000m.",
      c2cUrl: "https://www.camptocamp.org/routes/182349/fr/les-droites-arete-ne",
      c2cId: "182349",
      track: [
        { lon: 6.9737, lat: 45.9212, altM: 2687 }, // Refuge du Couvercle
        { lon: 6.9875, lat: 45.9285, altM: 3100 }, // Glacier d'Argentière
        { lon: 6.9940, lat: 45.9330, altM: 3680 }, // Col des Droites
        { lon: 6.9965, lat: 45.9355, altM: 3850 }, // Arête NE
        { lon: 7.0012, lat: 45.9383, altM: 4001 }, // Sommet
      ],
    },
    {
      id: "droites-couloir-nord",
      name: "Couloir Nord (Lagarde)",
      activity: "alpinisme",
      grade: "TD",
      gradeText: "couloir de glace 800m, 55° soutenu, séracs",
      description: "Couloir mythique des Droites, ouvert par Lagarde. Étroit et direct, il monte droit sur le sommet en passant sous les séracs de la face nord. Réservé aux alpinistes très confirmés en conditions.",
      c2cUrl: "https://www.camptocamp.org/routes/182350/fr/les-droites-couloir-nord",
      c2cId: "182350",
      track: [
        { lon: 6.9875, lat: 45.9285, altM: 3050 }, // Glacier d'Argentière bas
        { lon: 6.9980, lat: 45.9330, altM: 3300 }, // Pied couloir N
        { lon: 6.9998, lat: 45.9355, altM: 3650 }, // Mi-couloir
        { lon: 7.0010, lat: 45.9375, altM: 3900 }, // Haut couloir
        { lon: 7.0012, lat: 45.9383, altM: 4001 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // LES COURTES — 45.929°N 7.016°E (3856m)
  // Tuiles : 1009_6544, 1009_6545, 1010_6544, 1010_6545
  // ==========================================================================
  courtes: [
    {
      id: "courtes-face-nord",
      name: "Face Nord",
      activity: "alpinisme",
      grade: "AD+",
      gradeText: "glace 50°, 600m, grande classique du bassin d'Argentière",
      description: "La face nord des Courtes est une grande classique glaciaire à la rectitude parfaite. Accessible depuis le glacier d'Argentière, elle offre une ascension directe et élégante sur une pente de glace régulière.",
      c2cUrl: "https://www.camptocamp.org/routes/182385/fr/les-courtes-face-nord",
      c2cId: "182385",
      track: [
        { lon: 7.0053, lat: 45.9222, altM: 3050 }, // Glacier d'Argentière
        { lon: 7.0098, lat: 45.9251, altM: 3200 }, // Pied face nord
        { lon: 7.0130, lat: 45.9270, altM: 3600 }, // Mi-face
        { lon: 7.0157, lat: 45.9291, altM: 3856 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // AIGUILLE DU MOINE — 45.907°N 6.960°E (3412m)
  // Tuiles : 1006_6543, 1006_6544, 1007_6543, 1007_6544
  // ==========================================================================
  moine: [
    {
      id: "moine-arete-s",
      name: "Voie normale — Arête S",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "arête rocheuse classique, 700m D+, III obligatoire",
      description: "Belle pyramide rocheuse dominant le glacier de Talèfre. La voie normale par l'arête sud offre une escalade variée sur granite avec quelques pas de III. Vue magnifique sur l'Aiguille Verte et les Drus.",
      c2cUrl: "https://www.camptocamp.org/routes/54042/fr/aiguille-du-moine-voie-normale-arete-s",
      c2cId: "54042",
      track: [
        { lon: 6.9737, lat: 45.9212, altM: 2687 }, // Refuge du Couvercle
        { lon: 6.9650, lat: 45.9155, altM: 2900 }, // Glacier de Talèfre
        { lon: 6.9603, lat: 45.9115, altM: 3100 }, // Col du Moine
        { lon: 6.9597, lat: 45.9090, altM: 3250 }, // Arête S
        { lon: 6.9597, lat: 45.9074, altM: 3412 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // AIGUILLE DU PLAN — 45.880°N 6.864°E (3673m)
  // Tuiles : 1002_6540, 1002_6541, 1003_6540, 1003_6541
  // ==========================================================================
  plan: [
    {
      id: "plan-normale",
      name: "Voie normale",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "depuis Aig. du Midi, arête neigeuse puis rocher, 200m D+",
      description: "Accessible depuis l'Aiguille du Midi, la voie normale du Plan emprunte la Vallée Blanche puis l'arête nord-ouest. Course courte mais exposée avec une vue plongeante sur Chamonix.",
      c2cUrl: "https://www.camptocamp.org/routes/54147/fr/aiguille-du-plan-voie-normale",
      c2cId: "54147",
      track: [
        { lon: 6.9200, lat: 45.9090, altM: 3050 }, // Vallée Blanche (dans tile)
        { lon: 6.9100, lat: 45.9040, altM: 3350 }, // Glacier du Plan
        { lon: 6.9020, lat: 45.8990, altM: 3550 }, // Arête N
        { lon: 6.8980, lat: 45.8960, altM: 3673 }, // Sommet (approche tile)
      ],
    },
    {
      id: "plan-frendo",
      name: "Éperon Frendo",
      activity: "alpinisme",
      grade: "ED",
      gradeText: "grande face N mythique, mixte glace-rocher, 1100m D+",
      description: "L'Éperon Frendo est l'une des grandes voies de la face nord de l'Aiguille du Plan. Accessible depuis Chamonix par les remontées mécaniques, il engage sur un terrain de haute difficulté en glace et mixte.",
      c2cUrl: "https://www.camptocamp.org/routes/54146/fr/aiguille-du-plan-eperon-frendo",
      c2cId: "54146",
      track: [
        { lon: 6.8700, lat: 45.9240, altM: 1035 }, // Chamonix (approach)
        { lon: 6.9120, lat: 45.9080, altM: 2500 }, // Glacier des Pèlerins (dans tile)
        { lon: 6.9050, lat: 45.9010, altM: 2900 }, // Pied face N
        { lon: 6.9010, lat: 45.8970, altM: 3300 }, // Mi-éperon
        { lon: 6.8980, lat: 45.8960, altM: 3673 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // MONT MAUDIT — 45.852°N 6.871°E (4465m)
  // Tuiles : 1000_6535, 1000_6536, 1001_6536
  // ==========================================================================
  maudit: [
    {
      id: "maudit-normale",
      name: "Voie normale — Col Maudit",
      activity: "alpinisme",
      grade: "AD-",
      gradeText: "glaciaire depuis Midi, 800m D+, exposition séracs",
      description: "Mont Maudit, troisième sommet de France (4465m). Depuis l'Aiguille du Midi, la voie normale longe le plateau du Tacul et remonte au col Maudit par une pente de glace modérée. Passage sous les séracs de la face nord.",
      c2cUrl: "https://www.camptocamp.org/routes/53791/fr/mont-maudit-voie-normale",
      c2cId: "53791",
      track: [
        { lon: 6.8873, lat: 45.8788, altM: 3842 }, // Aiguille du Midi
        { lon: 6.8780, lat: 45.8572, altM: 3532 }, // Col du Midi
        { lon: 6.8740, lat: 45.8540, altM: 3700 }, // Glacier sous Maudit
        { lon: 6.8714, lat: 45.8527, altM: 4035 }, // Col Maudit
        { lon: 6.8714, lat: 45.8521, altM: 4300 }, // Arête W
        { lon: 6.8713, lat: 45.8521, altM: 4465 }, // Sommet
      ],
    },
    {
      id: "maudit-kuffner",
      name: "Arête Kuffner",
      activity: "alpinisme",
      grade: "D",
      gradeText: "arête franco-italienne, 1200m D+, mixte élégant",
      description: "Grande arête reliant le Col Moore (face S) au sommet du Mont Maudit en traversant la frontière franco-italienne. Itinéraire d'une grande beauté sur terrain mixte, première réalisée par Kuffner en 1887.",
      c2cUrl: "https://www.camptocamp.org/routes/53793/fr/mont-maudit-arete-kuffner",
      c2cId: "53793",
      track: [
        { lon: 6.8640, lat: 45.8380, altM: 3700 }, // Refuge Fourche (côté IT)
        { lon: 6.8670, lat: 45.8420, altM: 3900 }, // Col Moore
        { lon: 6.8690, lat: 45.8460, altM: 4100 }, // Pied arête Kuffner
        { lon: 6.8700, lat: 45.8490, altM: 4250 }, // Mi-arête
        { lon: 6.8713, lat: 45.8521, altM: 4465 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // DÔME DU GOÛTER — 45.843°N 6.850°E (4304m)
  // Tuiles : 0997_6534, 0997_6535, 0998_6534, 0998_6535
  // ==========================================================================
  "dome-gouter": [
    {
      id: "dome-gouter-normale",
      name: "Voie normale — depuis Refuge du Goûter",
      activity: "alpinisme",
      grade: "F",
      gradeText: "dôme neigeux, 500m D+, point de passage voie normale MB",
      description: "Le Dôme du Goûter est l'étape incontournable de la voie normale du Mont Blanc. Son vaste dôme neigeux à 4304m marque la frontière franco-italienne. Panorama exceptionnel sur le massif et les Alpes suisses.",
      c2cUrl: "https://www.camptocamp.org/routes/53781/fr/dome-du-gouter",
      c2cId: "53795",
      track: [
        { lon: 6.8398, lat: 45.8449, altM: 3835 }, // Refuge du Goûter
        { lon: 6.8430, lat: 45.8438, altM: 4050 }, // Dôme versant NW
        { lon: 6.8499, lat: 45.8431, altM: 4304 }, // Sommet
      ],
    },
    {
      id: "dome-gouter-ski",
      name: "Ski de randonnée — descente par les Bosses",
      activity: "ski",
      grade: "AD",
      gradeText: "ski haute altitude, 1000m de descente, glacier des Bossons",
      description: "L'une des plus belles descentes à ski haute altitude des Alpes françaises, depuis le Dôme du Goûter par les Bosses jusqu'au glacier des Bossons. Ambiance glaciaire unique.",
      c2cUrl: "https://www.camptocamp.org/routes/53796/fr/dome-du-gouter-ski",
      c2cId: "53796",
      track: [
        { lon: 6.8499, lat: 45.8431, altM: 4304 }, // Sommet Dôme
        { lon: 6.8460, lat: 45.8420, altM: 4150 }, // Arête des Bosses
        { lon: 6.8398, lat: 45.8449, altM: 3835 }, // Refuge du Goûter
        { lon: 6.8320, lat: 45.8520, altM: 3400 }, // Glacier des Bossons haut
        { lon: 6.8250, lat: 45.8610, altM: 2800 }, // Glacier des Bossons bas
      ],
    },
  ],

  // ==========================================================================
  // DENT DU GÉANT — 45.862°N 6.983°E (4013m)
  // Tuiles : 1006_6537
  // ==========================================================================
  geant: [
    {
      id: "geant-normale",
      name: "Voie normale — cordes fixes",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "arête W avec cordes fixes, 600m D+, granit excellent",
      description: "Longtemps jugée inaccessible, la Dent du Géant est désormais une grande classique grâce aux cordes fixes installées sur le ressaut sommital. Depuis le Refuge Torino, montée par le glacier du Géant puis l'arête W pour rejoindre les cordes fixes menant au sommet.",
      c2cUrl: "https://www.camptocamp.org/routes/54301/fr/dent-du-geant-voie-normale",
      c2cId: "54301",
      track: [
        { lon: 6.9580, lat: 45.8640, altM: 3480 }, // Glacier du Géant (dans tile)
        { lon: 6.9555, lat: 45.8655, altM: 3665 }, // Pied arête W
        { lon: 6.9535, lat: 45.8665, altM: 3800 }, // Arête W
        { lon: 6.9520, lat: 45.8672, altM: 3950 }, // Zone cordes fixes
        { lon: 6.9510, lat: 45.8677, altM: 4013 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // ARÊTE DE ROCHEFORT — 4001m
  // Tuiles : 1006_6537, 1006_6538, 1007_6537, 1007_6538
  // ==========================================================================
  rochefort: [
    {
      id: "rochefort-traversee",
      name: "Traversée de Rochefort",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "arête neigeuse aérienne, 4km de crête, panorama Vallée Blanche",
      description: "Grande traversée glaciaire reliant la Dent du Géant au Dôme de Rochefort, puis vers les Grandes Jorasses. Itinéraire esthétique sur arête neigeuse avec vue plongeante sur la Vallée Blanche côté français et les glaciers italiens côté S.",
      c2cUrl: "https://www.camptocamp.org/routes/54303/fr/arete-de-rochefort-traversee",
      c2cId: "54303",
      track: [
        { lon: 6.9829, lat: 45.8622, altM: 4013 }, // Dent du Géant
        { lon: 6.9742, lat: 45.8680, altM: 4001 }, // Aiguille de Rochefort
        { lon: 6.9696, lat: 45.8727, altM: 3928 }, // Col de Rochefort
        { lon: 6.9650, lat: 45.8760, altM: 3928 }, // Dôme de Rochefort
        { lon: 6.9600, lat: 45.8800, altM: 3750 }, // Extrémité NE
      ],
    },
  ],

  // ==========================================================================
  // TOUR RONDE — 45.848°N 6.869°E (3792m)
  // Tuiles : 1002_6535, 1003_6535
  // ==========================================================================
  "tour-ronde": [
    {
      id: "tour-ronde-normale",
      name: "Voie normale — Arête SE",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "arête neige/rocher, 400m D+, depuis Col du Midi",
      description: "La Tour Ronde est un sommet incontournable de la Vallée Blanche. Sa voie normale par l'arête SE offre une ascension courte mais variée depuis le Col du Midi. Vue superbe sur le Mont Blanc et la Dent du Géant.",
      c2cUrl: "https://www.camptocamp.org/routes/54175/fr/tour-ronde-voie-normale",
      c2cId: "54175",
      track: [
        { lon: 6.9170, lat: 45.8560, altM: 3200 }, // Vallée Blanche (dans tile)
        { lon: 6.9120, lat: 45.8540, altM: 3300 }, // Glacier du Géant
        { lon: 6.9080, lat: 45.8510, altM: 3400 }, // Pied arête SE
        { lon: 6.9050, lat: 45.8490, altM: 3600 }, // Arête SE
        { lon: 6.9030, lat: 45.8475, altM: 3792 }, // Sommet
      ],
    },
    {
      id: "tour-ronde-nord",
      name: "Face Nord — couloir E. Gros",
      activity: "alpinisme",
      grade: "AD+",
      gradeText: "couloir de glace 500m, 50°, beau terrain glaciaire",
      description: "Beau couloir de glace sur la face nord de la Tour Ronde, accessible depuis la Vallée Blanche. Itinéraire élégant sur terrain glaciaire soutenu, avec vue plongeante sur le glacier du Géant.",
      c2cUrl: "https://www.camptocamp.org/routes/54176/fr/tour-ronde-face-nord",
      c2cId: "54176",
      track: [
        { lon: 6.9150, lat: 45.8555, altM: 3200 }, // Vallée Blanche (dans tile)
        { lon: 6.9090, lat: 45.8510, altM: 3100 }, // Pied face N
        { lon: 6.9050, lat: 45.8490, altM: 3500 }, // Mi-face
        { lon: 6.9030, lat: 45.8475, altM: 3792 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // AIGUILLE DE TALÈFRE — 45.889°N 7.039°E (3730m)
  // Tuiles : 1009_6541, 1009_6542, 1010_6541, 1010_6542
  // ==========================================================================
  talefre: [
    {
      id: "talefre-normale",
      name: "Voie normale — Glacier de Talèfre",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "glacier et arête, 700m D+, beau panorama Jorasses",
      description: "Belle course glaciaire depuis le Refuge du Couvercle remontant le glacier de Talèfre jusqu'au col éponyme avant d'enchaîner l'arête W menant au sommet. Vue directe sur la face nord des Grandes Jorasses.",
      c2cUrl: "https://www.camptocamp.org/routes/54510/fr/aiguille-de-talefre-voie-normale",
      c2cId: "54510",
      track: [
        { lon: 6.9737, lat: 45.9212, altM: 2687 }, // Refuge du Couvercle (approach)
        { lon: 6.9950, lat: 45.9120, altM: 3100 }, // Glacier de Talèfre (dans tile)
        { lon: 7.0020, lat: 45.9060, altM: 3300 }, // Mi-glacier
        { lon: 7.0080, lat: 45.9010, altM: 3544 }, // Col de Talèfre
        { lon: 7.0110, lat: 45.8990, altM: 3620 }, // Arête W
        { lon: 7.0130, lat: 45.8980, altM: 3730 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // AIGUILLE DU GRÉPON — 45.9025°N 6.9192°E 3482m
  // Tuiles : 1003_6541, 1003_6542, 1003_6543, 1004_6540, 1004_6541
  // ==========================================================================
  grepon: [
    {
      id: "grepon-mer-de-glace",
      name: "Grépon - Face Mer de Glace",
      activity: "alpinisme",
      grade: "TD",
      gradeText: "rocher 5c max, 800m D+, engagement haute montagne",
      description:
        "Grande classique du massif du Mont-Blanc, la voie Mer de Glace du Grépon remonte la face est depuis le Refuge de l'Envers des Aiguilles (2523m). Approche par Montenvers et la Mer de Glace, puis 800m d'escalade sur granit d'exception. La Fissure Knubel (5c) est le passage-clé menant à l'arête sommitale. Longtemps considérée par Mummery comme la montagne la plus difficile du monde.",
      c2cUrl: "https://www.camptocamp.org/routes/53905/fr/grepon-mer-de-glace",
      c2cId: "53905",
      track: [
        { lon: 6.921, lat: 45.9265, altM: 1720 }, // Mer de Glace - pied des échelles Montenvers
        { lon: 6.9225, lat: 45.918, altM: 1900 }, // Progression sur glacier
        { lon: 6.923, lat: 45.912, altM: 2050 }, // Rive gauche - vers l'Envers
        { lon: 6.924, lat: 45.907, altM: 2200 }, // Montée moraines
        { lon: 6.9276, lat: 45.9, altM: 2523 }, // Refuge de l'Envers des Aiguilles
        { lon: 6.9255, lat: 45.905, altM: 2700 }, // Glacier de Trélaporte
        { lon: 6.9215, lat: 45.9035, altM: 2800 }, // Rimaye - pied de la face
        { lon: 6.92, lat: 45.9028, altM: 3150 }, // Mi-face (longueurs III-IV)
        { lon: 6.9192, lat: 45.9022, altM: 3420 }, // Brèche Balfour
        { lon: 6.9192, lat: 45.9025, altM: 3482 }, // Sommet Aiguille du Grépon
      ],
    },
  ],

  // AIGUILLES DE CHAMONIX — secteur 3400-3842m
  // Tuiles : 1002_6541, 1003_6541, 1003_6542, 1003_6543, 1004_6542
  // ==========================================================================
  "chamonix-needles": [
    {
      id: "needles-traversee",
      name: "Traversée des Aiguilles de Chamonix",
      activity: "alpinisme",
      grade: "D",
      gradeText: "rocher de qualité, IV-V obligatoire, 1500m D+",
      description: "La Traversée des Aiguilles de Chamonix relie en une longue journée l'Aiguille du Plan à l'Aiguille de l'M. Itinéraire prestigieux sur les aiguilles de granit de Chamonix, avec des passages de IV et V sur un rocher exceptionnel.",
      c2cUrl: "https://www.camptocamp.org/routes/54155/fr/traversee-des-aiguilles-de-chamonix",
      c2cId: "54155",
      track: [
        { lon: 6.8638, lat: 45.8795, altM: 3673 }, // Aiguille du Plan
        { lon: 6.8700, lat: 45.8840, altM: 3600 }, // Aiguille du Midi versant S
        { lon: 6.8750, lat: 45.8920, altM: 3400 }, // Aiguilles de Chamonix centrales
        { lon: 6.8800, lat: 45.9020, altM: 3200 }, // Aiguille de l'M
      ],
    },
  ],

  // ==========================================================================
  // AIGUILLE VERTE — 45.9245°N 6.9796°E 4122m
  // ==========================================================================
  verte: [
    {
      id: "verte-whymper",
      name: "Couloir Whymper",
      activity: "alpinisme",
      grade: "AD+",
      gradeText: "couloir neigeux 50–55°, 1000m de D+",
      description: "Le couloir nord de l'Aiguille Verte, première voie d'ascension par Edward Whymper en 1865. Exposition élevée aux séracs du Nant Blanc.",
      c2cUrl: "https://www.camptocamp.org/routes/182176/fr/aiguille-verte-couloir-whymper",
      c2cId: "182176",
      track: [
        { lon: 6.9350, lat: 45.9050, altM: 1540 }, // Chamonix bas
        { lon: 6.9542, lat: 45.9120, altM: 2090 }, // Refuge du Couvercle — départ
        { lon: 6.9650, lat: 45.9160, altM: 2700 }, // Pied du couloir (glacier)
        { lon: 6.9720, lat: 45.9200, altM: 3200 }, // Mi-couloir
        { lon: 6.9760, lat: 45.9225, altM: 3700 }, // Haut du couloir
        { lon: 6.9796, lat: 45.9245, altM: 4122 }, // Sommet
      ],
    },
    {
      id: "verte-jardin",
      name: "Arête du Jardin",
      activity: "alpinisme",
      grade: "D",
      gradeText: "arête mixte rocher/glace, 1200m de D+",
      description: "Longue arête mixte par l'Aiguille du Jardin, itinéraire esthétique et engagé sur le flanc nord-est de la Verte.",
      c2cUrl: "https://www.camptocamp.org/routes/182177/fr/aiguille-verte-arete-du-jardin",
      c2cId: "182177",
      track: [
        { lon: 6.9542, lat: 45.9120, altM: 2090 }, // Refuge du Couvercle
        { lon: 6.9680, lat: 45.9180, altM: 2900 }, // Glacier des Nantillons
        { lon: 6.9730, lat: 45.9210, altM: 3400 }, // Épaule de l'arête
        { lon: 6.9758, lat: 45.9228, altM: 3850 }, // Aiguille du Jardin
        { lon: 6.9780, lat: 45.9238, altM: 4000 }, // Arête finale
        { lon: 6.9796, lat: 45.9245, altM: 4122 }, // Sommet
      ],
    },
    {
      id: "verte-couturier",
      name: "Y Couloir (Couturier)",
      activity: "alpinisme",
      grade: "TD+",
      gradeText: "couloir extrême 55–60°, pente soutenue 800m",
      description: "Le célèbre Y Couloir, tracé par Lionel Couturier en 1928. Un des couloirs de glace les plus exigeants du massif, exposé aux chutes de pierres.",
      c2cUrl: "https://www.camptocamp.org/routes/50888/fr/aiguille-verte-y-couloir-couturier",
      c2cId: "50888",
      track: [
        { lon: 6.9650, lat: 45.9120, altM: 2500 }, // Montée glacier Argentière
        { lon: 6.9710, lat: 45.9165, altM: 3000 }, // Pied du Y couloir
        { lon: 6.9740, lat: 45.9195, altM: 3400 }, // Fourche du Y
        { lon: 6.9765, lat: 45.9220, altM: 3800 }, // Branche droite
        { lon: 6.9780, lat: 45.9235, altM: 3980 }, // Sortie couloir
        { lon: 6.9796, lat: 45.9245, altM: 4122 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // MONT BLANC — 45.8327°N 6.8651°E 4808m
  // ==========================================================================
  "mont-blanc": [
    {
      id: "mb-gouter",
      name: "Voie normale — Refuge du Goûter",
      activity: "alpinisme",
      grade: "F+",
      gradeText: "voie la plus fréquentée, D+ 2300m depuis Nid d'Aigle",
      description: "La voie normale du Mont Blanc depuis le Nid d'Aigle (Tramway du Mont-Blanc). Passage obligé au couloir du Goûter, exposé aux chutes de pierres.",
      c2cUrl: "https://www.camptocamp.org/routes/53781/fr/mont-blanc-voie-normale-par-le-refuge-du-gouter",
      c2cId: "53781",
      track: [
        { lon: 6.8273, lat: 45.8794, altM: 2372 }, // Nid d'Aigle (terminus TMB)
        { lon: 6.8350, lat: 45.8700, altM: 2900 }, // Tête Rousse
        { lon: 6.8420, lat: 45.8640, altM: 3350 }, // Couloir du Goûter
        { lon: 6.8470, lat: 45.8560, altM: 3835 }, // Refuge du Goûter
        { lon: 6.8530, lat: 45.8480, altM: 4304 }, // Dôme du Goûter
        { lon: 6.8592, lat: 45.8410, altM: 4547 }, // Vallot
        { lon: 6.8620, lat: 45.8370, altM: 4680 }, // Bosses du Dromadaire — basse
        { lon: 6.8640, lat: 45.8345, altM: 4741 }, // Bosses du Dromadaire — haute
        { lon: 6.8651, lat: 45.8327, altM: 4808 }, // Sommet
      ],
    },
    {
      id: "mb-trois-monts",
      name: "Voie des Trois Monts",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "Mont Blanc du Tacul → Mont Maudit → Mont Blanc, D+ 2200m",
      description: "Grande classique glaciaire par le Triangle du Tacul et l'arête Kuffner. Itinéraire plus engagé que la voie normale, entièrement sur glace et neige.",
      c2cUrl: "https://www.camptocamp.org/routes/53785/fr/mont-blanc-voie-des-trois-monts",
      c2cId: "53785",
      track: [
        { lon: 6.8873, lat: 45.8788, altM: 3842 }, // Aiguille du Midi (départ téléphérique)
        { lon: 6.8850, lat: 45.8700, altM: 3850 }, // Col du Midi
        { lon: 6.8820, lat: 45.8620, altM: 4248 }, // Mont Blanc du Tacul
        { lon: 6.8760, lat: 45.8540, altM: 4465 }, // Col Maudit
        { lon: 6.8710, lat: 45.8490, altM: 4465 }, // Mont Maudit
        { lon: 6.8680, lat: 45.8420, altM: 4630 }, // Col de la Brenva
        { lon: 6.8651, lat: 45.8327, altM: 4808 }, // Sommet Mont Blanc
      ],
    },
  ],

  // ==========================================================================
  // GRANDES JORASSES — 45.8993°N 7.0596°E (Pt Walker 4208m)
  // ==========================================================================
  jorasses: [
    {
      id: "jorasses-walker",
      name: "Éperon Walker",
      activity: "alpinisme",
      grade: "ED",
      gradeText: "face nord 1200m — rocher + glace, extrêmement engagé",
      description: "Un des trois grands problèmes nord des Alpes, ouvert en 1938 par Cassin, Esposito et Tizzoni. Itinéraire de référence de l'alpinisme mondial sur la face nord des Jorasses.",
      c2cUrl: "https://www.camptocamp.org/routes/54265/fr/grandes-jorasses-eperon-walker",
      c2cId: "54265",
      track: [
        { lon: 7.0350, lat: 45.8820, altM: 2000 }, // Refuge Leschaux
        { lon: 7.0430, lat: 45.8870, altM: 2600 }, // Pied de la face nord
        { lon: 7.0480, lat: 45.8910, altM: 3100 }, // Tiers inférieur éperon
        { lon: 7.0530, lat: 45.8945, altM: 3500 }, // Mi-voie — éperon central
        { lon: 7.0565, lat: 45.8972, altM: 3900 }, // Haut de l'éperon
        { lon: 7.0596, lat: 45.8993, altM: 4208 }, // Sommet Pt Walker
      ],
    },
    {
      id: "jorasses-normale",
      name: "Voie normale — Pt Whymper",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "arête W côté italien — neige et glace modérés",
      description: "Voie normale des Grandes Jorasses par le versant italien depuis le refuge Boccalatte. Itinéraire classique sur arête neigeuse, bien moins engagé que la face nord.",
      c2cUrl: "https://www.camptocamp.org/routes/54263/fr/grandes-jorasses-voie-normale-pointe-whymper",
      c2cId: "54263",
      track: [
        { lon: 7.0620, lat: 45.8850, altM: 2800 }, // Refuge Boccalatte (côté italien)
        { lon: 7.0640, lat: 45.8890, altM: 3300 }, // Glacier de Whymper
        { lon: 7.0620, lat: 45.8940, altM: 3750 }, // Col des Grandes Jorasses
        { lon: 7.0600, lat: 45.8960, altM: 3970 }, // Pointe Marguerite
        { lon: 7.0585, lat: 45.8975, altM: 4184 }, // Pointe Whymper
      ],
    },
  ],

  // ==========================================================================
  // MONT BLANC DU TACUL — 45.8620°N 6.8820°E (4248m)
  // ==========================================================================
  tacul: [
    {
      id: "tacul-gervasutti",
      name: "Pilier Gervasutti",
      activity: "alpinisme",
      grade: "TD+",
      gradeText: "pilier central, rocher et glace, 6a obligatoire",
      description: "Grand pilier de rocher et glace sur le flanc est du Mont Blanc du Tacul, ouvert par Giusto Gervasutti en 1944. Itinéraire technique et engagé.",
      c2cUrl: "https://www.camptocamp.org/routes/54208/fr/mont-blanc-du-tacul-pilier-gervasutti",
      c2cId: "54208",
      track: [
        { lon: 6.8873, lat: 45.8788, altM: 3842 }, // Aiguille du Midi
        { lon: 6.8850, lat: 45.8710, altM: 3850 }, // Col du Midi
        { lon: 6.8830, lat: 45.8650, altM: 3900 }, // Pied du pilier est
        { lon: 6.8840, lat: 45.8630, altM: 4050 }, // Mi-pilier
        { lon: 6.8825, lat: 45.8622, altM: 4200 }, // Sommet du pilier
        { lon: 6.8820, lat: 45.8620, altM: 4248 }, // Sommet Tacul
      ],
    },
  ],

  // ==========================================================================
  // AIGUILLE DES DRUS — 45.9310°N 6.9580°E (Petit Dru 3754m)
  // ==========================================================================
  drus: [
    {
      id: "drus-bonatti",
      name: "Pilier Bonatti",
      activity: "alpinisme",
      grade: "ED",
      gradeText: "solitaire 1955, rocher exceptionnel, 6a — 1200m de D+",
      description: "L'une des ascensions les plus légendaires de l'histoire de l'alpinisme. Walter Bonatti a gravi seul ce pilier rocheux en 6 jours en 1955, en tête. Chef-d'œuvre d'engagement et de technique.",
      c2cUrl: "https://www.camptocamp.org/routes/182620/fr/petit-dru-pilier-sw-bonatti",
      c2cId: "182620",
      track: [
        { lon: 6.9450, lat: 45.9200, altM: 2000 }, // Montenvers / Mer de Glace
        { lon: 6.9500, lat: 45.9250, altM: 2600 }, // Pied de la moraine Drus
        { lon: 6.9540, lat: 45.9280, altM: 3000 }, // Pied du pilier SW
        { lon: 6.9558, lat: 45.9295, altM: 3300 }, // Tiers bas du pilier
        { lon: 6.9568, lat: 45.9305, altM: 3550 }, // Mi-pilier
        { lon: 6.9578, lat: 45.9310, altM: 3700 }, // Haut du pilier
        { lon: 6.9580, lat: 45.9310, altM: 3754 }, // Sommet Petit Dru
      ],
    },
  ],

  // ==========================================================================
  // AIGUILLE DU MIDI — 45.8788°N 6.8873°E (3842m)
  // ==========================================================================
  midi: [
    {
      id: "midi-cosmiques",
      name: "Arête des Cosmiques",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "arête mixte classique, 200m de D+, technique et exposée",
      description: "Arête emblématique de l'Aiguille du Midi, accessible depuis le téléphérique. Grande classique pour les cordées souhaitant s'initier à l'alpinisme de haute montagne sur un itinéraire varié.",
      c2cUrl: "https://www.camptocamp.org/routes/54148/fr/aiguille-du-midi-arete-des-cosmiques",
      c2cId: "54148",
      track: [
        { lon: 6.8873, lat: 45.8788, altM: 3842 }, // Sommet téléphérique
        { lon: 6.8855, lat: 45.8775, altM: 3800 }, // Départ arête W
        { lon: 6.8840, lat: 45.8760, altM: 3750 }, // Première gendarme
        { lon: 6.8820, lat: 45.8745, altM: 3720 }, // Pas de la Goulotte
        { lon: 6.8800, lat: 45.8730, altM: 3700 }, // Milieu de l'arête
        { lon: 6.8780, lat: 45.8715, altM: 3690 }, // Refuge des Cosmiques
      ],
    },
  ],

  // ==========================================================================
  // LA MEIJE — Grand Pic 3984m — Massif des Écrins
  // ==========================================================================
  meije: [
    {
      id: "meije-promontoire",
      name: "Voie Normale — Arête du Promontoire",
      activity: "alpinisme",
      grade: "TD",
      gradeText: "face N, 1500m D+, mixte rocher/glace, très engagé",
      description: "Voie normale de la Meije depuis La Grave, par le Refuge du Promontoire (3092m). Itinéraire classique mais exigeant sur l'arête ouest du Grand Pic, réputé l'un des TD les plus sérieux des Alpes.",
      c2cUrl: "https://www.camptocamp.org/routes/54399/fr/la-meije-grand-pic-voie-normale-arete-du-promontoire",
      c2cId: "54399",
      track: [
        { lon: 6.3096, lat: 45.0461, altM: 1480 }, // La Grave village
        { lon: 6.3080, lat: 45.0191, altM: 3200 }, // Téléphérique des Glaciers de la Meije (haut)
        { lon: 6.3075, lat: 45.0119, altM: 3100 }, // Glacier de la Girose
        { lon: 6.3073, lat: 45.0083, altM: 3092 }, // Refuge du Promontoire
        { lon: 6.3135, lat: 45.0054, altM: 3300 }, // Pied de l'arête du Promontoire
        { lon: 6.3197, lat: 45.0026, altM: 3564 }, // Brèche Zsygmondy
        { lon: 6.3234, lat: 45.0006, altM: 3984 }, // Grand Pic de la Meije (sommet)
      ],
    },
    {
      id: "meije-traversee",
      name: "Traversée Intégrale de la Meije",
      activity: "alpinisme",
      grade: "ED",
      gradeText: "D→E intégrale, III à V, glaciaire + mixte + arête, 1800m D+",
      description: "Traversée complète d'W en E : de la Brèche de la Meije au Doigt de Dieu (Cime de l'Est, 3973m). L'une des plus grandes courses classiques des Alpes françaises, première réalisée en 1885 par Zsygmondy.",
      c2cUrl: "https://www.camptocamp.org/routes/54400/fr/la-meije-traversee-integrale",
      c2cId: "54400",
      track: [
        { lon: 6.2944, lat: 45.0042, altM: 3357 }, // Brèche de la Meije (W)
        { lon: 6.3073, lat: 45.0083, altM: 3700 }, // Glacier du Tabuchet
        { lon: 6.3197, lat: 45.0026, altM: 3800 }, // Brèche Zsygmondy
        { lon: 6.3234, lat: 45.0006, altM: 3984 }, // Grand Pic (sommet)
        { lon: 6.3262, lat: 45.0051, altM: 3973 }, // Cime de l'Est — Doigt de Dieu
      ],
    },
  ],

  // ==========================================================================
  // LE RÂTEAU — ~45.009°N 6.267°E (3809m) — Massif des Écrins
  // Tuiles : 0957_6438, 0958_6438, 0958_6439
  // ==========================================================================
  rateau: [
    {
      id: "rateau-normale",
      name: "Voie normale — Face SW",
      activity: "alpinisme",
      grade: "PD+",
      gradeText: "glacier du Tabuchet, arête S, 1400m D+",
      description: "Voisin de la Meije, le Râteau s'escalade depuis La Grave par le glacier du Tabuchet. Voie classique sur terrain mixte avec une courte arête rocheuse en fin de course. Vue saisissante sur la face nord de la Meije.",
      c2cUrl: "https://www.camptocamp.org/routes/54402/fr/le-rateau-voie-normale",
      c2cId: "54402",
      track: [
        { lon: 6.3096, lat: 45.0461, altM: 1450 }, // La Grave
        { lon: 6.2870, lat: 45.0260, altM: 2020 }, // Refuge de l'Alpe de Villard d'Arêne
        { lon: 6.2745, lat: 45.0152, altM: 3000 }, // Glacier du Tabuchet
        { lon: 6.2695, lat: 45.0102, altM: 3480 }, // Col du Râteau
        { lon: 6.2682, lat: 45.0090, altM: 3700 }, // Arête S
        { lon: 6.2671, lat: 45.0085, altM: 3809 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // PIC GASPARD — ~45.010°N 6.293°E (3883m) — Massif des Écrins
  // Tuiles : 0958_6438, 0958_6439
  // ==========================================================================
  "pic-gaspard": [
    {
      id: "pic-gaspard-normale",
      name: "Voie normale — depuis Refuge du Promontoire",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "arête mixte 700m D+, rocher de qualité",
      description: "Le Pic Gaspard porte le nom de la famille de guides qui vainquit la Meije. Sa voie normale depuis le Refuge du Promontoire offre une belle course mixte sur l'arête sud avec vue directe sur la face nord de la Meije.",
      c2cUrl: "https://www.camptocamp.org/routes/54403/fr/pic-gaspard-voie-normale",
      c2cId: "54403",
      track: [
        { lon: 6.3073, lat: 45.0083, altM: 3092 }, // Refuge du Promontoire (approach)
        { lon: 6.2840, lat: 45.0070, altM: 3500 }, // Glacier de la Meije versant SW (dans tile)
        { lon: 6.2820, lat: 45.0010, altM: 3700 }, // Col du Pic Gaspard
        { lon: 6.2810, lat: 44.9970, altM: 3800 }, // Arête S
        { lon: 6.2805, lat: 44.9950, altM: 3883 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // BARRE DES ÉCRINS — 44.924°N 6.355°E (4102m) — point culminant Écrins
  // Tuiles : 0964_6431, 0964_6432, 0965_6431, 0965_6432
  // ==========================================================================
  "barre-ecrins": [
    {
      id: "ecrins-glacier-blanc",
      name: "Voie normale — Glacier Blanc",
      activity: "alpinisme",
      grade: "D",
      gradeText: "glacier Blanc + face N séracs, 2200m D+, engagé",
      description: "Voie normale de la Barre des Écrins, 4000m le plus méridional des Alpes. Depuis Ailefroide et le Pré de Madame Carle, remontée du glacier Blanc jusqu'au bivouac des Écrins, puis ascension de la face nord glaciaire exposée aux séracs.",
      c2cUrl: "https://www.camptocamp.org/routes/54451/fr/barre-des-ecrins-voie-normale-glacier-blanc",
      c2cId: "54451",
      track: [
        { lon: 6.3630, lat: 44.8770, altM: 1510 }, // Ailefroide village
        { lon: 6.4026, lat: 44.9290, altM: 1874 }, // Pré de Madame Carle
        { lon: 6.3883, lat: 44.9272, altM: 3175 }, // Refuge des Écrins (Cézanne)
        { lon: 6.3735, lat: 44.9262, altM: 3600 }, // Glacier Blanc plateau
        { lon: 6.3605, lat: 44.9248, altM: 3975 }, // Col des Écrins
        { lon: 6.3580, lat: 44.9240, altM: 4050 }, // Arête finale
        { lon: 6.3549, lat: 44.9237, altM: 4102 }, // Sommet
      ],
    },
    {
      id: "ecrins-couloir-coolidge",
      name: "Couloir Coolidge — Face N",
      activity: "alpinisme",
      grade: "TD",
      gradeText: "couloir de glace 1000m, 55°, face N très exposée",
      description: "Grand couloir de glace sur la face nord de la Barre des Écrins, l'une des grandes faces des Alpes françaises. Course sérieuse sur glace raide, exposée aux avalanches et aux séracs.",
      c2cUrl: "https://www.camptocamp.org/routes/54452/fr/barre-des-ecrins-couloir-coolidge",
      c2cId: "54452",
      track: [
        { lon: 6.3883, lat: 44.9272, altM: 3175 }, // Refuge des Écrins
        { lon: 6.3680, lat: 44.9258, altM: 3500 }, // Glacier Blanc
        { lon: 6.3620, lat: 44.9250, altM: 3700 }, // Pied face N — couloir Coolidge
        { lon: 6.3580, lat: 44.9243, altM: 3900 }, // Mi-couloir
        { lon: 6.3555, lat: 44.9238, altM: 4050 }, // Sortie couloir
        { lon: 6.3549, lat: 44.9237, altM: 4102 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // DÔME DE NEIGE DES ÉCRINS — 44.926°N 6.357°E (4015m)
  // Tuiles : 0964_6431, 0964_6432, 0965_6431, 0965_6432
  // ==========================================================================
  "dome-neige": [
    {
      id: "dome-neige-normale",
      name: "Voie normale — Glacier Blanc",
      activity: "alpinisme",
      grade: "PD+",
      gradeText: "glacier Blanc, 2000m D+, 4000m le plus accessible des Écrins",
      description: "Le Dôme de Neige est le 4000m le plus accessible du massif des Écrins. Son vaste plateau neigeux offre un panorama exceptionnel sur la Barre et l'ensemble du massif. Souvent réalisé en aller-retour depuis le bivouac des Écrins.",
      c2cUrl: "https://www.camptocamp.org/routes/54453/fr/dome-de-neige-voie-normale",
      c2cId: "54453",
      track: [
        { lon: 6.4026, lat: 44.9290, altM: 1874 }, // Pré de Madame Carle
        { lon: 6.3883, lat: 44.9272, altM: 3175 }, // Refuge des Écrins
        { lon: 6.3735, lat: 44.9262, altM: 3600 }, // Glacier Blanc
        { lon: 6.3640, lat: 44.9255, altM: 3800 }, // Plateau supérieur
        { lon: 6.3571, lat: 44.9258, altM: 4015 }, // Sommet Dôme
      ],
    },
  ],

  // ==========================================================================
  // ROCHE FAURIO — ~44.968°N 6.270°E (3730m) — Écrins
  // Tuiles : 0957_6434, 0958_6434
  // ==========================================================================
  "roche-faurio": [
    {
      id: "roche-faurio-normale",
      name: "Voie normale — Arête SE",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "rocher et névé, 700m D+, beau panorama Écrins",
      description: "Sommet rocheux face à la Barre des Écrins, emblématique de la vue depuis le refuge des Écrins. Belle course rocheuse avec quelques pas d'escalade sur granite solide.",
      c2cUrl: "https://www.camptocamp.org/routes/54454/fr/roche-faurio-voie-normale",
      c2cId: "54454",
      track: [
        { lon: 6.3883, lat: 44.9272, altM: 3175 }, // Refuge des Écrins (approach)
        { lon: 6.2840, lat: 44.9630, altM: 2500 }, // Glacier du Faurio (dans tile)
        { lon: 6.2780, lat: 44.9620, altM: 3000 }, // Col du Faurio
        { lon: 6.2740, lat: 44.9600, altM: 3600 }, // Arête SE
        { lon: 6.2720, lat: 44.9585, altM: 3730 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // MONTAGNE DES AGNEAUX — ~44.953°N 6.372°E (3664m) — Écrins
  // Tuiles : 0958_6435, 0958_6436
  // ==========================================================================
  agneaux: [
    {
      id: "agneaux-normale",
      name: "Voie normale — Plateau des Agneaux",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "glacier et arête neigeuse, 1200m D+, haute montagne accessible",
      description: "Belle course glaciaire depuis le refuge du Pavé. L'itinéraire classique traverse les névés du plateau des Agneaux avant de rejoindre la cime rocheuse. Vue panoramique sur les Écrins et le Briançonnais.",
      c2cUrl: "https://www.camptocamp.org/routes/54455/fr/montagne-des-agneaux-voie-normale",
      c2cId: "54455",
      track: [
        { lon: 6.3500, lat: 44.9900, altM: 2100 }, // Casset / Monêtier (approach)
        { lon: 6.2860, lat: 44.9820, altM: 2800 }, // Plateau des Agneaux (dans tile)
        { lon: 6.2820, lat: 44.9760, altM: 3200 }, // Mi-plateau
        { lon: 6.2790, lat: 44.9710, altM: 3500 }, // Haut plateau
        { lon: 6.2770, lat: 44.9670, altM: 3664 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // MONT PELVOUX — 44.895°N 6.353°E (3946m) — Écrins
  // Tuiles : 0964_6428, 0964_6429, 0965_6428, 0965_6429
  // ==========================================================================
  pelvoux: [
    {
      id: "pelvoux-coolidge",
      name: "Arête du Coup de Sabre — Voie Coolidge",
      activity: "alpinisme",
      grade: "D",
      gradeText: "arête rocheuse 1200m D+, III-IV, style Écrins pur",
      description: "La voie Coolidge est la grande classique du Pelvoux, remontant l'arête du Coup de Sabre depuis Ailefroide. Terrain rocheux typique des Écrins avec passages de III-IV sur granit solide.",
      c2cUrl: "https://www.camptocamp.org/routes/54471/fr/mont-pelvoux-voie-coolidge",
      c2cId: "54471",
      track: [
        { lon: 6.3630, lat: 44.8770, altM: 1510 }, // Ailefroide
        { lon: 6.3600, lat: 44.8800, altM: 2100 }, // Vallon de Claphouse bas
        { lon: 6.3580, lat: 44.8860, altM: 2800 }, // Glacier du Coup de Sabre
        { lon: 6.3565, lat: 44.8900, altM: 3400 }, // Col du Coup de Sabre
        { lon: 6.3555, lat: 44.8925, altM: 3700 }, // Arête médiane
        { lon: 6.3530, lat: 44.8953, altM: 3946 }, // Sommet
      ],
    },
    {
      id: "pelvoux-ski",
      name: "Ski de randonnée — Glacier du Pelvoux",
      activity: "ski",
      grade: "AD",
      gradeText: "ski haute montagne, 1400m D+, glacier du Pelvoux",
      description: "Itinéraire de ski de randonnée classique depuis Ailefroide par le glacier du Pelvoux. Terrain exposé avec une belle ambiance de haute montagne au cœur du massif des Écrins.",
      c2cUrl: "https://www.camptocamp.org/routes/54472/fr/mont-pelvoux-ski",
      c2cId: "54472",
      track: [
        { lon: 6.3630, lat: 44.8770, altM: 1510 }, // Ailefroide
        { lon: 6.3580, lat: 44.8860, altM: 2500 }, // Vallon Claphouse
        { lon: 6.3560, lat: 44.8900, altM: 3000 }, // Glacier du Pelvoux
        { lon: 6.3540, lat: 44.8930, altM: 3500 }, // Haut glacier
        { lon: 6.3530, lat: 44.8953, altM: 3946 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // AILEFROIDE — 44.877°N 6.345°E (3954m — Pt Centrale) — Écrins
  // Tuiles : 0964_6426, 0964_6427, 0964_6428, 0965_6426, 0965_6427, 0965_6428
  // ==========================================================================
  ailefroide: [
    {
      id: "ailefroide-pt-centrale",
      name: "Voie normale — Pointe Centrale",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "arête mixte neige/rocher, 1400m D+, III obligatoire",
      description: "Troisième plus haut sommet du Dauphiné, l'Ailefroide Centrale (3954m) domine directement le hameau d'Ailefroide. Sa voie normale par le vallon de Claphouse est une classique des Écrins sur terrain varié.",
      c2cUrl: "https://www.camptocamp.org/routes/54480/fr/ailefroide-voie-normale",
      c2cId: "54480",
      track: [
        { lon: 6.3630, lat: 44.8770, altM: 1510 }, // Ailefroide village
        { lon: 6.3505, lat: 44.8780, altM: 2200 }, // Vallon de Claphouse
        { lon: 6.3470, lat: 44.8765, altM: 2900 }, // Glacier de Claphouse
        { lon: 6.3455, lat: 44.8768, altM: 3500 }, // Col de l'Ailefroide
        { lon: 6.3450, lat: 44.8769, altM: 3954 }, // Sommet Pt Centrale
      ],
    },
  ],

  // ==========================================================================
  // L'OLAN — ~44.978°N 6.170°E (3564m) — Valgaudemar
  // Tuiles : 0948_6423, 0952_6423
  // ==========================================================================
  olan: [
    {
      id: "olan-arete-nw",
      name: "Arête NW — Voie normale",
      activity: "alpinisme",
      grade: "D",
      gradeText: "arête NW 1500m D+, rocher III-IV, très engagé",
      description: "L'Olan est le sommet majestueux du Valgaudemar, sa voie normale par l'arête NW est déjà une grande course. Itinéraire long et engagé sur terrain rocheux typique des Écrins.",
      c2cUrl: "https://www.camptocamp.org/routes/54500/fr/l-olan-arete-nw",
      c2cId: "54500",
      track: [
        { lon: 6.1855, lat: 44.8950, altM: 1100 }, // La Chapelle-en-Valgaudemar (approach)
        { lon: 6.1800, lat: 44.8750, altM: 2100 }, // Refuge de Font Turbat (dans tile)
        { lon: 6.1730, lat: 44.8690, altM: 3000 }, // Glacier N de l'Olan
        { lon: 6.1695, lat: 44.8650, altM: 3300 }, // Bas de l'arête NW
        { lon: 6.1680, lat: 44.8625, altM: 3564 }, // Sommet
      ],
    },
    {
      id: "olan-face-nord",
      name: "Face Nord — Grande Classique",
      activity: "alpinisme",
      grade: "ED",
      gradeText: "face N 1000m, glace et mixte extrême, mythique des Écrins",
      description: "La face nord de l'Olan est l'une des grandes faces mythiques du massif des Écrins. Haute de plus de 1000m, elle offre des itinéraires de très haute difficulté sur glace et mixte.",
      c2cUrl: "https://www.camptocamp.org/routes/54501/fr/l-olan-face-nord",
      c2cId: "54501",
      track: [
        { lon: 6.1800, lat: 44.8750, altM: 2100 }, // Approche refuge (dans tile)
        { lon: 6.1720, lat: 44.8690, altM: 2800 }, // Pied face N
        { lon: 6.1700, lat: 44.8665, altM: 3200 }, // Mi-face
        { lon: 6.1685, lat: 44.8640, altM: 3500 }, // Haut face
        { lon: 6.1680, lat: 44.8625, altM: 3564 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // LES BANS — ~44.953°N 6.258°E (3669m) — Valgaudemar
  // Tuiles : 0957_6424
  // ==========================================================================
  "les-bans": [
    {
      id: "les-bans-normale",
      name: "Voie normale — Arête S",
      activity: "alpinisme",
      grade: "PD+",
      gradeText: "arête S, 1100m D+, mixte facile",
      description: "Les Bans dominent la haute vallée du Valgaudemar. La voie normale par l'arête sud est une classique accessible du secteur, avec une belle arête mixte en fin de course.",
      c2cUrl: "https://www.camptocamp.org/routes/54502/fr/les-bans-voie-normale",
      c2cId: "54502",
      track: [
        { lon: 6.1855, lat: 44.8950, altM: 1100 }, // La Chapelle-en-Valgaudemar (approach)
        { lon: 6.2590, lat: 44.8755, altM: 1620 }, // Refuge de Gioberney (dans tile)
        { lon: 6.2610, lat: 44.8730, altM: 2500 }, // Glacier des Bans
        { lon: 6.2620, lat: 44.8710, altM: 3200 }, // Col des Bans
        { lon: 6.2625, lat: 44.8685, altM: 3669 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // LES ROUIES — ~44.949°N 6.214°E (3589m) — Valgaudemar
  // Tuiles : 0955_6434, 0955_6435
  // ==========================================================================
  "les-rouies": [
    {
      id: "les-rouies-normale",
      name: "Voie normale — depuis Refuge de la Pilatte",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "glacier et arête rocheuse, 1000m D+",
      description: "Sommet sauvage au-dessus du vallon de la Pilatte, accessible depuis le refuge éponyme. Ambiance très isolée typique des Écrins, beau panorama sur la face W de l'Olan et la Barre des Écrins.",
      c2cUrl: "https://www.camptocamp.org/routes/54503/fr/les-rouies-voie-normale",
      c2cId: "54503",
      track: [
        { lon: 6.2460, lat: 44.9600, altM: 2577 }, // Refuge de la Pilatte (dans tile)
        { lon: 6.2430, lat: 44.9650, altM: 3000 }, // Glacier des Rouies
        { lon: 6.2400, lat: 44.9690, altM: 3300 }, // Col des Rouies
        { lon: 6.2385, lat: 44.9710, altM: 3589 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // LA MUZELLE — ~45.024°N 6.185°E (3465m) — secteur Vénéon
  // Tuiles : 0955_6438, 0955_6439
  // ==========================================================================
  muzelle: [
    {
      id: "muzelle-normale",
      name: "Voie normale — depuis Lac de la Muzelle",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "arête rocheuse, 1200m D+, vue spectaculaire sur le lac",
      description: "Belle pyramide rocheuse au-dessus du lac de la Muzelle (turquoise). La voie normale monte par le GR 54 depuis Les Deux Alpes pour rejoindre l'arête S conduisant au sommet. Vue plongeante sur le lac emblématique des Écrins.",
      c2cUrl: "https://www.camptocamp.org/routes/54505/fr/la-muzelle-voie-normale",
      c2cId: "54505",
      track: [
        { lon: 6.1320, lat: 45.0200, altM: 1650 }, // Les Deux Alpes (approach)
        { lon: 6.2380, lat: 45.0080, altM: 2613 }, // Lac de la Muzelle (dans tile)
        { lon: 6.2420, lat: 45.0030, altM: 3100 }, // Arête S
        { lon: 6.2440, lat: 44.9980, altM: 3300 }, // Montée finale
        { lon: 6.2450, lat: 44.9955, altM: 3465 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // LE SIRAC — ~44.944°N 6.190°E (3441m) — Valgaudemar
  // Tuiles : 0948_6423
  // ==========================================================================
  sirac: [
    {
      id: "sirac-normale",
      name: "Voie normale — Arête NW",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "arête rocheuse classique, 1100m D+, belle crête",
      description: "Sentinelle méridionale du Valgaudemar, le Sirac s'escalade par son arête NW depuis La Chapelle-en-Valgaudemar. Course rocheuse élégante avec quelques pas d'escalade.",
      c2cUrl: "https://www.camptocamp.org/routes/54506/fr/le-sirac-voie-normale",
      c2cId: "54506",
      track: [
        { lon: 6.1855, lat: 44.8950, altM: 1100 }, // La Chapelle-en-Valgaudemar (approach)
        { lon: 6.1490, lat: 44.8700, altM: 1800 }, // Approche vallon S (dans tile)
        { lon: 6.1470, lat: 44.8670, altM: 2500 }, // Glacier du Sirac
        { lon: 6.1455, lat: 44.8645, altM: 3200 }, // Arête NW
        { lon: 6.1445, lat: 44.8630, altM: 3441 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // MONTAGNE SAINTE-VICTOIRE — Pic des Mouches (1011m)
  // Tuiles : 0895_6238, 0896_6238
  // ==========================================================================
  "pic-mouches": [
    {
      id: "pic-mouches-crete",
      name: "Crête de la Sainte-Victoire",
      activity: "alpinisme",
      grade: "F",
      gradeText: "randonnée crête, 600m D+, panorama Provence",
      description: "Traversée de la crête de la Sainte-Victoire d'ouest en est jusqu'au point culminant. La montagne immortalisée par Cézanne offre depuis son sommet un panorama unique sur la Provence, Aix-en-Provence et par temps clair la Méditerranée.",
      c2cUrl: "https://www.camptocamp.org/routes/182900/fr/sainte-victoire-traversee-crete",
      c2cId: "182900",
      track: [
        { lon: 5.4000, lat: 43.2145, altM: 200 }, // Départ W (dans tile)
        { lon: 5.4050, lat: 43.2160, altM: 450 }, // Mi-crête
        { lon: 5.4100, lat: 43.2175, altM: 700 }, // Crête E
        { lon: 5.4150, lat: 43.2185, altM: 900 }, // Approche sommet
        { lon: 5.4200, lat: 43.2190, altM: 1011 }, // Pic des Mouches (sommet)
      ],
    },
  ],
};
