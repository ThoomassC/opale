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
npm i "@thomascaron/ui@github:ThoomassC/ui-commune#v1.2.0"
```

Le paquet se compile à l'installation (`prepare`). Cinq points d'entrée :

```ts
import '@thomascaron/ui/tokens.css'; // la palette, les échelles, le focus, le mouvement
import '@thomascaron/ui/ui.css'; // les styles de composants, une seule fois par app
import '@thomascaron/ui/glass.css'; // OPTIONNEL — le thème verre, inerte sans l'attribut
import '@thomascaron/ui/lens.css'; // OPTIONNEL — le bouton bulle, après ui.css
import { Button, Field, Input } from '@thomascaron/ui';
import { contrastRatio, parseThemes } from '@thomascaron/ui/contract'; // dev only
```

> **`lens.css` a la MÊME contrainte, pour une autre raison.** Elle écrase le fond que
> `button.css` pose sur `.tc-btn--bubble`, à poids égal `(0,1,0)` : importée avant
> `ui.css`, elle est simplement inopérante, et sans rien dire — le bouton reste peint,
> il n'est juste plus en verre.

> **L'ordre de ces imports EST la cascade, et `glass.css` vient en dernier.** Son bloc de
> jetons pèse `(0,2,0)` — exactement le poids de `:root[data-theme='dark']`. À égalité,
> c'est l'ordre du document qui tranche : importée avant `tokens.css`, la feuille perd
> contre le bloc sombre et le thème verre disparaît **en sombre seulement**. C'est le
> genre de panne qui se voit un jour sur deux.

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

Dix-huit, tous **sans état et sans hook** — ils rendent tels quels en Server Component et
ne coûtent rien au budget JavaScript de leurs hôtes. Sept sont arrivés en v0.3.0, portés du
portfolio ; le dix-huitième, `GlassLens`, en v1.2.0 :

| Composant                | Ce qu'il rend                                                     |
| ------------------------ | ----------------------------------------------------------------- |
| `Backdrop`               | L'hôte du décor : six halos (trois froids, trois chauds), positionné, isolé, clippé en `clip` |
| `SectionHeading`         | Sourcil cuivre, titre de niveau 2 à 4 **choisi par l'appelant**, chapô |
| `IconTile`               | Tuile en squircle. `<span aria-hidden>` en décor, `<a>` dès qu'un `href` est fourni — la branche lien exige alors un `label` |
| `DateRange`              | Deux `<time dateTime>` distincts, séparés par un « à » masqué visuellement ; plage ouverte rendue en texte simple |
| `Timeline` / `TimelineItem` | `<ol>` nommée et son entrée, géométrie seule — le matériau reste `Card`. L'entrée prend le niveau de son titre en prop |
| `ChipList`               | `<ul>` nommée de `Tag` en variante `plain`. **Rend `null` sur une liste vide** |
| `GlassLens`              | Ne peint AUCUN pixel : un `<svg>` de taille nulle portant le filtre `#tc-lens` que `lens.css` référence. Monté une fois par document, il donne au bouton `bubble` sa déformation du fond |

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

## Le thème verre liquide

Un second axe, **orthogonal** au clair/sombre : un attribut sur la racine, et la feuille
optionnelle `glass.css`. Quatre combinaisons — aplat clair, aplat sombre, verre clair, verre
sombre — servies sans une ligne de JavaScript.

```html
<html data-theme="dark" data-material="glass">
```

`data-material` n'a **qu'une valeur écrite** : `glass`. L'absence de l'attribut est le mode
aplat, et aucun sélecteur `[data-material='flat']` n'existe nulle part — `data-theme` a besoin
de `"light"` parce que l'OS peut imposer le sombre, or il n'existe aucune `prefers-material` à
contredire. La librairie **ne publie pas de sélecteur** : trois mécanismes de bascule
incompatibles cohabitent entre les consommateurs, en publier un reviendrait à publier le
mauvais deux fois. La bascule de la vitrine reste dans la vitrine.

