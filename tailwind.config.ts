import type { Config } from 'tailwindcss';

/**
 * Tailwind exists in this repository for ONE reason: the fourteen components
 * vendored into `src/magic/**` style themselves with `@apply` inside their
 * `*.module.scss`. Nothing else in Opale uses Tailwind — `src/styles/**` and
 * `src/tokens/**` are hand-written token CSS under an executable colour
 * contract, and `src/components/**` consumes those tokens.
 *
 * Hence the two deliberate constraints below.
 *
 * 1. `content` is bounded to `src/magic/**` and to nothing else. Letting the
 *    scanner walk `src/styles/**` or `src/components/**` would emit utility
 *    classes for every word that happens to look like one in the token sheets,
 *    and would tie Opale's contract tests to Tailwind's output.
 *
 * 2. Version 3.4.x, not 4.x. The source library is a Tailwind 3 project: its
 *    `@apply` vocabulary, its `@layer utilities`, and the `theme.extend`
 *    shape below are v3 semantics. The `@theme { … }` block found in their
 *    `src/tailwind.css` is v4 syntax that v3 never processed — it was dead
 *    code upstream and is not reproduced here.
 *
 * This config is consumed ONLY by `vite.magic.config.ts`, which declares the
 * PostCSS pipeline inline. There is deliberately no root `postcss.config.js`:
 * such a file would apply to the showcase build and to Vitest as well, and
 * would run Tailwind over Opale's own stylesheets.
 */
