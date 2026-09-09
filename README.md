# ui-commune — `@thomascaron/ui`

Le socle d'interface partagé par [`portfolio`](https://github.com/ThoomassC/portfolio) et
[`travels_in_world`](https://github.com/ThoomassC/travels_in_world).

## Pourquoi ce dépôt existe

`travels_in_world/src/styles/tokens.css` affirmait en commentaire que sa palette était
« délibérément identique à celle du portfolio, pour que les deux sites se lisent comme des
frères », et demandait que tout changement de couleur y soit répercuté.

Six jetons sur six avaient divergé, plus les deux fonds sombres. Aucun outil n'a rien dit,
**parce qu'un commentaire n'est pas un garde**.

Ce dépôt est ce garde. Il publie, dans cet ordre de valeur :

1. **un contrat de couleur exécutable** — il lit la feuille de jetons comme du texte,
   reconstruit ses trois thèmes, recompose les couches alpha et recalcule chaque ratio que
   les commentaires annoncent. Un chiffre faux fait échouer la CI le jour où il est écrit ;
2. **la feuille de jetons canonique** — la palette du portfolio, devenue référence parce
   qu'elle est la seule des deux à être mesurée et testée ;
3. **des composants sans état**, qui ne coûtent rien au budget JavaScript de leurs hôtes.

## Installation

```bash
npm i "@thomascaron/ui@github:ThoomassC/ui-commune#v1.0.0"
```

Le paquet se compile à l'installation (`prepare`). Trois points d'entrée :

```ts
import '@thomascaron/ui/tokens.css'; // la palette, les échelles, le focus, le mouvement
import '@thomascaron/ui/ui.css'; // les styles de composants, une seule fois par app
import { Button, Field, Input } from '@thomascaron/ui';
import { contrastRatio, parseThemes } from '@thomascaron/ui/contract'; // dev only
```

> **Point de vigilance en déploiement.** Si l'hôte n'exécute pas le script `prepare`
> (cache npm, image de build minimale), `dist/` sera absent et le build cassera en
> production sans avoir cassé en local. À vérifier par un déploiement de préversion avant
> tout passage en production.

### Les feuilles derrière `ui.css`

`ui.css` n'est **qu'un index de `@import`** : un fichier par famille de composants sous
`src/styles/components/`, plus `preferences.css` importé en dernier.

```
src/styles/
├── ui.css                    ← le point d'entrée public, rien que des @import
├── preferences.css           ← prefers-reduced-motion + forced-colors, transverses
├── doc.css                   ← la VITRINE, hors paquet (voir plus bas)
└── components/
    ├── utilities.css         ← .tc-visually-hidden + l'anneau de focus partagé
    ├── button.css   field.css          input.css      checkbox.css
    ├── pill.css     message.css        card.css       tag.css
    ├── backdrop.css section-heading.css icon-tile.css date-range.css
    └── timeline.css chip-list.css
```

Deux invariants à ne pas casser :

1. **L'ordre des `@import` EST la cascade.** `utilities.css` en premier (l'anneau de focus
   est partagé), `preferences.css` en dernier (ses deux `@media` redessinent tous les
   composants au-dessus, à spécificité égale), et les six feuilles du portage **après
   `card.css`** — `TimelineItem` se compose avec la carte, l'appelant empilant
   `tc-card tc-card--glass` sur son `<li>`. Réordonner change le rendu sans rien casser de
   visible. À ne pas confondre avec l'ordre **interne** de `card.css`, où le bloc du verre
   doit rester déclaré après le socle `.tc-card` et après `.tc-card--elev-3` : celui-là est
   testé (`styles/glass.structure.test.ts`), la ligne d'import ne l'est pas.
2. **Tout `.css` sous `src/styles/` est publié, sauf `doc.css`.** C'est ce que fait
   `build:css` : il copie l'arborescence dans `dist/` (les `@import` sont relatifs, donc
   ils se résolvent à l'identique depuis `dist`), puis retire `doc.css`. Une nouvelle
   feuille de vitrine doit donc s'ajouter à cette exclusion, sinon elle part chez les
   consommateurs.

`doc.css` porte les `.tc-doc-*` de la page de charte. Il n'est ni dans `ui.css` ni dans le
paquet : `src/main.tsx` est le seul à l'importer.

## Les composants

