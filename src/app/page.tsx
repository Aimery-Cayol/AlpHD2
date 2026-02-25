"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Map as MapIcon,
  X,
  HelpCircle,
  Compass as CompassIcon,
  MousePointer2,
  Move,
  Info,
  Mountain,
  ZoomIn,
  AlertTriangle,
  Sun,
  Grid3X3,
  ExternalLink,
  Search,
  Menu,
  Ruler,
  ArrowUpDown,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useAppContext } from "@/contexts/AppContext";
import Link from "next/link";
import type { TileModel, TileData } from "@/types/models";
import type { TileCoord } from "@/utils/fileUtils";

const ThreeScene = dynamic(() => import("@/components/three/ThreeScene"), { ssr: false });

// --- Helper pour construire un TileCoord padded depuis des km entiers ---
function toCoord(x: number, y: number): TileCoord {
  return `${x.toString().padStart(4, "0")}_${y.toString().padStart(4, "0")}` as TileCoord;
}

// --- LOGO OFFICIEL CAMPTOCAMP ---
const CamptocampLogo = () => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 85L50 15L85 85H15Z" fill="#D9534F" />
    <path d="M45 55L55 55L50 45L45 55Z" fill="white" />
    <path d="M35 75L65 75L50 50L35 75Z" fill="white" />
  </svg>
);

// --- MODAL D'AIDE ---
function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900">Aide à la navigation 3D</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2 text-blue-600"><MousePointer2 className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Rotation</span></div>
            <p className="text-xs text-slate-600">Clic gauche maintenu ou <strong>MAJ + Clic</strong> pour pivoter.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2 text-blue-600"><ZoomIn className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Zoom</span></div>
            <p className="text-xs text-slate-600">Utilisez la <strong>molette</strong> de la souris.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2 text-orange-500"><Sun className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Lumière</span></div>
            <p className="text-xs text-slate-600">Ajustez la position du soleil dans <strong>Azimuth</strong>.</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-3 mb-2 text-orange-600"><AlertTriangle className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Performance</span></div>
            <p className="text-xs text-orange-700 font-medium">L'accumulation de dalles peut ralentir l'affichage.</p>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Continuer</button>
      </div>
    </div>
  );
}

