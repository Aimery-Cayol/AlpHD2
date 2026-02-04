# Utilisation du système Level of Detail (LoD)

## Vue d'ensemble

Le système de Level of Detail (LoD) a été implémenté pour optimiser les performances lors de l'affichage de vos meshes 3D de montagnes alpines. Il bascule automatiquement entre une version haute résolution (niveau 11) et une version basse résolution (niveau 09) en fonction de la distance de la caméra.

## Fonctionnement automatique

### Détection automatique des paires LoD

Le système détecte automatiquement les paires de meshes correspondants dans vos fichiers S3 :

```
4565_6534_11.drc  (haute résolution)  \
4565_6534_09.drc  (basse résolution)  / → Regroupés automatiquement en un modèle LoD
```

**Format requis** : `XXXX_YYYY_NN.drc`
- `XXXX_YYYY` : Coordonnées de la dalle
- `NN` : Niveau de détail (11 = haute, 09 = basse)

### Distances de transition par défaut

- **0 - 2m** : Affichage haute résolution (niveau 11)
- **2 - 5m** : Affichage basse résolution (niveau 09)
- **> 5m** : Mesh masqué (culling)

## Fichiers créés

### Nouveau composant principal

**[`src/components/three/MeshLoaderWithLOD.tsx`](../src/components/three/MeshLoaderWithLOD.tsx)**
- Charge les deux niveaux de résolution en parallèle
- Utilise le composant `<Detailed>` de Drei pour le switching automatique
- Compatible avec tous les shaders existants (HauteMontagne, BasseMontagne)
- Utilise le GeometryCache pour optimiser la mémoire

### Fichiers modifiés

1. **[`src/app/page.tsx`](../src/app/page.tsx)**
   - Fonction `groupMeshesByCoordinates()` : regroupe automatiquement les meshes par coordonnées
   - Interface `Model` étendue avec `urlHigh`, `urlLow`, `lodEnabled`
   - Badge "LoD" dans l'interface pour identifier les modèles LoD

2. **[`src/components/three/ModelPositioner.tsx`](../src/components/three/ModelPositioner.tsx)**
   - Détection automatique des modèles LoD
   - Rendu conditionnel : `MeshLoaderWithLOD` vs `MeshLoader`

3. **[`src/components/three/ThreeScene.tsx`](../src/components/three/ThreeScene.tsx)**
   - Interface `Model` mise à jour

4. **[`src/components/three/SceneUI.tsx`](../src/components/three/SceneUI.tsx)**
   - Interface `Model` mise à jour

## Comment utiliser

### Configuration de votre bucket S3

Assurez-vous que vos meshes suivent le format de nommage correct :

```
meshes/
  ├── 4565_6534_11.drc  ✅ Haute résolution
  ├── 4565_6534_09.drc  ✅ Basse résolution
  ├── 4566_6534_11.drc  ✅ Haute résolution
  ├── 4566_6534_09.drc  ✅ Basse résolution
  └── 4567_6534_11.drc  ⚠️ Haute résolution seule (pas de LoD)
```

### Que se passe-t-il lors du chargement ?

1. **Chargement depuis l'API** : Les fichiers sont listés depuis S3
2. **Regroupement automatique** : La fonction `groupMeshesByCoordinates()` identifie les paires
3. **Affichage dans l'UI** : Les modèles LoD affichent un badge "LoD" bleu
4. **Sélection** : Quand vous sélectionnez un modèle LoD, les deux niveaux sont chargés
5. **Rendu** : Le système bascule automatiquement selon la distance caméra

## Indicateurs visuels

### Interface utilisateur

- **Badge "LoD" bleu** : Indique qu'un modèle utilise le système LoD
- **Console** : Logs détaillés lors du chargement :
  ```
  📊 Mesh HAUTE RÉSOLUTION (11) chargé: 4565_6534_11.drc
    └─ Vertices: 1,234,567
    └─ Triangles: 2,468,134
    └─ Mémoire: 45.32 MB
  📊 Mesh BASSE RÉSOLUTION (09) chargé: 4565_6534_09.drc
    └─ Vertices: 123,456
    └─ Triangles: 246,813
    └─ Mémoire: 4.53 MB
  ```

