"use client";

<<<<<<< Updated upstream
import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import DropZone from "@/components/three/DropZone";
import { createFileInfo, FileInfo, extractCoordinates } from "@/utils/fileUtils";
import { detectAndLogCapabilities } from "@/utils/deviceCapabilities";
=======
import { useState, useMemo, Suspense } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Map as MapIcon,
  Mountain,
  X,
  LocateFixed,
  HelpCircle,
  ExternalLink,
  Info,
  Compass as CompassIcon,
  ArrowUp,
  PanelRightOpen,
  MousePointer2, // Ajouté pour la modale
  Move           // Ajouté pour la modale
} from "lucide-react";
>>>>>>> Stashed changes
import { useAppContext } from "@/contexts/AppContext";
import ThreeScene from "@/components/three/ThreeScene";

// --- LOGO OFFICIEL CAMPTOCAMP ---
const CamptocampLogo = () => (
  <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 85L50 15L85 85H15Z" fill="#D9534F" />
    <path d="M45 55L55 55L50 45L45 55Z" fill="white" />
    <path d="M35 75L65 75L50 50L35 75Z" fill="white" />
  </svg>
);

// --- COMPOSANT MODALE D'AIDE ---
function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black uppercase italic">Navigation 3D</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><MousePointer2 className="h-5 w-5"/></div>
            <div><p className="text-xs font-black uppercase">Rotation</p><p className="text-[11px] text-slate-500 font-medium">Clic gauche + glisser</p></div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Move className="h-5 w-5"/></div>
            <div><p className="text-xs font-black uppercase">Déplacement</p><p className="text-[11px] text-slate-500 font-medium">Clic droit + glisser</p></div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><ArrowUp className="h-5 w-5 rotate-45"/></div>
            <div><p className="text-xs font-black uppercase">Zoom</p><p className="text-[11px] text-slate-500 font-medium">Molette de la souris</p></div>
          </div>
        </div>
        <button onClick={onClose} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
          J'ai compris
        </button>
      </div>
    </div>
  );
}