const MOUNTAIN_TREE = [
  {
    id: "massif-mont-blanc",
    name: "Massif du Mont-Blanc",
    children: [
      {
        id: "secteur-tour-argentiere",
        name: "1. Secteur Tour - Argentière",
        children: [
          { id: "tour", name: "Aiguille du Tour (3540m)", altitude: "3540m", c2c: "https://www.camptocamp.org/waypoints/37508/fr/aiguille-du-tour", firstAscent: "1864 — J.-J. Maquignaz, A. Maquignaz et J.-P. Maquignaz", description: "Sommet très classique et accessible du massif du Mont-Blanc, idéal pour une première haute montagne. Son panorama depuis la cime offre une vue exceptionnelle sur le bassin d'Argentière, la mer de Glace et les sommets environnants.", dalles: [{ path: "meshes/1010_6552_11.drc", x: 1010, y: 6552 }] },
          { id: "chardonnet", name: "Aiguille du Chardonnet (3824m)", altitude: "3824m", c2c: "https://www.camptocamp.org/waypoints/37433/fr/aiguille-du-chardonnet", firstAscent: "1865 — Edward Whymper avec les guides Michel Croz et Christian Almer", description: "L'une des plus belles courses mixtes du massif. Son arête Forbes, longue arête neigeuse et aérienne, est une classique de toute première catégorie. Le versant nord offre des itinéraires glaciaires exigeants.", dalles: [{ path: "meshes/1009_6549_11.drc", x: 1009, y: 6549 }, { path: "meshes/1009_6550_11.drc", x: 1009, y: 6550 }, { path: "meshes/1010_6549_11.drc", x: 1010, y: 6549 }, { path: "meshes/1010_6550_11.drc", x: 1010, y: 6550 }, { path: "meshes/1011_6550_11.drc", x: 1011, y: 6550 }] },
        ],
      },
      {
        id: "secteur-verte-drus",
        name: "2. Secteur Verte - Drus - Droites",
        children: [
          { id: "verte", name: "Aiguille Verte (4122m)", altitude: "4122m", c2c: "https://www.camptocamp.org/waypoints/37435/fr/aiguille-verte", firstAscent: "1865 — Edward Whymper avec les guides Michel Croz, Christian Almer et Franz Biener, par le couloir Whymper", description: "L'Aiguille Verte est un sommet mythique du massif du Mont-Blanc. Avant la Verte on est alpiniste, après la Verte on devient montagnard. Son ascension par le couloir Whymper ou l'arête des Grands Montets constitue une référence en alpinisme de haute montagne.", waypoints: [{name: "Couloir Whymper", type: "Couloir"}, {name: "Arête des Grands Montets", type: "Arête"}], dalles: [{ path: "meshes/1006_6545_11.drc", x: 1006, y: 6545 }, { path: "meshes/1006_6546_11.drc", x: 1006, y: 6546 }, { path: "meshes/1006_6547_11.drc", x: 1006, y: 6547 }, { path: "meshes/1007_6545_11.drc", x: 1007, y: 6545 }, { path: "meshes/1007_6546_11.drc", x: 1007, y: 6546 }, { path: "meshes/1007_6547_11.drc", x: 1007, y: 6547 }, { path: "meshes/1008_6546_11.drc", x: 1008, y: 6546 }] },
          { id: "drus", name: "Les Drus (3754m)", altitude: "3754m", c2c: "https://www.camptocamp.org/waypoints/221771/fr/les-drus", firstAscent: "Grand Dru 1878 — Clinton Dent et J.-W. Hartley avec les guides Alexander Burgener et Kaspar Maurer ; Petit Dru 1879 — J. Charlet-Straton, P. Payot et F. Folliguet", description: "Les Drus sont deux aiguilles jumelles d'une verticalité saisissante dominant Chamonix. La face ouest du Petit Dru, avec le légendaire Pilier Bonatti gravi en solitaire en 1955, est l'une des grandes faces rocheuses des Alpes. Un éboulement massif en 2005 en a profondément remodélé la silhouette.", youtube: "https://www.youtube.com/watch?v=nYQ5NgP3GGw", dalles: [{ path: "meshes/1006_6545_11.drc", x: 1006, y: 6545 }] },
          { id: "droites", name: "Les Droites (4001m)", altitude: "4001m", c2c: "https://www.camptocamp.org/waypoints/37434/fr/les-droites", firstAscent: "1876 — A. Adams-Reilly et A.W. Moore avec les guides Johann Jaun et Ulrich Almer", description: "Les Droites forment avec les Courtes et l'Aiguille Verte la trilogie des grands sommets du bassin d'Argentière. Leur face nord constitue un mur de glace et de roc de 1 000 m, parmi les plus redoutables des Alpes.", dalles: [{ path: "meshes/1008_6545_11.drc", x: 1008, y: 6545 }, { path: "meshes/1008_6546_11.drc", x: 1008, y: 6546 }, { path: "meshes/1009_6545_11.drc", x: 1009, y: 6545 }, { path: "meshes/1009_6546_11.drc", x: 1009, y: 6546 }] },
          { id: "courtes", name: "Les Courtes (3856m)", altitude: "3856m", c2c: "https://www.camptocamp.org/waypoints/37432/fr/les-courtes", firstAscent: "1876 — A. Adams-Reilly et A.W. Moore avec les guides Johann Jaun et Ulrich Almer", description: "Les Courtes se distinguent par leur face nord d'une rectitude parfaite, classique de glace PD+ à AD. Situées entre le glacier d'Argentière et le glacier du Tour Noir, elles offrent une course glaciaire élégante et engagée.", dalles: [{ path: "meshes/1009_6544_11.drc", x: 1009, y: 6544 }, { path: "meshes/1009_6545_11.drc", x: 1009, y: 6545 }, { path: "meshes/1010_6544_11.drc", x: 1010, y: 6544 }, { path: "meshes/1010_6545_11.drc", x: 1010, y: 6545 }] },
          { id: "moine", name: "Aiguille du Moine (3412m)", altitude: "3412m", c2c: "https://www.camptocamp.org/waypoints/37505/fr/aiguille-du-moine", firstAscent: "1881 — C.E. Eaton avec les guides Michel et Jean Simond", description: "L'Aiguille du Moine est une pyramide rocheuse élégante dominant le glacier de Talèfre et d'Argentière. Sa voie normale par l'arête sud est une classique en rocher offrant de belles vues sur l'Aiguille Verte et les Drus.", dalles: [{ path: "meshes/1006_6543_11.drc", x: 1006, y: 6543 }, { path: "meshes/1006_6544_11.drc", x: 1006, y: 6544 }, { path: "meshes/1007_6543_11.drc", x: 1007, y: 6543 }, { path: "meshes/1007_6544_11.drc", x: 1007, y: 6544 }] },
        ],
      },
      {
        id: "secteur-aiguilles-chamonix",
        name: "3. Secteur Aiguilles de Chamonix",
        children: [
          { id: "midi", name: "Aiguille du Midi (3842m)", altitude: "3842m", c2c: "https://www.camptocamp.org/waypoints/37402/fr/aiguille-du-midi", firstAscent: "1818 — les frères Joseph-Marie et Jacques-Michel Balmat", description: "L'Aiguille du Midi est le belvédère emblématique de Chamonix, reliée à la vallée par le téléphérique le plus haut d'Europe. Son arête sommitale, exposée et aérienne, conduit à 3 842 m avec une vue panoramique à 360° sur le Mont-Blanc, la Vallée Blanche et les Grandes Jorasses.", dalles: [{ path: "meshes/1000_6539_11.drc", x: 1000, y: 6539 }, { path: "meshes/1001_6539_11.drc", x: 1001, y: 6539 }, { path: "meshes/1001_6540_11.drc", x: 1001, y: 6540 }] },
          { id: "plan", name: "Aiguille du Plan (3673m)", altitude: "3673m", c2c: "https://www.camptocamp.org/waypoints/37427/fr/aiguille-du-plan", firstAscent: "1871 — G.E. Foster avec les guides Melchior et Andreas Imseng", description: "L'Aiguille du Plan est une des aiguilles de Chamonix les plus prisées des alpinistes confirmés. Son versant nord présente plusieurs voies de glace et mixte de haut niveau, dont le couloir des Frendo. La vue depuis la cime sur la Vallée Blanche et le Mont-Blanc est saisissante.", dalles: [{ path: "meshes/1002_6540_11.drc", x: 1002, y: 6540 }, { path: "meshes/1002_6541_11.drc", x: 1002, y: 6541 }, { path: "meshes/1003_6540_11.drc", x: 1003, y: 6540 }, { path: "meshes/1003_6541_11.drc", x: 1003, y: 6541 }] },
          { id: "chamonix-needles", name: "Aiguilles de Chamonix", altitude: "3400m-3842m", dalles: [{ path: "meshes/1002_6541_11.drc", x: 1002, y: 6541 }, { path: "meshes/1002_6542_11.drc", x: 1002, y: 6542 }, { path: "meshes/1003_6541_11.drc", x: 1003, y: 6541 }, { path: "meshes/1003_6542_11.drc", x: 1003, y: 6542 }, { path: "meshes/1003_6543_11.drc", x: 1003, y: 6543 }, { path: "meshes/1004_6542_11.drc", x: 1004, y: 6542 }] },
        ],
      },
      {
        id: "secteur-mont-blanc",
        name: "4. Secteur Mont-Blanc",
        children: [
          { id: "mont-blanc", name: "Mont Blanc (4810m)", altitude: "4810m", c2c: "https://www.camptocamp.org/waypoints/37399/fr/mont-blanc", firstAscent: "8 août 1786 — Jacques Balmat et le Dr Michel-Gabriel Paccard", description: "Le Mont Blanc est le toit de l'Europe occidentale et l'une des montagnes les plus emblématiques du monde. Son ascension par la voie normale des Grands Mulets ou du Goûter est le rêve de milliers d'alpinistes chaque année. Sa cime, à 4 810 m, offre un panorama unique sur les Alpes.", dalles: [{ path: "meshes/0999_6533_11.drc", x: 999, y: 6533 }, { path: "meshes/0999_6534_11.drc", x: 999, y: 6534 }, { path: "meshes/1000_6533_11.drc", x: 1000, y: 6533 }, { path: "meshes/1000_6534_11.drc", x: 1000, y: 6534 }] },
          { id: "tacul", name: "Mont Blanc du Tacul (4248m)", altitude: "4248m", c2c: "https://www.camptocamp.org/waypoints/37400/fr/mont-blanc-du-tacul", firstAscent: "1855 — Charles Hudson et C.E. Mathews avec les guides Balmat", description: "Le Mont Blanc du Tacul est un sommet incontournable sur la voie du Mont Blanc par les Trois Monts. Ses faces nord et est abritent de nombreuses voies de glace et mixte de haute difficulté, dont la célèbre voie des Arêtes du Diable sur les Aiguilles du Diable.", waypoints: [{name: "Pilier Gervasutti", type: "Sommet"}, {name: "Aiguilles du Diable", type: "Crête"}], dalles: [{ path: "meshes/1002_6536_11.drc", x: 1002, y: 6536 }, { path: "meshes/1002_6537_11.drc", x: 1002, y: 6537 }, { path: "meshes/1001_6536_11.drc", x: 1001, y: 6536 }, { path: "meshes/1001_6537_11.drc", x: 1001, y: 6537 }] },
          { id: "maudit", name: "Mont Maudit (4465m)", altitude: "4465m", c2c: "https://www.camptocamp.org/waypoints/37401/fr/mont-maudit", firstAscent: "1878 — W.E. Davidson avec les guides J.-P. Cachat et A. Simond", description: "Le Mont Maudit, troisième plus haut sommet de France, est une étape souvent boudée mais indispensable sur la traversée des Trois Monts. Son arête reliant le Mont Blanc du Tacul est une classique glaciaire exposée aux séracs de la face nord.", dalles: [{ path: "meshes/1000_6535_11.drc", x: 1000, y: 6535 }, { path: "meshes/1000_6536_11.drc", x: 1000, y: 6536 }, { path: "meshes/1001_6536_11.drc", x: 1001, y: 6536 }] },
          { id: "dome-gouter", name: "Dôme du Goûter (4304m)", altitude: "4304m", c2c: "https://www.camptocamp.org/waypoints/37403/fr/dome-du-gouter", firstAscent: "1784 — Marie Paradis, première femme à atteindre un sommet alpin majeur ; voie normale du côté de l'Aiguille du Goûter établie dès 1786", description: "Étape incontournable sur la voie normale du Mont-Blanc par le refuge du Goûter. Son vaste dôme neigeux à 4 304 m marque la frontière franco-italienne et offre un panorama exceptionnel sur le massif. On y distingue clairement le tracé de la voie des Bosses menant au sommet.", dalles: [{ path: "meshes/0997_6534_11.drc", x: 997, y: 6534 }, { path: "meshes/0997_6535_11.drc", x: 997, y: 6535 }, { path: "meshes/0998_6534_11.drc", x: 998, y: 6534 }, { path: "meshes/0998_6535_11.drc", x: 998, y: 6535 }] },
        ],
      },
      {
        id: "secteur-geant-vallee-blanche",
        name: "5. Secteur Géant - Vallée Blanche",
        children: [
          { id: "geant", name: "Dent du Géant (4013m)", altitude: "4013m", c2c: "https://www.camptocamp.org/waypoints/37407/fr/dent-du-geant", firstAscent: "1882 — W.W. Graham avec Jean-Joseph et Baptiste Maquignaz", description: "Obélisque granitique de 4 013 m dominant le glacier du Géant côté italien. Longtemps réputée absolument inaccessible, la Dent du Géant est désormais une grande classique grâce aux cordes fixes installées sur son ressaut sommital. La vue sur la Vallée Blanche et les sommets environnants y est spectaculaire.", dalles: [{ path: "meshes/1006_6537_11.drc", x: 1006, y: 6537 }] },
          { id: "rochefort", name: "Arête de Rochefort", altitude: "4001m", c2c: "https://www.camptocamp.org/waypoints/37416/fr/arete-de-rochefort", firstAscent: "1873 — J. Eccles avec les guides Michel et Alphonse Payot", description: "Longue arête neigeuse et aérienne à 4 001 m reliant la Dent du Géant en direction des Grandes Jorasses. L'un des itinéraires glaciaires les plus esthétiques du massif, avec une vue imprenable sur la Vallée Blanche d'un côté et les glaciers italiens de l'autre.", dalles: [{ path: "meshes/1006_6537_11.drc", x: 1006, y: 6537 }, { path: "meshes/1006_6538_11.drc", x: 1006, y: 6538 }, { path: "meshes/1007_6537_11.drc", x: 1007, y: 6537 }, { path: "meshes/1007_6538_11.drc", x: 1007, y: 6538 }] },
          { id: "tour-ronde", name: "Tour Ronde (3792m)", altitude: "3792m", c2c: "https://www.camptocamp.org/waypoints/37404/fr/tour-ronde", firstAscent: "1867 — F.C. Grove, W.E. Mathews et J.C. Jacomb avec les guides Melchior et Jakob Anderegg", description: "Sommet rocheux et neigeux de 3 792 m au cœur de la Vallée Blanche, entre l'Aiguille du Midi et le Col du Géant. Sa voie normale est accessible depuis le refuge Torino côté italien ; son versant nord, en glace raide, offre des courses très prisées des amateurs de glace.", dalles: [{ path: "meshes/1002_6535_11.drc", x: 1002, y: 6535 }, { path: "meshes/1003_6535_11.drc", x: 1003, y: 6535 }] },
          { id: "periades", name: "Les Périades (3549m)", altitude: "3549m", c2c: "https://www.camptocamp.org/waypoints/37520/fr/les-periades", description: "Crête acérée et très découpée s'étendant du Col du Tacul au Col du Mont Mallet.", dalles: [{ path: "meshes/1006_6539_11.drc", x: 1006, y: 6539 }, { path: "meshes/1006_6540_11.drc", x: 1006, y: 6540 }, { path: "meshes/1007_6539_11.drc", x: 1007, y: 6539 }, { path: "meshes/1007_6540_11.drc", x: 1007, y: 6540 }] },
          { id: "leschaux-geant", name: "Aiguille de Leschaux (3759m)", altitude: "3759m", c2c: "https://www.camptocamp.org/waypoints/37512/fr/aiguille-de-leschaux", description: "Vue depuis le secteur Géant, sur la crête entre Mont Dolent et Grandes Jorasses.", dalles: [{ path: "meshes/1006_6539_11.drc", x: 1006, y: 6539 }, { path: "meshes/1006_6540_11.drc", x: 1006, y: 6540 }, { path: "meshes/1007_6539_11.drc", x: 1007, y: 6539 }, { path: "meshes/1007_6540_11.drc", x: 1007, y: 6540 }] },
        ]
      },
      {
        id: "secteur-jorasses",
        name: "6. Secteur Grandes Jorasses",
        children: [
          { id: "jorasses", name: "Grandes Jorasses (4208m)", altitude: "4208m", c2c: "https://www.camptocamp.org/waypoints/37419/fr/grandes-jorasses", firstAscent: "Pointe Whymper 1865 — Edward Whymper avec les guides Michel Croz, C. Almer et F. Biener ; Pointe Walker 1868 — Horace Walker avec les guides Johann Jaun et Melchior Anderegg", description: "Les Grandes Jorasses sont l'un des six grands défis classiques des Alpes. Leur face nord, haute de 1 200 m, domine le glacier de Leschaux d'une verticalité terrifiante. L'Éperon Walker, premier gravi par Riccardo Cassin en 1938, est considéré comme l'une des plus grandes réalisations de l'alpinisme.", waypoints: [{name: "Pointe Walker", type: "Sommet"}, {name: "Éperon Walker", type: "Pilier"}], dalles: [{ path: "meshes/1008_6538_11.drc", x: 1008, y: 6538 }, { path: "meshes/1008_6539_11.drc", x: 1008, y: 6539 }, { path: "meshes/1009_6538_11.drc", x: 1009, y: 6538 }, { path: "meshes/1009_6539_11.drc", x: 1009, y: 6539 }] },
          { id: "petites-jorasses", name: "Petites Jorasses (3650m)", altitude: "3650m", c2c: "https://www.camptocamp.org/waypoints/37513/fr/petites-jorasses", description: "Sommet voisin des Grandes Jorasses, situé entre les glaciers de Leschaux et de Frébouze.", dalles: [{ path: "meshes/1009_6539_11.drc", x: 1009, y: 6539 }, { path: "meshes/1009_6540_11.drc", x: 1009, y: 6540 }, { path: "meshes/1010_6539_11.drc", x: 1010, y: 6539 }, { path: "meshes/1010_6540_11.drc", x: 1010, y: 6540 }] },
          { id: "leschaux", name: "Aiguille de Leschaux (3759m)", altitude: "3759m", c2c: "https://www.camptocamp.org/waypoints/37512/fr/aiguille-de-leschaux", description: "Située sur la crête entre le Mont Dolent et les Grandes Jorasses, à la frontière franco-italienne.", dalles: [{ path: "meshes/1009_6539_11.drc", x: 1009, y: 6539 }, { path: "meshes/1009_6540_11.drc", x: 1009, y: 6540 }, { path: "meshes/1010_6539_11.drc", x: 1010, y: 6539 }, { path: "meshes/1010_6540_11.drc", x: 1010, y: 6540 }] },
          { id: "talefre", name: "Aiguille de Talèfre (3730m)", altitude: "3730m", c2c: "https://www.camptocamp.org/waypoints/37530/fr/aiguille-de-talefre", description: "Domine le glacier de Talèfre au nord et les glaciers de Pierre-Joseph et de Leschaux au sud-ouest.", dalles: [{ path: "meshes/1009_6541_11.drc", x: 1009, y: 6541 }, { path: "meshes/1009_6542_11.drc", x: 1009, y: 6542 }, { path: "meshes/1010_6541_11.drc", x: 1010, y: 6541 }, { path: "meshes/1010_6542_11.drc", x: 1010, y: 6542 }] },
        ],
      },
    ],
  },
  {
    id: "massif-ecrins",
    name: "Massif des Écrins",
    children: [
      {
        id: "secteur-meije",
        name: "1. Secteur La Meije",
        children: [
          { id: "meije", name: "La Meije (3984m)", altitude: "3984m", c2c: "https://www.camptocamp.org/waypoints/38988/fr/la-meije-grand-pic", firstAscent: "16 août 1877 — Pierre Boileau de Castelnau avec les guides Emmanuel et Pierre Gaspard père et fils, après 8 tentatives infructueuses", description: "La Meije est l'un des sommets les plus mythiques des Alpes françaises, dernière grande cime à avoir résisté aux alpinistes du XIXe siècle. Sa traversée intégrale, de la Brèche de la Meije à la Cime du Doigt, est un itinéraire de haute montagne exceptionnel qui suscite le respect et l'admiration.", dalles: [{ path: "meshes/0959_6439_11.drc", x: 959, y: 6439 }, { path: "meshes/0959_6440_11.drc", x: 959, y: 6440 }, { path: "meshes/0960_6439_11.drc", x: 960, y: 6439 }, { path: "meshes/0960_6440_11.drc", x: 960, y: 6440 }, { path: "meshes/0961_6439_11.drc", x: 961, y: 6439 }, { path: "meshes/0961_6440_11.drc", x: 961, y: 6440 }] },
          { id: "rateau", name: "Le Râteau (3809m)", altitude: "3809m", c2c: "https://www.camptocamp.org/waypoints/38989/fr/le-rateau", firstAscent: "1876 — A.W. Moore avec les guides Jakob et Andreas Imseng", description: "Voisin immédiat de la Meije, le Râteau en est le contrefort occidental. Sa face nord présente un imposant mur de glace dominant le glacier du Tabuchet. Depuis son sommet, la vue sur la Meije et la brèche homonyme est saisissante.", dalles: [{ path: "meshes/0957_6438_11.drc", x: 957, y: 6438 }, { path: "meshes/0958_6438_11.drc", x: 958, y: 6438 }, { path: "meshes/0958_6439_11.drc", x: 958, y: 6439 }] },
          { id: "pic-grave", name: "Pic de la Grave (3667m)", altitude: "3667m", c2c: "https://www.camptocamp.org/waypoints/38987/fr/pic-de-la-grave", firstAscent: "Fin XIXe siècle", description: "Sommet dominant directement la station de La Grave et le célèbre téléphérique des Glaciers de la Meije. Son versant nord plonge sur l'immense glacier de la Girose, domaine glaciaire hors-piste parmi les plus sauvages des Alpes françaises.", dalles: [{ path: "meshes/0956_6439_11.drc", x: 956, y: 6439 }, { path: "meshes/0956_6440_11.drc", x: 956, y: 6440 }] },
          { id: "gandoliere", name: "Tête de la Gandolière (3609m)", altitude: "3609m", firstAscent: "Fin XIXe siècle", description: "Sommet secondaire de la chaîne frontière entre la Meije et le Râteau. Son panorama s'étend du glacier de Tsanfleuron aux sommets italiens du Gran Paradiso. Accessible par des pentes mixtes depuis le col de la Gandolière.", dalles: [{ path: "meshes/0955_6439_11.drc", x: 955, y: 6439 }, { path: "meshes/0955_6440_11.drc", x: 955, y: 6440 }] },
          { id: "plaret", name: "Le Plaret (3563m)", altitude: "3563m", firstAscent: "XIXe siècle", description: "Petit sommet rocheux aux abords du glacier du Râteau, entre la Tête de la Gandolière et la vallée de la Romanche. Accessible en randonnée depuis La Grave par les pentes herbeuses du versant sud.", dalles: [{ path: "meshes/0955_6438_11.drc", x: 955, y: 6438 }, { path: "meshes/0955_6439_11.drc", x: 955, y: 6439 }] },
          { id: "pic-geny", name: "Pic Gény (3423m)", altitude: "3423m", firstAscent: "Fin XIXe siècle", description: "Point de vue sur le vaste glacier de la Girose et le cirque glaciaire autour de la Meije. Accessible depuis La Grave, il offre un beau belvédère sur les faces nord des grands sommets du massif.", dalles: [{ path: "meshes/0956_6437_11.drc", x: 956, y: 6437 }, { path: "meshes/0957_6437_11.drc", x: 957, y: 6437 }] },
          { id: "pic-gaspard", name: "Pic Gaspard (3883m)", altitude: "3883m", c2c: "https://www.camptocamp.org/waypoints/38986/fr/pic-gaspard", firstAscent: "1877 — Emmanuel et Pierre Gaspard père et fils, vainqueurs de la Meije", description: "Sommet voisin de la Meije portant le nom de la famille de guides qui en a réalisé la première ascension. Sa silhouette rocheuse caractéristique offre une vue directe sur la face nord de la Meije et les glaciers qui l'entourent.", dalles: [{ path: "meshes/0958_6438_11.drc", x: 958, y: 6438 }, { path: "meshes/0958_6439_11.drc", x: 958, y: 6439 }] },
          { id: "combeynot", name: "Pic de Combeynot (3155m)", altitude: "3155m", firstAscent: "XIXe siècle", description: "Massif calcaire au-dessus du col du Lautaret, ponctué de lacs d'altitude et de pelouses alpines. Excellent belvédère sur la face nord de la Meije et le massif des Écrins, accessible en randonnée depuis le col du Lautaret.", dalles: [{ path: "meshes/0961_6437_11.drc", x: 961, y: 6437 }, { path: "meshes/0961_6438_11.drc", x: 961, y: 6438 }] },
          { id: "neige-cordier", name: "Pic de Neige Cordier (3614m)", altitude: "3614m", firstAscent: "Début XXe siècle", description: "Sommet glaciaire accessible depuis le plateau de la Plate des Agneaux. Vue plongeante sur les séracs du glacier du Casset et les vallées du Briançonnais. Itinéraire mixte exigeant depuis le col du Lautaret.", dalles: [{ path: "meshes/0962_6436_11.drc", x: 962, y: 6436 }, { path: "meshes/0961_6437_11.drc", x: 961, y: 6437 }] },
        ],
      },
      {
        id: "secteur-ecrins",
        name: "2. Secteur Barre des Écrins",
        children: [
          { id: "barre-ecrins", name: "Barre des Écrins (4102m)", altitude: "4102m", c2c: "https://www.camptocamp.org/waypoints/38929/fr/barre-des-ecrins", firstAscent: "25 juin 1864 — Edward Whymper et A.W. Moore avec les guides Michel Croz et Christian Almer", description: "Point culminant du massif des Écrins et 4000m le plus méridional des Alpes, la Barre des Écrins est un sommet glaciaire majestueux. Son ascension par le glacier Blanc est une grande course classique, tandis que sa face nord offre des itinéraires de haute difficulté sur la glace et le mixte.", dalles: [{ path: "meshes/0964_6431_11.drc", x: 964, y: 6431 }, { path: "meshes/0964_6432_11.drc", x: 964, y: 6432 }, { path: "meshes/0965_6431_11.drc", x: 965, y: 6431 }, { path: "meshes/0965_6432_11.drc", x: 965, y: 6432 }] },
          { id: "dome-neige", name: "Dôme de Neige des Écrins (4015m)", altitude: "4015m", c2c: "https://www.camptocamp.org/waypoints/38930/fr/dome-de-neige-des-ecrins", firstAscent: "1864 — Edward Whymper et A.W. Moore avec les guides Michel Croz et Christian Almer, lors de la même course que la première de la Barre", description: "Le 4000 m le plus accessible du massif des Écrins. Son large dôme neigeux se situe quelques mètres en contrebas de la Barre des Écrins et constitue une étape naturelle sur la voie normale par le glacier Blanc. Panorama exceptionnel sur l'ensemble du massif.", dalles: [{ path: "meshes/0964_6431_11.drc", x: 964, y: 6431 }, { path: "meshes/0964_6432_11.drc", x: 964, y: 6432 }, { path: "meshes/0965_6431_11.drc", x: 965, y: 6431 }, { path: "meshes/0965_6432_11.drc", x: 965, y: 6432 }] },
          { id: "roche-faurio", name: "Roche Faurio (3730m)", altitude: "3730m", firstAscent: "1878 — T. Middlemore avec les guides J. Jaun et J. Fischer", description: "Sommet rocheux face à la Barre des Écrins, de l'autre côté du glacier Blanc. Point de repère visuel emblématique depuis le refuge des Écrins (Cézanne) ; son ascension constitue une belle course rocheuse PD en haute montagne.", dalles: [{ path: "meshes/0957_6434_11.drc", x: 957, y: 6434 }, { path: "meshes/0958_6434_11.drc", x: 958, y: 6434 }] },
          { id: "pic-cavales", name: "Pic des Cavales (3385m)", altitude: "3385m", firstAscent: "Début XXe siècle", description: "Sommet rocheux dominant le pré de Madame Carle et la vallée d'Ailefroide. Accès par des pentes herbeuses et rocheuses depuis Ailefroide ; beau point de vue sur les faces sud de la Barre des Écrins et du Pelvoux.", dalles: [{ path: "meshes/0964_6430_11.drc", x: 964, y: 6430 }, { path: "meshes/0965_6430_11.drc", x: 965, y: 6430 }] },
          { id: "roche-meane", name: "Roche Méane (3500m)", altitude: "3500m", firstAscent: "Fin XIXe siècle", description: "Crête rocheuse austère entre le glacier Blanc et le glacier Noir, typique du style minéral des Écrins. Elle offre un beau point d'observation sur ces deux immenses glaciers qui descendent de la Barre des Écrins.", dalles: [{ path: "meshes/0963_6431_11.drc", x: 963, y: 6431 }, { path: "meshes/0964_6431_11.drc", x: 964, y: 6431 }] },
          { id: "agneaux", name: "Montagne des Agneaux (3664m)", altitude: "3664m", firstAscent: "1878", description: "Belle course glaciaire depuis le refuge du Pavé. L'itinéraire classique traverse les névés du plateau des Agneaux avant de rejoindre la cime rocheuse. Vue panoramique sur les Écrins, le Pelvoux et les sommets du Briançonnais.", dalles: [{ path: "meshes/0958_6435_11.drc", x: 958, y: 6435 }, { path: "meshes/0958_6436_11.drc", x: 958, y: 6436 }] },
          { id: "pic-coolidge", name: "Pic Coolidge (3775m)", altitude: "3775m", firstAscent: "1881 — W.A.B. Coolidge avec les guides Christian Almer père et fils", description: "Nommé en hommage au grand alpiniste et historien américain W.A.B. Coolidge, qui contribua à l'exploration systématique des Écrins à la fin du XIXe siècle. Course rocheuse élégante avec vue directe sur le cirque de la Barre des Écrins.", dalles: [{ path: "meshes/0964_6430_11.drc", x: 964, y: 6430 }, { path: "meshes/0965_6430_11.drc", x: 965, y: 6430 }] },
        ],
      },
      {
        id: "secteur-pelvoux",
        name: "3. Secteur Pelvoux - Ailefroide",
        children: [
          { id: "pelvoux", name: "Mont Pelvoux (3946m)", altitude: "3946m", c2c: "https://www.camptocamp.org/waypoints/38925/fr/mont-pelvoux", firstAscent: "1848 — H.W. Tuckett avec les guides Pierre Reynaud et Michel Croz", description: "Longtemps considéré comme le point culminant du Dauphiné avant la découverte que la Barre des Écrins le dépasse. Massif imposant dominant Ailefroide, le Pelvoux offre des courses variées sur rocher et glace, de l'arête du Coup de Sabre aux couloirs nord.", dalles: [{ path: "meshes/0964_6428_11.drc", x: 964, y: 6428 }, { path: "meshes/0964_6429_11.drc", x: 964, y: 6429 }, { path: "meshes/0965_6428_11.drc", x: 965, y: 6428 }, { path: "meshes/0965_6429_11.drc", x: 965, y: 6429 }] },
          { id: "ailefroide", name: "Ailefroide (3954m)", altitude: "3954m", c2c: "https://www.camptocamp.org/waypoints/38926/fr/ailefroide", firstAscent: "1870 — E. Whymper avec les guides Almer et Moore", description: "Troisième plus haut sommet du Dauphiné, constitué de trois pointes distinctes (Centrale, Orientale, Occidentale). Ses faces rocheuses offrent des voies variées de tout niveau au-dessus du hameau d'Ailefroide, point de départ classique des courses dans les Écrins.", dalles: [{ path: "meshes/0964_6426_11.drc", x: 964, y: 6426 }, { path: "meshes/0964_6427_11.drc", x: 964, y: 6427 }, { path: "meshes/0964_6428_11.drc", x: 964, y: 6428 }, { path: "meshes/0965_6426_11.drc", x: 965, y: 6426 }, { path: "meshes/0965_6427_11.drc", x: 965, y: 6427 }, { path: "meshes/0965_6428_11.drc", x: 965, y: 6428 }] },
          { id: "pic-sans-nom", name: "Pic Sans Nom (3913m)", altitude: "3913m", firstAscent: "Fin XIXe siècle", description: "Érigé sur la crête reliant le Pelvoux à l'Ailefroide, ce sommet au nom énigmatique se distingue par sa silhouette rocheuse acérée. Course engagée avec des passages mixtes caractéristiques du style Écrins.", dalles: [{ path: "meshes/0964_6428_11.drc", x: 964, y: 6428 }, { path: "meshes/0965_6428_11.drc", x: 965, y: 6428 }] },
          { id: "coup-sabre", name: "Pic du Coup de Sabre (3699m)", altitude: "3699m", firstAscent: "Fin XIXe siècle", description: "Son nom évoque la netteté de l'arête rocheuse qui le caractérise, entre l'Ailefroide et le Pelvoux. Course technique sur rocher avec un accès depuis le vallon de Claphouse.", dalles: [{ path: "meshes/0964_6428_11.drc", x: 964, y: 6428 }, { path: "meshes/0965_6428_11.drc", x: 965, y: 6428 }] },
          { id: "pointe-sele", name: "Pointe du Sélé (3557m)", altitude: "3557m", firstAscent: "Fin XIXe siècle", description: "Dominant le glacier du Sélé entre Ailefroide et le vallon du Sélé. Accès par les pentes neigeuses du glacier depuis le refuge du Sélé, avec vue sur les faces ouest des Écrins.", dalles: [{ path: "meshes/0964_6427_11.drc", x: 964, y: 6427 }, { path: "meshes/0965_6427_11.drc", x: 965, y: 6427 }] },
          { id: "pic-temple", name: "Pic de la Temple (3682m)", altitude: "3682m", firstAscent: "Fin XIXe siècle", description: "Sommet élancé du secteur sud du Pelvoux, dominant le vallon de Claphouse. Vue dégagée sur l'ensemble du secteur Pelvoux-Ailefroide et les glaciers environnants.", dalles: [{ path: "meshes/0964_6429_11.drc", x: 964, y: 6429 }, { path: "meshes/0965_6429_11.drc", x: 965, y: 6429 }] },
          { id: "pic-paveoux", name: "Pic des Pavéous (3548m)", altitude: "3548m", firstAscent: "Fin XIXe siècle", description: "Sommet rocheux offrant un large panorama sur le vallon de Claphouse et les contreforts méridionaux du Pelvoux. Itinéraire de randonnée alpinistique accessible depuis Ailefroide.", dalles: [{ path: "meshes/0964_6427_11.drc", x: 964, y: 6427 }] },
          { id: "grande-sagne", name: "Pointe de la Grande Sagne (3660m)", altitude: "3660m", firstAscent: "Début XXe siècle", description: "Sommet isolé du secteur sud du massif des Écrins, accessible depuis le refuge du Sélé. La Grande Sagne se distingue par ses pentes rocheuses austères typiques des Écrins méridionaux.", dalles: [{ path: "meshes/0964_6427_11.drc", x: 964, y: 6427 }, { path: "meshes/0965_6427_11.drc", x: 965, y: 6427 }] },
        ],
      },
      {
        id: "secteur-valgaudemar",
        name: "4. Secteur Valgaudemar - Olan",
        children: [
          { id: "olan", name: "L'Olan (3564m)", altitude: "3564m", c2c: "https://www.camptocamp.org/waypoints/38955/fr/l-olan", firstAscent: "1877 — W.A.B. Coolidge avec les guides Christian et Rudolf Almer", description: "Sommet majestueux dominant le Valgaudemar, surnommé le 'toit du Valgaudemar'. Sa face nord, haute de plus de 1 000 m, est l'une des grandes faces de glace des Écrins et un objectif mythique pour les amateurs de courses de haute difficulté.", dalles: [{ path: "meshes/0948_6423_11.drc", x: 948, y: 6423 }, { path: "meshes/0952_6423_11.drc", x: 952, y: 6423 }] },
          { id: "les-bans", name: "Les Bans (3669m)", altitude: "3669m", firstAscent: "1878 — T. Middlemore avec les guides J. Jaun et J. Fischer", description: "Sommet élancé dominant la haute vallée du Valgaudemar. Course classique du secteur, avec une belle arête mixte menant au sommet. Le versant nord offre de beaux couloirs de glace en conditions hivernales.", dalles: [{ path: "meshes/0957_6424_11.drc", x: 957, y: 6424 }] },
          { id: "les-rouies", name: "Les Rouies (3589m)", altitude: "3589m", firstAscent: "1876 — A.W. Moore avec les guides Jakob Anderegg et Andreas Maurer", description: "Sommet rocheux au-dessus du vallon de la Pilatte. Son caractère sauvage et isolé en fait un sommet recherché par les alpinistes souhaitant s'éloigner des itinéraires fréquentés. Beau panorama sur la face ouest de l'Olan.", dalles: [{ path: "meshes/0955_6434_11.drc", x: 955, y: 6434 }, { path: "meshes/0955_6435_11.drc", x: 955, y: 6435 }] },
          { id: "pointe-guyard", name: "Pointe Guyard (3461m)", altitude: "3461m", firstAscent: "Fin XIXe siècle", description: "Sommet voisin de l'Olan dominant la confluence des vallons du Valgaudemar. Itinéraire rocheux sur crête avec vue sur la face nord de l'Olan et les vallées environnantes.", dalles: [{ path: "meshes/0948_6423_11.drc", x: 948, y: 6423 }] },
          { id: "boeufs-rouges", name: "Pointe des Bœufs Rouges (3517m)", altitude: "3517m", firstAscent: "Fin XIXe siècle", description: "Sommet entre le Valgaudemar et le Vénéon, aux pentes rocheuses teintées d'ocre caractéristiques des Écrins. Accessible depuis le refuge de la Pilatte, avec vue sur les grandes faces nord du secteur.", dalles: [{ path: "meshes/0955_6434_11.drc", x: 955, y: 6434 }] },
          { id: "cime-orgieres", name: "Cime d'Orgières (2755m)", altitude: "2755m", firstAscent: "XIXe siècle", description: "Sommet accessible en randonnée depuis le Valgaudemar. Belvédère remarquable sur le cirque de l'Olan et les hauts sommets environnants, idéal pour une première approche du massif sans équipement alpinistique.", dalles: [{ path: "meshes/0952_6423_11.drc", x: 952, y: 6423 }] },
          { id: "sirac", name: "Le Sirac (3441m)", altitude: "3441m", firstAscent: "1878 — T. Middlemore avec J. Jaun", description: "Sentinelle méridionale du Valgaudemar, visible depuis La Chapelle-en-Valgaudemar. Course rocheuse élégante sur crête avec quelques passages d'escalade ; vue plongeante sur les gorges du Valgaudemar et les villages en contrebas.", dalles: [{ path: "meshes/0948_6423_11.drc", x: 948, y: 6423 }] },
        ],
      },
      {
        id: "secteur-muzelle",
        name: "5. Secteur Muzelle - Vénéon",
        children: [
          { id: "muzelle", name: "La Muzelle (3465m)", altitude: "3465m", c2c: "https://www.camptocamp.org/waypoints/38957/fr/la-muzelle", firstAscent: "1878 — W. Coolidge avec les guides Christian et Rudolf Almer", description: "Belle pyramide rocheuse au-dessus du lac de la Muzelle, accessible depuis Les Deux Alpes par le GR 54. Course classique du secteur Vénéon alliant randonnée alpine et terrain rocheux avec une vue plongeante sur le lac turquoise en contrebas.", dalles: [{ path: "meshes/0955_6438_11.drc", x: 955, y: 6438 }, { path: "meshes/0955_6439_11.drc", x: 955, y: 6439 }] },
        ],
      },
    ],
  },
  {
    id: "massif-sainte-victoire",
    name: "Montagne Sainte-Victoire",
    children: [
      {
        id: "secteur-sainte-victoire",
        name: "Crête Sainte-Victoire",
        children: [
          { id: "pic-mouches", name: "Pic des Mouches (1011m)", altitude: "1011m", description: "Point culminant de la Montagne Sainte-Victoire, rendu célèbre par les toiles de Paul Cézanne qui peignit cette montagne plus de quatre-vingts fois. Depuis le sommet, panorama à 360° sur la Provence, Aix-en-Provence, l'Étang de Berre et, par temps clair, la mer Méditerranée.", dalles: [{ path: "meshes/0895_6238_11.drc", x: 895, y: 6238 }, { path: "meshes/0896_6238_11.drc", x: 896, y: 6238 }] },
          { id: "signal", name: "Le Signal (943m)", altitude: "943m", description: "Sommet dominant la partie centrale de la Sainte-Victoire, visible depuis Aix-en-Provence. La Croix de Provence, érigée en 1875, en signale l'emplacement depuis la vallée. Accès depuis le prieuré de Sainte-Victoire par le sentier des Venturiers.", dalles: [{ path: "meshes/0893_6238_11.drc", x: 893, y: 6238 }, { path: "meshes/0894_6238_11.drc", x: 894, y: 6238 }] },
          { id: "bau-cezanne", name: "Bau Cézanne (900m)", altitude: "900m", description: "Belvédère calcaire offrant une vue magnifique sur le versant sud de la Sainte-Victoire et la plaine du Var. Le terme 'bau' désigne en provençal une falaise ou un escarpement rocheux abrupt, caractéristique du paysage karstique de la montagne.", dalles: [{ path: "meshes/0894_6238_11.drc", x: 894, y: 6238 }, { path: "meshes/0894_6239_11.drc", x: 894, y: 6239 }] },
          { id: "plan-crau", name: "Plan de la Crau (850m)", altitude: "850m", description: "Plateau sommital intermédiaire entre le Signal et le Pic des Mouches, caractérisé par un plateau calcaire ouvert. Lieu de passage incontournable sur la crête principale de la Sainte-Victoire, offrant de larges vues sur la plaine provençale et les massifs environnants.", dalles: [{ path: "meshes/0894_6238_11.drc", x: 894, y: 6238 }, { path: "meshes/0895_6238_11.drc", x: 895, y: 6238 }] },
        ],
      },
    ],
  },
];

