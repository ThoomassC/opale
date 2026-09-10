import type { ReactNode } from 'react';

/* =============================================================================
   LA LENTILLE — le filtre SVG que `lens.css` référence, et rien d'autre.

   POURQUOI UN COMPOSANT PLUTÔT QU'UNE FEUILLE DE STYLE. `backdrop-filter`
   accepte une référence de filtre, `url(#tc-lens)`, mais un filtre SVG n'est
   pas une valeur CSS : c'est un ÉLÉMENT, qui doit exister dans le document.
   Une feuille de style ne peut pas en poser un. Le déplacement du fond ne peut
   donc pas être livré par `lens.css` seule — il lui faut ce composant, monté
   une fois, n'importe où dans le document.

   CE QU'IL RENDE EST INVISIBLE et doit le rester : un `<svg>` de taille nulle,
   `aria-hidden`, sorti du flux. Il ne peint pas, il ne mesure pas, il ne prend
   pas de place. C'est un porte-définitions.

   L'OUBLI EST SANS CONSÉQUENCE, ET C'EST MESURÉ. Un `backdrop-filter` qui
   référence un filtre absent est INERTE dans Chromium 151 : le fond n'est pas
   déformé, et l'élément est peint normalement. Sondé au pixel — les rayures du
   fond derrière un bouton dont le filtre n'existe pas sont à la même position
   qu'en l'absence de tout filtre. Le bouton `bubble` sans ce composant n'est
   donc pas cassé : il est simplement sans lentille, ce qui est exactement son
   rendu de base partout où `backdrop-filter: url()` n'est pas honoré.

   AUCUN HOOK, AUCUN ÉTAT : rendu tel quel comme Server Component, comme les
   dix-huit autres composants de la librairie.
   ========================================================================== */

/* -----------------------------------------------------------------------------
   LA CARTE DE DÉPLACEMENT, ET POURQUOI ELLE EST EN DEUX MORCEAUX.

   `feDisplacementMap` lit un DÉCALAGE par pixel dans deux canaux d'une image :
   ici le rouge porte l'axe x, le vert l'axe y. La valeur neutre est 128 — un
   pixel à `rgb(128, 128, …)` ne déplace rien. Au-dessus, le fond est échantillonné
   plus loin dans la direction ; en dessous, plus près. La convention de signe a
   été sondée et non supposée : une carte uniforme à R = 255 avec `scale = 10`
   déplace le fond de 5 px, et la mesure donne le sens NÉGATIF — R au-dessus de
   128 tire le contenu vers la gauche. C'est ce qui fixe le sens des deux
   dégradés ci-dessous : clair au bord gauche, sombre au bord droit, donc le fond
   est ramené vers l'intérieur des deux côtés. C'est le comportement d'une
   lentille convexe, pas d'un décalage.

   DEUX IMAGES ET UN `feBlend`, LÀ OÙ UNE SEULE SUFFIRAIT EN APPARENCE. Écrire
   les deux dégradés dans un seul SVG demande de les composer, donc un
   `mix-blend-mode: screen` sur un `<rect>` À L'INTÉRIEUR d'une URI de données.
   Cela fonctionne dans Chromium, et c'est tout ce qu'on en sait : c'est une
   propriété CSS interprétée dans un document imbriqué qu'aucun `@supports` ne
   permet d'interroger. Si elle n'était pas honorée, les deux dégradés
   s'empileraient au lieu de se composer et le canal x serait perdu SANS BRUIT —
   le bouton se déformerait seulement en vertical, ce qui ressemble à un choix.
   Les deux cartes sont donc composées par `feBlend mode="screen"`, une
   primitive de filtre, dans le seul langage dont ce fichier dépend déjà.
   `screen` est ici une addition exacte : les canaux ne se recouvrent pas.

   LE PROFIL EST PLAT AU CENTRE. De 22 % à 78 % de la boîte, les deux dégradés
   valent 128 : le fond y est rendu tel quel. Le déplacement est réservé à la
   bande de bord, ce qui est ce qui fait lire une BULLE et non une loupe — une
   goutte posée sur une surface est épaisse au bord et transparente au milieu.
   Les deux arrêts intermédiaires (198 et 58 à 45 % de la bande) courbent le
   profil : sans eux la transition centre/bord est une cassure, et elle se voit
   comme un anneau net à l'intérieur du bouton.
   -------------------------------------------------------------------------- */

/** Les arrêts du profil, du bord vers le centre. Écrits une fois, lus deux. */
const PROFILE: readonly (readonly [number, number])[] = [
  [0, 255],
  [0.099, 198],
  [0.22, 128],
  [0.78, 128],
  [0.901, 58],
  [1, 0],
];