### Dans la scène 3D

- **Sphère verte** : Les deux niveaux sont en cache
- **Boîte verte** : Modèle chargé depuis le cache (BoundingBox)
- **Boîte jaune** : Modèle chargé depuis le réseau

## Configuration avancée

### Modifier les distances de transition

Dans [`ModelPositioner.tsx`](../src/components/three/ModelPositioner.tsx), ligne 62 :

```typescript
<MeshLoaderWithLOD
  urlHigh={model.urlHigh}
  urlLow={model.urlLow}
  distances={[2, 5]}  // ← Modifier ici
  // ...
/>
```

**Exemples de configurations** :

```typescript
// Plus agressif (changement plus tôt)
distances={[1, 3]}

// Plus conservateur (garde haute résolution plus longtemps)
distances={[5, 10]}

// Très proche (pour petites dalles)
distances={[0.5, 1]}
```

### Désactiver le LoD pour un modèle spécifique

Si vous voulez forcer l'utilisation d'un seul niveau pour certains modèles, vous pouvez modifier la fonction `groupMeshesByCoordinates()` :

```typescript
// Exemple : toujours utiliser haute résolution seule pour une zone spécifique
if (coords === '4565_6534') {
  lodModels.push(high);  // Haute résolution seule, pas de LoD
} else if (high && low) {
  lodModels.push({       // LoD normal
    name: coords,
    urlHigh: high.url || "",
    urlLow: low.url || "",
    lodEnabled: true,
    // ...
  });
}
```

## Performance et mémoire

### Avantages

✅ **GPU** : Une seule géométrie rendue à la fois (selon distance)  
✅ **Cache** : Les deux niveaux utilisent le GeometryCache  
✅ **Chargement** : Parallélisé avec `Promise.all()`  
✅ **Shaders** : Partagés entre les deux niveaux

### Considérations

⚠️ **RAM** : Les deux géométries restent en mémoire  
⚠️ **Réseau** : Charge initiale doublée (mais ensuite en cache)  
⚠️ **Transitions** : Instantanées (pas de morphing progressif)

### Recommandations

- Pour une scène avec **5 dalles** :
  - Avec LoD : Charge 10 meshes (5×2) ≈ 250 MB RAM
  - Sans LoD : Charge 5 meshes haute résolution ≈ 200 MB RAM
  
- **Point d'équilibre** : Le LoD devient intéressant avec 3+ dalles affichées simultanément

## Déboggage

### Vérifier que le LoD fonctionne

1. **Check console** : Vous devez voir les logs de chargement pour les deux niveaux
2. **Testez la distance** : 
   - Zoomez proche d'une dalle → devrait être en haute résolution
   - Dézoomez loin → devrait basculer en basse résolution
3. **userData** : Dans la console Three.js, inspectez `mesh.userData.lodLevel` (11 ou 9)

### Problèmes courants

**Les modèles LoD n'apparaissent pas**
- Vérifiez le format de nommage des fichiers
- Consultez la console pour voir si les paires sont détectées

**Transitions trop rapides/lentes**
- Ajustez les valeurs `distances` dans ModelPositioner

**Consommation mémoire élevée**
- Normal : les deux niveaux restent en mémoire
- Solution : Vider le cache depuis SceneUI si nécessaire

## Évolutions futures possibles

1. **LoD dynamique** : Décharger la géométrie non-utilisée de la RAM
2. **Niveau intermédiaire** : Ajouter un niveau 10 entre 11 et 09
3. **Distances par défaut** : Calculer automatiquement selon la taille du mesh
4. **Morphing** : Transition progressive entre niveaux (plus complexe)
5. **Configuration UI** : Contrôles dans LevaUI pour ajuster les distances en temps réel

## Support

Pour plus d'informations, consultez :
- [Plan d'implémentation complet](../plans/lod-implementation-plan.md)
- [Documentation Drei Detailed](https://github.com/pmndrs/drei#detailed)
- [Three.js LOD](https://threejs.org/docs/#api/en/objects/LOD)

---

**Date de création** : 2026-02-04  
**Version** : 1.0
