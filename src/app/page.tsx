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
  Ruler
} from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import ThreeScene from "@/components/three/ThreeScene";
import Compass3D from "@/components/three/Compass3D";
import Link from "next/link";

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
          { id: "tour", name: "Aiguille du Tour (3540m)", altitude: "3540m", c2c: "https://www.camptocamp.org/waypoints/37508/fr/aiguille-du-tour", description: "Sommet très classique, point de vue exceptionnel sur le bassin d'Argentière.", dalles: [{ path: "meshes/1010_6552_11.drc", x: 1010, y: 6552 }] },
          { id: "chardonnet", name: "Aiguille du Chardonnet (3824m)", altitude: "3824m", c2c: "https://www.camptocamp.org/waypoints/37433/fr/aiguille-du-chardonnet", description: "Une des plus belles arêtes mixtes du massif : l'arête Forbes.", dalles: [{ path: "meshes/1009_6549_11.drc", x: 1009, y: 6549 }, { path: "meshes/1009_6550_11.drc", x: 1009, y: 6550 }, { path: "meshes/1010_6549_11.drc", x: 1010, y: 6549 }, { path: "meshes/1010_6550_11.drc", x: 1010, y: 6550 }, { path: "meshes/1011_6550_11.drc", x: 1011, y: 6550 }] },
        ],
      },
      {
        id: "secteur-verte-drus",
        name: "2. Secteur Verte - Drus - Droites",
        children: [
          { id: "verte", name: "Aiguille Verte (4122m)", altitude: "4122m", c2c: "https://www.camptocamp.org/waypoints/37435/fr/aiguille-verte", description: "L'aiguille Verte est un sommet mythique. Avant la Verte on est alpiniste, après la Verte on devient montagnard.", waypoints: [{name: "Couloir Whymper", type: "Couloir"}, {name: "Arête des Grands Montets", type: "Arête"}], dalles: [{ path: "meshes/1006_6545_11.drc", x: 1006, y: 6545 }, { path: "meshes/1006_6546_11.drc", x: 1006, y: 6546 }, { path: "meshes/1006_6547_11.drc", x: 1006, y: 6547 }, { path: "meshes/1007_6545_11.drc", x: 1007, y: 6545 }, { path: "meshes/1007_6546_11.drc", x: 1007, y: 6546 }, { path: "meshes/1007_6547_11.drc", x: 1007, y: 6547 }, { path: "meshes/1008_6546_11.drc", x: 1008, y: 6546 }] },
          { id: "drus", name: "Les Drus (3754m)", altitude: "3754m", c2c: "https://www.camptocamp.org/waypoints/37431/fr/les-drus", description: "Les Drus sont célèbres pour leur face Ouest vertigineuse et le Pilier Bonatti.", dalles: [{ path: "meshes/1006_6545_11.drc", x: 1006, y: 6545 }] },
          { id: "droites", name: "Les Droites (4001m)", altitude: "4001m", c2c: "https://www.camptocamp.org/waypoints/37434/fr/les-droites", description: "Un mur de glace et de roc dominant le bassin d'Argentière.", dalles: [{ path: "meshes/1008_6545_11.drc", x: 1008, y: 6545 }, { path: "meshes/1008_6546_11.drc", x: 1008, y: 6546 }, { path: "meshes/1009_6545_11.drc", x: 1009, y: 6545 }, { path: "meshes/1009_6546_11.drc", x: 1009, y: 6546 }] },
          { id: "courtes", name: "Les Courtes (3856m)", altitude: "3856m", c2c: "https://www.camptocamp.org/waypoints/37432/fr/les-courtes", description: "Célèbre pour sa face Nord rectiligne.", dalles: [{ path: "meshes/1009_6544_11.drc", x: 1009, y: 6544 }, { path: "meshes/1009_6545_11.drc", x: 1009, y: 6545 }, { path: "meshes/1010_6544_11.drc", x: 1010, y: 6544 }, { path: "meshes/1010_6545_11.drc", x: 1010, y: 6545 }] },
          { id: "moine", name: "Aiguille du Moine (3412m)", altitude: "3412m", c2c: "https://www.camptocamp.org/waypoints/37505/fr/aiguille-du-moine", dalles: [{ path: "meshes/1006_6543_11.drc", x: 1006, y: 6543 }, { path: "meshes/1006_6544_11.drc", x: 1006, y: 6544 }, { path: "meshes/1007_6543_11.drc", x: 1007, y: 6543 }, { path: "meshes/1007_6544_11.drc", x: 1007, y: 6544 }] },
        ],
      },
      {
        id: "secteur-aiguilles-chamonix",
        name: "3. Secteur Aiguilles de Chamonix",
        children: [
          { id: "midi", name: "Aiguille du Midi (3842m)", altitude: "3842m", c2c: "https://www.camptocamp.org/waypoints/37402/fr/aiguille-du-midi", dalles: [{ path: "meshes/1000_6539_11.drc", x: 1000, y: 6539 }, { path: "meshes/1001_6539_11.drc", x: 1001, y: 6539 }, { path: "meshes/1001_6540_11.drc", x: 1001, y: 6540 }] },
          { id: "plan", name: "Aiguille du Plan (3673m)", altitude: "3673m", c2c: "https://www.camptocamp.org/waypoints/37427/fr/aiguille-du-plan", dalles: [{ path: "meshes/1002_6540_11.drc", x: 1002, y: 6540 }, { path: "meshes/1002_6541_11.drc", x: 1002, y: 6541 }, { path: "meshes/1003_6540_11.drc", x: 1003, y: 6540 }, { path: "meshes/1003_6541_11.drc", x: 1003, y: 6541 }] },
          { id: "chamonix-needles", name: "Aiguilles de Chamonix", altitude: "3400m-3842m", dalles: [{ path: "meshes/1002_6541_11.drc", x: 1002, y: 6541 }, { path: "meshes/1002_6542_11.drc", x: 1002, y: 6542 }, { path: "meshes/1003_6541_11.drc", x: 1003, y: 6541 }, { path: "meshes/1003_6542_11.drc", x: 1003, y: 6542 }, { path: "meshes/1003_6543_11.drc", x: 1003, y: 6543 }, { path: "meshes/1004_6542_11.drc", x: 1004, y: 6542 }] },
        ],
      },
      {
        id: "secteur-mont-blanc",
        name: "4. Secteur Mont-Blanc",
        children: [
          { id: "mont-blanc", name: "Mont Blanc (4810m)", altitude: "4810m", c2c: "https://www.camptocamp.org/waypoints/37399/fr/mont-blanc", dalles: [{ path: "meshes/0999_6533_11.drc", x: 999, y: 6533 }, { path: "meshes/0999_6534_11.drc", x: 999, y: 6534 }, { path: "meshes/1000_6533_11.drc", x: 1000, y: 6533 }, { path: "meshes/1000_6534_11.drc", x: 1000, y: 6534 }] },
          { id: "tacul", name: "Mont Blanc du Tacul (4248m)", altitude: "4248m", c2c: "https://www.camptocamp.org/waypoints/37400/fr/mont-blanc-du-tacul", waypoints: [{name: "Pilier Gervasutti", type: "Sommet"}, {name: "Aiguilles du Diable", type: "Crête"}], dalles: [{ path: "meshes/1002_6536_11.drc", x: 1002, y: 6536 }, { path: "meshes/1002_6537_11.drc", x: 1002, y: 6537 }, { path: "meshes/1001_6536_11.drc", x: 1001, y: 6536 }, { path: "meshes/1001_6537_11.drc", x: 1001, y: 6537 }] },
          { id: "maudit", name: "Mont Maudit (4465m)", altitude: "4465m", dalles: [{ path: "meshes/1000_6535_11.drc", x: 1000, y: 6535 }, { path: "meshes/1000_6536_11.drc", x: 1000, y: 6536 }, { path: "meshes/1001_6536_11.drc", x: 1001, y: 6536 }] },
          { id: "dome-gouter", name: "Dôme du Goûter (4304m)", altitude: "4304m", dalles: [{ path: "meshes/0997_6534_11.drc", x: 997, y: 6534 }, { path: "meshes/0997_6535_11.drc", x: 997, y: 6535 }, { path: "meshes/0998_6534_11.drc", x: 998, y: 6534 }, { path: "meshes/0998_6535_11.drc", x: 998, y: 6535 }] },
        ],
      },
      {
        id: "secteur-geant-vallee-blanche",
        name: "5. Secteur Géant - Vallée Blanche",
        children: [
          { id: "geant", name: "Dent du Géant (4013m)", altitude: "4013m", dalles: [{ path: "meshes/1006_6537_11.drc", x: 1006, y: 6537 }] },
          { id: "rochefort", name: "Arête de Rochefort", altitude: "4001m", dalles: [{ path: "meshes/1006_6537_11.drc", x: 1006, y: 6537 }, { path: "meshes/1006_6538_11.drc", x: 1006, y: 6538 }, { path: "meshes/1007_6537_11.drc", x: 1007, y: 6537 }, { path: "meshes/1007_6538_11.drc", x: 1007, y: 6538 }] },
          { id: "tour-ronde", name: "Tour Ronde (3792m)", altitude: "3792m", dalles: [{ path: "meshes/1002_6535_11.drc", x: 1002, y: 6535 }, { path: "meshes/1003_6535_11.drc", x: 1003, y: 6535 }] },
          { id: "periades", name: "Les Périades (3549m)", altitude: "3549m", c2c: "https://www.camptocamp.org/waypoints/37520/fr/les-periades", description: "Crête acérée et très découpée s'étendant du Col du Tacul au Col du Mont Mallet.", dalles: [{ path: "meshes/1006_6539_11.drc", x: 1006, y: 6539 }, { path: "meshes/1006_6540_11.drc", x: 1006, y: 6540 }, { path: "meshes/1007_6539_11.drc", x: 1007, y: 6539 }, { path: "meshes/1007_6540_11.drc", x: 1007, y: 6540 }] },
          { id: "leschaux-geant", name: "Aiguille de Leschaux (3759m)", altitude: "3759m", c2c: "https://www.camptocamp.org/waypoints/37512/fr/aiguille-de-leschaux", description: "Vue depuis le secteur Géant, sur la crête entre Mont Dolent et Grandes Jorasses.", dalles: [{ path: "meshes/1006_6539_11.drc", x: 1006, y: 6539 }, { path: "meshes/1006_6540_11.drc", x: 1006, y: 6540 }, { path: "meshes/1007_6539_11.drc", x: 1007, y: 6539 }, { path: "meshes/1007_6540_11.drc", x: 1007, y: 6540 }] },
        ]
      },
      {
        id: "secteur-jorasses",
        name: "6. Secteur Grandes Jorasses",
        children: [
          { id: "jorasses", name: "Grandes Jorasses (4208m)", altitude: "4208m", c2c: "https://www.camptocamp.org/waypoints/37419/fr/grandes-jorasses", waypoints: [{name: "Pointe Walker", type: "Sommet"}, {name: "Éperon Walker", type: "Pilier"}], dalles: [{ path: "meshes/1008_6538_11.drc", x: 1008, y: 6538 }, { path: "meshes/1008_6539_11.drc", x: 1008, y: 6539 }, { path: "meshes/1009_6538_11.drc", x: 1009, y: 6538 }, { path: "meshes/1009_6539_11.drc", x: 1009, y: 6539 }] },
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
          { id: "meije", name: "La Meije (3984m)", altitude: "3984m", c2c: "https://www.camptocamp.org/waypoints/38988/fr/la-meije-grand-pic", description: "Sommet mythique des Alpes, dernière grande cime française à avoir été gravie.", dalles: [{ path: "meshes/0959_6439_11.drc", x: 959, y: 6439 }, { path: "meshes/0959_6440_11.drc", x: 959, y: 6440 }, { path: "meshes/0960_6439_11.drc", x: 960, y: 6439 }, { path: "meshes/0960_6440_11.drc", x: 960, y: 6440 }, { path: "meshes/0961_6439_11.drc", x: 961, y: 6439 }, { path: "meshes/0961_6440_11.drc", x: 961, y: 6440 }] },
          { id: "rateau", name: "Le Râteau (3809m)", altitude: "3809m", c2c: "https://www.camptocamp.org/waypoints/38989/fr/le-rateau", description: "Voisin de la Meije, offre une vue exceptionnelle sur le massif.", dalles: [{ path: "meshes/0957_6438_11.drc", x: 957, y: 6438 }, { path: "meshes/0958_6438_11.drc", x: 958, y: 6438 }, { path: "meshes/0958_6439_11.drc", x: 958, y: 6439 }] },
          { id: "pic-grave", name: "Pic de la Grave (3667m)", altitude: "3667m", description: "Sommet accessible depuis La Grave.", dalles: [{ path: "meshes/0956_6439_11.drc", x: 956, y: 6439 }, { path: "meshes/0956_6440_11.drc", x: 956, y: 6440 }] },
          { id: "gandoliere", name: "Tête de la Gandolière (3609m)", altitude: "3609m", description: "Belle vue sur le versant nord de la Meije.", dalles: [{ path: "meshes/0955_6439_11.drc", x: 955, y: 6439 }, { path: "meshes/0955_6440_11.drc", x: 955, y: 6440 }] },
          { id: "plaret", name: "Le Plaret (3563m)", altitude: "3563m", description: "Sommet voisin de la Gandolière.", dalles: [{ path: "meshes/0955_6438_11.drc", x: 955, y: 6438 }, { path: "meshes/0955_6439_11.drc", x: 955, y: 6439 }] },
          { id: "pic-geny", name: "Pic Gény (3423m)", altitude: "3423m", description: "Point de vue sur le glacier de la Girose.", dalles: [{ path: "meshes/0956_6437_11.drc", x: 956, y: 6437 }, { path: "meshes/0957_6437_11.drc", x: 957, y: 6437 }] },
          { id: "pic-gaspard", name: "Pic Gaspard (3883m)", altitude: "3883m", description: "Sommet proche de la Meije avec vue panoramique.", dalles: [{ path: "meshes/0958_6438_11.drc", x: 958, y: 6438 }, { path: "meshes/0958_6439_11.drc", x: 958, y: 6439 }] },
          { id: "combeynot", name: "Pic de Combeynot (3155m)", altitude: "3155m", description: "Sommet au-dessus du col du Lautaret.", dalles: [{ path: "meshes/0961_6437_11.drc", x: 961, y: 6437 }, { path: "meshes/0961_6438_11.drc", x: 961, y: 6438 }] },
          { id: "neige-cordier", name: "Pic de Neige Cordier (3614m)", altitude: "3614m", description: "Accessible depuis le glacier de la Plate des Agneaux.", dalles: [{ path: "meshes/0962_6436_11.drc", x: 962, y: 6436 }, { path: "meshes/0961_6437_11.drc", x: 961, y: 6437 }] },
        ],
      },
      {
        id: "secteur-ecrins",
        name: "2. Secteur Barre des Écrins",
        children: [
          { id: "barre-ecrins", name: "Barre des Écrins (4102m)", altitude: "4102m", c2c: "https://www.camptocamp.org/waypoints/38929/fr/barre-des-ecrins", description: "Point culminant du massif, 4000m le plus méridional des Alpes.", dalles: [{ path: "meshes/0964_6431_11.drc", x: 964, y: 6431 }, { path: "meshes/0964_6432_11.drc", x: 964, y: 6432 }, { path: "meshes/0965_6431_11.drc", x: 965, y: 6431 }, { path: "meshes/0965_6432_11.drc", x: 965, y: 6432 }] },
          { id: "dome-neige", name: "Dôme de Neige des Écrins (4015m)", altitude: "4015m", c2c: "https://www.camptocamp.org/waypoints/38930/fr/dome-de-neige-des-ecrins", description: "Le 4000m le plus accessible du massif.", dalles: [{ path: "meshes/0964_6431_11.drc", x: 964, y: 6431 }, { path: "meshes/0964_6432_11.drc", x: 964, y: 6432 }, { path: "meshes/0965_6431_11.drc", x: 965, y: 6431 }, { path: "meshes/0965_6432_11.drc", x: 965, y: 6432 }] },
          { id: "roche-faurio", name: "Roche Faurio (3730m)", altitude: "3730m", description: "Sommet classique, accès depuis le refuge des Écrins.", dalles: [{ path: "meshes/0957_6434_11.drc", x: 957, y: 6434 }, { path: "meshes/0958_6434_11.drc", x: 958, y: 6434 }] },
          { id: "pic-cavales", name: "Pic des Cavales (3385m)", altitude: "3385m", description: "Sommet rocheux au-dessus du pré de Mme Carle.", dalles: [{ path: "meshes/0964_6430_11.drc", x: 964, y: 6430 }, { path: "meshes/0965_6430_11.drc", x: 965, y: 6430 }] },
          { id: "roche-meane", name: "Roche Méane (3500m)", altitude: "3500m", description: "Sommet entre glacier Blanc et glacier Noir.", dalles: [{ path: "meshes/0963_6431_11.drc", x: 963, y: 6431 }, { path: "meshes/0964_6431_11.drc", x: 964, y: 6431 }] },
          { id: "agneaux", name: "Montagne des Agneaux (3664m)", altitude: "3664m", description: "Belle course glaciaire depuis le refuge du Pavé.", dalles: [{ path: "meshes/0958_6435_11.drc", x: 958, y: 6435 }, { path: "meshes/0958_6436_11.drc", x: 958, y: 6436 }] },
          { id: "pic-coolidge", name: "Pic Coolidge (3775m)", altitude: "3775m", description: "Nommé en hommage à l'alpiniste américain W.A.B. Coolidge.", dalles: [{ path: "meshes/0964_6430_11.drc", x: 964, y: 6430 }, { path: "meshes/0965_6430_11.drc", x: 965, y: 6430 }] },
        ],
      },
      {
        id: "secteur-pelvoux",
        name: "3. Secteur Pelvoux - Ailefroide",
        children: [
          { id: "pelvoux", name: "Mont Pelvoux (3946m)", altitude: "3946m", c2c: "https://www.camptocamp.org/waypoints/38925/fr/mont-pelvoux", description: "Longtemps considéré comme le point culminant du Dauphiné.", dalles: [{ path: "meshes/0964_6428_11.drc", x: 964, y: 6428 }, { path: "meshes/0964_6429_11.drc", x: 964, y: 6429 }, { path: "meshes/0965_6428_11.drc", x: 965, y: 6428 }, { path: "meshes/0965_6429_11.drc", x: 965, y: 6429 }] },
          { id: "ailefroide", name: "Ailefroide (3954m)", altitude: "3954m", c2c: "https://www.camptocamp.org/waypoints/38926/fr/ailefroide", description: "Troisième plus haut sommet du Dauphiné, trois pointes distinctes.", dalles: [{ path: "meshes/0964_6426_11.drc", x: 964, y: 6426 }, { path: "meshes/0964_6427_11.drc", x: 964, y: 6427 }, { path: "meshes/0964_6428_11.drc", x: 964, y: 6428 }, { path: "meshes/0965_6426_11.drc", x: 965, y: 6426 }, { path: "meshes/0965_6427_11.drc", x: 965, y: 6427 }, { path: "meshes/0965_6428_11.drc", x: 965, y: 6428 }] },
          { id: "pic-sans-nom", name: "Pic Sans Nom (3913m)", altitude: "3913m", description: "Entre le Pelvoux et l'Ailefroide sur une crête impressionnante.", dalles: [{ path: "meshes/0964_6428_11.drc", x: 964, y: 6428 }, { path: "meshes/0965_6428_11.drc", x: 965, y: 6428 }] },
          { id: "coup-sabre", name: "Pic du Coup de Sabre (3699m)", altitude: "3699m", description: "Arête acérée entre Ailefroide et Pelvoux.", dalles: [{ path: "meshes/0964_6428_11.drc", x: 964, y: 6428 }, { path: "meshes/0965_6428_11.drc", x: 965, y: 6428 }] },
          { id: "pointe-sele", name: "Pointe du Sélé (3557m)", altitude: "3557m", description: "Dominant le glacier du Sélé.", dalles: [{ path: "meshes/0964_6427_11.drc", x: 964, y: 6427 }, { path: "meshes/0965_6427_11.drc", x: 965, y: 6427 }] },
          { id: "pic-temple", name: "Pic de la Temple (3682m)", altitude: "3682m", description: "Sommet élancé du secteur sud.", dalles: [{ path: "meshes/0964_6429_11.drc", x: 964, y: 6429 }, { path: "meshes/0965_6429_11.drc", x: 965, y: 6429 }] },
          { id: "pic-paveoux", name: "Pic des Pavéous (3548m)", altitude: "3548m", description: "Vue panoramique sur le vallon de Claphouse.", dalles: [{ path: "meshes/0964_6427_11.drc", x: 964, y: 6427 }] },
          { id: "grande-sagne", name: "Pointe de la Grande Sagne (3660m)", altitude: "3660m", description: "Accès depuis le refuge du Sélé.", dalles: [{ path: "meshes/0964_6427_11.drc", x: 964, y: 6427 }, { path: "meshes/0965_6427_11.drc", x: 965, y: 6427 }] },
        ],
      },
      {
        id: "secteur-valgaudemar",
        name: "4. Secteur Valgaudemar - Olan",
        children: [
          { id: "olan", name: "L'Olan (3564m)", altitude: "3564m", c2c: "https://www.camptocamp.org/waypoints/38955/fr/l-olan", description: "Sommet majestueux dominant le Valgaudemar, face nord mythique.", dalles: [{ path: "meshes/0948_6423_11.drc", x: 948, y: 6423 }, { path: "meshes/0952_6423_11.drc", x: 952, y: 6423 }] },
          { id: "les-bans", name: "Les Bans (3669m)", altitude: "3669m", description: "Sommet élancé, course classique du Valgaudemar.", dalles: [{ path: "meshes/0957_6424_11.drc", x: 957, y: 6424 }] },
          { id: "les-rouies", name: "Les Rouies (3589m)", altitude: "3589m", description: "Sommet rocheux au-dessus du vallon de la Pilatte.", dalles: [{ path: "meshes/0955_6434_11.drc", x: 955, y: 6434 }, { path: "meshes/0955_6435_11.drc", x: 955, y: 6435 }] },
          { id: "pointe-guyard", name: "Pointe Guyard (3461m)", altitude: "3461m", description: "Sommet voisin de l'Olan.", dalles: [{ path: "meshes/0948_6423_11.drc", x: 948, y: 6423 }] },
          { id: "boeufs-rouges", name: "Pointe des Boeufs Rouges (3517m)", altitude: "3517m", description: "Entre le Valgaudemar et le Vénéon.", dalles: [{ path: "meshes/0955_6434_11.drc", x: 955, y: 6434 }] },
          { id: "cime-orgieres", name: "Cime d'Orgières (2755m)", altitude: "2755m", description: "Sommet accessible en randonnée.", dalles: [{ path: "meshes/0952_6423_11.drc", x: 952, y: 6423 }] },
          { id: "sirac", name: "Le Sirac (3441m)", altitude: "3441m", description: "Sentinelle sud du Valgaudemar.", dalles: [{ path: "meshes/0948_6423_11.drc", x: 948, y: 6423 }] },
        ],
      },
      {
        id: "secteur-muzelle",
        name: "5. Secteur Muzelle - Vénéon",
        children: [
          { id: "muzelle", name: "La Muzelle (3465m)", altitude: "3465m", description: "Belle pyramide rocheuse au-dessus du lac de la Muzelle.", dalles: [{ path: "meshes/0955_6438_11.drc", x: 955, y: 6438 }, { path: "meshes/0955_6439_11.drc", x: 955, y: 6439 }] },
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
          { id: "pic-mouches", name: "Pic des Mouches (1011m)", altitude: "1011m", description: "Point culminant de la Montagne Sainte-Victoire, célèbre par les peintures de Cézanne.", dalles: [{ path: "meshes/0895_6238_11.drc", x: 895, y: 6238 }, { path: "meshes/0896_6238_11.drc", x: 896, y: 6238 }] },
          { id: "signal", name: "Le Signal (943m)", altitude: "943m", description: "Sommet visible depuis Aix-en-Provence avec la Croix de Provence.", dalles: [{ path: "meshes/0893_6238_11.drc", x: 893, y: 6238 }, { path: "meshes/0894_6238_11.drc", x: 894, y: 6238 }] },
          { id: "bau-cezanne", name: "Bau Cézanne (900m)", altitude: "900m", description: "Belvédère offrant une vue sur le versant sud de la montagne.", dalles: [{ path: "meshes/0894_6238_11.drc", x: 894, y: 6238 }, { path: "meshes/0894_6239_11.drc", x: 894, y: 6239 }] },
          { id: "plan-crau", name: "Plan de la Crau (850m)", altitude: "850m", description: "Plateau sommital entre le Signal et le Pic des Mouches.", dalles: [{ path: "meshes/0894_6238_11.drc", x: 894, y: 6238 }, { path: "meshes/0895_6238_11.drc", x: 895, y: 6238 }] },
        ],
      },
    ],
  },
];

