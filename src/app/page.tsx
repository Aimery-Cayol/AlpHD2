"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
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
  Mountain
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
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black uppercase italic tracking-tighter">Navigation 3D</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200"><MousePointer2 className="h-5 w-5"/></div>
            <div><p className="text-xs font-black uppercase tracking-wider">Rotation</p><p className="text-[11px] text-slate-500 font-medium">Clic gauche maintenu</p></div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200"><Move className="h-5 w-5"/></div>
            <div><p className="text-xs font-black uppercase tracking-wider">Déplacement</p><p className="text-[11px] text-slate-500 font-medium">Clic droit / flèches</p></div>
          </div>
        </div>
        <button onClick={onClose} className="w-full mt-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all">J'ai compris</button>
      </div>
    </div>
  );
}

// --- DONNÉES ---
const MOUNTAIN_TREE = [
  {
    id: "massif-mont-blanc",
    name: "Massif du Mont-Blanc",
    children: [
      {
        id: "secteur-mont-blanc",
        name: "1. Secteur Mont-Blanc",
        children: [
          { id: "mont-blanc", name: "Mont Blanc (4810m)", altitude: "4810m", c2c: "https://www.camptocamp.org/waypoints/37399/fr/mont-blanc", dalles: [{ path: "meshes/0999_6533.drc", x: 999, y: 6533 }, { path: "meshes/0999_6534.drc", x: 999, y: 6534 }, { path: "meshes/1000_6533.drc", x: 1000, y: 6533 }, { path: "meshes/1000_6534.drc", x: 1000, y: 6534 }] },
          { id: "tacul", name: "Mont Blanc du Tacul (4248m)", altitude: "4248m", c2c: "https://www.camptocamp.org/waypoints/37400/fr/mont-blanc-du-tacul", dalles: [{ path: "meshes/1002_6536.drc", x: 1002, y: 6536 }, { path: "meshes/1002_6537.drc", x: 1002, y: 6537 }, { path: "meshes/1001_6536.drc", x: 1001, y: 6536 }, { path: "meshes/1001_6537.drc", x: 1001, y: 6537 }] },
          { id: "maudit", name: "Mont Maudit (4465m)", altitude: "4465m", c2c: "https://www.camptocamp.org/waypoints/37401/fr/mont-maudit", dalles: [{ path: "meshes/1000_6535.drc", x: 1000, y: 6535 }, { path: "meshes/1000_6536.drc", x: 1000, y: 6536 }, { path: "meshes/1001_6536.drc", x: 1001, y: 6536 }] },
          { id: "dome-gouter", name: "Dôme du Goûter (4304m)", altitude: "4304m", c2c: "https://www.camptocamp.org/waypoints/37403/fr/dome-du-gouter", dalles: [{ path: "meshes/0997_6534.drc", x: 997, y: 6534 }, { path: "meshes/0997_6535.drc", x: 997, y: 6535 }, { path: "meshes/0998_6534.drc", x: 998, y: 6534 }, { path: "meshes/0998_6535.drc", x: 998, y: 6535 }] },
          { id: "aiguille-gouter", name: "Aiguille du Goûter (3863m)", altitude: "3863m", c2c: "https://www.camptocamp.org/waypoints/37404/fr/aiguille-du-gouter", dalles: [{ path: "meshes/0996_6536.drc", x: 996, y: 6536 }, { path: "meshes/0997_6535.drc", x: 997, y: 6535 }, { path: "meshes/0997_6536.drc", x: 997, y: 6536 }] },
        ],
      },
      {
        id: "secteur-verte-drus",
        name: "2. Secteur Verte - Drus - Droites",
        children: [
          { id: "verte", name: "Aiguille Verte (4122m)", altitude: "4122m", c2c: "https://www.camptocamp.org/waypoints/37435/fr/aiguille-verte", dalles: [{ path: "meshes/1006_6545-12.drc", x: 1006, y: 6545 }, { path: "meshes/1006_6546.drc", x: 1006, y: 6546 }, { path: "meshes/1006_6547.drc", x: 1006, y: 6547 }, { path: "meshes/1007_6545.drc", x: 1007, y: 6545 }, { path: "meshes/1007_6546.drc", x: 1007, y: 6546 }, { path: "meshes/1007_6547.drc", x: 1007, y: 6547 }, { path: "meshes/1008_6546.drc", x: 1008, y: 6546 }] },
          { id: "drus", name: "Les Drus (3754m)", altitude: "3754m", c2c: "https://www.camptocamp.org/waypoints/37431/fr/les-drus", dalles: [{ path: "meshes/0961_6440.drc", x: 961, y: 6440 }] },
          { id: "droites", name: "Les Droites (4001m)", altitude: "4001m", c2c: "https://www.camptocamp.org/waypoints/37434/fr/les-droites", dalles: [{ path: "meshes/1008_6545.drc", x: 1008, y: 6545 }, { path: "meshes/1008_6546.drc", x: 1008, y: 6546 }, { path: "meshes/1009_6545.drc", x: 1009, y: 6545 }, { path: "meshes/1009_6546.drc", x: 1009, y: 6546 }] },
          { id: "courtes", name: "Les Courtes (3856m)", altitude: "3856m", c2c: "https://www.camptocamp.org/waypoints/37432/fr/les-courtes", dalles: [{ path: "meshes/1009_6544.drc", x: 1009, y: 6544 }, { path: "meshes/1010_6544.drc", x: 1010, y: 6544 }, { path: "meshes/1010_6545.drc", x: 1010, y: 6545 }] },
          { id: "moine", name: "Aiguille du Moine (3412m)", altitude: "3412m", c2c: "https://www.camptocamp.org/waypoints/37505/fr/aiguille-du-moine", dalles: [{ path: "meshes/1006_6543-12.drc", x: 1006, y: 6543 }, { path: "meshes/1006_6544.drc", x: 1006, y: 6544 }, { path: "meshes/1007_6543.drc", x: 1007, y: 6543 }, { path: "meshes/1007_6544.drc", x: 1007, y: 6544 }] },
        ],
      },
      {
        id: "secteur-aiguilles-chamonix",
        name: "3. Secteur Aiguilles de Chamonix",
        children: [
          { id: "midi", name: "Aiguille du Midi (3842m)", altitude: "3842m", c2c: "https://www.camptocamp.org/waypoints/37402/fr/aiguille-du-midi", dalles: [{ path: "meshes/1000_6539.drc", x: 1000, y: 6539 }, { path: "meshes/1001_6539.drc", x: 1001, y: 6539 }, { path: "meshes/1001_6540.drc", x: 1001, y: 6540 }] },
          { id: "plan", name: "Aiguille du Plan (3673m)", altitude: "3673m", c2c: "https://www.camptocamp.org/waypoints/37427/fr/aiguille-du-plan", dalles: [{ path: "meshes/1002_6540.drc", x: 1002, y: 6540 }, { path: "meshes/1002_6541.drc", x: 1002, y: 6541 }, { path: "meshes/1003_6540.drc", x: 1003, y: 6540 }, { path: "meshes/1003_6541.drc", x: 1003, y: 6541 }] },
          { id: "chamonix-needles", name: "Aiguilles de Chamonix", altitude: "3400m-3842m", c2c: "https://www.camptocamp.org/waypoints/42284/fr/aiguilles-de-chamonix", dalles: [{ path: "meshes/1002_6541.drc", x: 1002, y: 6541 }, { path: "meshes/1002_6542.drc", x: 1002, y: 6542 }, { path: "meshes/1003_6541.drc", x: 1003, y: 6541 }, { path: "meshes/1003_6542.drc", x: 1003, y: 6542 }, { path: "meshes/1003_6543.drc", x: 1003, y: 6543 }, { path: "meshes/1004_6542.drc", x: 1004, y: 6542 }] },
        ],
      },
      {
        id: "secteur-tour-argentiere",
        name: "4. Secteur Tour - Argentière",
        children: [
          { id: "tour", name: "Aiguille du Tour (3540m)", altitude: "3540m", c2c: "https://www.camptocamp.org/waypoints/37508/fr/aiguille-du-tour", dalles: [{ path: "meshes/1010_6552.drc", x: 1010, y: 6552 }] },
          { id: "chardonnet", name: "Aiguille du Chardonnet (3824m)", altitude: "3824m", c2c: "https://www.camptocamp.org/waypoints/37433/fr/aiguille-du-chardonnet", dalles: [{ path: "meshes/1009_6549.drc", x: 1009, y: 6549 }, { path: "meshes/1009_6550.drc", x: 1009, y: 6550 }, { path: "meshes/1010_6549.drc", x: 1010, y: 6549 }, { path: "meshes/1010_6550.drc", x: 1010, y: 6550 }, { path: "meshes/1011_6550.drc", x: 1011, y: 6550 }] },
        ],
      },
      {
        id: "secteur-geant-vallee-blanche",
        name: "5. Secteur Géant - Vallée Blanche",
        children: [
          { id: "geant", name: "Dent du Géant (4013m)", altitude: "4013m", c2c: "https://www.camptocamp.org/waypoints/37424/fr/dent-du-geant", dalles: [{ path: "meshes/1006_6537.drc", x: 1006, y: 6537 }] },
          { id: "rochefort", name: "Arête de Rochefort", altitude: "4001m", c2c: "https://www.camptocamp.org/waypoints/37422/fr/aiguille-de-rochefort", dalles: [{ path: "meshes/1006_6537.drc", x: 1006, y: 6537 }, { path: "meshes/1006_6538.drc", x: 1006, y: 6538 }, { path: "meshes/1007_6537.drc", x: 1007, y: 6537 }, { path: "meshes/1007_6538.drc", x: 1007, y: 6538 }] },
          { id: "tour-ronde", name: "Tour Ronde & Entrèves", altitude: "3792m", c2c: "https://www.camptocamp.org/waypoints/37408/fr/tour-ronde", dalles: [{ path: "meshes/1002_6535.drc", x: 1002, y: 6535 }, { path: "meshes/1003_6535.drc", x: 1003, y: 6535 }] },
        ],
      },
      {
        id: "secteur-jorasses",
        name: "6. Secteur Grandes Jorasses",
        children: [
          { id: "jorasses", name: "Grandes Jorasses (4208m)", altitude: "4208m", c2c: "https://www.camptocamp.org/waypoints/37419/fr/grandes-jorasses", dalles: [{ path: "meshes/1008_6538.drc", x: 1008, y: 6538 }, { path: "meshes/1008_6539.drc", x: 1008, y: 6539 }, { path: "meshes/1009_6538.drc", x: 1009, y: 6538 }, { path: "meshes/1009_6539.drc", x: 1009, y: 6539 }] },
        ],
      },
    ],
  },
];