Dix-sept, tous **sans état et sans hook** — ils rendent tels quels en Server Component et
ne coûtent rien au budget JavaScript de leurs hôtes. Les sept derniers arrivent en v0.3.0,
portés du portfolio :

| Composant                | Ce qu'il rend                                                     |
| ------------------------ | ----------------------------------------------------------------- |
| `Backdrop`               | L'hôte du décor : six halos (trois froids, trois chauds), positionné, isolé, clippé en `clip` |
| `SectionHeading`         | Sourcil cuivre, titre de niveau 2 à 4 **choisi par l'appelant**, chapô |
| `IconTile`               | Tuile en squircle. `<span aria-hidden>` en décor, `<a>` dès qu'un `href` est fourni — la branche lien exige alors un `label` |
| `DateRange`              | Deux `<time dateTime>` distincts, séparés par un « à » masqué visuellement ; plage ouverte rendue en texte simple |
| `Timeline` / `TimelineItem` | `<ol>` nommée et son entrée, géométrie seule — le matériau reste `Card`. L'entrée prend le niveau de son titre en prop |
| `ChipList`               | `<ul>` nommée de `Tag` en variante `plain`. **Rend `null` sur une liste vide** |

Deux d'entre eux décident quelque chose au rendu, et aucun n'a besoin d'une frontière
client pour ça : `ChipList` rend `null` plutôt qu'une liste vide qu'un lecteur d'écran
annoncerait, et `Pill` **se replie sur le nom de son ton** (« Acquis », « En cours »,
« À venir ») si ses enfants ne produisent aucun libellé lisible, en le signalant par
`console.error`. La couleur de ses trois tons est mesurée indiscernable en deutéranopie :
le libellé est le garde-fou réel, et il est toujours rendu. Une version intermédiaire
**levait** dans ce cas, sur l'idée que les deux consommateurs étaient prérendus — c'est
faux, le portfolio fait `vite build` + `createRoot` sans frontière d'erreur, et un `throw`
en rendu client y démonte la racine React : page blanche pour tous, à cause d'une pastille.

`Timeline` et `ChipList` exigent un **nom accessible**, et de façon exclusive : `label`
**ou** `aria-labelledby`, jamais les deux ni aucun des deux. C'est délibéré — une liste
anonyme s'annonce « liste, 6 éléments » et laisse l'auditeur deviner ; et deux noms dont un
seul gagne est une divergence silencieuse. La branche lien d'`IconTile` porte la même
exigence par une prop `label`, rendue en texte masqué : l'icône étant son seul contenu
visible, la laisser à la charge de l'appelant produisait des liens nommés « ◆ ».

### `./contract` — ce que l'entrée de développement exporte en plus

Le **support composé** rejoint le contrat, et il n'y a plus qu'une définition du mot
« fond » : le portfolio nommait ses piles dans son fichier de test (`CARD_FLOORS`,
`WASH_SUPPORTS`), `travels_in_world` dans le sien (une fonction `stack()` maison).

```ts
import {
  resolveBackdrop, // (theme, spec) → l'aplat OPAQUE que la pile présente à une encre
  GLASS_BACKDROPS, // les CINQ supports sur lesquels une carte de verre est mesurée
  GLASS_LAYERS, // les couches nommées une fois : page, halos, remplissage, repli opaque
  STATE_WASHES, // les trois lavis d'état, du repos à l'appui
  withWash, // le même support, un lavis posé dessus — le libellé grandit, il n'est pas remplacé
} from '@thomascaron/ui/contract';
import type { BackdropSpec } from '@thomascaron/ui/contract';
```

Le type s'appelle **`BackdropSpec`** et non `Backdrop` : la librairie exporte depuis la
v0.3.0 un composant React `Backdrop` sur l'entrée `.`. Les deux ne se disputent
techniquement rien — deux points d'entrée — mais un consommateur qui mesure sa propre
palette importe volontiers les deux dans le même fichier de test, et devait alors aliaser
l'un des deux.

## La vitrine

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

Ce qui se rend est un **site de documentation** : barre de navigation à gauche, une page par
sujet, et **une entrée par composant publié** — la palette avec ses ratios mesurés, les quatre
échelles, le contrat d'accessibilité, une page par composant (spécimens rendus et tableau de
props tiré des types réels), et une page de compositions pour ce qui ne se juge qu'assemblé.
Le site est rendu **dans la palette qu'il documente** : le document est une instance de
lui-même, et si une règle est fausse il se dégrade avec elle.