export default {
  content: ['./src/magic/**/*.{ts,tsx}'],

  /* LES SIX FAUX POSITIFS DE L'EXTRACTEUR, BLOQUÉS NOMMÉMENT.

     L'extracteur de Tailwind ne lit pas le JSX, il cherche des suites de
     caractères qui RESSEMBLENT à des classes dans tout le fichier — chaînes
     JavaScript, `aria-label`, `data-testid`, commentaires compris. Sur du code
     vendoré, ça publie des classes globales très génériques dans une feuille
     que deux applications tierces importent. Vérifié une par une, voici d'où
     venaient les six :

       .container  <- data-testid="modal-container"   (Modal.test.tsx)
       .collapse   <- aria-label="collapse sidebar"    (Sidebar.tsx)
       .grow       <- data-testid="grow-section"       (Topbar.test.tsx)
       .hidden     <- style.overflow = "hidden"        (Modal.tsx, du JS)
       .filter     <- les identifiants `glassFilter`, `filterRef`…
     `.rounded` FIGURAIT DANS CETTE LISTE ET ELLE Y ÉTAIT À TORT. Je l'avais
     classée « sous-chaîne de rounded-full ». Le build a refusé de passer :
     « The `rounded` class does not exist », depuis
     `Select.module.scss:70` — elle est employée par deux `@apply`, donc par
     du CSS et non par du JSX, là où je ne l'avais pas cherchée. Un `blocklist`
     casse aussi la résolution d'un `@apply`, ce qui est heureux : l'erreur est
     arrivée au build au lieu d'arriver à l'écran.

     Aucune des cinq restantes n'est employée comme classe, vérifié dans les
     `@apply` autant que dans le JSX. `.rounded-full` et
     `.pointer-events-none`, elles, le SONT — Badge.tsx et Checkbox.tsx les
     passent en clair à `clsx` — donc elles restent, et un `blocklist` sur un
     nom exact ne touche pas `rounded-full`.

     Mesuré : 145 classes globales avant de borner `content` aux `{ts,tsx}`,
     13 après, 8 après ce blocage. Les sept restantes sont toutes réellement
     citées par un composant. */
  blocklist: ['container', 'collapse', 'grow', 'hidden', 'filter'],

  /* LES QUATRE CLASSES QUE L'EXTRACTEUR NE PEUT PAS VOIR, ÉNUMÉRÉES.

     `Button.tsx:47` construit sa classe de variante PAR INTERPOLATION :

         variant && `bg-${variant}`

     L'extracteur de Tailwind ne lit pas le JavaScript, il cherche des suites de
     caractères qui ressemblent à des classes. Dans un gabarit, il ne voit que
     `bg-` : aucune des quatre variantes déclarées par le composant
     (`"default" | "positive" | "negative" | "warning"`) n'est un littéral, donc
     aucune n'est émise. Mesuré sur `dist/magic/magic.css` avant correction :
     `.bg-default` ABSENTE, et `Button variant="default"` sortait sans aucun
     fond.

     POURQUOI LES QUATRE ALORS QU'UNE SEULE MANQUAIT. Mesuré en construisant la
     feuille sans cette liste, `grep '^\.bg-'` :

       sans safelist : bg-info bg-negative bg-neutral bg-positive bg-warning
       avec safelist : bg-default + les cinq ci-dessus

     Donc `bg-default` était bien la SEULE absente, et il faut dire pourquoi les
     cinq autres étaient là : ce n'est pas le gabarit de `Button` qui les fait
     émettre, c'est `Badge.tsx`, dont la table `variantBackground` les écrit en
     CLAIR (`positive: "bg-positive"`, …). L'extracteur les voit comme
     littéraux. Et `bg-default` manquait parce que cette même table associe
     `default` à la chaîne VIDE.

     Les trois variantes que `Button` partage avec `Badge` ne tiennent donc
     aujourd'hui qu'à un détail d'implémentation d'un AUTRE composant. Changez
     cette table, ou supprimez `Badge`, et `Button variant="positive"` redevient
     inerte sans un mot — le mode de panne exact qu'on répare pour `default`.
     Les quatre sont listées pour que `Button` se tienne tout seul : trois
     entrées sont redondantes aujourd'hui, et sont là pour ne pas l'être demain.

     CE QUE ÇA NE CHANGE PAS, mesuré et non supposé : `Badge` garde son rendu.
     `Badge.module.scss` porte AUSSI un bloc `:global` qui repeint ces cinq
     classes en `linear-gradient` ; il passe plus loin dans la feuille produite
     (ligne 1612 contre 52) et emploie le raccourci `background`, qui écrase le
     `background-color` de l'utilitaire. C'est cette règle-là qui peint
     réellement les variantes communes, utilitaire ou pas.

     PAS DE CONFLIT AVEC LE `blocklist` CI-DESSUS, vérifié nom par nom : il
     bloque `container`, `collapse`, `grow`, `hidden` et `filter`, dont aucun
     n'est un préfixe ni un nom exact des quatre ci-dessous. Le rappel vaut
     quand même, parce qu'une entrée de `blocklist` casse aussi la résolution
     d'un `@apply` — c'est déjà arrivé sur `rounded`, employée par deux `@apply`
     de `Select.module.scss`, et le build a refusé de passer. Les deux listes se
     relisent ensemble. */
  safelist: ['bg-default', 'bg-positive', 'bg-negative', 'bg-warning'],

  theme: {
    extend: {
      // Taken verbatim from react-magic-ui's `tailwind.config.ts` (MIT,
      // Copyright (c) 2025 tweeedlex). These are indirections onto CSS custom
      // properties, so the utilities they generate (`bg-positive`,
      // `text-danger`, …) are only as defined as the `--color-*` variables in
      // the published sheet. See the note in `src/magic/magic.scss`.
      colors: {
        danger: 'var(--color-danger)',
        link: 'var(--color-link)',
        default: 'var(--color-default)',
        positive: 'var(--color-positive)',
        negative: 'var(--color-negative)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        neutral: 'var(--color-neutral)',
        gradient: 'var(--color-gradient)',
      },
    },
  },
  // Preflight is switched off here as well as being absent from the entry
  // sheet. `src/magic/magic.scss` omits `@tailwind base` on purpose — a
  // published stylesheet that resets `*`, headings, buttons and margins would
  // reset the whole page of every consumer, not just `/magic`. Disabling it in
  // the config makes that intent enforceable rather than a convention someone
  // can undo by adding one line to the entry sheet.
  corePlugins: { preflight: false },
  plugins: [],
} satisfies Config;
