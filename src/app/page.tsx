"use client";

import { useState, useMemo, Suspense } from "react";
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
  Sun
} from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import ThreeScene from "@/components/three/ThreeScene";

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
          { id: "tour", name: "Aiguille du Tour (3540m)", altitude: "3540m", c2c: "https://www.camptocamp.org/waypoints/37508/fr/aiguille-du-tour", description: "Sommet très classique, point de vue exceptionnel sur le bassin d'Argentière.", dalles: [{ path: "meshes/1010_6552.drc", x: 1010, y: 6552 }] },
          { id: "chardonnet", name: "Aiguille du Chardonnet (3824m)", altitude: "3824m", c2c: "https://www.camptocamp.org/waypoints/37433/fr/aiguille-du-chardonnet", description: "Une des plus belles arêtes mixtes du massif : l'arête Forbes.", dalles: [{ path: "meshes/1009_6549.drc", x: 1009, y: 6549 }, { path: "meshes/1009_6550.drc", x: 1009, y: 6550 }, { path: "meshes/1010_6549.drc", x: 1010, y: 6549 }, { path: "meshes/1010_6550.drc", x: 1010, y: 6550 }, { path: "meshes/1011_6550.drc", x: 1011, y: 6550 }] },
        ],
      },
      {
        id: "secteur-verte-drus",
        name: "2. Secteur Verte - Drus - Droites",
        children: [
          { id: "verte", name: "Aiguille Verte (4122m)", altitude: "4122m", c2c: "https://www.camptocamp.org/waypoints/37435/fr/aiguille-verte", description: "L'aiguille Verte est un sommet mythique. Avant la Verte on est alpiniste, après la Verte on devient montagnard.", waypoints: [{name: "Couloir Whymper", type: "Couloir"}, {name: "Arête des Grands Montets", type: "Arête"}], dalles: [{ path: "meshes/1006_6545-12.drc", x: 1006, y: 6545 }, { path: "meshes/1006_6546.drc", x: 1006, y: 6546 }, { path: "meshes/1006_6547.drc", x: 1006, y: 6547 }, { path: "meshes/1007_6545.drc", x: 1007, y: 6545 }, { path: "meshes/1007_6546.drc", x: 1007, y: 6546 }, { path: "meshes/1007_6547.drc", x: 1007, y: 6547 }, { path: "meshes/1008_6546.drc", x: 1008, y: 6546 }] },
          { id: "drus", name: "Les Drus (3754m)", altitude: "3754m", c2c: "https://www.camptocamp.org/waypoints/37431/fr/les-drus", description: "Les Drus sont célèbres pour leur face Ouest vertigineuse et le Pilier Bonatti.", dalles: [{ path: "meshes/1006_6545-12.drc", x: 1006, y: 6545 }] },
          { id: "droites", name: "Les Droites (4001m)", altitude: "4001m", c2c: "https://www.camptocamp.org/waypoints/37434/fr/les-droites", description: "Un mur de glace et de roc dominant le bassin d'Argentière.", dalles: [{ path: "meshes/1008_6545.drc", x: 1008, y: 6545 }, { path: "meshes/1008_6546.drc", x: 1008, y: 6546 }, { path: "meshes/1009_6545.drc", x: 1009, y: 6545 }, { path: "meshes/1009_6546.drc", x: 1009, y: 6546 }] },
          { id: "courtes", name: "Les Courtes (3856m)", altitude: "3856m", c2c: "https://www.camptocamp.org/waypoints/37432/fr/les-courtes", description: "Célèbre pour sa face Nord rectiligne.", dalles: [{ path: "meshes/1009_6544.drc", x: 1009, y: 6544 }, { path: "meshes/1009_6545.drc", x: 1009, y: 6545 }, { path: "meshes/1010_6544.drc", x: 1010, y: 6544 }, { path: "meshes/1010_6545.drc", x: 1010, y: 6545 }] },
          { id: "moine", name: "Aiguille du Moine (3412m)", altitude: "3412m", c2c: "https://www.camptocamp.org/waypoints/37505/fr/aiguille-du-moine", dalles: [{ path: "meshes/1006_6543-12.drc", x: 1006, y: 6543 }, { path: "meshes/1006_6544.drc", x: 1006, y: 6544 }, { path: "meshes/1007_6543.drc", x: 1007, y: 6543 }, { path: "meshes/1007_6544.drc", x: 1007, y: 6544 }] },
        ],
      },
      {
        id: "secteur-aiguilles-chamonix",
        name: "3. Secteur Aiguilles de Chamonix",
        children: [
          { id: "midi", name: "Aiguille du Midi (3842m)", altitude: "3842m", c2c: "https://www.camptocamp.org/waypoints/37402/fr/aiguille-du-midi", dalles: [{ path: "meshes/1000_6539.drc", x: 1000, y: 6539 }, { path: "meshes/1001_6539.drc", x: 1001, y: 6539 }, { path: "meshes/1001_6540.drc", x: 1001, y: 6540 }] },
          { id: "plan", name: "Aiguille du Plan (3673m)", altitude: "3673m", c2c: "https://www.camptocamp.org/waypoints/37427/fr/aiguille-du-plan", dalles: [{ path: "meshes/1002_6540.drc", x: 1002, y: 6540 }, { path: "meshes/1002_6541.drc", x: 1002, y: 6541 }, { path: "meshes/1003_6540.drc", x: 1003, y: 6540 }, { path: "meshes/1003_6541.drc", x: 1003, y: 6541 }] },
          { id: "chamonix-needles", name: "Aiguilles de Chamonix", altitude: "3400m-3842m", dalles: [{ path: "meshes/1002_6541.drc", x: 1002, y: 6541 }, { path: "meshes/1002_6542.drc", x: 1002, y: 6542 }, { path: "meshes/1003_6541.drc", x: 1003, y: 6541 }, { path: "meshes/1003_6542.drc", x: 1003, y: 6542 }, { path: "meshes/1003_6543.drc", x: 1003, y: 6543 }, { path: "meshes/1004_6542.drc", x: 1004, y: 6542 }] },
        ],
      },
      {
        id: "secteur-mont-blanc",
        name: "4. Secteur Mont-Blanc",
        children: [
          { id: "mont-blanc", name: "Mont Blanc (4810m)", altitude: "4810m", c2c: "https://www.camptocamp.org/waypoints/37399/fr/mont-blanc", dalles: [{ path: "meshes/0999_6533.drc", x: 999, y: 6533 }, { path: "meshes/0999_6534.drc", x: 999, y: 6534 }, { path: "meshes/1000_6533.drc", x: 1000, y: 6533 }, { path: "meshes/1000_6534.drc", x: 1000, y: 6534 }] },
          { id: "tacul", name: "Mont Blanc du Tacul (4248m)", altitude: "4248m", c2c: "https://www.camptocamp.org/waypoints/37400/fr/mont-blanc-du-tacul", waypoints: [{name: "Pilier Gervasutti", type: "Sommet"}, {name: "Aiguilles du Diable", type: "Crête"}], dalles: [{ path: "meshes/1002_6536.drc", x: 1002, y: 6536 }, { path: "meshes/1002_6537.drc", x: 1002, y: 6537 }, { path: "meshes/1001_6536.drc", x: 1001, y: 6536 }, { path: "meshes/1001_6537.drc", x: 1001, y: 6537 }] },
          { id: "maudit", name: "Mont Maudit (4465m)", altitude: "4465m", dalles: [{ path: "meshes/1000_6535.drc", x: 1000, y: 6535 }, { path: "meshes/1000_6536.drc", x: 1000, y: 6536 }, { path: "meshes/1001_6536.drc", x: 1001, y: 6536 }] },
          { id: "dome-gouter", name: "Dôme du Goûter (4304m)", altitude: "4304m", dalles: [{ path: "meshes/0997_6534.drc", x: 997, y: 6534 }, { path: "meshes/0997_6535.drc", x: 997, y: 6535 }, { path: "meshes/0998_6534.drc", x: 998, y: 6534 }, { path: "meshes/0998_6535.drc", x: 998, y: 6535 }] },
        ],
      },
      {
        id: "secteur-geant-vallee-blanche",
        name: "5. Secteur Géant - Vallée Blanche",
        children: [
          { id: "geant", name: "Dent du Géant (4013m)", altitude: "4013m", dalles: [{ path: "meshes/1006_6537.drc", x: 1006, y: 6537 }] },
          { id: "rochefort", name: "Arête de Rochefort", altitude: "4001m", dalles: [{ path: "meshes/1006_6537.drc", x: 1006, y: 6537 }, { path: "meshes/1006_6538.drc", x: 1006, y: 6538 }, { path: "meshes/1007_6537.drc", x: 1007, y: 6537 }, { path: "meshes/1007_6538.drc", x: 1007, y: 6538 }] },
          { id: "tour-ronde", name: "Tour Ronde (3792m)", altitude: "3792m", dalles: [{ path: "meshes/1002_6535.drc", x: 1002, y: 6535 }, { path: "meshes/1003_6535.drc", x: 1003, y: 6535 }] },
        ]
      },
      {
        id: "secteur-jorasses",
        name: "6. Secteur Grandes Jorasses",
        children: [
          { id: "jorasses", name: "Grandes Jorasses (4208m)", altitude: "4208m", c2c: "https://www.camptocamp.org/waypoints/37419/fr/grandes-jorasses", waypoints: [{name: "Pointe Walker", type: "Sommet"}, {name: "Éperon Walker", type: "Pilier"}], dalles: [{ path: "meshes/1008_6538.drc", x: 1008, y: 6538 }, { path: "meshes/1008_6539.drc", x: 1008, y: 6539 }, { path: "meshes/1009_6538.drc", x: 1009, y: 6538 }, { path: "meshes/1009_6539.drc", x: 1009, y: 6539 }] },
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

function TreeElement({ item, selectedIds, onToggle }: any) {
  const [isOpen, setIsOpen] = useState(true);
  const isBranch = item.children && item.children.length > 0;
  const isSelected = selectedIds.includes(item.id);

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
          {item.id === "massif-mont-blanc" ? <MapIcon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-slate-900"}`} /> : !isBranch && <Mountain className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-orange-500"}`} />}
          <span className={`text-[12px] leading-tight truncate ${isBranch ? "font-bold uppercase tracking-tight text-slate-900" : isSelected ? "text-white font-bold" : "text-slate-600 font-medium"}`}>{item.name}</span>
        </div>
      </div>
      {isBranch && isOpen && (
        <div className="ml-4 border-l-2 border-slate-100 pl-2 mt-1 space-y-1">
          {item.children.map((child: any) => <TreeElement key={child.id} item={child} selectedIds={selectedIds} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
}

function HomePageContent() {
  const { selectedModels, setSelectedModels } = useAppContext();
  const [showHelp, setShowHelp] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

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

  const threeModels = useMemo(() => {
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

  const handleToggle = (id: string) => {
    setSelectedModels(selectedModels.includes(id) ? [] : [id]);
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
          </div>
        </aside>

        <section className="flex-1 relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800">
            {threeModels.length > 0 ? (
                <>
                    <ThreeScene models={threeModels} selectedModels={selectedModels} />
                    <div className="absolute top-6 right-6 z-40">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('reset-camera'))}
                            className="flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-xl hover:bg-blue-600 hover:text-white transition-all group"
                        >
                            <Move className="h-4 w-4 text-blue-600 group-hover:text-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Réinitialiser</span>
                        </button>
                    </div>
                    <Compass />
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

        {selectedRouteInfo && showDetails && (
          <aside className="w-[380px] flex-shrink-0 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white border border-slate-200 rounded-[2rem] h-full shadow-2xl flex flex-col overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Détails Relief</span>
                  <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group"><X className="h-5 w-5 text-slate-300 group-hover:text-slate-600" /></button>
                </div>
                <h2 className="text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter">{selectedRouteInfo.name.split('(')[0]}</h2>
                <div className="flex items-center gap-2"><Mountain className="h-4 w-4 text-orange-500" /><p className="text-xl font-bold text-slate-900 uppercase tracking-tighter">{selectedRouteInfo.altitude}</p></div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar-light">
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