Le routage passe par le fragment (`#/composants/button`) parce que la vitrine se construit en
statique dans `dist-showcase/`, sans serveur capable de réécrire une URL profonde vers
`index.html`.

Deux promesses de ce site sont **exécutables**, dans `src/showcase/registry.test.tsx` : chaque
composant exporté par `src/index.ts` a sa page — un composant publié sans page fait rougir la
suite — et chacune des vingt-trois pages se rend sans jeter, sans second `<h1>` et sans saut
de niveau de titre.

## Les règles, en sept lignes

Une règle qu'on ne peut pas citer de mémoire n'est pas appliquée.

1. **Un jeton nomme un rôle, jamais un emplacement.** Cinq encres de texte, pas douze cases
   par écran. `--card-title-color` est une dette : il fige un composant dans la palette.
2. **Une valeur de couleur se mesure, elle ne se déclare pas.** Sur le support où elle vit
   réellement, et le chiffre est recalculé en CI.
3. **Le support de référence n'est pas le fond de page.** Une palette validée contre
   `--site-background` seul est validée contre le meilleur cas.
4. **La hiérarchie se construit.** Résoudre chaque encre isolément contre son seuil les
   fait converger et tue la hiérarchie : plancher de ΔE OKLab 5 entre rôles voisins.
5. **Un invariant qui casse en silence a un test, pas un commentaire.**
6. **Le sens ne passe jamais par la couleur seule.** Le garde-fou réel est le libellé
   textuel ; la couleur est un renfort.
7. **Une contrainte non satisfaisable s'écrit, elle ne se contourne pas.** Une charte qui
   ne contient que des succès est une charte qu'on n'a pas éprouvée.

## Le contrat teal & cuivre

> **v1.0.0 — l'API se fige, et la vitrine devient un site.** Le vocabulaire décrit
> ci-dessous est celui que la 1.0 publie : rien n'a bougé depuis la v0.3.0, ce qui est la
> seule raison acceptable de promettre une stabilité. Ce que la 1.0 ajoute n'est pas un
> composant mais une lecture — une page par composant, une entrée de navigation par entrée
> publiée, et deux tests qui gardent cette correspondance.

> **v0.3.0 — le portfolio reprend la main, et ça casse six choses.** Pré-1.0, une
> rupture va dans le mineur : passer à `1.0.0` promettrait une stabilité que la
> réécriture de la palette vient de démentir.
>
> 1. **`PillTone` change de vocabulaire** : `'success' | 'warning' | 'danger'` →
>    `'done' | 'progress' | 'upcoming'`. L'axe de la pastille est l'AVANCEMENT, pas
>    la sévérité — ce second vocabulaire vit dans `Message` (`ok | warn | error`).
>    Une composante, un vocabulaire.
> 2. **`ButtonProps` est devenu une union** — `ButtonAsButtonProps |
>    ButtonAsAnchorProps` : un `href` fait basculer l'élément rendu de `<button>` à
>    `<a>`, et la branche ancre n'a plus de `type` (`AnchorHTMLAttributes` en porte
>    un — l'indice MIME de la cible — qui acceptait silencieusement
>    `type="submit"` sur un lien).
> 3. **`CardProps` est devenu une union** — `CardGlassProps | CardFlatProps`. Le
>    **verre est le défaut** et `elevation` y est déclaré `never` : `variant="glass"
>    elevation={2}` est désormais une erreur de compilation et non une prop
>    silencieusement ignorée. Le cran vit sur la carte opaque, seule des deux à en
>    avoir un.
> 4. **`--panel-surface*` n'est plus un aplat, c'est un lavis translucide.** Sur une
>    carte dont le repli opaque est `#ebf4f6`, il ne reste rien à éclaircir — le
>    blanc pur n'est qu'à 1,200:1 du sol — donc la couche d'état CREUSE en clair et
>    ÉCLAIRCIT en sombre. Conséquence pour l'appelant : un fond de panneau posé sur
>    autre chose que `--surface` prend la couleur de ce qui passe dessous.
> 5. **Quatre signatures ont bougé sous la revue d'accessibilité**, toutes dans le
>    sens d'une contrainte ajoutée : `IconTile` exige un `label` sur sa branche lien
>    (et son `aria-label` est retiré du type) ; `TimelineItem` prend un `level` ;
>    `Timeline` et `ChipList` prennent `label` **ou** `aria-labelledby`, jamais les
>    deux ; `Pill` ne lève plus. Un bouton `aria-disabled` rendu en lien **n'émet
>    plus d'attribut `href`** — c'est ce qui ferme le clic du milieu, le menu
>    contextuel et le glisser, qu'aucun `preventDefault` sur `click` n'atteignait —
>    et porte `role="link"` + `tabIndex={0}` pour rester focusable et annoncé
>    indisponible.
> 6. **La famille `--tc-paper-*` est supprimée.** Les cinq sols chauds
>    (`#fbf1de` … `#ded4c1`) que la v0.2.0 avait posés à la luminosité exacte de
>    leurs `mist` sont retirés : les sols du portfolio sont des `mist` froids, la
>    famille n'était plus citée nulle part, et cinq primitives qu'aucun rôle ne cite
>    sont une invitation à réintroduire par erreur un sol chaud. La retrouver, c'est
>    un `git show`.