### Ce qui devient du verre, et ce qui n'en devient pas

Le partage n'est pas esthétique. Il suit la doctrine d'Apple — **« Don't use Liquid Glass in
the content layer »**, le matériau est la couche de navigation qui flotte au-dessus du
contenu — et il est borné par la mesure.

| | Composants | Ce qu'ils reçoivent |
| --- | --- | --- |
| **Flou + liseré** | `Button --secondary`, `Button --danger`, `Message`, `IconTile` | `backdrop-filter: blur(var(--glass-blur-control)) saturate(...)` et un liseré spéculaire sur `::before` |
| **Flou seul** | `Input`, `Select`, `Textarea` | le flou. Pas de liseré : **un contrôle de formulaire ne génère pas de boîte de pseudo-élément** — sondé, le témoin `<span>` peint son anneau, les trois contrôles n'en peignent aucun pixel |
| **Liseré seul, aplat conservé** | `Button --primary`, `Tag`, les trois `Pill` | le bord et le reflet, jamais la transparence de fond |
| **Inchangés** | `Backdrop`, `Card`, `Checkbox`, `ChipList`, `DateRange`, `Field`, `SectionHeading`, `Timeline` | rien |

**Pourquoi un aplat qui porte du texte ne devient pas translucide**, chiffré : `--accent` a
besoin d'un alpha ≥ **0,892** pour que `--text-on-accent` tienne 4,5:1, et d'un alpha ≥
**0,811** pour que `--focus-inner` garde ses 3:1 sur l'aplat. Le bouton primaire disposerait
donc de 11 % de transparence, que personne ne voit. Une pastille tolère au mieux un alpha
≈ 0,78 : `--status-progress-text` tombe à **4,48:1 dès l'alpha 0,70**, et le blanc de la
pastille « acquis » à **3,74:1 à 0,60**.

**Pourquoi `Tag` et `Pill` n'ont pas de flou** : un `backdrop-filter` coûte une passe de
composition **par élément**, pas par composant. Une `ChipList` de vingt chips, c'est vingt
couches promues. La contrainte de performance et la contrainte WCAG désignent ici le même
coupable.

**Pourquoi `Backdrop` et `Card` ne changent pas** : le décor est le **sol**, il n'a rien
derrière lui à filtrer ; et `Card` a déjà son verre, dont `variant="flat"` est l'échappatoire
opaque assumée — celle dont `travels_in_world` aura besoin photo par photo.

**Pourquoi `Checkbox` est hors périmètre** : la case est dessinée par l'agent utilisateur. La
verrer demanderait `appearance: none`, donc perdre la coche système, le mode contraste forcé
et l'état indéterminé.

### Les trois replis, tous obligatoires

| Condition | Ce qui se passe |
| --- | --- |
| `@supports not (backdrop-filter)` | les liserés partent ; les sept surfaces retrouvent au pixel leur rendu de mode aplat — la feuille ne pose aucun fond, il n'y a donc rien à rendre opaque |
| `prefers-reduced-transparency: reduce` **ou** `prefers-contrast: more` | tous les filtres à `none`, tous les liserés retirés |
| `forced-colors: active` | les liserés **et** les filtres s'éteignent |

Les deux conditions du deuxième cas ne sont pas une ceinture de plus :
`prefers-reduced-transparency` n'est implémenté **que par Chromium**. Et le troisième cas est
nécessaire parce que — mesuré, contre l'intuition — **`forced-colors: active` n'implique pas
`prefers-contrast: more`**.

> **Le trou résiduel, et rien en CSS ne peut le fermer.** Un utilisateur qui a activé
> *seulement* « Réduire la transparence » (macOS) ou « Effets de transparence : désactivé »
> (Windows), **sans** contraste élevé, ne déclenche aucune de ces trois requêtes sous Safari
> ni sous Firefox : il garde le verre. Sans conséquence dans la vitrine, où le matériau est un
> clic explicite — réel pour un consommateur qui poserait `data-material="glass"` par défaut.
> Le contraste élevé de macOS, lui, passe bien par `prefers-contrast: more` (Safari 14.1+), et
> celui de Windows par `forced-colors` (Firefox).

