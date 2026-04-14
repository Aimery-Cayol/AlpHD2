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

// Palette de couleurs distinctes pour éviter les doublons au sein d'un même sommet
const ROUTE_PALETTE = [
  "#3b82f6", // bleu
  "#ef4444", // rouge
  "#22c55e", // vert
  "#f97316", // orange
  "#a855f7", // violet
  "#06b6d4", // cyan
  "#eab308", // jaune
  "#ec4899", // rose
  "#14b8a6", // teal
  "#f59e0b", // ambre
  "#6366f1", // indigo
  "#84cc16", // lime
];

/**
 * Retourne une couleur unique pour chaque voie au sein d'un sommet.
 * Utilise l'index de la voie dans la liste filtrée (GPX uniquement).
 */
export function getRoutePaletteColor(summitId: string, routeId: string): string {
  const routes = (CLIMBING_ROUTES[summitId] ?? []).filter((r) =>
    GPX_ROUTE_IDS.has(r.id)
  );
  const index = routes.findIndex((r) => r.id === routeId);
  if (index === -1) {
    // Voie pas dans la liste filtrée — fallback palette via position globale
    const allRoutes = CLIMBING_ROUTES[summitId] ?? [];
    const i = allRoutes.findIndex((r) => r.id === routeId);
    return ROUTE_PALETTE[Math.max(0, i) % ROUTE_PALETTE.length];
  }
  return ROUTE_PALETTE[index % ROUTE_PALETTE.length];
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
      id: "sommet-s-par-le-col-superieur-du-tour",
      name: "Voie normale — Col Supérieur du Tour",
      activity: "alpinisme",
      grade: "F+",
      gradeText: "classique glaciaire d'initiation, 2000m D+, glacier du Tour",
      description: "L'Aiguille du Tour est l'une des premières grandes courses glaciaires du massif. La voie normale par le Col Supérieur du Tour part du village du Tour, remonte le glacier du Tour jusqu'au col éponyme (3289m) puis rejoint le Sommet S (3540m) par une courte arête rocheuse. Classique idéale pour une première haute montagne.",
      c2cUrl: "https://www.camptocamp.org/routes/56749/fr/aiguille-du-tour-voie-normale",
      c2cId: "56749",
      track: [
        { lon: 6.94750, lat: 45.99900, altM: 1483 }, // Le Tour (village)
        { lon: 6.97000, lat: 45.99500, altM: 2000 }, // Glacier du Tour bas
        { lon: 7.00000, lat: 45.99200, altM: 2900 }, // Glacier du Tour
        { lon: 7.00500, lat: 45.99200, altM: 3100 }, // Glacier du Tour haut
        { lon: 7.01031, lat: 45.99437, altM: 3542 }, // Sommet S
      ],
    },
    {
      id: "arete-de-la-table",
      name: "Arête de la Table (SW)",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "arête mixte variée, neige et rocher, plus technique que la voie normale",
      description: "Belle course mixte sur l'arête SW de la Table de Roc de l'Aiguille du Tour. Plus technique et variée que la voie normale, elle offre un bel itinéraire sur neige et rocher menant au Sommet S (3540m) par un cheminement aérien.",
      c2cUrl: "https://www.camptocamp.org/routes/56749/fr/aiguille-du-tour-voie-normale",
      c2cId: "56749",
      track: [
        { lon: 6.98649, lat: 45.99678, altM: 2700 }, // Pied de l'arête
        { lon: 7.00000, lat: 45.99400, altM: 3100 }, // Milieu arête
        { lon: 7.01031, lat: 45.99436, altM: 3484 }, // Sommet S
      ],
    },
    {
      id: "couloir-de-la-table",
      name: "Couloir de la Table",
      activity: "ski",
      grade: "AD-",
      gradeText: "couloir sauvage pente raide, accès refuge Albert 1er",
      description: "Beau couloir sauvage propice au perfectionnement du ski de pente raide. Accès à la base par le col du Passon ou le refuge Albert 1er.",
      c2cUrl: "https://www.camptocamp.org/routes/46737",
      c2cId: "46737",
      track: [
        { lon: 6.9875, lat: 45.9945, altM: 2678 }, // Base couloir (glacier du Tour)
        { lon: 6.9950, lat: 45.9944, altM: 3000 }, // Couloir bas
        { lon: 7.0030, lat: 45.9944, altM: 3200 }, // Couloir milieu
        { lon: 7.0103, lat: 45.9943, altM: 3540 }, // Sommet S
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
      gradeText: "longue arête neigeuse S-N, 1200m D+, exposition modérée",
      description: "L'Arête Forbes est la grande classique du Chardonnet. Longue et aérienne, elle escalade l'arête frontière entre la France et la Suisse depuis le Col d'Argentière. Vue exceptionnelle sur le glacier d'Argentière et le massif.",
      c2cUrl: "https://www.camptocamp.org/routes/53806/fr/aiguille-du-chardonnet-arete-forbes",
      c2cId: "53806",
      track: [
        { lon: 6.9868, lat: 45.9962, altM: 2611 }, // Glacier du Tour (départ)
        { lon: 6.9897, lat: 45.9936, altM: 2696 }, // Glacier bas
        { lon: 6.9944, lat: 45.9910, altM: 2777 }, // Glacier moyen
        { lon: 6.9977, lat: 45.9882, altM: 2905 }, // Col du Chardonnet approche
        { lon: 7.0033, lat: 45.9872, altM: 3063 }, // Col d'Argentière
        { lon: 7.0076, lat: 45.9795, altM: 3223 }, // Pied arête Forbes
        { lon: 7.0091, lat: 45.9711, altM: 3437 }, // Mi-arête
        { lon: 7.0014, lat: 45.9689, altM: 3824 }, // Sommet
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
      track: [
        { lon: 6.9454, lat: 46.0036, altM: 1465 }, // Le Tour (départ)
        { lon: 6.9660, lat: 45.9932, altM: 2203 }, // Glacier du Tour
        { lon: 6.9716, lat: 45.9921, altM: 2331 }, // Glacier moyen
        { lon: 6.9765, lat: 45.9893, altM: 2545 }, // Glacier haut
        { lon: 6.9867, lat: 45.9834, altM: 2849 }, // Col du Passon approche
        { lon: 6.9987, lat: 45.9817, altM: 2979 }, // Col du Passon
        { lon: 7.0110, lat: 45.9884, altM: 3246 }, // Glacier SW
        { lon: 7.0010, lat: 45.9689, altM: 3818 }, // Sommet
      ],
    },
    {
      id: "eperon-migot",
      name: "Éperon Migot",
      activity: "alpinisme",
      grade: "AD+",
      gradeText: "itinéraire varié mixte + pente de neige, sérac",
      description: "Itinéraire splendide et très varié : mixte, pente de neige. Ambiance sympa au niveau du sérac.",
      c2cUrl: "https://www.camptocamp.org/routes/54940",
      c2cId: "54940",
      track: [
        { lon: 6.9978, lat: 45.9630, altM: 2771 }, // Refuge d'Argentière
        { lon: 7.0010, lat: 45.9650, altM: 3100 }, // Glacier d'Argentière
        { lon: 7.0020, lat: 45.9670, altM: 3400 }, // Éperon
        { lon: 7.0014, lat: 45.9689, altM: 3824 }, // Sommet
      ],
    },
  ],

  // ==========================================================================
  // LES DROITES — 45.938°N 7.001°E (4001m)
  // Tuiles : 1008_6545, 1008_6546, 1009_6545, 1009_6546
  // ==========================================================================
  droites: [
    {
      id: "droites-eperon-oriental",
      name: "Éperon Oriental (voie normale)",
      activity: "alpinisme",
      grade: "AD+",
      gradeText: "couloir-mixte puis arête neigeuse, 800m D+, glacier d'Argentière",
      description: "Voie normale des Droites par l'éperon oriental. Depuis le glacier d'Argentière SE, on remonte le couloir puis l'éperon oriental jusqu'au sommet W de ce 4000m.",
      c2cUrl: "https://www.camptocamp.org/routes/54257",
      c2cId: "54257",
      track: [
        { lon: 6.99158, lat: 45.91965, altM: 2928 }, // Glacier d'Argentière SE
        { lon: 6.99303, lat: 45.92355, altM: 3200 }, // Glacier bas
        { lon: 6.99008, lat: 45.92527, altM: 3400 }, // Pied éperon oriental
        { lon: 6.99378, lat: 45.92835, altM: 3700 }, // Éperon médian
        { lon: 6.98911, lat: 45.93042, altM: 4003 }, // Sommet W
      ],
    },
    {
      id: "couloir-lagarde",
      name: "Couloir Lagarde direct",
      activity: "alpinisme",
      grade: "TD",
      gradeText: "couloir NE, glace raide, itinéraire direct",
      description: "Couloir Lagarde direct sur la face nord-est des Droites. Terrain de glace soutenu.",
      c2cUrl: "https://www.camptocamp.org/routes/57364",
      c2cId: "57364",
      track: [
        { lon: 6.94505, lat: 45.94797, altM: 2755 }, // Départ glacier d'Argentière
        { lon: 6.97337, lat: 45.94388, altM: 3002 }, // Approche couloir
        { lon: 6.99572, lat: 45.93772, altM: 2761 }, // Pied couloir (bergschrund)
        { lon: 6.99490, lat: 45.93229, altM: 3441 }, // Mi-couloir
        { lon: 6.98960, lat: 45.93073, altM: 3979 }, // Sortie couloir / sommet
      ],
    },
  ],

  // ==========================================================================
  // LES COURTES — 45.929°N 7.016°E (3856m)
  // Tuiles : 1009_6544, 1009_6545, 1010_6544, 1010_6545
  // ==========================================================================
  courtes: [
    {
      id: "courtes-voie-normale",
      name: "Voie normale et traversée",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "glacier et arête mixte, 1200m D+, depuis le glacier d'Argentière",
      description: "Voie normale des Courtes depuis le glacier d'Argentière. Longue approche glaciaire puis montée sur l'arête sommitale. Permet la traversée jusqu'au glacier de Talèfre.",
      c2cUrl: "https://www.camptocamp.org/routes/169662",
      c2cId: "169662",
      track: [
        { lon: 6.96552, lat: 45.91030, altM: 2707 }, // Glacier d'Argentière (départ)
        { lon: 6.99300, lat: 45.92200, altM: 3200 }, // Glacier approche
        { lon: 7.00339, lat: 45.92738, altM: 3866 }, // Sommet
      ],
    },
    {
      id: "courtes-voie-des-suisses",
      name: "Voie des Suisses",
      activity: "alpinisme",
      grade: "TD",
      gradeText: "face N directe, glace 55°, 600m, depuis glacier d'Argentière",
      description: "Grande voie de la face nord des Courtes. Montée directe en glace soutenue depuis le glacier d'Argentière côté nord. Descente possible par le couloir NE.",
      c2cUrl: "https://www.camptocamp.org/routes/169662",
      c2cId: "169662",
      track: [
        { lon: 7.00446, lat: 45.94642, altM: 2767 }, // Glacier d'Argentière N
        { lon: 7.00383, lat: 45.93700, altM: 3200 }, // Face N bas
        { lon: 7.00320, lat: 45.92750, altM: 3822 }, // Sommet
      ],
    },
    {
      id: "courtes-voie-autrichiens",
      name: "Voie des Autrichiens",
      activity: "alpinisme",
      grade: "TD",
      gradeText: "face NE, glace et mixte, depuis le glacier de Talèfre",
      description: "Grande voie de la face NE des Courtes. Montée depuis le glacier de Talèfre par l'éperon NE, avec passages en mixte et glace raide.",
      c2cUrl: "https://www.camptocamp.org/routes/169662",
      c2cId: "169662",
      track: [
        { lon: 6.95678, lat: 45.97077, altM: 2038 }, // Départ approche
        { lon: 7.00000, lat: 45.94000, altM: 3000 }, // Glacier de Talèfre
        { lon: 7.00341, lat: 45.92742, altM: 3867 }, // Sommet
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
      name: "Face S — Voie normale",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "face S + arête rocheuse, 700m D+, III obligatoire",
      description: "Belle pyramide rocheuse dominant le glacier de Talèfre. La voie normale par la face S et l'arête offre une escalade variée sur granite avec quelques pas de III. Vue magnifique sur l'Aiguille Verte et les Drus.",
      c2cUrl: "https://www.camptocamp.org/routes/56049",
      c2cId: "56049",
      track: [
        { lon: 6.9737, lat: 45.9212, altM: 2687 }, // Refuge du Couvercle
        { lon: 6.9650, lat: 45.9155, altM: 2900 }, // Glacier de Talèfre
        { lon: 6.9603, lat: 45.9115, altM: 3100 }, // Col du Moine
        { lon: 6.9597, lat: 45.9090, altM: 3250 }, // Face S
        { lon: 6.9597, lat: 45.9074, altM: 3412 }, // Sommet
      ],
    },
    {
      id: "arete-s-classique",
      name: "Arête S Classique",
      activity: "escalade",
      grade: "D",
      gradeText: "arête aérienne esthétique, vues Mer de Glace, très fréquentée",
      description: "Très belle classique offrant des vues magnifiques sur la Mer de Glace. Itinéraire aérien, esthétique et rapidement en conditions.",
      c2cUrl: "https://www.camptocamp.org/routes/54075/fr/aiguille-du-moine-arete-s-classique",
      c2cId: "54075",
      track: [
        { lon: 6.91764, lat: 45.93154, altM: 1909 }, // Départ (village / parking)
        { lon: 6.94783, lat: 45.90985, altM: 2107 }, // Approche glacier
        { lon: 6.96049, lat: 45.91218, altM: 2853 }, // Pied arête S
        { lon: 6.96087, lat: 45.91370, altM: 3011 }, // Arête S bas
        { lon: 6.96109, lat: 45.91634, altM: 3417 }, // Sommet
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
      name: "Voie normale — Refuge du Requin",
      activity: "alpinisme",
      grade: "PD+",
      gradeText: "depuis refuge du Requin, arête SW, granit",
      description: "Voie normale de l'Aiguille du Plan accessible depuis le refuge du Requin. Ascension variée sur granit et neige.",
      c2cUrl: "https://www.camptocamp.org/routes/1561115",
      c2cId: "1561115",
      track: [{ lon: 6.885, lat: 45.885, altM: 2537 }, { lon: 6.864, lat: 45.879, altM: 3628 }],
    },
    {
      id: "traversee-midi-plan",
      name: "Traversée Midi – Plan",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "très bel itinéraire de montagne, abordable mais complet, très populaire",
      description: "Très bel itinéraire de montagne, abordable mais complet. Très populaire du fait de son accès évident depuis l'Aiguille du Midi.",
      c2cUrl: "https://www.camptocamp.org/routes/53804",
      c2cId: "53804",
      track: [
        { lon: 6.88781, lat: 45.87881, altM: 3781 }, // Départ Aiguille du Midi
        { lon: 6.89384, lat: 45.88006, altM: 3645 }, // Glacier du Plan (descente)
        { lon: 6.90131, lat: 45.88349, altM: 3459 }, // Col bas (minimum)
        { lon: 6.90479, lat: 45.88631, altM: 3555 }, // Col du Plan
        { lon: 6.90724, lat: 45.89174, altM: 3664 }, // Aiguille du Plan
      ],
    },
    {
      id: "arete-ryan",
      name: "Arête Ryan",
      activity: "escalade",
      grade: "D+",
      gradeText: "grande classique, approche délicate conditions sèches actuelles",
      description: "Grande classique devenue moins fréquentée en raison des conditions d'accès difficiles ces dernières années à cause du manque de neige.",
      c2cUrl: "https://www.camptocamp.org/routes/56752",
      c2cId: "56752",
      track: [{ lon: 6.911, lat: 45.893, altM: 2458 }, { lon: 6.911, lat: 45.893, altM: 3003 }],
    },
  ],

  // ==========================================================================
  // MONT MAUDIT — 45.852°N 6.871°E (4465m)
  // Tuiles : 1000_6535, 1000_6536, 1001_6536
  // ==========================================================================
  maudit: [
    {
      id: "maudit-kuffner",
      name: "Arête Kuffner",
      activity: "alpinisme",
      grade: "D",
      gradeText: "arête franco-italienne, 1200m D+, mixte élégant",
      description: "Grande arête reliant le Col Moore (face S) au sommet du Mont Maudit en traversant la frontière franco-italienne. Itinéraire d'une grande beauté sur terrain mixte, première réalisée par Kuffner en 1887.",
      c2cUrl: "https://www.camptocamp.org/routes/53791",
      c2cId: "53791",
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
  // AIGUILLE DE BIONNASSAY — 45.836°N 6.818°E (4052m)
  // Tuiles : 0996_6534, 0995_6534, 0995_6533, 0996_6533
  // ==========================================================================
  bionnassay: [
    {
      id: "arete-s-bionnassay",
      name: "Arête S (voie normale)",
      activity: "alpinisme",
      grade: "AD+",
      gradeText: "longue arête mixte aérienne, 3000m D+, grande course d'altitude",
      c2cUrl: "https://www.camptocamp.org/outings/1791088/fr/aiguille-de-bionnassay-arete-s-solo-a-la-journee",
      c2cId: "1791088",
      track: [],
    },
  ],

  // ==========================================================================
  // DÔMES DE MIAGE — 45.786°N 6.766°E (3673m)
  // Tuiles : 0995_6531, 0994_6531, 0994_6532, 0993_6530, 0993_6531, 0994_6530
  // ==========================================================================
  "domes-miage": [
    {
      id: "domes-miage-traversee",
      name: "Traversée classique",
      activity: "alpinisme",
      grade: "PD+",
      gradeText: "longue traversée glaciaire des 5 sommets, boucle depuis les Contamines",
      c2cUrl: "https://www.camptocamp.org/routes/53886/fr/domes-de-miage-traversee-classique",
      c2cId: "53886",
      track: [],
    },
  ],

  // ==========================================================================
  // DENT DU GÉANT — 45.862°N 6.983°E (4013m)
  // Tuiles : 1006_6537
  // ==========================================================================
  geant: [
    {
      id: "sw-face-by-the-burgener-slabs",
      name: "Voie normale — Burgener Slabs (face SW)",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "depuis refuge Torino, cordes fixes arête W, granit excellent",
      description: "Depuis le refuge Torino, traverser le glacier du Géant puis rejoindre la face SW par les Burgener Slabs. Cordes fixes sur le ressaut sommital. Grande classique.",
      c2cUrl: "https://www.camptocamp.org/routes/54431",
      c2cId: "54431",
      track: [{ lon: 6.952, lat: 45.862, altM: 3299 }, { lon: 6.952, lat: 45.862, altM: 3978 }],
    },
  ],

  // ==========================================================================
  // ARÊTE DE ROCHEFORT — 4001m
  // Tuiles : 1006_6537, 1006_6538, 1007_6537, 1007_6538
  // ==========================================================================
  rochefort: [
    {
      id: "aretes-de-rochefort-en-ar",
      name: "Traversée Rochefort — Grandes Jorasses",
      activity: "alpinisme",
      grade: "AD+",
      gradeText: "arête neigeuse aérienne, traversée Rochefort → Jorasses",
      description: "Grande traversée glaciaire et aérienne reliant le Dôme de Rochefort aux Grandes Jorasses par l'arête de Rochefort. Itinéraire d'une beauté rare avec vue plongeante sur la Vallée Blanche et les glaciers italiens.",
      c2cUrl: "https://www.camptocamp.org/outings/1802628/fr/traversee-rochefort-grandes-jorasses",
      c2cId: "1802628",
      track: [
        { lon: 6.93430, lat: 45.84741, altM: 3281 }, // Départ Rochefort
        { lon: 6.96000, lat: 45.86200, altM: 4202 }, // Point haut
        { lon: 6.98493, lat: 45.83228, altM: 1608 }, // Arrivée Jorasses
      ],
    },
  ],

  // ==========================================================================
  // TOUR RONDE — 45.848°N 6.869°E (3792m)
  // Tuiles : 1002_6535, 1003_6535
  // ==========================================================================
  "tour-ronde": [],

  // ==========================================================================
  // AIGUILLE DE TALÈFRE — 45.889°N 7.039°E (3730m)
  // Tuiles : 1009_6541, 1009_6542, 1010_6541, 1010_6542
  // ==========================================================================
  talefre: [],

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
      // Fallback : points-clés vérifiés via C2C API (GPX local public/routes/grepon-mer-de-glace.gpx prioritaire)
      track: [
        { lon: 6.9175, lat: 45.9317, altM: 1913 }, // Montenvers (C2C exact)
        { lon: 6.9177, lat: 45.9292, altM: 1490 }, // Pied des échelles — glacier
        { lon: 6.9202, lat: 45.9212, altM: 1635 }, // Mer de Glace — traverse vers SE
        { lon: 6.9231, lat: 45.9123, altM: 1750 }, // Glacier SE — vers rive Envers
        { lon: 6.9252, lat: 45.906, altM: 1820 }, // Pied moraines Envers
        { lon: 6.9275, lat: 45.9000, altM: 2493 }, // Refuge de l'Envers des Aiguilles (C2C exact)
        { lon: 6.9245, lat: 45.9046, altM: 2822 }, // Tour Rouge (C2C exact)
        { lon: 6.9218, lat: 45.9056, altM: 2830 }, // Contournement Tour Rouge N → cirque
        { lon: 6.9215, lat: 45.9048, altM: 2790 }, // Rimaye — bergschrund
        { lon: 6.9209, lat: 45.9068, altM: 3010 }, // Face rocheuse — section NNW
        { lon: 6.9200, lat: 45.9096, altM: 3275 }, // Sommet section NNW — traverse gauche
        { lon: 6.9198, lat: 45.9062, altM: 3340 }, // Rappel 12 m — pied éperon E
        { lon: 6.9194, lat: 45.9040, altM: 3393 }, // Terrasse des Amis
        { lon: 6.9193, lat: 45.9029, altM: 3422 }, // Brèche Balfour
        { lon: 6.9192, lat: 45.9025, altM: 3482 }, // Sommet Aiguille du Grépon (C2C exact)
      ],
    },
    {
      id: "grepon-charmoz-grepon",
      name: "Traversée Charmoz - Grépon",
      activity: "alpinisme",
      grade: "TD",
      gradeText: "rocher 5c, traversée classique, 1500m D+",
      description: "Grande traversée reliant les Grands Charmoz au Grépon par l'arête des Aiguilles de Chamonix. Itinéraire engagé sur un granit exceptionnel, avec passages en rappel entre les différents sommets.",
      c2cUrl: "https://www.camptocamp.org/routes/53905/fr/grepon-traversee-charmoz-grepon",
      track: [
        { lon: 6.90652, lat: 45.90690, altM: 2539 }, // Départ Montenvers
        { lon: 6.89800, lat: 45.91200, altM: 3000 }, // Grands Charmoz
        { lon: 6.91920, lat: 45.90250, altM: 3486 }, // Sommet Grépon
        { lon: 6.87688, lat: 45.92332, altM: 1044 }, // Arrivée Chamonix
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
      track: [
        { lon: 6.88789, lat: 45.87846, altM: 3724 }, // Aiguille du Plan (départ S)
        { lon: 6.88700, lat: 45.88400, altM: 3500 }, // Crête des aiguilles
        { lon: 6.88600, lat: 45.89200, altM: 3200 }, // Aiguilles centrales
        { lon: 6.88510, lat: 45.90163, altM: 2222 }, // Aiguille de l'M (arrivée N)
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
      id: "greben-jardin",
      name: "Arête du Jardin",
      activity: "alpinisme",
      grade: "D",
      gradeText: "arête mixte rocher/glace, 1200m de D+, depuis refuge Couvercle",
      description: "Longue arête mixte par l'Aiguille du Jardin, itinéraire esthétique et engagé sur le flanc nord-est de la Verte. Depuis le refuge du Couvercle, remonter sous le couloir Whymper jusqu'au col de l'Aiguille Verte, puis suivre l'arête du Jardin jusqu'au sommet.",
      c2cUrl: "https://www.camptocamp.org/routes/55897",
      c2cId: "55897",
      track: [{ lon: 6.973, lat: 45.935, altM: 2707 }, { lon: 6.973, lat: 45.935, altM: 4089 }],
    },
    {
      id: "greben-moine",
      name: "Arête du Moine",
      activity: "alpinisme",
      grade: "AD+",
      gradeText: "arête du Moine vers Verte, aussi utilisée en descente quand Whymper hors conditions",
      description: "Magnifique course de montagne, approche de l'un des sommets les plus convoités des Alpes. Sert également d'itinéraire de descente quand le couloir Whymper n'est plus en bonnes conditions.",
      c2cUrl: "https://www.camptocamp.org/routes/56802",
      c2cId: "56802",
      track: [{ lon: 6.970, lat: 45.935, altM: 2683 }, { lon: 6.970, lat: 45.935, altM: 4081 }],
    },
    {
      id: "couloir-couturier",
      name: "Couloir Couturier",
      activity: "ski",
      grade: "D",
      gradeText: "magnifique couloir glaciaire, accès au sommet de la Verte, très fréquenté",
      description: "Magnifique couloir glaciaire, l'un des plus beaux pour accéder au prestigieux sommet de la Verte et également l'un des plus fréquentés. Couloir évident se trouvant derrière le triangle rocheux.",
      c2cUrl: "https://www.camptocamp.org/routes/54983",
      c2cId: "54983",
      track: [{ lon: 6.970, lat: 45.935, altM: 2706 }, { lon: 6.970, lat: 45.935, altM: 4063 }],
    },
  ],

  // ==========================================================================
  // MONT BLANC — 45.8327°N 6.8651°E 4808m
  // ==========================================================================
  "mont-blanc": [
    {
      id: "traversee-3-monts",
      name: "Traversée des 3 Monts",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "Tacul → Maudit → Mont Blanc, grande classique glaciaire depuis l'Aiguille du Midi",
      description: "Grande classique glaciaire reliant l'Aiguille du Midi au sommet du Mont Blanc via le Mont Blanc du Tacul (4248m) et le Mont Maudit (4465m). Itinéraire entièrement sur glace et neige, plus engagé que la voie normale.",
      c2cUrl: "https://www.camptocamp.org/routes/53788/fr/mont-blanc-traversee-des-3-monts",
      c2cId: "53788",
      track: [
        { lon: 6.88825, lat: 45.87894, altM: 3729 }, // Aiguille du Midi
        { lon: 6.87600, lat: 45.86200, altM: 4248 }, // Mont Blanc du Tacul
        { lon: 6.87034, lat: 45.85829, altM: 4465 }, // Mont Maudit
        { lon: 6.86486, lat: 45.83270, altM: 4814 }, // Sommet Mont Blanc
      ],
    },
  ],

  // ==========================================================================
  // GRANDES JORASSES — 45.8993°N 7.0596°E (Pt Walker 4208m)
  // ==========================================================================
  jorasses: [
    {
      id: "jorasses-normale",
      name: "Voie normale — Pt Walker (face SW)",
      activity: "alpinisme",
      grade: "PD",
      gradeText: "face SW côté italien — neige et glace modérés",
      description: "Voie normale de la Pointe Walker des Grandes Jorasses par le versant SW depuis le refuge Boccalatte. Itinéraire classique sur arête neigeuse, bien moins engagé que la face nord.",
      c2cUrl: "https://www.camptocamp.org/routes/53890/fr/grandes-jorasses-pointe-walker-face-sw-voie-normale-",
      c2cId: "53890",
      track: [
        { lon: 6.98374, lat: 45.84387, altM: 2040 }, // Refuge Boccalatte (côté italien)
        { lon: 6.98500, lat: 45.85200, altM: 3200 }, // Glacier SW
        { lon: 6.98400, lat: 45.85900, altM: 3800 }, // Arête sommitale
        { lon: 6.98276, lat: 45.86574, altM: 4208 }, // Pointe Walker
      ],
    },
    {
      id: "espolon-walker",
      name: "Éperon Walker",
      activity: "alpinisme",
      grade: "ED-",
      gradeText: "voie mythique des années 1930, itinéraire classique face nord",
      description: "L'Éperon Walker est l'une des voies mythiques des années 1930. L'itinéraire est devenu une classique, parcourue de nombreuses fois en été.",
      c2cUrl: "https://www.camptocamp.org/routes/55210",
      c2cId: "55210",
      track: [
        { lon: 6.92181, lat: 45.92681, altM: 1790 }, // Départ Chamonix
        { lon: 6.97000, lat: 45.87000, altM: 3000 }, // Pied face nord
        { lon: 6.97518, lat: 45.82541, altM: 4058 }, // Pointe Walker
      ],
    },
    {
      id: "le-linceul",
      name: "Le Linceul",
      activity: "alpinisme",
      grade: "TD-",
      gradeText: "itinéraire mythique, rarement en très bonnes conditions",
      description: "Itinéraire mythique et rarement en très bonnes conditions.",
      c2cUrl: "https://www.camptocamp.org/routes/57995",
      c2cId: "57995",
      track: [{ lon: 6.989, lat: 45.868, altM: 3101 }, { lon: 6.989, lat: 45.868, altM: 4193 }],
    },
    {
      id: "aretes-de-rochefort-en-ar",
      name: "Traversée Rochefort — Grandes Jorasses",
      activity: "alpinisme",
      grade: "AD+",
      gradeText: "arête neigeuse aérienne, traversée Rochefort → Jorasses",
      description: "Grande traversée glaciaire et aérienne reliant le Dôme de Rochefort aux Grandes Jorasses par l'arête de Rochefort. Itinéraire d'une beauté rare avec vue plongeante sur la Vallée Blanche et les glaciers italiens.",
      c2cUrl: "https://www.camptocamp.org/outings/1802628/fr/traversee-rochefort-grandes-jorasses",
      c2cId: "1802628",
      track: [
        { lon: 6.93430, lat: 45.84741, altM: 3281 }, // Départ Rochefort
        { lon: 6.96000, lat: 45.86200, altM: 4202 }, // Point haut
        { lon: 6.98493, lat: 45.83228, altM: 1608 }, // Arrivée Jorasses
      ],
    },
  ],

  // ==========================================================================
  // MONT BLANC DU TACUL — 45.8620°N 6.8820°E (4248m)
  // ==========================================================================
  tacul: [
    {
      id: "couloir-gervasutti",
      name: "Couloir Gervasutti",
      activity: "ski",
      grade: "D-",
      gradeText: "grand couloir visible depuis la Vallée Blanche, délaissé au profit du Jager",
      description: "Le grand couloir évident et bien visible depuis le début de la Vallée Blanche. Autrefois classique, il est actuellement délaissé au profit de son voisin, le Jager.",
      c2cUrl: "https://www.camptocamp.org/outings/528540/it/mont-blanc-du-tacul-couloir-gervasutti",
      c2cId: "528540",
      track: [
        { lon: 6.88800, lat: 45.87200, altM: 3719 }, // Départ Vallée Blanche
        { lon: 6.88500, lat: 45.86500, altM: 3900 }, // Pied du couloir
        { lon: 6.88300, lat: 45.86200, altM: 4221 }, // Sommet Tacul
      ],
    },
    {
      id: "supercouloir",
      name: "Supercouloir",
      activity: "alpinisme",
      grade: "ED-",
      gradeText: "couloir très long entre pilier Gervasutti et pilier des Trois Pointes",
      description: "L'une des plus belles courses de ce type dans le massif du Mont Blanc. Sépare le pilier Gervasutti (à droite) du pilier des Trois Pointes (à gauche).",
      c2cUrl: "https://www.camptocamp.org/outings/1401764/fr/mont-blanc-du-tacul-supercouloir",
      c2cId: "1401764",
      track: [{ lon: 6.887, lat: 45.858, altM: 3483 }, { lon: 6.887, lat: 45.858, altM: 4156 }],
    },
    {
      id: "contamine-negri",
      name: "Contamine – Négri",
      activity: "ski",
      grade: "AD+",
      gradeText: "triangle du Tacul, plus facile des voies Contamine, sous grosse barre de séracs",
      description: "La plus facile des voies Contamine du Triangle, mais itinéraire peu recommandé : on est sous une grosse barre de séracs sur tout l'itinéraire.",
      c2cUrl: "https://www.camptocamp.org/outings/1534902/fr/mont-blanc-du-tacul-solo-via-contamine-negri",
      c2cId: "1534902",
      track: [
        { lon: 6.88813, lat: 45.87890, altM: 3813 }, // Départ Vallée Blanche
        { lon: 6.88500, lat: 45.86500, altM: 4000 }, // Triangle du Tacul
        { lon: 6.88200, lat: 45.86200, altM: 4285 }, // Sommet Tacul
      ],
    },
    {
      id: "arete-du-diable",
      name: "Arête du Diable",
      activity: "alpinisme",
      grade: "D+",
      gradeText: "depuis Col du Diable, Corne, Chaubert, Médiane, Carmen, Isolée",
      description: "Course consistant à monter au Mont Blanc du Tacul depuis le Col du Diable, en passant par la Corne du Diable, la Pointe Chaubert, la Pointe Médiane, la Pointe Carmen et l'Isolée.",
      c2cUrl: "https://www.camptocamp.org/routes/54098",
      c2cId: "54098",
      track: [{ lon: 6.888, lat: 45.857, altM: 3392 }, { lon: 6.888, lat: 45.857, altM: 4221 }],
    },
    {
      id: "contamine-grisolle",
      name: "Contamine – Grisolle",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "triangle du Tacul, depuis Col du Midi et refuge des Cosmiques",
      description: "Descendre de l'Aiguille du Midi et rejoindre le Col du Midi au pied du refuge des Cosmiques, puis se diriger au SSE pour rejoindre le Triangle du Tacul.",
      c2cUrl: "https://www.camptocamp.org/routes/54062",
      c2cId: "54062",
      track: [{ lon: 6.887, lat: 45.860, altM: 3518 }, { lon: 6.887, lat: 45.860, altM: 4085 }],
    },
    {
      id: "goulotte-chere",
      name: "Goulotte Chéré",
      activity: "alpinisme",
      grade: "D",
      gradeText: "depuis téléphérique Aiguille du Midi, accès facile",
      description: "Le Mont Blanc du Tacul est facilement accessible depuis le téléphérique de l'Aiguille du Midi, ce qui en fait une course très fréquentée.",
      c2cUrl: "https://www.camptocamp.org/outings/1539989/fr/triangle-du-tacul-goulotte-chere",
      c2cId: "1539989",
      track: [
        { lon: 6.88800, lat: 45.86800, altM: 3628 }, // Pied de la goulotte
        { lon: 6.88600, lat: 45.86400, altM: 3810 }, // Sortie goulotte
      ],
    },
    {
      id: "lifting-du-roi",
      name: "Lifting du Roi",
      activity: "escalade",
      grade: "D+",
      gradeText: "face SE du Roi du Siam, accessible du printemps à l'automne",
      description: "La voie est tracée sur la face SE du Roi du Siam, ce qui la rend praticable du printemps à l'automne.",
      c2cUrl: "https://www.camptocamp.org/outings/1811456/fr/roi-de-siam-lifting-du-roi",
      c2cId: "1811456",
      track: [
        { lon: 6.90200, lat: 45.85400, altM: 3372 }, // Pied de la voie
        { lon: 6.90200, lat: 45.85400, altM: 3589 }, // Sommet Roi du Siam
      ],
    },
  ],

  // ==========================================================================
  // AIGUILLE DES DRUS — 45.9310°N 6.9580°E (Petit Dru 3754m)
  // ==========================================================================
  drus: [
    {
      id: "pilier-s-voie-contamine",
      name: "Grand Dru — Pilier S Voie Contamine",
      activity: "escalade",
      grade: "TD+",
      gradeText: "depuis refuge de la Charpoua, dalles IV en diagonale",
      description: "Du refuge de la Charpoua, gagner la large vire à la base du pilier S. Dalles de IV en diagonale vers la gauche jusqu'à la base du premier ressaut.",
      c2cUrl: "https://www.camptocamp.org/outings/1143835/fr/grand-dru-pilier-s-voie-contamine-video-",
      c2cId: "1143835",
      track: [
        { lon: 6.92096, lat: 45.92787, altM: 1913 }, // Départ Montenvers
        { lon: 6.95700, lat: 45.93300, altM: 2833 }, // Refuge de la Charpoua
        { lon: 6.95700, lat: 45.93300, altM: 3619 }, // Sommet Grand Dru
      ],
    },
    {
      id: "flammes-de-pierre-drus",
      name: "Arête des Flammes de Pierre + Traversée des Drus",
      activity: "alpinisme",
      grade: "D+",
      gradeText: "arête des Flammes de Pierre puis traversée des Drus",
      description: "Enchaînement de l'arête des Flammes de Pierre et de la traversée des Drus, itinéraire aérien et varié sur l'un des massifs rocheux les plus impressionnants du Mont-Blanc.",
      c2cUrl: "https://www.camptocamp.org/outings/1784894/fr/arete-des-flammes-de-pierre-traversee-des-drus",
      c2cId: "1784894",
      track: [
        { lon: 6.95800, lat: 45.93300, altM: 2806 }, // Départ
        { lon: 6.95800, lat: 45.93100, altM: 3748 }, // Sommet Drus
        { lon: 6.95800, lat: 45.93300, altM: 1721 }, // Arrivée
      ],
    },
    {
      id: "traversee-des-drus",
      name: "Traversée des Drus",
      activity: "alpinisme",
      grade: "D",
      gradeText: "classique incontournable, efficience et expérience requises pour la Vierge",
      description: "Classique incontournable qui demande efficience et expérience pour gagner sereinement la Vierge.",
      c2cUrl: "https://www.camptocamp.org/outings/1135533/fr/traversee-des-drus-video-",
      c2cId: "1135533",
      track: [{ lon: 6.956, lat: 45.933, altM: 2830 }, { lon: 6.956, lat: 45.933, altM: 3690 }],
    },
  ],

  // ==========================================================================
  // AIGUILLE DU MIDI — 45.8788°N 6.8873°E (3842m)
  // ==========================================================================
  midi: [
    {
      id: "midi-rebuffat-baquet-1",
      name: "Face S — Voie Rébuffat-Baquet",
      activity: "escalade",
      grade: "D",
      gradeText: "face sud, granite d'exception, vue plongeante sur Chamonix",
      description: "Grande classique de la face sud de l'Aiguille du Midi, ouverte par Gaston Rébuffat et Maurice Baquet. Escalade sur granite d'exception avec vue plongeante sur Chamonix.",
      c2cUrl: "https://www.camptocamp.org/outings/1792938/fr/aiguille-du-midi-face-s-voie-rebuffat-baquet",
      c2cId: "1792938",
      track: [{ lon: 6.887, lat: 45.879, altM: 3617 }, { lon: 6.887, lat: 45.879, altM: 3797 }],
    },
    {
      id: "aresta-de-cosmiques-1",
      name: "Arête des Cosmiques",
      activity: "alpinisme",
      grade: "AD",
      gradeText: "arête mixte classique, 200m de D+, technique et exposée",
      description: "Arête emblématique de l'Aiguille du Midi, accessible depuis le téléphérique. Grande classique pour les cordées souhaitant s'initier à l'alpinisme de haute montagne sur un itinéraire varié.",
      c2cUrl: "https://www.camptocamp.org/outings/1879804/fr/4eme-arete-des-cosmiques",
      c2cId: "1879804",
      track: [{ lon: 6.887, lat: 45.878, altM: 3547 }, { lon: 6.887, lat: 45.878, altM: 3784 }],
    },
    {
      id: "eperon-frendo",
      name: "Éperon Frendo",
      activity: "alpinisme",
      grade: "D",
      gradeText: "éperon nord, 1000m de D+, mixte classique",
      description: "L'Éperon Frendo est une grande classique de l'alpinisme sur la face nord de l'Aiguille du Plan. Itinéraire mixte varié et engagé, accessible depuis l'Aiguille du Midi.",
      c2cUrl: "https://www.camptocamp.org/outings/1782678/fr/aiguille-du-midi-eperon-frendo",
      c2cId: "1782678",
      track: [{ lon: 6.864, lat: 45.906, altM: 2347 }, { lon: 6.864, lat: 45.879, altM: 3770 }],
    },
    {
      id: "mallory-porter",
      name: "Mallory – Porter rectifiée",
      activity: "alpinisme",
      grade: "TD",
      gradeText: "éperon N de l'Aiguille du Midi, rocher+mixte, 1000m D+",
      description: "Grande classique du massif, l'éperon Mallory-Porter gravit la face nord de l'Aiguille du Midi depuis la Mer de Glace. Itinéraire varié sur granit et mixte, avec une exposition soutenue.",
      c2cUrl: "https://www.camptocamp.org/routes/54000/fr/aiguille-du-midi-eperon-mallory-porter",
      c2cId: "54000",
      // Trace GPX auto-générée : public/routes/mallory-porter.gpx (fetch-route 54000 mallory-porter)
      track: [
        { lon: 6.8873, lat: 45.8930, altM: 2317 }, // Plan de l'Aiguille
        { lon: 6.8870, lat: 45.8890, altM: 2700 }, // Approche pied de l'éperon
        { lon: 6.8871, lat: 45.8860, altM: 3100 }, // Bas de l'éperon N
        { lon: 6.8872, lat: 45.8830, altM: 3400 }, // Mi-éperon
        { lon: 6.8873, lat: 45.8810, altM: 3650 }, // Haut de l'éperon
        { lon: 6.8873, lat: 45.8788, altM: 3842 }, // Sommet Aiguille du Midi
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

// ---------------------------------------------------------------------------
// Sommets du massif du Mont-Blanc
// ---------------------------------------------------------------------------
export const MONT_BLANC_SUMMIT_IDS = new Set<string>([
  "tour", "chardonnet", "droites", "courtes", "moine", "plan",
  "maudit", "bionnassay", "domes-miage", "geant", "rochefort",
  "tour-ronde", "talefre", "grepon", "chamonix-needles", "verte",
  "mont-blanc", "jorasses", "tacul", "drus", "midi",
]);

// ---------------------------------------------------------------------------
// Voies disposant d'un fichier GPX local (tracé GPS réel)
// ---------------------------------------------------------------------------
export const GPX_ROUTE_IDS = new Set<string>([
  // Tour
  "sommet-s-par-le-col-superieur-du-tour", "arete-de-la-table", "couloir-de-la-table",
  // Chardonnet
  "chardonnet-forbes", "chardonnet-normale", "eperon-migot",
  // Droites
  "droites-eperon-oriental", "couloir-lagarde",
  // Courtes
  "courtes-voie-normale", "courtes-voie-des-suisses", "courtes-voie-autrichiens",
  // Moine
  "moine-arete-s", "arete-s-classique",
  // Plan
  "traversee-midi-plan", "arete-ryan",
  // Maudit
  "maudit-kuffner",
  // Bionnassay
  "arete-s-bionnassay",
  // Dômes de Miage
  "domes-miage-traversee",
  // Géant
  "sw-face-by-the-burgener-slabs",
  // Rochefort
  "aretes-de-rochefort-en-ar",
  // Grépon
  "grepon-mer-de-glace", "grepon-charmoz-grepon",
  // Verte
  "verte-whymper", "greben-jardin", "greben-moine", "couloir-couturier",
  // Mont-Blanc
  "traversee-3-monts",
  // Jorasses
  "espolon-walker", "le-linceul",
  // Tacul
  "couloir-gervasutti", "supercouloir", "contamine-negri",
  "arete-du-diable", "contamine-grisolle", "goulotte-chere", "lifting-du-roi",
  // Drus
  "pilier-s-voie-contamine", "flammes-de-pierre-drus", "traversee-des-drus",
  // Midi
  "midi-rebuffat-baquet-1", "aresta-de-cosmiques-1", "eperon-frendo", "mallory-porter",
]);