| Rôle             | Jeton                | Ce qu'il a le droit de faire                                 |
| ---------------- | -------------------- | ------------------------------------------------------------ |
| L'encre          | `--accent`           | **Monopole** des actions et des états : boutons, liens, focus |
| Le décor         | `--accent-secondary` | L'éditorial et l'ornement, **jamais un contrôle**             |
| Le champ         | les neutres          | Le teal vidé de sa chroma : rien ne devient sale              |

Les deux sont tenus en opposition mesurée à 179,3° en clair et 179,5° en sombre, avec un
écart de luminosité OKLab d'au moins 0,08 — c'est lui qui empêche le décor d'usurper le
signal, puisque la teinte chaude est verrouillée par l'opposition.

Conséquence directe, et elle surprend : **l'action destructrice est un bouton à liseré,
jamais un aplat.** L'aplat plein est réservé au teal.

## Architecture des jetons

Trois couches, une seule direction de dépendance : `materials → roles → primitives`,
jamais l'inverse.

| Couche         | Fichier                     | Ce qu'elle nomme                    | Qui peut la citer                |
| -------------- | --------------------------- | ----------------------------------- | -------------------------------- |
| **Primitives** | `src/tokens/primitives.css` | Une **couleur**, pas un emploi      | Rôles et matériaux, uniquement   |
| **Rôles**      | `src/tokens/roles.css`      | Un **emploi** — « le texte fort »   | Tout composant                   |
| **Matériaux**  | `src/tokens/materials.css`  | Un **matériau** — le verre, ses filtres, les halos, les tuiles | Tout composant |

`materials.css` est chargé en **dernier** parce qu'il lit `--surface` et `--shadow-ink` ;
l'inverse laisserait `--glass-fill-solid` sans valeur. Le contrat vérifie la partie
vérifiable : aucun hexadécimal hors de `primitives.css`, et `roles.css` ne cite aucun jeton
de matériau.

Les primitives sont nommées `--tc-<famille>-<L>`, où `<L>` est la **luminosité OKLab
mesurée**, ×1000 et arrondie : `--tc-teal-515` vaut `#087487` parce que sa L vaut 0,515. Le
nom est une donnée, pas une convention — le contrat le vérifie.

Trois blocs de thème, dans cet ordre et pas deux :

```css
:root { /* déclare TOUT, en entier */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { /* redéfinit */ } }
:root[data-theme='dark'] { /* redéfinit */ }
```

Le thème sombre est donc servi **sans une ligne de JavaScript** — la seule architecture
compatible avec un site entièrement prérendu. Une couleur dont la seule déclaration vit
dans un `@media` ne s'applique jamais dans l'état non marqué : le contrat échoue si un
jeton sombre manque au bloc clair.

## Les quatre manquements AA, publiés