### Ce qu'elle coûte

Mesuré sur `dist/glass.css` : **24 489 octets bruts, 8 963 gzippés**. Mais `build:css` copie
les feuilles **verbatim, commentaires compris** — il n'y a pas de minifieur dans ce dépôt, et
c'est un choix assumé pour toutes ses feuilles. La CSS utile, elle, pèse **4 204 octets
bruts, 685 gzippés** : c'est ce qu'un consommateur qui minifie paiera réellement. C'est aussi
pourquoi l'entrée est **optionnelle** plutôt qu'incluse dans `ui.css` : `travels_in_world` est
un non-consommateur plausible et durable de ce thème.

### Ce qu'il coûte à peindre, mesuré

Profilé au CDP (`Tracing`, durée de `Display::DrawAndSwap` par trame composée), A/B
**entrelacé dans un même chargement** pour qu'aucune dérive de charge ne soit attribuée au
matériau. Le rendu est **logiciel** — pas de GPU : les **rapports** et la **forme des
courbes** valent, les millisecondes absolues non, et le comportement iOS reste inconnu.

**Un `backdrop-filter` promeut exactement une couche de composition.** Mesuré au `LayerTree`
et non déduit : `+15 / +15` sur la page `Button`, `+7 / +7` sur `Field`. Mais c'est le nombre
**visible** qui coûte — à 300 puis 400 surfaces dont 216 seulement à l'écran, le coût ne bouge
pas. **Le verre hors écran est gratuit.**

| | ms / trame en aplat | en verre | écart |
| --- | --- | --- | --- |
| `#/composants/button` (15 surfaces) | 1,71 | 3,22 | **+1,51** |
| `#/composants/field` (7 surfaces) | 1,68 | 3,73 | **+2,05** |
| `#/compositions/verre-et-frise`, halos figés | 12,40 | 12,43 | **+0,03** |

`field` coûte **plus** que `button` avec deux fois moins d'éléments : ce n'est pas le nombre,
c'est l'**aire**. Le coût se lit à deux termes — environ **54 µs de forfait par élément** plus
**19,4 µs par millier de pixels carrés visibles**. Le modèle prédit les trois pages à
±0,34 ms sans réajustement.

**Il n'y a pas de falaise. C'est une droite** : 92,77 µs par étiquette de 70×26, 147,77 µs par
contrôle de 110×44, r² = 0,99999, coût unitaire constant de 5 à 400 éléments. Le décrochage
n'est pas une propriété du filtre, c'est l'instant où la droite croise le budget de trame :
**vers 168 étiquettes à 60 Hz, vers 105 contrôles**. Quarante `Tag` verrés coûteraient
3,65 ms/trame — un impôt de 22 %, pas une falaise.

**Le liseré spéculaire coûte zéro.** Entre −0,04 et +0,06 ms jusqu'à 400 éléments, dans le
bruit d'une mesure à 0,05 ms d'écart-type ; −0,01 ms sur la page réelle. C'est **ça** qui
justifie le rationnement : le flou se paie, le bord non.

**`--glass-blur-control: 12px` est aussi un choix de performance.** À aire égale, 12 px coûte
147 µs par surface contre 374 µs à 32 px — **2,54× moins**. La mesure de luminance et celle du
compositeur pointent dans le même sens, indépendamment. À noter : `blur(0px)` coûte encore
37 µs — la passe elle-même n'est jamais gratuite.

**Le poste de dépense n'est pas le verre rationné, c'est celui qui en est exempté.** Sur
`#/compositions/verre-et-frise`, `Card` pèse **11,08 ms sur 14,51 — 76 % du budget**, parce
qu'elle est le seul objet de la librairie à porter **deux** `backdrop-filter` : le ménisque de
2 px sur l'hôte (5,49 ms, il couvre toute l'aire de la carte) et le cœur de 32 px sur son
`::before` (6,76 ms). Les sept familles rationnées, elles, coûtent 1,40 ms — **10 %**. Facteur
huit entre l'exempté et les rationnées.

