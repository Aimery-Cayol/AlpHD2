// =============================================================================
// data/climbingRoutes.ts — Voies d'alpinisme classiques du massif du Mont-Blanc
// Tracés WGS84 simplifiés (6–12 waypoints) — suffisants pour le rendu 3D
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
};