// Identifie si c'est un massif racine (niveau 0)
const ROOT_MASSIF_IDS = ["massif-mont-blanc", "massif-ecrins", "massif-sainte-victoire"];

function ElevationProfilePanel({ profile, userPoints }: {
  profile: { distance: number; altitude: number }[];
  userPoints?: { altitude: number }[];
}) {
  const chartData = useMemo(() => {
    if (profile.length < 2) return null;

    const altitudes = profile.map(p => p.altitude);
    const distances = profile.map(p => p.distance);
    const minAlt = Math.min(...altitudes);
    const maxAlt = Math.max(...altitudes);
    const altRange = maxAlt - minAlt || 1;
    const maxDist = Math.max(...distances);

    const altMargin = altRange * 0.05;
    const displayMinAlt = minAlt - altMargin;
    const displayMaxAlt = maxAlt + altMargin;
    const displayAltRange = displayMaxAlt - displayMinAlt;

    const viewWidth = maxDist;
    const viewHeight = displayAltRange;

    const chartWidthPx = 280;
    const realRatio = viewHeight / viewWidth;
    const chartHeightPx = Math.min(320, Math.max(80, Math.round(chartWidthPx * realRatio)));

    const points = profile.map(p => ({
      x: p.distance,
      y: viewHeight - (p.altitude - displayMinAlt),
      distance: p.distance,
      altitude: p.altitude
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const areaPath = `M 0,${viewHeight} L 0,${points[0].y} ` +
      points.map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L ${viewWidth},${points[points.length - 1].y} L ${viewWidth},${viewHeight} Z`;

    const userPointsInProfile: { x: number; y: number; index: number }[] = [];
    if (userPoints && userPoints.length > 0) {
      userPointsInProfile.push({ ...points[0], index: 0 });
      if (userPoints.length > 1) {
        const distPerPoint = maxDist / (userPoints.length - 1);
        for (let i = 1; i < userPoints.length; i++) {
          const targetDist = distPerPoint * i;
          let closestIdx = 0;
          let closestDiff = Infinity;
          for (let j = 0; j < points.length; j++) {
            const diff = Math.abs(points[j].distance - targetDist);
            if (diff < closestDiff) { closestDiff = diff; closestIdx = j; }
          }
          userPointsInProfile.push({ ...points[closestIdx], index: i });
        }
      }
    }

    const numYLabels = 4;
    const yLabels = [];
    for (let i = 0; i < numYLabels; i++) {
      yLabels.push(Math.round(minAlt + (altRange * i) / (numYLabels - 1)));
    }

    return {
      points, linePath, areaPath,
      minAlt: Math.round(minAlt), maxAlt: Math.round(maxAlt),
      maxDist: Math.round(maxDist), altRange: Math.round(altRange),
      viewWidth, viewHeight, chartHeightPx,
      yLabels, userPointsInProfile
    };
  }, [profile, userPoints]);

  if (!chartData) {
    return (
      <div className="h-32 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
        Cliquez sur le terrain pour mesurer...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex justify-between text-[9px] text-slate-400 mb-2">
        <span>Dénivelé : {chartData.altRange}m</span>
        <span>Distance : {chartData.maxDist}m</span>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 w-10 flex flex-col justify-between text-[8px] text-slate-400 pr-1" style={{ height: chartData.chartHeightPx }}>
          {[...chartData.yLabels].reverse().map((alt, i) => (
            <span key={i} className="text-right">{alt}m</span>
          ))}
        </div>
        <div className="ml-11 bg-gradient-to-b from-amber-50/50 via-slate-50 to-emerald-50/30 rounded-lg overflow-hidden border border-slate-200">
          <svg
            viewBox={`0 0 ${chartData.viewWidth} ${chartData.viewHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full"
            style={{ height: chartData.chartHeightPx }}
          >
            {[0.25, 0.5, 0.75].map(f => (
              <line key={`h${f}`} x1="0" y1={chartData.viewHeight * f} x2={chartData.viewWidth} y2={chartData.viewHeight * f} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />
            ))}
            {[0.25, 0.5, 0.75].map(f => (
              <line key={`v${f}`} x1={chartData.viewWidth * f} y1="0" x2={chartData.viewWidth * f} y2={chartData.viewHeight} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />
            ))}
            <path d={chartData.areaPath} fill="url(#terrainGradientProfile)" opacity="0.7" />
            <path d={chartData.linePath} fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {chartData.userPointsInProfile.map((p, i) => (
              <g key={i}>
                <line x1={p.x} y1={p.y} x2={p.x} y2={chartData.viewHeight} stroke={i === 0 ? "#22c55e" : i === chartData.userPointsInProfile.length - 1 ? "#ef4444" : "#3b82f6"} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" vectorEffect="non-scaling-stroke" />
                <circle cx={p.x} cy={p.y} r="4" fill={i === 0 ? "#22c55e" : i === chartData.userPointsInProfile.length - 1 ? "#ef4444" : "#3b82f6"} stroke="white" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </g>
            ))}
            <defs>
              <linearGradient id="terrainGradientProfile" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a8a29e" stopOpacity="0.6" />
                <stop offset="30%" stopColor="#78716c" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#57534e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#44403c" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="ml-11 flex justify-between text-[8px] text-slate-400 mt-1">
          <span>0m</span>
          <span>{Math.round(chartData.maxDist / 2)}m</span>
          <span>{chartData.maxDist}m</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mt-3 text-[9px] text-slate-500 flex-wrap">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span>Départ</span></div>
        {userPoints && userPoints.length > 2 && (
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /><span>Points ({userPoints.length - 2})</span></div>
        )}
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span>Arrivée</span></div>
        <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-stone-500 rounded" /><span>Relief</span></div>
      </div>
    </div>
  );
}

function TreeElement({ item, selectedSummitId, onToggle, level = 0 }: {
  item: any;
  selectedSummitId: string | null;
  onToggle: (id: string) => void;
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(level > 0);
  const isBranch = item.children && item.children.length > 0;
  const isSelected = !isBranch && selectedSummitId === item.id;
  const isRootMassif = ROOT_MASSIF_IDS.includes(item.id);

  return (
    <div className="select-none w-full">
      <div
        className={`flex items-center py-2 px-3 rounded-xl cursor-pointer transition-all ${isBranch ? "hover:bg-slate-50" : "hover:bg-slate-100 group"} ${isSelected ? "bg-slate-900 shadow-lg" : ""}`}
        onClick={() => (isBranch ? setIsOpen(!isOpen) : onToggle(item.id))}
      >
        <div className="mr-2 flex-shrink-0">
          {isBranch ? (isOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />) : isSelected ? <CheckSquare className="h-4 w-4 text-white" /> : <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />}
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isRootMassif ? <MapIcon className="h-3.5 w-3.5 text-slate-900" /> : !isBranch && <Mountain className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-orange-500"}`} />}
          <span className={`text-[12px] leading-tight truncate ${isBranch ? "font-bold uppercase tracking-tight text-slate-900" : isSelected ? "text-white font-bold" : "text-slate-600 font-medium"}`}>{item.name}</span>
        </div>
      </div>
      {isBranch && isOpen && (
        <div className="ml-4 border-l-2 border-slate-100 pl-2 mt-1 space-y-1">
          {item.children.map((child: any) => <TreeElement key={child.id} item={child} selectedSummitId={selectedSummitId} onToggle={onToggle} level={level + 1} />)}
        </div>
      )}
    </div>
  );
}

function HomePageContent() {
  const {
    selectedTiles, setSelectedTiles,
    selectedLevel, setSelectedLevel,
    tilesData, setTilesData,
    availableLevels,
    measurementEnabled, setMeasurementEnabled,
    measurementData, resetMeasurement,
  } = useAppContext();

  const hasMeasurement = measurementData.points.length >= 2;

  const [selectedSummitId, setSelectedSummitId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetails, setShowDetails] = useState(true);
  const [showSummitInfo, setShowSummitInfo] = useState(false);
  const [showTileInfo, setShowTileInfo] = useState(false);
  const [showTilesPanel, setShowTilesPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");


  // Charger les données des tuiles depuis le GeoJSON statique (public/tiles.geojson)
  const loadTilesData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/tiles.geojson");
      if (!response.ok) throw new Error("Erreur lors du chargement des tuiles");
      const geojson = await response.json();

      // Format du GeoJSON (public/tiles.geojson) : une feature par fichier DRC
      // { properties: { id: "1010000_6552000", x: 1010000, y: 6552000,
      //                 url: "https://.../meshes/1010_6552.drc",
      //                 name: "1010_6552" } }
      // On regroupe par coord (x_y en km) et on construit files[] + levels[].
      const tileMap = new Map<TileCoord, TileData>();

      geojson.features?.forEach((feature: any) => {
        const props = feature.properties;
        if (!props) return;

        // Coordonnées en mètres → km → TileCoord padded "XXXX_YYYY"
        const xKm = Math.round((props.x ?? 0) / 1000);
        const yKm = Math.round((props.y ?? 0) / 1000);
        const coord = toCoord(xKm, yKm);

        // Extraire le niveau depuis le nom du fichier (ex: "1010_6552_11" → "11")
        const nameMatch = (props.name ?? "").match(/_(\d+)$/);
        const level = nameMatch ? nameMatch[1] : "11";

        // Convertir l'URL S3 en URL proxy pour éviter les problèmes CORS
        const rawUrl: string = props.url ?? "";
        const pathMatch = rawUrl.match(/meshes\/[\w_]+\.drc/);
        const fileUrl = pathMatch
          ? `/api/tiles?path=${encodeURIComponent(pathMatch[0])}`
          : rawUrl;

        if (!tileMap.has(coord)) {
          tileMap.set(coord, { coord, x: props.x, y: props.y, levels: [], files: [] });
        }
        const tileData = tileMap.get(coord)!;
        if (!tileData.levels.includes(level)) tileData.levels.push(level);
        tileData.files.push({ url: fileUrl, level });
      });

      setTilesData(tileMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTilesData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Afficher automatiquement le panneau dès qu'on a 2 points de mesure
  useEffect(() => {
    if (hasMeasurement && measurementEnabled) setShowDetails(true);
  }, [hasMeasurement, measurementEnabled]);

  // Construire les modèles à afficher à partir des tuiles sélectionnées + niveau choisi
  const models: TileModel[] = useMemo(() => {
    return selectedTiles
      .map((coord) => {
        const tileData = tilesData.get(coord);
        if (!tileData) return null;
        let file = tileData.files.find((f) => f.level === selectedLevel);
        if (!file) {
          const sortedFiles = [...tileData.files].sort(
            (a, b) => Math.abs(parseInt(a.level) - parseInt(selectedLevel)) - Math.abs(parseInt(b.level) - parseInt(selectedLevel))
          );
          file = sortedFiles[0];
        }
        if (!file) return null;
        return { coord, level: file.level, coordinates: { x: tileData.x, y: tileData.y }, availableLevels: tileData.levels };
      })
      .filter(Boolean) as TileModel[];
  }, [selectedTiles, selectedLevel, tilesData]);

  // Info du sommet sélectionné
  const selectedRouteInfo = useMemo(() => {
    if (!selectedSummitId) return null;
    let found: any = null;
    const findDeep = (nodes: any[]) => {
      for (const node of nodes) {
        if (found) return;
        if (node.id === selectedSummitId) { found = node; return; }
        if (node.children) findDeep(node.children);
      }
    };
    findDeep(MOUNTAIN_TREE);
    return found;
  }, [selectedSummitId]);

  // Index plat des feuilles MOUNTAIN_TREE pour la recherche
  const summitSearchItems = useMemo(() => {
    const items: { kind: "summit"; id: string; name: string; altitude?: string }[] = [];
    function flatten(nodes: any[]) {
      for (const n of nodes) {
        if (n.children) flatten(n.children);
        else if (n.dalles) items.push({ kind: "summit", id: n.id, name: n.name, altitude: n.altitude });
      }
    }
    flatten(MOUNTAIN_TREE);
    return items;
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (q.length < 2) return [];
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const summits = summitSearchItems.filter(i => norm(i.name).includes(q));
    return summits.slice(0, 8);
  }, [searchQuery, summitSearchItems]);

  const handleToggle = (id: string) => {
    if (selectedSummitId === id) {
      // Désélection
      setSelectedSummitId(null);
      setSelectedTiles([]);
      setShowSummitInfo(false);
      return;
    }
    // Trouver le sommet dans MOUNTAIN_TREE
    let summit: any = null;
    const find = (nodes: any[]) => {
      for (const n of nodes) {
        if (n.id === id) { summit = n; return; }
        if (n.children) find(n.children);
      }
    };
    find(MOUNTAIN_TREE);
    if (summit?.dalles) {
      setSelectedSummitId(id);
      setSelectedTiles(summit.dalles.map((d: any) => toCoord(d.x, d.y)));
      setShowTileInfo(false);
      }
  };

  const clearAllTiles = () => {
    setSelectedSummitId(null);
    setSelectedTiles([]);
    setShowTileInfo(false);
    setShowSummitInfo(false);
  };

  const handleSearchSelect = (item: any) => {
    setSearchQuery("");
    setSidebarOpen(false);
    if (item.kind === "summit") {
      handleToggle(item.id);
    } else {
      // POI → trouver le sommet MOUNTAIN_TREE contenant sa dalle
      const tileId = item.tileIds?.[0];
      let foundId: string | null = null;
      const findSummit = (nodes: any[]) => {
        for (const n of nodes) {
          if (n.children) findSummit(n.children);
          else if (n.dalles?.some((d: any) => toCoord(d.x, d.y) === tileId || `${d.x}_${d.y}` === tileId)) foundId = n.id;
        }
      };
      if (tileId) findSummit(MOUNTAIN_TREE);
      if (foundId) {
        handleToggle(foundId);
      } else if (tileId && tilesData.has(tileId as TileCoord)) {
        setSelectedSummitId(null);
        setSelectedTiles([tileId as TileCoord]);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erreur : {error}</p>
          <button onClick={loadTilesData} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col p-2 lg:p-4 gap-2 lg:gap-3 overflow-hidden">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Overlay mobile pour fermer la sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          {/* Bouton hamburger sur mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tighter uppercase leading-none">
              Topos <span className="text-blue-600 font-black">3D</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 hidden sm:block">
              Explorateur de Massifs
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Aide à la navigation 3D</span>
          <span className="sm:hidden">Aide</span>
        </button>
      </header>

      <main className="flex-1 flex gap-2 lg:gap-3 overflow-hidden min-h-0">
        {/* Sidebar — drawer sur mobile, fixe sur desktop */}
        <aside
          className={`
            fixed top-0 left-0 h-full z-30 pt-16
            lg:static lg:z-auto lg:pt-0
            w-[300px] bg-white border-r border-slate-200
            lg:border-r-0 lg:border lg:border-slate-200 lg:rounded-3xl
            p-4 lg:p-6 shadow-xl lg:shadow-sm
            overflow-hidden flex flex-col flex-shrink-0
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Bouton fermer (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>

          <p className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-3 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Mountain className="h-3 w-3 text-orange-500" /> Répertoire
          </p>

          {/* Moteur de recherche */}
          <div className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un sommet ou lieu…"
                className="w-full pl-8 pr-7 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base leading-none"
                >
                  ×
                </button>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                {searchResults.map((item: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleSearchSelect(item)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-[11px] border-b border-slate-50 last:border-0"
                  >
                    {item.kind === "summit"
                      ? <Mountain className="h-3 w-3 text-orange-400 flex-shrink-0" />
                      : <span className="h-3 w-3 text-blue-400 flex-shrink-0 text-[8px]">📍</span>}
                    <span className="font-medium text-slate-800 truncate">{item.name}</span>
                    {item.kind === "poi" && (
                      <span className="ml-auto text-[10px] text-slate-400 capitalize flex-shrink-0">{item.type}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {MOUNTAIN_TREE.map((root) => (
              <TreeElement key={root.id} item={root} selectedSummitId={selectedSummitId} onToggle={handleToggle} />
            ))}

            <div className="my-6 border-t border-slate-200" />

            {/* Section Dalles disponibles */}
            <div className="select-none">
              <div
                className="flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-50"
                onClick={() => setShowTilesPanel(!showTilesPanel)}
              >
                <div className="flex items-center gap-2">
                  {showTilesPanel ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  <Grid3X3 className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-[12px] font-bold uppercase tracking-tight text-slate-900">Zones disponibles</span>
                </div>
                {selectedTiles.length > 0 && !selectedSummitId && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {selectedTiles.length}
                  </span>
                )}
              </div>

              {showTilesPanel && (
                <div className="ml-4 border-l-2 border-slate-100 pl-2 mt-1">
                  <Link
                    href="/zonesdispos"
                    className="flex items-center gap-2 py-2 px-3 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <MapIcon className="h-3 w-3" />
                    <span className="font-medium">Ouvrir la carte interactive</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Link>

                  {selectedTiles.length > 0 && !selectedSummitId && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-green-700 uppercase">Sélection actuelle</span>
                        <button onClick={clearAllTiles} className="text-[9px] text-red-500 hover:text-red-700 font-medium">Tout effacer</button>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {selectedTiles.map((coord) => (
                          <div key={coord} className="flex items-center justify-between text-[10px] bg-white px-2 py-1 rounded border border-green-200">
                            <span className="font-mono text-slate-700">{coord}</span>
                            <button onClick={() => setSelectedTiles(prev => prev.filter(c => c !== coord))} className="text-red-400 hover:text-red-600">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 max-h-48 overflow-y-auto">
                    {[...tilesData.entries()].slice(0, 100).map(([coord]) => {
                      const isSelected = selectedTiles.includes(coord);
                      return (
                        <div
                          key={coord}
                          className={`flex items-center py-1.5 px-3 rounded-lg cursor-pointer transition-all text-[11px] ${isSelected ? "bg-green-100 text-green-800" : "hover:bg-slate-50 text-slate-600"}`}
                          onClick={() => {
                            setSelectedSummitId(null);
                            setSelectedTiles(prev => prev.includes(coord) ? prev.filter(c => c !== coord) : [...prev, coord]);
                          }}
                        >
                          {isSelected ? <CheckSquare className="h-3.5 w-3.5 mr-2 text-green-600" /> : <Square className="h-3.5 w-3.5 mr-2 text-slate-300" />}
                          <span className="font-mono">{coord}</span>
                        </div>
                      );
                    })}
                    {tilesData.size > 100 && (
                      <p className="text-[10px] text-slate-400 py-2 px-3 text-center">
                        + {tilesData.size - 100} autres dalles...<br />
                        <Link href="/zonesdispos" className="text-blue-500 hover:underline">Voir sur la carte</Link>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Zone 3D principale */}
        <section className="flex-1 relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800 min-w-0">
          {models.length > 0 ? (
            <>
              <ThreeScene models={models} />

              {/* Hint outil de mesure */}
              {measurementEnabled && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-slate-900/80 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none flex items-center gap-2 whitespace-nowrap">
                  <Ruler className="h-3 w-3 text-blue-400" />
                  {measurementData.points.length === 0
                    ? "Cliquez sur le terrain pour démarrer"
                    : "Cliquez pour ajouter un point · Clic droit pour terminer"}
                </div>
              )}

              {/* Barre d'outils à droite */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1.5">
                {selectedRouteInfo && !measurementEnabled && (
                  <button
                    title="Infos sommet"
                    onClick={() => { const s = !showSummitInfo; setShowSummitInfo(s); if (s) setShowDetails(true); }}
                    className={`relative group p-2.5 backdrop-blur border rounded-xl shadow-xl transition-all ${showSummitInfo ? "bg-orange-500 text-white border-orange-600" : "bg-white/90 border-slate-200 hover:bg-orange-500 hover:text-white"}`}
                  >
                    <Info className="h-4 w-4" />
                    <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Infos sommet</span>
                  </button>
                )}
                {selectedTiles.length > 0 && !selectedRouteInfo && !measurementEnabled && (
                  <button
                    title="Infos dalles"
                    onClick={() => { const s = !showTileInfo; setShowTileInfo(s); if (s) setShowDetails(true); }}
                    className={`relative group p-2.5 backdrop-blur border rounded-xl shadow-xl transition-all ${showTileInfo ? "bg-green-500 text-white border-green-600" : "bg-white/90 border-slate-200 hover:bg-green-500 hover:text-white"}`}
                  >
                    <Info className="h-4 w-4" />
                    <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Infos dalles</span>
                  </button>
                )}
                <button
                  title="Mesure"
                  onClick={() => { setMeasurementEnabled(!measurementEnabled); if (measurementEnabled) resetMeasurement(); }}
                  className={`relative group p-2.5 backdrop-blur border rounded-xl shadow-xl transition-all ${measurementEnabled ? "bg-blue-600 text-white border-blue-700" : "bg-white/90 border-slate-200 hover:bg-blue-600 hover:text-white"}`}
                >
                  <Ruler className="h-4 w-4" />
                  <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Mesure</span>
                </button>
              </div>

            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 lg:p-12 animate-in fade-in duration-700">
              <div className="max-w-2xl w-full text-center space-y-8">
                <div className="inline-flex p-6 border border-white/5 rounded-full bg-white/5 mb-4">
                  <CompassIcon className="h-12 w-12 text-blue-500/50 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-white text-2xl font-black uppercase tracking-tighter mb-2">Prêt pour l'exploration ?</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Sélectionnez un sommet dans le répertoire pour charger le relief 3D</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-blue-400"><MousePointer2 className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Rotation</span></div>
                    <p className="text-xs text-slate-400">Clic gauche maintenu ou <strong>MAJ + Clic</strong> pour pivoter autour du relief.</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-blue-400"><ZoomIn className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Zoom</span></div>
                    <p className="text-xs text-slate-400">Utilisez la <strong>molette</strong> de la souris pour plonger dans les détails.</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-orange-500"><Sun className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Lumière</span></div>
                    <p className="text-xs text-slate-400">Ajustez l'heure et l'exposition dans les <strong>paramètres d'Azimuth</strong>.</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-blue-400"><Move className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Panoramique</span></div>
                    <p className="text-xs text-slate-400">Utilisez le <strong>clic droit</strong> pour déplacer la caméra latéralement.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Panneau de droite : Mesure OU Infos sommet OU Dalles */}
        {((hasMeasurement && measurementEnabled) || (selectedRouteInfo && showSummitInfo) || (selectedTiles.length > 0 && !selectedSummitId && showTileInfo)) && showDetails && (
          <aside className="w-[340px] lg:w-[380px] flex-shrink-0 animate-in slide-in-from-right-4 duration-500 hidden lg:block">
            <div className="bg-white border border-slate-200 rounded-[2rem] h-full shadow-2xl flex flex-col overflow-hidden">
              <div className="p-6 lg:p-8 border-b border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    {(hasMeasurement && measurementEnabled) ? "Mesure de distance" : selectedRouteInfo ? "Détails Relief" : "Dalles sélectionnées"}
                  </span>
                  <button
                    onClick={() => { setShowDetails(false); setShowSummitInfo(false); setShowTileInfo(false); }}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
                  >
                    <X className="h-5 w-5 text-slate-300 group-hover:text-slate-600" />
                  </button>
                </div>
                {(hasMeasurement && measurementEnabled) ? (
                  <>
                    <h2 className="text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter">Mesure</h2>
                    <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-blue-600" /><p className="text-xl font-bold text-slate-900 uppercase tracking-tighter">{measurementData.points.length} points</p></div>
                  </>
                ) : selectedRouteInfo ? (
                  <>
                    <h2 className="text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter">{selectedRouteInfo.name.split("(")[0]}</h2>
                    <div className="flex items-center gap-2"><Mountain className="h-4 w-4 text-orange-500" /><p className="text-xl font-bold text-slate-900 uppercase tracking-tighter">{selectedRouteInfo.altitude}</p></div>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter">Sélection libre</h2>
                    <div className="flex items-center gap-2"><Grid3X3 className="h-4 w-4 text-green-600" /><p className="text-xl font-bold text-slate-900 uppercase tracking-tighter">{selectedTiles.length} dalle{selectedTiles.length > 1 ? "s" : ""}</p></div>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
                {/* Contenu Mesure */}
                {(hasMeasurement && measurementEnabled) ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-1.5 text-blue-400 mb-1"><Ruler className="h-3 w-3" /><span className="text-[9px] font-bold uppercase tracking-wider">Distance</span></div>
                        <p className="text-xl font-black text-slate-900">
                          {measurementData.distance !== null ? (measurementData.distance >= 1 ? `${measurementData.distance.toFixed(2)} km` : `${(measurementData.distance * 1000).toFixed(0)} m`) : "—"}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center gap-1.5 text-purple-400 mb-1"><ArrowUpDown className="h-3 w-3" /><span className="text-[9px] font-bold uppercase tracking-wider">Élévation</span></div>
                        <p className="text-xl font-black text-slate-900">
                          {measurementData.elevationDiff !== null ? `${Math.abs(Math.round(measurementData.elevationDiff))} m` : "—"}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                        <div className="flex items-center gap-1.5 text-orange-400 mb-1"><Mountain className="h-3 w-3" /><span className="text-[9px] font-bold uppercase tracking-wider">Pente moy.</span></div>
                        <p className="text-xl font-black text-slate-900">
                          {measurementData.slope !== null ? `${measurementData.slope.toFixed(1)}°` : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-orange-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-3"><Mountain className="h-3 w-3" /><span className="text-[9px] font-bold uppercase tracking-wider">Dénivelé</span></div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-[9px] text-slate-400 uppercase">Départ</p>
                          <p className="text-sm font-bold text-green-600">{measurementData.startPoint ? `${Math.round(measurementData.startPoint.altitude)} m` : "—"}</p>
                        </div>
                        <div className="flex-1 px-3">
                          <div className="h-0.5 bg-slate-200 relative">
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold ${measurementData.elevationDiff !== null && measurementData.elevationDiff > 0 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                              {measurementData.elevationDiff !== null ? `${measurementData.elevationDiff > 0 ? "+" : ""}${Math.round(measurementData.elevationDiff)}m` : "—"}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-slate-400 uppercase">Arrivée</p>
                          <p className="text-sm font-bold text-orange-600">{measurementData.endPoint ? `${Math.round(measurementData.endPoint.altitude)} m` : "—"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-slate-400 mb-3"><Mountain className="h-3 w-3" /><span className="text-[9px] font-bold uppercase tracking-wider">Profil altimétrique</span></div>
                      <ElevationProfilePanel profile={measurementData.elevationProfile} userPoints={measurementData.points} />
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-3"><Info className="h-3 w-3" /><span className="text-[9px] font-bold uppercase tracking-wider">Points de mesure</span></div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {measurementData.points.map((point, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] bg-white px-3 py-2 rounded-lg border border-slate-200">
                            <span className={`font-bold ${idx === 0 ? "text-green-600" : idx === measurementData.points.length - 1 ? "text-orange-600" : "text-blue-600"}`}>Point {idx + 1}</span>
                            <span className="text-slate-500">{Math.round(point.altitude)} m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : selectedRouteInfo ? (
                  /* Contenu Infos Sommet */
                  <>
                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Info className="h-3 w-3 text-blue-600" /> Description</h3>
                      <p className="text-sm leading-relaxed text-slate-700">{selectedRouteInfo.description || "Données topographiques en cours d'indexation."}</p>
                    </section>

                    {selectedRouteInfo.firstAscent && (
                      <section className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Mountain className="h-3 w-3 text-orange-500" /> Première ascension</h3>
                        <p className="text-sm text-slate-700 leading-relaxed">{selectedRouteInfo.firstAscent}</p>
                      </section>
                    )}

                    {selectedRouteInfo.waypoints && (
                      <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Points d'intérêt</h3>
                        <div className="space-y-3">
                          {selectedRouteInfo.waypoints.map((wp: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                              <span className="font-bold text-slate-700 uppercase">{wp.name}</span>
                              <span className="text-slate-400 italic">{wp.type}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {selectedRouteInfo.youtube && (
                      <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><span className="text-red-500">▶</span> Vidéo ascension</h3>
                        <a href={selectedRouteInfo.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors group">
                          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white text-lg leading-none">▶</span></div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-800">Regarder sur YouTube</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Ascension de {selectedRouteInfo.name.split("(")[0].trim()}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-slate-400 ml-auto group-hover:text-red-600 transition-colors" />
                        </a>
                      </section>
                    )}

                    {selectedRouteInfo.c2c && (
                      <a href={selectedRouteInfo.c2c} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-100 active:scale-95 group">
                        <div className="flex items-center gap-3"><CamptocampLogo /> <span>Fiche Camptocamp</span></div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </a>
                    )}
                  </>
                ) : (
                  /* Contenu Dalles */
                  <>
                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Info className="h-3 w-3 text-green-600" /> Dalles LiDAR HD</h3>
                      <p className="text-sm leading-relaxed text-slate-700">Vous visualisez des dalles de terrain sélectionnées librement depuis la carte interactive.</p>
                    </section>
                    <section className="bg-green-50 p-6 rounded-2xl border border-green-100">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-4">Dalles chargées</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedTiles.map((coord) => (
                          <div key={coord} className="flex items-center justify-between text-[11px] bg-white px-3 py-2 rounded-lg border border-green-200">
                            <span className="font-mono font-bold text-slate-700">{coord}</span>
                            <button onClick={() => setSelectedTiles(prev => prev.filter(c => c !== coord))} className="text-red-400 hover:text-red-600 text-[10px]">Retirer</button>
                          </div>
                        ))}
                      </div>
                    </section>
                    <button onClick={clearAllTiles} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-200">
                      Tout effacer
                    </button>
                  </>
                )}
              </div>

              <footer className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                IGN / Camptocamp / Wikipedia
              </footer>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