**Et au repos, décor visible, personne ne touchant à rien** : les six halos animés forcent une
composition continue à ~100 trames/s, soit **974 ms de composition par seconde — 97 % d'un
cœur**. Les halos ne coûtent presque rien en eux-mêmes ; ils coûtent en rendant les trames
**obligatoires**, et chacune réévalue tous les `backdrop-filter` au-dessus d'eux. Retirer le
flou de `Card` en gardant les halos ramène la charge à 19 %. Hors écran, la charge est
**nulle** — le décor ne coûte que visible — et tout est déjà derrière
`prefers-reduced-motion: no-preference`.

### Ce qui garde le thème

`src/styles/glass-theme.structure.test.ts` lit la feuille en texte et épingle, entre autres :
la liste des sélecteurs verrés **croisée avec les classes réellement émises par les
composants** — un dix-huitième composant ajouté sans règle de verre ni exclusion motivée fait
rougir la suite ; l'appariement de chaque `backdrop-filter` avec son doublet `-webkit-`, la
cible d'un thème Liquid Glass étant Safari ; l'interdiction de cibler `::after`, où
`button.css` tient le seul indicateur d'attente du bouton ; la présence **et l'ordre** des
trois replis ; et l'absence de toute couleur hors des blocs de repli — la forme exécutable de
« la couleur par le jeton, la matière par la feuille ».

Ce compte de dix-sept est passé à dix-huit avec `GlassLens`, qui est **exclu avec sa
raison** : il ne peint aucun pixel, donc il n'a pas de surface à verrer.

## Le bouton bulle, et ce qu'il a fallu abandonner pour l'avoir

`variant="bubble"` + `lens.css` + `<GlassLens />` : un bouton dont le fond est réellement
DÉFORMÉ, pas seulement flouté. `backdrop-filter` accepte une référence de filtre SVG, et
Chromium l'honore — sondé au pixel, une carte uniforme à `scale = 10` déplace le fond de
5 px, exactement ce que la spécification annonce. Le filtre déplace les trois canaux de
`scale × (1 ± 0,12)` : le bord porte donc une frange colorée, comme un vrai bord de verre.

**Deux moitiés, et aucune ne suffit.** Un filtre SVG est un ÉLÉMENT, pas une valeur CSS :
`lens.css` ne peut pas en poser un. D'où le composant. Ce qui rend l'oubli inoffensif est
mesuré : **une référence vers un filtre absent est INERTE** — le fond n'est pas déplacé, et
le reste de la déclaration s'applique. Le bouton sans lentille est un bouton de verre
flouté, complet et lisible.

### La contradiction, chiffrée

Un libellé lisible et une réfraction visible s'excluent, et le flou est l'arbitre : il
efface les hautes fréquences qui rendent le texte illisible, donc aussi celles que la
lentille aurait courbées. Mesuré sur les pixels composités, voile 0,32, libellé en
`--text-strong`, pire ratio relevé :

| `--lens-blur`   | damier 20 px + gras | fond réaliste |
| --------------- | ------------------- | ------------- |
| 0 px            | 2,87 / 2,08 ❌      | 9,82 / 11,10  |
| 6 px            | 5,30 / 4,38 ❌      | 7,39 / 11,93  |
| **8 px** (déf.) | **5,42 / 4,81**     | 7,49 / 10,37  |
| 12 px           | 5,46 / 4,73         | 7,90 / 8,64   |

Clair / sombre. Le damier de 20 px noir-blanc surchargé de texte gras est le pire fond que
j'aie su construire ; le fond réaliste est un dégradé à masses larges avec un titre et un
paragraphe, c'est-à-dire ce qu'un bouton flottant rencontre.