// --- STRUCTURE DES DONNÉES MISE À JOUR ---
const MOUNTAIN_TREE = [
  {
    id: "massif-mont-blanc",
    name: "Massif du Mont-Blanc",
    children: [
      {
        id: "secteur-tour-argentiere",
        name: "1. Secteur Tour - Argentière",
        children: [
          { id: "aiguille-tour-group", name: "Aiguille du Tour (3540m)", altitude: "3540m", c2c: "https://www.camptocamp.org/waypoints/37508/fr/aiguille-du-tour", dalles: [{ path: "meshes/1010_6552.drc", x: 1010, y: 6552 }] },
          { id: "chardonnet-group", name: "Aiguille du Chardonnet (3824m)", altitude: "3824m", c2c: "https://www.camptocamp.org/waypoints/37433/fr/aiguille-du-chardonnet", dalles: [{ path: "meshes/1009_6549.drc", x: 1009, y: 6549 }, { path: "meshes/1009_6550.drc", x: 1009, y: 6550 }, { path: "meshes/1010_6549.drc", x: 1010, y: 6549 }, { path: "meshes/1010_6550.drc", x: 1010, y: 6550 }, { path: "meshes/1011_6550.drc", x: 1011, y: 6550 }] },
        ],
      },
      {
        id: "secteur-verte-drus",
        name: "2. Secteur Verte - Drus - Droites",
        children: [
          { id: "verte-group", name: "Aiguille Verte (4122m)", altitude: "4122m", c2c: "https://www.camptocamp.org/waypoints/37435/fr/aiguille-verte", dalles: [{ path: "meshes/1006_6545-12.drc", x: 1006, y: 6545 }, { path: "meshes/1006_6546.drc", x: 1006, y: 6546 }, { path: "meshes/1006_6547.drc", x: 1006, y: 6547 }, { path: "meshes/1007_6545.drc", x: 1007, y: 6545 }, { path: "meshes/1007_6546.drc", x: 1007, y: 6546 }, { path: "meshes/1007_6547.drc", x: 1007, y: 6547 }, { path: "meshes/1008_6546.drc", x: 1008, y: 6546 }] },
          { id: "les-drus-direct", name: "Les Drus (3754m)", altitude: "3754m", c2c: "https://www.camptocamp.org/waypoints/37431/fr/les-drus", dalles: [{ path: "meshes/0961_6440.drc", x: 961, y: 6440 }] },
          { id: "droites-group", name: "Les Droites (4001m)", altitude: "4001m", c2c: "https://www.camptocamp.org/waypoints/37434/fr/les-droites", dalles: [{ path: "meshes/1008_6545.drc", x: 1008, y: 6545 }, { path: "meshes/1008_6546.drc", x: 1008, y: 6546 }, { path: "meshes/1009_6545.drc", x: 1009, y: 6545 }, { path: "meshes/1009_6546.drc", x: 1009, y: 6546 }] },
          { id: "courtes-group", name: "Les Courtes (3856m)", c2c: "https://www.camptocamp.org/waypoints/37432/fr/les-courtes", dalles: [{ path: "meshes/1009_6544.drc", x: 1009, y: 6544 }, { path: "meshes/1010_6544.drc", x: 1010, y: 6544 }, { path: "meshes/1010_6545.drc", x: 1010, y: 6545 }] },
          { id: "moine-group", name: "Aiguille du Moine (3412m)", c2c: "https://www.camptocamp.org/waypoints/37505/fr/aiguille-du-moine", dalles: [{ path: "meshes/1006_6543-12.drc", x: 1006, y: 6543 }, { path: "meshes/1006_6544.drc", x: 1006, y: 6544 }, { path: "meshes/1007_6543.drc", x: 1007, y: 6543 }, { path: "meshes/1007_6544.drc", x: 1007, y: 6544 }] },
        ],
      },
      {
        id: "secteur-aiguilles-chamonix",
        name: "3. Secteur Aiguilles de Chamonix",
        children: [
          { id: "midi-group", name: "Aiguille du Midi (3842m)", c2c: "https://www.camptocamp.org/waypoints/37402/fr/aiguille-du-midi", dalles: [{ path: "meshes/1000_6539.drc", x: 1000, y: 6539 }, { path: "meshes/1001_6539.drc", x: 1001, y: 6539 }, { path: "meshes/1001_6540.drc", x: 1001, y: 6540 }] },
          { id: "plan-group", name: "Aiguille du Plan (3673m)", c2c: "https://www.camptocamp.org/waypoints/37427/fr/aiguille-du-plan", dalles: [{ path: "meshes/1002_6540.drc", x: 1002, y: 6540 }, { path: "meshes/1002_6541.drc", x: 1002, y: 6541 }, { path: "meshes/1003_6540.drc", x: 1003, y: 6540 }, { path: "meshes/1003_6541.drc", x: 1003, y: 6541 }] },
          { id: "chamonix-needles-group", name: "Aiguilles de Chamonix", altitude: "3400m-3842m", c2c: "https://www.camptocamp.org/waypoints/42284/fr/aiguilles-de-chamonix-et-envers-des-aiguilles-", dalles: [{ path: "meshes/1002_6541.drc", x: 1002, y: 6541 }, { path: "meshes/1002_6542.drc", x: 1002, y: 6542 }, { path: "meshes/1003_6541.drc", x: 1003, y: 6541 }, { path: "meshes/1003_6542.drc", x: 1003, y: 6542 }, { path: "meshes/1003_6543.drc", x: 1003, y: 6543 }, { path: "meshes/1004_6542.drc", x: 1004, y: 6542 }] },
        ],
      },
      {
        id: "secteur-mont-blanc",
        name: "4. Secteur Mont-Blanc",
        children: [
          { id: "mont-blanc-group", name: "Mont Blanc (4810m)", altitude: "4810m", c2c: "https://www.camptocamp.org/waypoints/37399/fr/mont-blanc", dalles: [{ path: "meshes/0999_6533.drc", x: 999, y: 6533 }, { path: "meshes/0999_6534.drc", x: 999, y: 6534 }, { path: "meshes/1000_6533.drc", x: 1000, y: 6533 }, { path: "meshes/1000_6534.drc", x: 1000, y: 6534 }] },
          { 
            id: "tacul-group", 
            name: "Mont Blanc du Tacul (4248m)", 
            altitude: "4248m",
            c2c: "https://www.camptocamp.org/waypoints/37400/fr/mont-blanc-du-tacul",
            dalles: [
              { path: "meshes/1002_6536.drc", x: 1002, y: 6536 },
              { path: "meshes/1002_6537.drc", x: 1002, y: 6537 },
              { path: "meshes/1001_6536.drc", x: 1001, y: 6536 },
              { path: "meshes/1001_6537.drc", x: 1001, y: 6537 }
            ] 
          },
          { 
            id: "mont-maudit-group", 
            name: "Mont Maudit (4465m)", 
            altitude: "4465m",
            c2c: "https://www.camptocamp.org/waypoints/37401/fr/mont-maudit",
            dalles: [
              { path: "meshes/1000_6535.drc", x: 1000, y: 6535 },
              { path: "meshes/1000_6536.drc", x: 1000, y: 6536 },
              { path: "meshes/1001_6536.drc", x: 1001, y: 6536 }
            ] 
          },
          { id: "dome-gouter-group", name: "Dôme du Goûter (4304m)", c2c: "https://www.camptocamp.org/waypoints/37403/fr/dome-du-gouter", dalles: [{ path: "meshes/0997_6534.drc", x: 997, y: 6534 }, { path: "meshes/0997_6535.drc", x: 997, y: 6535 }, { path: "meshes/0998_6534.drc", x: 998, y: 6534 }, { path: "meshes/0998_6535.drc", x: 998, y: 6535 }] },
          { id: "aiguille-gouter-group", name: "Aiguille du Goûter (3863m)", c2c: "https://www.camptocamp.org/waypoints/37404/fr/aiguille-du-gouter", dalles: [{ path: "meshes/0996_6536.drc", x: 996, y: 6536 }, { path: "meshes/0997_6535.drc", x: 997, y: 6535 }, { path: "meshes/0997_6536.drc", x: 997, y: 6536 }] },
        ],
      },
      {
        id: "secteur-geant-vallee-blanche",
        name: "5. Secteur Géant - Vallée Blanche",
        children: [
          { id: "dent-geant-group", name: "Dent du Géant (4013m)", c2c: "https://www.camptocamp.org/waypoints/37424/fr/dent-du-geant", dalles: [{ path: "meshes/1006_6537.drc", x: 1006, y: 6537 }] },
          { id: "rochefort-group", name: "Arête de Rochefort", c2c: "https://www.camptocamp.org/waypoints/37422/fr/aiguille-de-rochefort", dalles: [{ path: "meshes/1006_6537.drc", x: 1006, y: 6537 }, { path: "meshes/1006_6538.drc", x: 1006, y: 6538 }, { path: "meshes/1007_6537.drc", x: 1007, y: 6537 }, { path: "meshes/1007_6538.drc", x: 1007, y: 6538 }] },
          { id: "tour-ronde-entreves-group", name: "Tour Ronde & Entrèves", c2c: "https://www.camptocamp.org/waypoints/37408/fr/tour-ronde", dalles: [{ path: "meshes/1002_6535.drc", x: 1002, y: 6535 }, { path: "meshes/1003_6535.drc", x: 1003, y: 6535 }] },
        ],
      },
      {
        id: "secteur-jorasses",
        name: "6. Secteur Grandes Jorasses",
        children: [
          { id: "grandes-jorasses-group", name: "Grandes Jorasses (4208m)", c2c: "https://www.camptocamp.org/waypoints/37419/fr/grandes-jorasses", dalles: [{ path: "meshes/1008_6538.drc", x: 1008, y: 6538 }, { path: "meshes/1008_6539.drc", x: 1008, y: 6539 }, { path: "meshes/1009_6538.drc", x: 1009, y: 6538 }, { path: "meshes/1009_6539.drc", x: 1009, y: 6539 }] },
        ],
      },
    ],
  },
];