function Compass() {
  const { cameraRotation } = useAppContext();
  return (
    <div className="absolute bottom-8 right-8 z-50">
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('reset-camera-north'))}
        className="w-20 h-20 bg-white/90 backdrop-blur border border-slate-200 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-1 border border-slate-100 rounded-full" />
          <div 
            className="relative w-1 h-14 flex flex-col items-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${- (cameraRotation?.y || 0)}rad)` }}
          >
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[28px] border-b-red-600 drop-shadow-sm" />
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[28px] border-t-slate-800 drop-shadow-sm" />
            <span className="absolute -top-5 text-[11px] font-black text-red-600">N</span>
          </div>
          <div className="absolute w-2 h-2 bg-white border-2 border-slate-400 rounded-full shadow-inner" />
        </div>
      </button>
    </div>
  );
}

// Identifie si c'est un massif racine (niveau 0)
const ROOT_MASSIF_IDS = ["massif-mont-blanc", "massif-ecrins", "massif-sainte-victoire"];

// Composant pour le profil altimétrique détaillé avec tous les points de mesure
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

    // Générer les points SVG normalisés
    const points = profile.map(p => {
      const x = (p.distance / maxDist) * 100;
      const y = 100 - ((p.altitude - minAlt) / altRange) * 85 - 7.5;
      return { x, y, distance: p.distance, altitude: p.altitude };
    });

    // Path pour la ligne (courbe lissée avec les vraies données du terrain)
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    // Path pour le remplissage
    const areaPath = `M 0,100 L 0,${points[0].y} ` +
      points.map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L 100,${points[points.length - 1].y} L 100,100 Z`;

    // Trouver les indices des points utilisateur dans le profil
    // On cherche les points où la distance correspond à un point de mesure
    const userPointsInProfile: { x: number; y: number; index: number }[] = [];
    if (userPoints && userPoints.length > 0) {
      // Le premier point est à distance 0
      userPointsInProfile.push({ ...points[0], index: 0 });

      // Les points intermédiaires et le dernier
      if (userPoints.length > 1) {
        // On distribue les points uniformément sur la distance
        const distPerPoint = maxDist / (userPoints.length - 1);
        for (let i = 1; i < userPoints.length; i++) {
          const targetDist = distPerPoint * i;
          // Trouver le point le plus proche dans le profil
          let closestIdx = 0;
          let closestDiff = Infinity;
          for (let j = 0; j < points.length; j++) {
            const diff = Math.abs(points[j].distance - targetDist);
            if (diff < closestDiff) {
              closestDiff = diff;
              closestIdx = j;
            }
          }
          userPointsInProfile.push({ ...points[closestIdx], index: i });
        }
      }
    }

    return {
      points,
      linePath,
      areaPath,
      minAlt: Math.round(minAlt),
      maxAlt: Math.round(maxAlt),
      maxDist: Math.round(maxDist),
      altRange: Math.round(altRange),
      userPointsInProfile
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
      {/* Infos du graphique */}
      <div className="flex justify-between text-[9px] text-slate-400 mb-2">
        <span>Dénivelé : {chartData.altRange}m</span>
        <span>Distance : {chartData.maxDist}m</span>
      </div>

      {/* Graphique */}
      <div className="relative">
        {/* Labels Y-axis */}
        <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[8px] text-slate-400 pr-1">
          <span className="text-right">{chartData.maxAlt}m</span>
          <span className="text-right">{Math.round((chartData.maxAlt + chartData.minAlt) / 2)}m</span>
          <span className="text-right">{chartData.minAlt}m</span>
        </div>

        {/* Chart area */}
        <div className="ml-11 h-40 bg-gradient-to-b from-amber-50/50 via-slate-50 to-emerald-50/30 rounded-lg overflow-hidden border border-slate-200">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            {/* Grille horizontale */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="2,2" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="2,2" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="2,2" />

            {/* Grille verticale */}
            <line x1="25" y1="0" x2="25" y2="100" stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="2,2" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="2,2" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="2,2" />

            {/* Zone de remplissage - effet terrain */}
            <path
              d={chartData.areaPath}
              fill="url(#terrainGradient)"
              opacity="0.7"
            />

            {/* Ligne du profil - aspérités du terrain réel */}
            <path
              d={chartData.linePath}
              fill="none"
              stroke="#78716c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Tous les points de mesure utilisateur */}
            {chartData.userPointsInProfile.map((p, i) => (
              <g key={i}>
                {/* Ligne verticale pour marquer le point */}
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2="100"
                  stroke={i === 0 ? "#22c55e" : i === chartData.userPointsInProfile.length - 1 ? "#ef4444" : "#3b82f6"}
                  strokeWidth="0.5"
                  strokeDasharray="1,1"
                  opacity="0.5"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Point */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="2.5"
                  fill={i === 0 ? "#22c55e" : i === chartData.userPointsInProfile.length - 1 ? "#ef4444" : "#3b82f6"}
                  stroke="white"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}

            {/* Gradient definition - effet terrain montagneux */}
            <defs>
              <linearGradient id="terrainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a8a29e" stopOpacity="0.6" />
                <stop offset="30%" stopColor="#78716c" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#57534e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#44403c" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Labels X-axis */}
        <div className="ml-11 flex justify-between text-[8px] text-slate-400 mt-1">
          <span>0m</span>
          <span>{Math.round(chartData.maxDist / 4)}m</span>
          <span>{Math.round(chartData.maxDist / 2)}m</span>
          <span>{Math.round(chartData.maxDist * 3 / 4)}m</span>
          <span>{chartData.maxDist}m</span>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[9px] text-slate-500 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Départ</span>
        </div>
        {userPoints && userPoints.length > 2 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Points ({userPoints.length - 2})</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Arrivée</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-stone-500 rounded" />
          <span>Relief</span>
        </div>
      </div>
    </div>
  );
}

function TreeElement({ item, selectedIds, onToggle, level = 0 }: any) {
  // Les massifs racines sont repliés par défaut, les autres ouverts
  const [isOpen, setIsOpen] = useState(level > 0);
  const isBranch = item.children && item.children.length > 0;
  const isSelected = selectedIds.includes(item.id);
  const isRootMassif = ROOT_MASSIF_IDS.includes(item.id);

  return (
    <div className="select-none w-full">
      <div
        className={`flex items-center py-2 px-3 rounded-xl cursor-pointer transition-all ${isBranch ? "hover:bg-slate-50" : "hover:bg-slate-100 group"} ${isSelected && !isBranch ? "bg-slate-900 shadow-lg" : ""}`}
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
          {item.children.map((child: any) => <TreeElement key={child.id} item={child} selectedIds={selectedIds} onToggle={onToggle} level={level + 1} />)}
        </div>
      )}
    </div>
  );
}

// Interface pour les dalles disponibles
interface AvailableTile {
  id: string;
  name: string;
  url: string;
  x: number;
  y: number;
}

function HomePageContent() {
  const { selectedModels, setSelectedModels, selectedTiles, setSelectedTiles, measurementEnabled, setMeasurementEnabled, measurementData } = useAppContext();
  const [showHelp, setShowHelp] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showSummitInfo, setShowSummitInfo] = useState(false); // Contrôle l'affichage des infos du sommet
  const [showTilesPanel, setShowTilesPanel] = useState(false);
  const [availableTiles, setAvailableTiles] = useState<AvailableTile[]>([]);
  const [tilesLoading, setTilesLoading] = useState(false);

  // Vérifier si on a une mesure avec au moins 2 points
  const hasMeasurement = measurementData.points.length >= 2;

  // Afficher automatiquement le panneau dès qu'on a 2 points de mesure
  useEffect(() => {
    if (hasMeasurement && measurementEnabled) {
      setShowDetails(true);
    }
  }, [hasMeasurement, measurementEnabled]);

  // Charger les dalles disponibles depuis l'API
  useEffect(() => {
    if (showTilesPanel && availableTiles.length === 0) {
      setTilesLoading(true);
      fetch('/api/tiles')
        .then(res => res.json())
        .then(geojson => {
          const tiles = geojson.features?.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            url: f.properties.url,
            x: f.properties.x / 1000, // Convertir en km
            y: f.properties.y / 1000,
          })) || [];
          setAvailableTiles(tiles);
          setTilesLoading(false);
        })
        .catch(err => {
          console.error('Erreur chargement dalles:', err);
          setTilesLoading(false);
        });
    }
  }, [showTilesPanel, availableTiles.length]);

  const selectedRouteInfo = useMemo(() => {
    if (!selectedModels || selectedModels.length === 0) return null;
    const targetId = selectedModels[0];
    let found: any = null;

    const findDeep = (nodes: any[]) => {
      if (!nodes || !Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (found) return;
        if (!node) continue;
        if (node.id === targetId) { found = node; return; }
        if (node.children) findDeep(node.children);
      }
    };

    findDeep(MOUNTAIN_TREE);
    return found;
  }, [selectedModels]);

  // Modèles 3D depuis les sommets sélectionnés
  const threeModelsFromSummits = useMemo(() => {
    if (!selectedRouteInfo || !selectedRouteInfo.dalles) return [];
    return selectedRouteInfo.dalles.map((d: any) => ({
      id: selectedRouteInfo.id,
      name: selectedRouteInfo.name,
      url: `/api/tiles?path=${encodeURIComponent(d.path)}`,
      format: "drc" as const,
      x: d.x,
      y: d.y,
    }));
  }, [selectedRouteInfo]);

  // Modèles 3D depuis les dalles sélectionnées directement (via ZonesDispos ou panneau)
  const threeModelsFromTiles = useMemo(() => {
    if (!selectedTiles || selectedTiles.length === 0) return [];
    return selectedTiles.map((url: string, index: number) => {
      // Extraire les coordonnées et le path du nom de fichier
      // URL peut être soit un S3 URL complet soit un path local
      const match = url.match(/(\d{3,4})_(\d{4})_(\d+)\.drc/);
      const x = match ? parseInt(match[1]) : 0;
      const y = match ? parseInt(match[2]) : 0;
      const variant = match ? match[3] : index.toString();
      const tileId = `tile-${x}-${y}-${variant}`;

      // Extraire le path pour utiliser le proxy API (eviter CORS)
      // Format: meshes/XXXX_YYYY_VV.drc
      const pathMatch = url.match(/meshes\/\d{3,4}_\d{4}_\d+\.drc/);
      const path = pathMatch ? pathMatch[0] : null;
      const proxyUrl = path ? `/api/tiles?path=${encodeURIComponent(path)}` : url;

      return {
        id: tileId,
        name: `Dalle ${x}_${y}`,
        url: proxyUrl,
        format: "drc" as const,
        x: x,
        y: y,
      };
    });
  }, [selectedTiles]);

  // Combiner les deux sources de modèles
  const threeModels = useMemo(() => {
    if (threeModelsFromSummits.length > 0) return threeModelsFromSummits;
    return threeModelsFromTiles;
  }, [threeModelsFromSummits, threeModelsFromTiles]);

  // IDs effectifs pour le rendu (sommets ou dalles directes)
  const effectiveSelectedModels = useMemo(() => {
    if (selectedModels.length > 0) return selectedModels;
    // Pour les dalles directes, on utilise leurs IDs
    return threeModelsFromTiles.map(m => m.id);
  }, [selectedModels, threeModelsFromTiles]);

  const handleToggle = (id: string) => {
    // Désélectionner les dalles directes quand on sélectionne un sommet
    setSelectedTiles([]);
    setSelectedModels(selectedModels.includes(id) ? [] : [id]);
    // Désactiver la mesure quand on sélectionne un sommet
    setMeasurementEnabled(false);
  };

  const handleTileToggle = (url: string) => {
    // Désélectionner les sommets quand on sélectionne une dalle
    setSelectedModels([]);
    setSelectedTiles((prev: string[]) =>
      prev.includes(url)
        ? prev.filter((u: string) => u !== url)
        : prev.length < 20 ? [...prev, url] : prev
    );
  };

  const clearAllTiles = () => {
    setSelectedTiles([]);
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col p-4 gap-3 overflow-hidden">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <header className="flex-shrink-0 p-5 flex items-center justify-between bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tighter uppercase leading-none">Topographies <span className="text-blue-600 font-black">3D</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Explorateur de Massif</p>
          </div>
          <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
             <HelpCircle className="h-3.5 w-3.5" /> Aide à la navigation 3D
          </button>
      </header>

      <main className="flex-1 flex gap-3 overflow-hidden">
        <aside className="w-[300px] flex-shrink-0 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
          <p className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-3 flex items-center gap-2"><Mountain className="h-3 w-3 text-orange-500" /> Répertoire</p>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-light">
            {MOUNTAIN_TREE.map((root) => (
              <TreeElement key={root.id} item={root} selectedIds={selectedModels} onToggle={handleToggle} />
            ))}

            {/* Séparateur */}
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
                  <span className="text-[12px] font-bold uppercase tracking-tight text-slate-900">Dalles disponibles</span>
                </div>
                {selectedTiles.length > 0 && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {selectedTiles.length}
                  </span>
                )}
              </div>

              {showTilesPanel && (
                <div className="ml-4 border-l-2 border-slate-100 pl-2 mt-1">
                  {/* Lien vers la carte */}
                  <Link
                    href="/zonesdispos"
                    className="flex items-center gap-2 py-2 px-3 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <MapIcon className="h-3 w-3" />
                    <span className="font-medium">Ouvrir la carte interactive</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Link>

                  {/* Dalles sélectionnées */}
                  {selectedTiles.length > 0 && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-green-700 uppercase">Sélection actuelle</span>
                        <button
                          onClick={clearAllTiles}
                          className="text-[9px] text-red-500 hover:text-red-700 font-medium"
                        >
                          Tout effacer
                        </button>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {selectedTiles.map((url: string) => {
                          const match = url.match(/(\d{3,4})_(\d{4})_\d+\.drc/);
                          const name = match ? `${match[1]}_${match[2]}` : url.split('/').pop();
                          return (
                            <div
                              key={url}
                              className="flex items-center justify-between text-[10px] bg-white px-2 py-1 rounded border border-green-200"
                            >
                              <span className="font-mono text-slate-700">{name}</span>
                              <button
                                onClick={() => handleTileToggle(url)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Liste des dalles */}
                  {tilesLoading ? (
                    <p className="text-[10px] text-slate-400 py-2 px-3">Chargement...</p>
                  ) : (
                    <div className="mt-2 max-h-48 overflow-y-auto">
                      {availableTiles.slice(0, 100).map((tile, index) => {
                        const isSelected = selectedTiles.includes(tile.url);
                        return (
                          <div
                            key={`${tile.id}-${index}`}
                            className={`flex items-center py-1.5 px-3 rounded-lg cursor-pointer transition-all text-[11px] ${
                              isSelected
                                ? "bg-green-100 text-green-800"
                                : "hover:bg-slate-50 text-slate-600"
                            }`}
                            onClick={() => handleTileToggle(tile.url)}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-3.5 w-3.5 mr-2 text-green-600" />
                            ) : (
                              <Square className="h-3.5 w-3.5 mr-2 text-slate-300" />
                            )}
                            <span className="font-mono">{tile.name}</span>
                          </div>
                        );
                      })}
                      {availableTiles.length > 100 && (
                        <p className="text-[10px] text-slate-400 py-2 px-3 text-center">
                          + {availableTiles.length - 100} autres dalles...
                          <br />
                          <Link href="/zonesdispos" className="text-blue-500 hover:underline">
                            Voir sur la carte
                          </Link>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex-1 relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800">
            {threeModels.length > 0 ? (
                <>
                    <ThreeScene models={threeModels} selectedModels={effectiveSelectedModels} />
                    {/* Barre d'outils en haut à droite */}
                    <div className="absolute top-6 right-6 z-40 flex gap-2">
                        {/* Bouton Infos sur le sommet - visible uniquement si un sommet est sélectionné */}
                        {selectedRouteInfo && !measurementEnabled && (
                          <button
                              onClick={() => {
                                const newState = !showSummitInfo;
                                setShowSummitInfo(newState);
                                if (newState) setShowDetails(true); // S'assurer que le panneau est visible
                              }}
                              className={`flex items-center gap-2 px-4 py-3 backdrop-blur border rounded-xl shadow-xl transition-all group ${
                                showSummitInfo
                                  ? "bg-orange-500 text-white border-orange-600"
                                  : "bg-white/90 border-slate-200 hover:bg-orange-500 hover:text-white"
                              }`}
                          >
                              <Info className={`h-4 w-4 ${showSummitInfo ? "text-white" : "text-orange-500 group-hover:text-white"}`} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Infos sommet</span>
                          </button>
                        )}
                        <button
                            onClick={() => setMeasurementEnabled(!measurementEnabled)}
                            className={`flex items-center gap-2 px-4 py-3 backdrop-blur border rounded-xl shadow-xl transition-all group ${
                              measurementEnabled
                                ? "bg-blue-600 text-white border-blue-700"
                                : "bg-white/90 border-slate-200 hover:bg-blue-600 hover:text-white"
                            }`}
                        >
                            <Ruler className={`h-4 w-4 ${measurementEnabled ? "text-white" : "text-blue-600 group-hover:text-white"}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Mesure</span>
                        </button>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('reset-camera'))}
                            className="flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-xl hover:bg-blue-600 hover:text-white transition-all group"
                        >
                            <Move className="h-4 w-4 text-blue-600 group-hover:text-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Réinitialiser</span>
                        </button>
                    </div>
                    {/* Boussole 3D */}
                    <Compass3D />
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
                                <div className="flex items-center gap-3 mb-2 text-blue-400">
                                    <MousePointer2 className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Rotation</span>
                                </div>
                                <p className="text-xs text-slate-400">Clic gauche maintenu ou <strong>MAJ + Clic</strong> pour pivoter autour du relief.</p>
                            </div>
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-2 text-blue-400">
                                    <ZoomIn className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Zoom</span>
                                </div>
                                <p className="text-xs text-slate-400">Utilisez la <strong>molette</strong> de la souris pour plonger dans les détails.</p>
                            </div>
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-2 text-orange-500">
                                    <Sun className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Lumière</span>
                                </div>
                                <p className="text-xs text-slate-400">Ajustez l'heure et l'exposition dans les <strong>paramètres d'Azimuth</strong>.</p>
                            </div>
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-2 text-blue-400">
                                    <Move className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-widest">Panoramique</span>
                                </div>
                                <p className="text-xs text-slate-400">Utilisez le <strong>clic droit</strong> pour déplacer la caméra latéralement.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>

        {/* Panneau de droite : Mesure OU Infos sommet OU Dalles */}
        {((hasMeasurement && measurementEnabled) || (selectedRouteInfo && showSummitInfo) || (selectedTiles.length > 0 && !selectedRouteInfo)) && showDetails && (
          <aside className="w-[380px] flex-shrink-0 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white border border-slate-200 rounded-[2rem] h-full shadow-2xl flex flex-col overflow-hidden">
              {/* Header du panneau */}
              <div className="p-8 border-b border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    {(hasMeasurement && measurementEnabled) ? "Mesure de distance" : selectedRouteInfo ? "Détails Relief" : "Dalles sélectionnées"}
                  </span>
                  <button onClick={() => { setShowDetails(false); setShowSummitInfo(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors group"><X className="h-5 w-5 text-slate-300 group-hover:text-slate-600" /></button>
                </div>
                {(hasMeasurement && measurementEnabled) ? (
                  <>
                    <h2 className="text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter">Mesure</h2>
                    <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-blue-600" /><p className="text-xl font-bold text-slate-900 uppercase tracking-tighter">{measurementData.points.length} points</p></div>
                  </>
                ) : selectedRouteInfo ? (
                  <>
                    <h2 className="text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter">{selectedRouteInfo.name.split('(')[0]}</h2>
                    <div className="flex items-center gap-2"><Mountain className="h-4 w-4 text-orange-500" /><p className="text-xl font-bold text-slate-900 uppercase tracking-tighter">{selectedRouteInfo.altitude}</p></div>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter">Sélection libre</h2>
                    <div className="flex items-center gap-2"><Grid3X3 className="h-4 w-4 text-green-600" /><p className="text-xl font-bold text-slate-900 uppercase tracking-tighter">{selectedTiles.length} dalle{selectedTiles.length > 1 ? 's' : ''}</p></div>
                  </>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar-light">
                {/* Contenu Mesure */}
                {(hasMeasurement && measurementEnabled) ? (
                  <>
                    {/* Stats principales */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                          <Ruler className="h-3 w-3" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Distance</span>
                        </div>
                        <p className="text-xl font-black text-slate-900">
                          {measurementData.distance !== null
                            ? (measurementData.distance >= 1 ? `${measurementData.distance.toFixed(2)} km` : `${(measurementData.distance * 1000).toFixed(0)} m`)
                            : "—"}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                        <div className="flex items-center gap-1.5 text-orange-400 mb-1">
                          <Mountain className="h-3 w-3" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Pente moy.</span>
                        </div>
                        <p className="text-xl font-black text-slate-900">
                          {measurementData.slope !== null ? `${measurementData.slope.toFixed(1)}°` : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Dénivelé */}
                    <div className="bg-gradient-to-r from-green-50 to-orange-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-3">
                        <Mountain className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Dénivelé</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-[9px] text-slate-400 uppercase">Départ</p>
                          <p className="text-sm font-bold text-green-600">{measurementData.startPoint ? `${Math.round(measurementData.startPoint.altitude)} m` : "—"}</p>
                        </div>
                        <div className="flex-1 px-3">
                          <div className="h-0.5 bg-slate-200 relative">
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold ${
                              measurementData.elevationDiff !== null && measurementData.elevationDiff > 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {measurementData.elevationDiff !== null
                                ? `${measurementData.elevationDiff > 0 ? '+' : ''}${Math.round(measurementData.elevationDiff)}m`
                                : '—'
                              }
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-slate-400 uppercase">Arrivée</p>
                          <p className="text-sm font-bold text-orange-600">{measurementData.endPoint ? `${Math.round(measurementData.endPoint.altitude)} m` : "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Profil altimétrique */}
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-400 mb-3">
                        <Mountain className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Profil altimétrique</span>
                      </div>
                      <ElevationProfilePanel profile={measurementData.elevationProfile} userPoints={measurementData.points} />
                    </div>

                    {/* Liste des points */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-3">
                        <Info className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Points de mesure</span>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {measurementData.points.map((point, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] bg-white px-3 py-2 rounded-lg border border-slate-200">
                            <span className={`font-bold ${idx === 0 ? 'text-green-600' : idx === measurementData.points.length - 1 ? 'text-orange-600' : 'text-blue-600'}`}>
                              Point {idx + 1}
                            </span>
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
                    {selectedRouteInfo.c2c && (
                        <a href={selectedRouteInfo.c2c} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-100 active:scale-95 group">
                            <div className="flex items-center gap-3"><CamptocampLogo /> <span>Fiche Camptocamp</span></div>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">→</span>
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
                            {selectedTiles.map((url: string) => {
                              const match = url.match(/(\d{3,4})_(\d{4})_\d+\.drc/);
                              const name = match ? `${match[1]}_${match[2]}` : url.split('/').pop();
                              return (
                                <div key={url} className="flex items-center justify-between text-[11px] bg-white px-3 py-2 rounded-lg border border-green-200">
                                    <span className="font-mono font-bold text-slate-700">{name}</span>
                                    <button onClick={() => handleTileToggle(url)} className="text-red-400 hover:text-red-600 text-[10px]">Retirer</button>
                                </div>
                              );
                            })}
                        </div>
                    </section>
                    <button
                      onClick={clearAllTiles}
                      className="w-full p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-200"
                    >
                      Tout effacer
                    </button>
                  </>
                )}
              </div>
              <footer className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">IGN / Camptocamp / Wikipedia</footer>
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