**Le défaut ne suppose rien sur le fond ; le baisser demande de mesurer le sien.** C'est
pour ça que `--lens-blur` est un jeton et non une constante : au-dessus d'une image, `0`
donne la réfraction pleine et le libellé tient encore 9,82:1.

Le voile est à **0,32 dans les deux thèmes**, et c'est une frontière, pas un goût : à 0,24
le clair tient encore (4,82:1) et le sombre tombe à 4,09:1 — **quel que soit le flou**
(4,03:1 à 12 px, 3,78:1 à 6 px). Le flou fait converger la plaque vers la moyenne du fond,
et cette moyenne est trop claire pour une encre claire. Seul le voile la déplace.

### Les états, et la non-conformité que l'audit a trouvée

Le survol et l'appui empruntaient `--panel-surface-hover` / `-active`, l'échelle d'état des
panneaux. Elle **creuse en clair et éclaircit en sombre** — juste pour un panneau, dont
l'encre est du côté opposé ; **faux** pour la lentille, dont le voile va dans l'autre sens
(blanc en clair, pitch en sombre) et dont l'encre suit le voile. Chaque état rapprochait donc
la plaque du libellé :

| état   | avant (clair / sombre) | après (clair / sombre) |
| ------ | ---------------------- | ---------------------- |
| repos  | 5,32 / 4,72            | 5,39 / 4,60            |
| survol | **4,47 / 3,60** ❌     | 5,85 / 5,48            |
| appui  | **4,26 / 3,30** ❌     | 6,07 / 5,74            |

Deux états sous 4,5:1 en clair, trois en sombre : **la frontière avait été calibrée sur le
seul état de repos.** Le lavis prend maintenant la famille du voile (`--lens-wash-*`), donc
le contraste MONTE avec l'état.

Le garde qui manquait n'est pas un test de présence — les blocs étaient là, les jetons étaient
thémés, la valeur était fausse. `src/styles/lens.structure.test.ts` vérifie la **polarité** :
que le lavis et le voile viennent de la même famille de primitives, bloc de thème par bloc de
thème. Prouvé par mutation : lavis remis à `--panel-surface-*` → 2 échecs ; lavis retiré d'un
bloc sombre → 2 échecs.

### La frontière du contrôle, et ce qu'aucune couleur ne peut promettre

`--glass-border` ne dessine **rien** : 1,75:1 sur le blanc de la vitrine, 1,74 sur
`--surface`, 1,72 sur `--site-background`, 1,85 et 1,87 sur les deux sols sombres. Or
`button.css` porte la doctrine du dépôt — « le liseré EST la forme d'un bouton dont le fond
est un lavis, donc WCAG 1.4.11 lui demande 3:1 ». La bulle emploie donc `--control-border`,
qui tient **5,73 / 5,13 / 4,77 / 6,64 / 6,42:1** sur ces cinq sols.

**Ce que ça ne règle pas.** Contre un contenu quelconque, aucune couleur opaque ne peut
garantir 3:1 : le pire support est celui de même luminance, et il donne 1:1 par construction.
Même la paire à deux couches — liseré opaque plus reflet spéculaire, contraste interne 5,73:1
en clair et 2,78 en sombre — ne descend qu'à environ 2,4:1 dans le pire cas. La frontière de
ce contrôle est garantie **sur les sols de la librairie et pas au-dessus d'une image
arbitraire.** C'est la même limite structurelle que celle du libellé, et une raison de plus de
tenir la variante dans la couche de navigation.

### Ce qu'elle coûte

`dist/lens.css` : **16 650 octets bruts, 6 572 gzippés** — dont l'essentiel est du
commentaire, `build:css` étant un `cp`. La CSS utile pèse **2 464 octets bruts, 738
gzippés**. `GlassLens` ajoute **3 210 octets de markup rendu**, une fois par document, et
zéro octet de JavaScript à l'exécution : le composant n'a ni état ni hook, et son SVG est
statique.

### Ce qui n'est pas promis