La règle n° 7 s'applique à la palette elle-même. Le contrat mesure chaque encre sur les
**vingt supports** du produit « cinq supports × (nu + trois lavis d'état) », et quatre
couples encre × support ne tiennent pas AA. Ils sont nommés plutôt que contournés, et
chacun porte l'encre de remplacement qui tient au même endroit.

Le pire support est toujours le même : **une carte posée sur le halo froid, avec le lavis
d'appui `--panel-surface-active` par-dessus**.

| Encre                | Pire cas mesuré                | Plancher | Ce qu'un composant fait à la place            |
| -------------------- | ------------------------------ | -------- | --------------------------------------------- |
| `--accent-secondary` | **2,96:1** en sombre           | 4,5:1    | Le cuivre est ÉDITORIAL : il n'a rien à faire sur un lavis d'état, qui est une couche d'INTERACTION |
| `--text-accent`      | **4,40:1** clair / **4,23:1** sombre | 4,5:1 | Un lavis d'appui ne porte que `--text-strong` — 6,85:1 clair, 6,12:1 sombre au même endroit |
| `--text-muted`       | **4,31:1** en sombre           | 4,5:1    | `--text-body`, 5,15:1 au même endroit. C'est l'appui et lui seul : 7,00:1 au lavis de repos |
| `--warning`          | **3,65:1** en clair            | 4,5:1    | Une mention d'avertissement se pose sur une carte NUE, où son pire cas est 4,75:1 |

**Sur les cinq supports nus, toutes les encres tiennent AA — pire cas 4,58:1.** C'est le
cuivre en sombre sur la carte posée sur le halo froid, soit 0,08 de marge.

Dit autrement, et c'est le point : **c'est le lavis qui fait tomber, pas le halo.** Le halo
seul dégrade le contraste sans le faire passer sous le seuil ; il faut une couche
d'interaction posée par-dessus pour franchir la ligne. `--accent-secondary` en sombre passe
de 4,58:1 nu à 2,96:1 avec le lavis d'appui.

Ces quatre notes ne sont pas des dettes déguisées : le test les vérifie **dans les deux
sens**. Une exemption dont la palette n'a plus besoin fait échouer la suite, et le nombre
d'exemptions est lui-même épinglé — en ajouter une est une modification visible en revue.

## Ce que le contrat ne prouve pas

Il lit du CSS en **texte** et ne compose que des couches de `background`. Sont donc hors du
domaine mesuré, et aucune assertion de ce dépôt ne doit prétendre le contraire :

1. **Le `backdrop-filter`** et le ménisque (`--glass-edge-*`, `--glass-rim-width`). Un flou
   moyenne les pixels du dessous — il rapproche donc le support de sa propre moyenne — et
   `saturate(1.6)` comme `brightness(1.08)` déplacent la couleur reçue. Rien de tout cela
   n'est calculé. Le portfolio a la même limite et la déclare *estimation* ; on reprend le
   mot.
2. **Les dégradés rendus** — `--glass-specular`, `--glass-highlight`, `--icon-surface-*`.
   Un arrêt de couleur se mesure, et le § 15 le fait arrêt par arrêt ; le dégradé rendu
   non, sa couleur en un point donné dépendant de la géométrie de l'élément.
3. **La géométrie des halos.** Les bulles sont des disques positionnés, pas des aplats de
   page : le modèle suppose qu'une carte peut se trouver entièrement dessus, ce qui est le
   cas le plus défavorable et non le cas général.
4. **Ce qu'un navigateur peint vraiment sur un élément donné.** Le contrat prouve qu'une
   pile nommée est arithmétiquement juste ; l'appariement d'une pile avec une règle CSS
   reste une affirmation humaine.

### Il n'y a aucun harnais navigateur dans ce dépôt

Pas de Playwright, pas de capture, pas de test de rendu. `jsdom` ne peint pas :
`getComputedStyle` y rend les valeurs déclarées, aucun pixel n'existe. **Le rendu du verre
n'a donc aucun garde automatisé** — ni le flou, ni le ménisque, ni le liseré spéculaire dont
le masque a déjà été cassé une fois par son voisin `backdrop-filter`.

Ce qui est verrouillé, c'est la **forme** de la feuille, par `styles/glass.structure.test.ts`
qui la lit en texte : les quelques propriétés dont l'absence est une panne *silencieuse* —
l'hôte du décor positionné, isolé et clippé en `clip` (et non `hidden`, qui casse un
`sticky` enfant), les disques à `z-index: -1`, la présence du `backdrop-filter` et du repli
`@supports not`. Aucune de ces absences ne casse le build ni ne rougit un autre test, et
chacune produit un décor qui monte par-dessus le contenu ou un verre qui n'en est plus un.

Les mesures de rendu citées dans les commentaires (Chromium 151 headless) ont été faites à
la main, une fois. **Elles ne sont pas rejouées en CI**, et rien ne les surveille.

## Ce que ce dépôt ne fait pas