function TreeElement({ item, selectedIds, onToggle }: any) {
  const [isOpen, setIsOpen] = useState(true);
  const isBranch = item.children && item.children.length > 0;
  // IMPORTANT: On vérifie si l'id est exactement dans le tableau selectedIds
  const isSelected = selectedIds.includes(item.id);

  return (
    <div className="select-none w-full">
      <div
        className={`flex items-center py-2 px-1 rounded-xl cursor-pointer transition-all ${isBranch ? "hover:bg-slate-50" : "hover:bg-blue-50 group"} ${isSelected && !isBranch ? "bg-blue-50/50" : ""}`}
        onClick={() => (isBranch ? setIsOpen(!isOpen) : onToggle(item.id))}
      >
        <div className="mr-1.5 flex-shrink-0">
          {isBranch ? (isOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />) : isSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-300 group-hover:text-blue-300" />}
        </div>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {item.id === "massif-mont-blanc" ? <MapIcon className="h-3.5 w-3.5 text-slate-900 flex-shrink-0" /> : !isBranch && <Mountain className={`h-3 w-3 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-orange-500"}`} />}
          <span className={`text-[13px] leading-tight truncate ${isBranch ? "font-bold text-slate-900 uppercase tracking-tighter" : isSelected ? "text-blue-700 font-bold" : "text-slate-600 font-medium"}`}>{item.name}</span>
        </div>
      </div>
      {isBranch && isOpen && (
        <div className="ml-2 border-l-2 border-slate-100 pl-1 mt-0.5 space-y-0.5">
          {item.children.map((child: any) => <TreeElement key={child.id} item={child} selectedIds={selectedIds} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
}

function HomePageContent() {
  const { selectedModels, setSelectedModels, cameraRotation } = useAppContext();
  const [showHelp, setShowHelp] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // Recherche récursive robuste
  const selectedRouteInfo = useMemo(() => {
    if (!selectedModels || selectedModels.length === 0) return null;
    
    const targetId = selectedModels[0];
    let found = null;

    const findDeep = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.id === targetId) {
          found = node;
          return;
        }
        if (node.children) findDeep(node.children);
        if (found) return;
      }
    };

    findDeep(MOUNTAIN_TREE);
    return found;
  }, [selectedModels]);

  // Génération des modèles pour ThreeScene
    const threeModels = useMemo(() => {
      if (!selectedRouteInfo || !selectedRouteInfo.dalles) return [];
      
      return selectedRouteInfo.dalles.map((d: any) => ({
        id: selectedRouteInfo.id, // AJOUT DE L'ID DU SOMMET ICI
        name: selectedRouteInfo.name,
        url: `/api/tiles?path=${encodeURIComponent(d.path)}`,
        format: "drc" as const,
        x: d.x,
        y: d.y,
      }));
    }, [selectedRouteInfo]);

  // Logs pour debug (visible dans la console F12)
  useEffect(() => {
    console.log("Sélection actuelle:", selectedModels);
    console.log("Sommet trouvé:", selectedRouteInfo?.name);
    console.log("Nombre de dalles à charger:", threeModels.length);
  }, [selectedModels, selectedRouteInfo, threeModels]);

  return (
    <div className="h-screen bg-white text-slate-900 font-sans overflow-hidden flex flex-col">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <header className="flex-shrink-0 p-3 lg:p-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-10">
          <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Les topos <span className="text-blue-600">3D</span></h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Exploration LiDAR Haute Définition</p>
          </div>
          <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase italic tracking-wider hover:scale-105 transition-transform active:scale-95">
             <HelpCircle className="h-3.5 w-3.5" /> Aide Navigation
          </button>
      </header>

      <main className="flex-1 flex p-2 lg:p-3 gap-2 lg:gap-3 overflow-hidden bg-slate-50/30">
        
        <aside className="w-[260px] lg:w-[300px] flex-shrink-0 flex flex-col"> 
          <div className="bg-white border border-slate-200 rounded-[2rem] p-4 h-full overflow-y-auto custom-scrollbar shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 opacity-70">Massifs & Secteurs</p>
            {MOUNTAIN_TREE.map((root) => (
              <TreeElement 
                key={root.id} 
                item={root} 
                selectedIds={selectedModels} 
                onToggle={(id: any) => setSelectedModels([id])} 
              />
            ))}
          </div>
        </aside>

        <section className="flex-1 relative">
          <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden h-full relative shadow-2xl border border-slate-800">
              {threeModels.length > 0 ? (
                <ThreeScene models={threeModels} selectedModels={selectedModels} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/10 uppercase font-black italic tracking-[0.3em] text-xl gap-6">
                  <div className="p-10 border-2 border-white/5 rounded-full bg-white/5 shadow-inner">
                     <CompassIcon className="h-16 w-16 animate-pulse text-white/20" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span>Prêt à explorer</span>
                    <span className="text-[10px] mt-2 opacity-50">Sélectionnez un sommet à gauche</span>
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-6 right-6 z-40 bg-slate-950/60 backdrop-blur-xl p-3.5 rounded-full border border-white/10 shadow-2xl pointer-events-none">
                  <CompassIcon className="h-7 w-7 text-blue-500 transition-transform duration-100" style={{ transform: `rotate(${cameraRotation?.y || 0}rad)` }} />
              </div>
          </div>
        </section>

        {selectedRouteInfo && showDetails && (
          <aside className="w-[280px] lg:w-[320px] flex-shrink-0 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 h-full shadow-xl flex flex-col border-l-[6px] border-l-blue-600 relative overflow-hidden">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex flex-col gap-3">
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full w-fit uppercase border border-blue-100">
                     <Info className="h-3 w-3" /> Fiche de Sommet
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-[0.9] tracking-tighter">{selectedRouteInfo.name}</h2>
                </div>
                <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
              </div>

              <div className="space-y-4 mb-8 relative z-10">
                 <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Altitude Max</p>
                    <p className="text-2xl font-black italic text-slate-800">{selectedRouteInfo.altitude || "---"}</p>
                 </div>
                 <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Couverture LiDAR</p>
                    <p className="text-2xl font-black italic text-blue-600">{threeModels.length} <span className="text-xs uppercase ml-1">Tuiles</span></p>
                 </div>
              </div>

              {selectedRouteInfo.c2c && (
                <a 
                  href={selectedRouteInfo.c2c} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-3 p-5 bg-slate-950 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all group shadow-xl active:scale-95"
                >
                  <CamptocampLogo /> Camptocamp <span className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">↗</span>
                </a>
              )}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

export default function HomePage() { return ( <Suspense fallback={null}> <HomePageContent /> </Suspense> ); }