Le déplacement n'a été vérifié que sur **Chromium 151**. Safari et Firefox ne l'ont pas
été, et `@supports` ne permet pas de trancher : il répond vrai dans les trois moteurs pour
`backdrop-filter: url(#x)`. Le rendu sans déformation n'est donc pas un mode dégradé —
c'est le rendu de base, et il est complet.

Et la doctrine est celle d'Apple : **« Don't use Liquid Glass in the content layer. »**
Cette variante n'a de sens qu'au-dessus d'un contenu. Sur le sol d'un formulaire, elle ne
fait que rendre son propre fond illisible.

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
suite — et chacune des vingt-quatre pages se rend sans jeter, sans second `<h1>` et sans saut
de niveau de titre. `doc-shell.test.tsx` tient les deux autres : la note de version est le
premier élément du sommaire, et il y a une entrée de nav par page.

Le sol de la vitrine est **blanc**, et c'est une décision de vitrine seulement : le jeton
publié `--site-background` reste `#deedf0`, mesuré, servi aux deux consommateurs. Un sol
blanc dans la librairie invaliderait les vingt supports du contrat et retournerait la
décision « les sols clairs sont du papier, pas de l'écran ».

La barre du haut porte **deux** bascules indépendantes — clair/sombre et aplat/verre — et
tient sur une seule ligne de 320 px à 1440 px : sous 36 rem les libellés sont masqués
visuellement, leur nom accessible conservé. Cette hauteur n'est pas cosmétique : le collant
du sommaire et le `scroll-padding` qui empêche la barre de manger le focus (WCAG 2.4.11) s'en
décalent tous les deux.

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

> **v1.2.0 — un bouton de plus, un composant de plus, et rien qui casse.** `bubble` est
> une valeur AJOUTÉE à l'union `ButtonVariant` : un appelant qui ne l'écrit pas ne voit
> aucune différence, et `lens.css` est un cinquième point d'entrée optionnel. `GlassLens`
> est un dix-huitième composant, donc un ajout à la surface publiée, pas un changement.
> Deux primitives d'alpha entrent (`--tc-white-a32`, `--tc-pitch-a32`) ; aucune ne bouge.
> Le sommaire de la vitrine, lui, n'est pas dans le paquet. **Mineur.**

> **v1.1.0 — un second thème, et rien qui casse.** Le verre liquide arrive en feuille
> **optionnelle** (`./glass.css`) pilotée par un attribut : aucun jeton renommé, aucun rôle
> dont le sens change, aucun composant, prop ou classe modifié. C'est donc un **mineur**, et
> le raisonnement est le miroir de celui qui a refusé `1.0.0` à la v0.3.0 : appeler ceci
> `2.0.0` promettrait une rupture qui n'a pas eu lieu, et brûlerait le seul numéro qui reste
> pour une vraie. `2.0.0` attend le jour où `--surface` changera de sens.

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

## Les quatre manquements de contraste, publiés