/**
 * Une carte de déplacement à un seul axe, en URI de données.
 *
 * `channel` choisit le canal peint — `'r'` pour l'axe x, `'g'` pour l'axe y —
 * et les deux autres restent à zéro, ce qui est la condition pour que le
 * `feBlend mode="screen"` du filtre les additionne sans les mélanger.
 *
 * L'URI est en `utf8` et non en base64 : elle reste lisible dans l'inspecteur,
 * et c'est la seule documentation de la carte qu'un débogueur verra. Le `#` des
 * références de dégradé y est percent-encodé — c'est OBLIGATOIRE, un `#` non
 * encodé dans une URI de données ouvre un fragment et tronque le SVG.
 */
function axisMap(channel: 'r' | 'g'): string {
  const stops = PROFILE.map(([offset, value]) => {
    const color = channel === 'r' ? `rgb(${value},0,0)` : `rgb(0,${value},0)`;
    return `<stop offset='${offset}' stop-color='${color}'/>`;
  }).join('');

  /* Le dégradé est horizontal pour l'axe x, vertical pour l'axe y. */
  const vector = channel === 'r' ? "x1='0' y1='0' x2='1' y2='0'" : "x1='0' y1='0' x2='0' y2='1'";

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' preserveAspectRatio='none'>` +
    `<defs><linearGradient id='g' ${vector}>${stops}</linearGradient></defs>` +
    `<rect width='100' height='100' fill='url(%23g)'/></svg>`;

  return `data:image/svg+xml;utf8,${svg}`;
}

const MAP_X = axisMap('r');
const MAP_Y = axisMap('g');

/* -----------------------------------------------------------------------------
   CE FILTRE NE FLOUTE PAS, ET C'EST LA DÉCISION LA PLUS IMPORTANTE DU FICHIER.

   Le flou est ce qui rend le libellé lisible au-dessus d'un fond quelconque :
   il efface les hautes fréquences — le texte, une grille, une photo — que le
   voile seul ne masque pas. Il a donc sa place dans la chaîne… mais PAS ICI.

   Écrit dans ce filtre, le flou disparaissait avec lui. Un document qui importe
   `lens.css` sans monter ce composant — l'oubli attendu, puisque le composant
   est la moitié qu'on ne voit pas — servait alors un bouton à voile 0,32 SANS
   AUCUN FLOU : le libellé retombait sous 4,5:1 au-dessus de n'importe quel
   contenu chargé, et rien ne le signalait, puisque le bouton reste par ailleurs
   parfaitement peint. Le repli aurait été moins accessible que le cas nominal,
   ce qui est l'inverse de ce qu'un repli doit faire.

   `lens.css` porte donc le flou, dans `backdrop-filter`, AVANT la référence à
   ce filtre : `blur(…) saturate(…) url(#tc-lens)`. Les filtres s'appliquent
   dans l'ordre écrit, donc le fond est flouté puis déplacé — exactement la
   chaîne mesurée. Et la lisibilité ne dépend plus du montage : avec ou sans
   lentille, le libellé est lu sur la même plaque.

   RESTENT LES DEUX CONSTANTES PUREMENT GÉOMÉTRIQUES, mesurées toutes les deux.

   `SCALE` — l'amplitude du déplacement. En unités de boîte objet, une longueur
   scalaire est multipliée par sqrt((w² + h²) / 2), donc l'amplitude SUIT LA
   TAILLE du bouton : sqrt((170² + 52²) / 2) = 125,7, donc 16,3 px sur un bouton
   de 170 × 52 ; et sqrt((340² + 52²) / 2) = 243,2, donc 31,6 px sur un bouton
   deux fois plus large. (Ce second chiffre disait 19 px, qui ne sort d'aucun
   calcul — il correspondrait à une boîte de 200 × 52.) C'est le comportement voulu — une grosse goutte courbe plus
   qu'une petite.

   `SPREAD` — l'écart d'indice entre les canaux, c'est-à-dire la DISPERSION
   CHROMATIQUE. Les trois canaux sont déplacés de scale × (1 ± 0,12), puis
   recomposés : le bord du bouton porte une frange colorée, comme un vrai bord
   de verre. À 0,45 la frange devient un arc-en-ciel et le bouton ressemble à un
   défaut d'affichage ; 0,12 est la valeur où la frange se voit sans se nommer.
   -------------------------------------------------------------------------- */

const SCALE = 0.13;
const SPREAD = 0.12;

