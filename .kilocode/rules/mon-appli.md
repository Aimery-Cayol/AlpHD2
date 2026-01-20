# mon-appli.md

Présentation de mon appli
## Lignes directrices

voici mon appli 3d next.js react three fiber qui affiche des meshs ultra HD de montagnes alpines au format draco .drc par dalles de 1 km x 1 km. les meshs sont téléchargés depuis mon backend amazon aws S3 bucket par le fichier MeshLoader.tsx.

## Fonctionnalités

- **Affichage 3D** : Utilisation de Three.js et React Three Fiber pour un rendu 3D interactif.
- **Chargement de modèles** : Chargement de modèles 3D au format Draco (.drc) pour une performance optimale.
- **Gestion des dalles** : Chargement dynamique des dalles de 1 km x 1 km, par l'onglet "zones disponibles" ou bien dans la page principale par le bandeau latéral affichant la liste des fichiers disponibles dans le bucket S3.
- **Backend AWS S3** : Stockage et récupération des modèles 3D depuis un bucket S3 d'Amazon AWS.
- **shader spéciaux** permettant de recréer un aspect haute montagne en fonction de l'inclinaison de la pente.
- **interface UI déroulante** pour réglages des paramètres 3d à la volée aec la bibliothèque LevaUI