La règle n° 7 s'applique à la palette elle-même. Le contrat mesure chaque encre sur les
**vingt supports** du produit « cinq supports × (nu + trois lavis d'état) », et quatre
couples ne tiennent pas leur seuil. Ils sont nommés plutôt que contournés, et chacun porte
l'encre — ou la forme — de remplacement qui tient au même endroit.

**Trois portent sur du TEXTE (WCAG 1.4.3, 4,5:1), le quatrième sur une FORME (WCAG 1.4.11,
3:1)** : le titre ne dit donc plus « AA » tout court.

Le pire support est toujours le même : **une carte posée sur le halo froid, avec le lavis
d'appui `--panel-surface-active` par-dessus**.

| Encre                | Pire cas mesuré                | Plancher | Ce qu'un composant fait à la place            |
| -------------------- | ------------------------------ | -------- | --------------------------------------------- |
| `--accent-secondary` | **2,96:1** en sombre           | 4,5:1    | Le cuivre est ÉDITORIAL : il n'a rien à faire sur un lavis d'état, qui est une couche d'INTERACTION |
| `--text-accent`      | **4,40:1** clair / **4,23:1** sombre | 4,5:1 | Un lavis d'appui ne porte que `--text-strong` — 6,85:1 clair, 6,12:1 sombre au même endroit |
| `--text-muted`       | **4,31:1** en sombre           | 4,5:1    | `--text-body`, 5,15:1 au même endroit. C'est l'appui et lui seul : 7,00:1 au lavis de repos |
| `--accent` (l'aplat du bouton primaire) | **2,59:1** sur le halo froid / **2,78:1** sur le halo chaud, en sombre | 3:1 | `.tc-btn--primary` déclare `border-color: var(--accent)` : son aplat EST sa seule limite visible. Il lui faut un liseré propre dès qu'il peut être posé sur un halo — `--control-border` tient 3,27:1 au même endroit — ou le halo doit rester hors de sa boîte |

> **`--warning` n'est plus de la série, et c'est le contrat qui l'en a sorti.** Son exemption
> disait « une mention d'avertissement se pose sur une carte NUE, où son pire cas est
> 4,75:1 » — une consigne que la librairie ne pouvait pas tenir : `.tc-message--warn` peint
> son propre lavis, et `Backdrop` l'autorise à le faire au-dessus d'un halo sans carte du
> tout. Mesurée, cette chaîne valait 3,35:1. L'ambre clair est passé à `--tc-amber-390`, et le
> pire cas de l'encre remonte à **5,395:1** en clair, **5,38:1** en sombre.

**Le quatrième ne porte pas sur une encre mais sur une FORME**, et son pire support n'est pas
un lavis d'état : c'est le halo. Le § 11 de `glass.contract.test.ts` publie ses dix mesures.

| substrat                   | clair  | sombre     |
| -------------------------- | ------ | ---------- |
| la page nue                | 4,53:1 | 3,28:1     |
| la carte sur la page nue   | 4,88:1 | 3,40:1     |
| la carte sur le halo froid | 3,93:1 | **2,59:1** |
| la carte sur le halo chaud | 3,96:1 | **2,78:1** |
| la carte en repli opaque   | 4,87:1 | 3,40:1     |

Le teal n'est pas en cause : il tient 3,40:1 sur la carte sans halo. C'est le halo qui remonte
le substrat vers lui — la bulle froide sombre est un teal de la même famille que l'accent, la
bulle chaude est simplement plus claire que le sol. **Ce manquement est antérieur au thème
verre** : il ne dépend que de `--halo-tint` et de `--glass-fill`, tous deux servis sans
`data-material="glass"`, et c'est ce que rend la page `#/compositions/verre-et-frise` en
sombre aujourd'hui.

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

Le thème verre en ajoute trois, et la première est la plus grave :

5. **Un rayon de flou excède l'élément qu'il filtre.** Pour une carte de 300 px,
   « entièrement posée sur un halo » reste un pire cas défendable. Pour un contrôle de
   44 px, `--glass-blur-control` vaut 12 px : son arrière-plan effectif est une moyenne de
   voisinage qui inclut ce qui est **à côté** de lui, pas seulement **derrière**. Aucune
   arithmétique de couches ne l'exprime. C'est ce qui a fait choisir 12 px et non 32 —
   mesuré sur un profil de luminance, la modulation du fond survit à 16 % du rayon 12 contre
   0,8 % du rayon 32.
6. **Deux `backdrop-filter` imbriqués.** Selon le moteur, l'enfant échantillonne la sortie
   déjà filtrée du parent ou la page brute. Le modèle suppose l'empilement des fonds, ce qui
   ne décrit exactement ni l'un ni l'autre — et c'est précisément ce que `nested()` prétend
   approcher.
7. **La réfraction n'est pas reproductible, donc elle n'est pas promise.** Le « lensing » est
   la signature du matériau d'Apple ; en CSS il demande `backdrop-filter: url(#...)`, qui est
   **Chromium seul** et non spécifié. Pire, `@supports (backdrop-filter: url(#f))` rend `true`
   dans les trois moteurs — c'est un test de syntaxe, pas de rendu — donc **aucune détection
   CSS ne peut protéger un repli**. Ce dépôt s'en tient au ménisque à deux anneaux, qui est
   la meilleure approximation atteignable partout.

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

1. **Le harnais navigateur, et le bouton bulle vient d'aggraver le cas.** Les quatre
   ratios de la table de `--lens-blur` ont été relevés par capture d'écran et lecture de
   pixels, à la main, dans une session : **rien ne les rejoue.** Le contrat de couleur
   sait recalculer une composition d'alphas ; il ne sait pas ce qu'un
   `feDisplacementMap` a mis sous un libellé. C'est la première mesure publiée par ce
   dépôt qu'aucun test ne garde, et un changement de `--lens-veil` ou de la carte de
   déplacement la périmerait en silence. Le thème verre, lui,
   multiplie par neuf la surface de rendu qu'aucun test ne garde : les limites du contrat
   listées plus haut ne sont pas des précautions de style, ce sont les trois choses que ce
   dépôt affirme sans pouvoir les prouver. Une sonde qui capture les quatre combinaisons,
   échantillonne le pixel réel derrière trois encres et recalcule le ratio est chiffrée à
   environ une journée. C'est le premier chantier où la promesse d'honnêteté du dépôt
   commence à coûter plus qu'elle ne rapporte.
2. **Le liseré du bouton primaire en thème sombre** (2,59:1 sur le halo froid). Deux issues :
   `border-color: var(--control-border)` sur `.tc-btn--primary`, qui tient 3,27:1 au même
   endroit mais fait apparaître un filet gris visible sur le teal — donc change l'apparence
   du portfolio —, ou la publication du manquement, qui est l'état actuel. C'est une décision
   d'apparence, elle appartient au propriétaire de la palette et ne doit pas être prise en
   passant dans un chantier de thème.
3. **Le double `backdrop-filter` de `Card`, et le coût du décor animé au-dessus de lui.**
   Mesuré : `Card` pèse 76 % du budget de composition de la page de compositions, et le décor
   visible force 97 % d'un cœur au repos dont 80 % est le flou de `Card` réévalué. Deux
   leviers séparés — ramener le cœur de 32 px à 12 px (−11 % du budget de la page) et le
   ménisque de 2 px sur l'hôte (−38 % à lui seul, parce qu'il couvre toute l'aire). Ce sont
   des décisions d'apparence sur le composant le plus visible de la librairie : elles
   appartiennent au propriétaire de la palette, pas à un chantier de thème.
4. **Minifier le CSS publié dans `build:css`.** `build:css` est un `cp` : tous les
   commentaires partent chez le consommateur. Mesuré — le socle livré passerait de **46,3 à
   5,7 kB gzippés (−88 %)**, et le coût marginal de `glass.css` de **7 597 à 222 octets**.
   Les commentaires sont la valeur du dépôt dans `src/` ; ils n'ont aucune raison d'être
   téléchargés. À faire dans le script, jamais en appauvrissant la source.
5. La bascule du fond de `travels_in_world` vers `#deedf0`, et le remesurage de sa carte.
6. Les trois familles de caractères, et le budget de police qui va avec.
7. La simulation de deutéranopie sur `--danger` / `--success` / `--warning` : elle n'a pas
   été faite, et le résultat peut changer les trois valeurs. Le rouge n'est séparé du
   cuivre que de 11,3° de teinte. Elle **a** été faite sur les trois pastilles
   d'avancement, et son résultat est la raison du glyphe : l'ambre et le violet tombent à
   1,16:1 l'un contre l'autre en clair, et les trois s'effondrent ensemble en sombre
   (1,06 / 1,21 / 1,14:1).
8. Le squircle (`corner-shape: superellipse()`) est **retenu** depuis la v0.3.0, sur
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