function ClimberLoader({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center z-50 overflow-hidden">
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/10 w-full h-full absolute opacity-20 translate-y-4">
            <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
        </svg>
        <div className="absolute w-full h-full flex items-center justify-center animate-[climb_3s_infinite_linear]">
            <div className="relative -translate-x-8 translate-y-8">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" className="animate-bounce">
                    <circle cx="12" cy="5" r="2" /><path d="M12 7v6l-4 4M12 9l4 2M12 9l-4-1M16 17l-4-4" />
                </svg>
                <div className="absolute top-0 left-1/2 w-[1px] h-64 bg-gradient-to-t from-blue-500/50 to-transparent -translate-y-full" />
            </div>
        </div>
      </div>
      <style jsx>{` @keyframes climb { 0% { transform: translate(-20px, 40px) scale(0.9); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translate(20px, -40px) scale(1.1); opacity: 0; } } `}</style>
      <div className="text-center z-10">
        <p className="font-black tracking-[0.4em] uppercase text-[10px] text-blue-500 mb-2">{text}</p>
        <div className="flex gap-1.5 justify-center items-center">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

function TreeElement({ item, selectedIds, onToggle }: any) {
  const [isOpen, setIsOpen] = useState(true);
  const isBranch = item.children && item.children.length > 0;
  const isSelected = selectedIds.includes(item.id);

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-2.5 px-3 rounded-2xl cursor-pointer transition-all ${isBranch ? "hover:bg-slate-50" : "hover:bg-blue-50 group"}`}
        onClick={() => (isBranch ? setIsOpen(!isOpen) : onToggle(item.id))}
      >
        <div className="mr-3 flex-shrink-0">
          {isBranch ? (isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />) : isSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />}
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          {item.id === "massif-mont-blanc" ? <MapIcon className="h-4 w-4 text-slate-900" /> : !isBranch && <Mountain className="h-3.5 w-3.5 text-orange-500" />}
          <span className={`text-sm truncate ${isBranch ? "font-bold text-slate-900 uppercase tracking-tight" : "text-slate-600 font-semibold"}`}>{item.name}</span>
        </div>
      </div>
      {isBranch && isOpen && (
        <div className="ml-4 border-l-2 border-slate-100 pl-3 mt-1 space-y-1">
          {item.children.map((child: any) => <TreeElement key={child.id} item={child} selectedIds={selectedIds} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
}

function HomePageContent() {
<<<<<<< Updated upstream
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { selectedModels, setSelectedModels, availableModels, setAvailableModels } = useAppContext();
  const [models, setModels] = useState<Model[]>([]);
  const [localFiles, setLocalFiles] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showDropZone, setShowDropZone] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Fonction pour récupérer la taille d'un fichier depuis S3
  const getFileSize = async (url: string): Promise<number> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return parseInt(response.headers.get("content-length") || "0");
    } catch {
      return 0;
    }
  };

  // Fonction pour recharger les modèles (utilisée par le bouton Réessayer)
  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/models");
      if (!response.ok)
        throw new Error("Erreur lors du chargement des modèles");

      const modelsData = await response.json();

      // Récupérer les tailles des fichiers en parallèle
      const modelPromises = modelsData.map(
        async (modelData: { url: string; format: string; key: string }) => {
          const fileSize = await getFileSize(modelData.url);
          const name = modelData.url.split("/").pop() || "Modèle";
          const nameWithoutExtension = name
            .replace(".final.ply", "")
            .replace(".drc", "");

          return {
            name: nameWithoutExtension,
            url: modelData.url,
            format: modelData.format as "ply" | "drc",
            coordinates: extractCoordinates(modelData.url),
            fileSize,
          };
        }
      );

      const modelList = await Promise.all(modelPromises);
      setModels(modelList);
      setAvailableModels(modelList); // Synchroniser avec le contexte global
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des modèles depuis l'API
  useEffect(() => {
    loadModels();
  }, []);

  // Détecter les capacités du client au chargement
  useEffect(() => {
    detectAndLogCapabilities();
  }, []);

  // Fonction pour gérer l'upload de fichiers
  const handleFileUpload = (file: File) => {
    try {
      const fileInfo = createFileInfo(file);

      // Créer un nouveau modèle local
      const newModel: Model = {
        name: fileInfo.name.replace(/\.(final\.)?ply|\.(drc)/i, ""),
        url: fileInfo.url,
        format: fileInfo.format,
        fileSize: fileInfo.size,
      };

      // Ajouter le fichier local à la liste
      setLocalFiles((prev) => [...prev, newModel]);

      // Afficher un message de succès
      console.log(`✅ Fichier uploadé: ${newModel.name}`);

      // Sélectionner automatiquement le fichier uploadé
      setSelectedModels((prev) => [...prev, newModel.url]);
    } catch (err) {
      console.error("Erreur lors de l'upload du fichier:", err);
      setError("Erreur lors du traitement du fichier");
    }
=======
  const { selectedModels, setSelectedModels, cameraRotation } = useAppContext();
  const [isSimulatingLoad, setIsSimulatingLoad] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const toggleModel = (id: string) => {
    setIsSimulatingLoad(true);
    setShowDetails(true);
    setTimeout(() => { setSelectedModels([id]); setIsSimulatingLoad(false); }, 1500);
>>>>>>> Stashed changes
  };

  const selectedRouteInfo = useMemo(() => {
    if (selectedModels.length === 0) return null;
    let found: any = null;
    const search = (items: any[]) => {
      for (const item of items) {
        if (item.id === selectedModels[0]) { found = item; break; }
        if (item.children) search(item.children);
        if (found) break;
      }
    };
    search(MOUNTAIN_TREE);
    return found;
  }, [selectedModels]);

  const threeModels = useMemo(() => {
    if (!selectedRouteInfo || !selectedRouteInfo.dalles) return [];
    return selectedRouteInfo.dalles.map((d: any) => ({
      name: selectedRouteInfo.name, url: `/api/tiles?path=${d.path}`, format: "drc" as const, x: d.x, y: d.y,
    }));
  }, [selectedRouteInfo]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* AFFICHAGE DE LA MODALE */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-end justify-between">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Les topos <span className="text-blue-600">3D</span></h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Exploration LiDAR Haute Définition</p>
            </div>
            <button 
                onClick={() => setShowHelp(true)} 
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-2xl text-[10px] font-black text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-[0.1em]"
            >
                <HelpCircle className="h-4 w-4" /> Se déplacer dans les topos 3D
            </button>
        </div>

        <div className="grid grid-cols-12 gap-6 relative items-start">
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm h-[800px] overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-3">Massifs Disponibles</p>
              {MOUNTAIN_TREE.map((root) => <TreeElement key={root.id} item={root} selectedIds={selectedModels} onToggle={toggleModel} />)}
            </div>
          </div>

          <div className={`${(selectedRouteInfo && showDetails) ? "lg:col-span-5 xl:col-span-6" : "lg:col-span-8 xl:col-span-9"} transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative`}>
            <div className="bg-slate-900 border border-slate-300 rounded-[3rem] overflow-hidden h-[800px] relative shadow-2xl group">
              {selectedRouteInfo && !showDetails && (
                <button 
                    onClick={() => setShowDetails(true)}
                    className="absolute top-10 right-10 z-50 bg-white p-4 rounded-2xl shadow-2xl border border-slate-200 hover:text-blue-600 transition-all"
                >
                    <PanelRightOpen className="h-6 w-6" />
                </button>
              )}

              <div className="absolute bottom-10 right-10 z-40 bg-slate-950/60 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 flex items-center gap-4 pointer-events-none shadow-2xl">
                  <div className="relative flex flex-col items-center">
                      <div className="text-[9px] font-black text-white mb-1">N</div>
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <CompassIcon className="h-full w-full text-blue-500 transition-transform duration-100" style={{ transform: `rotate(${cameraRotation?.y || 0}rad)` }} />
                      </div>
                      <div className="text-[9px] font-black text-white/40 mt-1">S</div>
                  </div>
              </div>

              {threeModels.length > 0 ? (
                <ThreeScene models={threeModels} selectedModels={threeModels.map(m => m.url)} />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center">
                    <div className="relative z-20 bg-white/5 backdrop-blur-2xl p-12 rounded-[4rem] border border-white/10 text-center max-w-sm mx-4 text-white">
                        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-pulse"><LocateFixed className="h-10 w-10 text-white" /></div>
                        <h2 className="text-3xl font-black mb-4 tracking-tight uppercase italic">Prêt à explorer</h2>
                    </div>
                </div>
              )}

              {isSimulatingLoad && <ClimberLoader text="Ascension du relief..." />}
            </div>
          </div>

          {selectedRouteInfo && showDetails && (
            <div className="col-span-12 lg:col-span-3 animate-in slide-in-from-right-12 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-[800px] flex flex-col overflow-y-auto custom-scrollbar border-l-4 border-l-blue-600">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 flex items-center gap-2 w-fit"><Info className="h-3 w-3" /> Fiche Technique</span>
                    <h2 className="text-3xl font-black text-slate-900 mt-6 tracking-tighter leading-[0.9] uppercase italic">{selectedRouteInfo.name}</h2>
                  </div>
                  <button onClick={() => setShowDetails(false)} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200 ml-2">
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-8 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Altitude</p>
                            <p className="text-lg font-black text-slate-800 tracking-tighter italic">{selectedRouteInfo.altitude || "N/A"}</p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Dalles</p>
                            <p className="text-lg font-black text-slate-800 tracking-tighter italic">{threeModels.length} LiDAR</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {selectedRouteInfo.c2c && (
                            <a href={selectedRouteInfo.c2c} target="_blank" rel="noreferrer" className="flex items-center justify-between w-full p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-[#D9534F] transition-all group shadow-xl">
                                <div className="flex items-center gap-4">
                                    <CamptocampLogo />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Voir sur Camptocamp</span>
                                </div>
                                <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </a>
                        )}
                    </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function HomePage() { return ( <Suspense fallback={null}> <HomePageContent /> </Suspense> ); }