- Il **ne publie pas sur npm** et n'a pas vocation à le faire tant que deux projets
  suffisent.
- Il **n'a pas migré** `portfolio` ni `travels_in_world` : ils consomment encore leurs
  propres feuilles. La bascule de `travels_in_world` implique de reteindre son fond de
  `#c4d8de` vers `#deedf0`, donc de remesurer les remplissages de sa carte du monde — c'est
  un chantier réel, pas un chercher-remplacer.
- Il **n'emporte plus le verre liquide en promesse : il l'emporte pour de vrai** depuis la
  v0.3.0 — `Card variant="glass"`, `Backdrop` et la couche `--glass-*` sont ici. Ce qui
  reste vrai de l'ancienne réserve : la campagne de mesure du portfolio est un corollaire
  de son verre, parce qu'il connaissait ses six sols. Posé sur des photos de voyage, il y a
  autant de sols que de photos — `travels_in_world` devra donc décider, photo par photo, du
  repli opaque plutôt que du verre.
- Il **ne vérifie pas le rendu du verre.** Aucun harnais navigateur, aucune capture : voir
  la section ci-dessus. Seule la *forme* de la feuille est verrouillée.
- Il **n'a pas de police propre.** Piles système dans les deux projets, et aucune requête
  hors origine n'est tolérée : une police sera auto-hébergée en `woff2`, sous un budget qui
  reste à ouvrir.

## Ce qui reste à décider

Par coût de retour en arrière décroissant.

1. La bascule du fond de `travels_in_world` vers `#deedf0`, et le remesurage de sa carte.
2. Les trois familles de caractères, et le budget de police qui va avec.
3. La simulation de deutéranopie sur `--danger` / `--success` / `--warning` : elle n'a pas
   été faite, et le résultat peut changer les trois valeurs. Le rouge n'est séparé du
   cuivre que de 11,3° de teinte. Elle **a** été faite sur les trois pastilles
   d'avancement, et son résultat est la raison du glyphe : l'ambre et le violet tombent à
   1,16:1 l'un contre l'autre en clair, et les trois s'effondrent ensemble en sombre
   (1,06 / 1,21 / 1,14:1).
4. Le squircle (`corner-shape: superellipse()`) est **retenu** depuis la v0.3.0, sur
   `IconTile` : le rayon en pourcentage donne déjà la bonne silhouette là où
   `corner-shape` manque, donc la dégradation est propre et il n'y a rien à prévoir. Ce qui
   reste ouvert est de savoir si la forme mérite d'exister sur d'autres composants alors
   qu'elle n'est pleine qu'en Chromium.

Deux questions que la charte laissait ouvertes sont **tranchées et mesurées** ici, plutôt
que reportées :

- **L'état désactivé n'utilise pas `opacity`.** La recette `opacity: 0.45` héritée du
  portfolio donnait 2,20:1 en clair contre 3,00:1 en sombre — un écart d'un tiers entre
  deux thèmes pour la même règle est un accident, pas une intention. La librairie pose
  `--panel-surface-active` + `--text-muted` + une bordure tiretée : mesuré 5,55:1 en clair
  et 5,69:1 en sombre pour le libellé, 3,92:1 et 4,31:1 pour la bordure. Le tiret est là
  parce que le sens ne doit pas passer par la couleur seule, y compris pour dire « inerte ».
- **`--warning` clair vaut `#7b5620`, et non le `#845d22` que la charte proposait.** Le
  `#845d22` tenait 4,90:1 sur le fond de page, mais 4,20:1 sur son propre lavis posé sur
  `--panel-surface` — c'est-à-dire dans une pastille, son emploi principal. La règle n° 3
  s'appliquait à elle-même : le fond de page n'est jamais le pire cas. Le contrat mesure
  désormais chaque encre sémantique sur son propre lavis, sur trois substrats et dans les
  trois thèmes.

## Scripts

| Commande            | Ce qu'elle fait                                          |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Sert la charte graphique sur `127.0.0.1:5173`             |
| `npm test`          | Le contrat de couleur et les tests de composants          |
| `npm run build:lib` | Compile la librairie dans `dist/`                         |
| `npm run build`     | Construit la charte statique dans `dist-showcase/`        |
| `npm run typecheck` | `tsc` sans émission                                       |
| `npm run lint`      | ESLint, `jsx-a11y` compris                                |