/** Les trois amplitudes, du canal le plus dévié au moins dévié. */
const SCALE_R = SCALE * (1 + SPREAD);
const SCALE_G = SCALE;
const SCALE_B = SCALE * (1 - SPREAD);

/** Isole un canal en laissant l'alpha intact, pour que `screen` recompose. */
const KEEP_R = '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0';
const KEEP_G = '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0';
const KEEP_B = '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0';

export interface GlassLensProps {
  /**
   * Le préfixe des identifiants rendus. Par défaut `tc`, ce qui produit
   * `#tc-lens` — l'identifiant que `lens.css` référence, donc le laisser tel
   * quel est le cas normal.
   *
   * Il existe pour deux situations réelles, et pas pour la configuration :
   * une page qui possède déjà un `#tc-lens` à elle, et un second jeu de
   * définitions monté volontairement à côté du premier. Dans les deux cas,
   * c'est à l'appelant d'écrire la règle CSS qui cite son propre identifiant —
   * `lens.css` ne connaît que le défaut.
   */
  readonly idPrefix?: string;
}

/**
 * Le porte-définitions de la lentille : monté UNE FOIS par document, il donne
 * au bouton `variant="bubble"` sa déformation du fond.
 *
 * Ne rend rien de visible. Placez-le où vous voulez — la fin du gabarit est
 * l'endroit habituel — et importez `@thomascaron/ui/lens.css`.
 *
 * Sans lui, le bouton `bubble` reste correct : voile, liseré et reflet sont
 * portés par la feuille de style, seule la déformation manque.
 *
 * @example
 * // Une fois, dans le gabarit de l'application.
 * <>
 *   {children}
 *   <GlassLens />
 * </>
 */
export function GlassLens({ idPrefix = 'tc' }: GlassLensProps = {}): ReactNode {
  return (
    <svg
      /* `aria-hidden` ET `focusable="false"` : le premier retire l'élément de
         l'arbre d'accessibilité, le second empêche Internet Explorer et les
         anciens Edge de le placer dans l'ordre de tabulation — un `<svg>` y
         était focusable par défaut. Deux attributs pour deux publics. */
      aria-hidden="true"
      focusable="false"
      /* Taille nulle DANS L'ATTRIBUT autant que dans le style : sans les
         attributs, un `<svg>` sans dimensions prend 300 × 150 px avant que la
         feuille de style n'arrive, donc un saut de mise en page au chargement.
         `position: absolute` le sort du flux, `overflow: hidden` garantit que
         rien de son contenu ne peut peindre au-delà. */
      width="0"
      height="0"
      className="tc-lens-defs"
      style={{ position: 'absolute', inlineSize: 0, blockSize: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter
          id={`${idPrefix}-lens`}
          /* La région de filtre DÉBORDE la boîte de 30 % de chaque côté. Le
             bord de la bulle échantillonne le fond au-delà de l'élément : dans
             une région serrée sur la boîte, il n'y trouverait que du
             transparent, et la frange se peindrait en noir. */
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          /* La clé de la réutilisabilité : en unités de boîte objet, la carte
             s'ÉTIRE sur le bouton et l'amplitude suit sa taille. Sondé —
             sans cet attribut, la carte garde ses 100 × 100 px intrinsèques,
             se termine au premier tiers d'un bouton à libellé long, et le reste
             de la surface reçoit un décalage uniforme au lieu d'une lentille. */
          primitiveUnits="objectBoundingBox"
          /* Le déplacement et la recomposition des canaux sont des opérations
             GÉOMÉTRIQUES sur des pixels d'écran. Les mener dans l'espace
             linéaire par défaut de SVG ferait passer le fond par deux
             conversions gamma pour rien, et éclaircirait la frange. */
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={MAP_X}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="mapX"
          />
          <feImage
            href={MAP_Y}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="mapY"
          />
          <feBlend in="mapX" in2="mapY" mode="screen" result="map" />

          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={SCALE_R}
            xChannelSelector="R"
            yChannelSelector="G"
            result="shiftedR"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={SCALE_G}
            xChannelSelector="R"
            yChannelSelector="G"
            result="shiftedG"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={SCALE_B}
            xChannelSelector="R"
            yChannelSelector="G"
            result="shiftedB"
          />

          <feColorMatrix in="shiftedR" type="matrix" values={KEEP_R} result="keptR" />
          <feColorMatrix in="shiftedG" type="matrix" values={KEEP_G} result="keptG" />
          <feColorMatrix in="shiftedB" type="matrix" values={KEEP_B} result="keptB" />

          <feBlend in="keptR" in2="keptG" mode="screen" result="keptRG" />
          <feBlend in="keptRG" in2="keptB" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
