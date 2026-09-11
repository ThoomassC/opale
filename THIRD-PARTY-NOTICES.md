# Third-party notices

Ce fichier existe pour une raison juridique et non documentaire : la licence MIT
exige que sa notice de droit d'auteur soit **incluse dans toute copie ou portion
substantielle** du logiciel. `src/magic/` est une portion substantielle.

Il est écrit en anglais pour la partie citée — une licence se recopie, elle ne se
traduit pas.

---

## react-magic-ui

- **Ce qui en vient** : les quatorze composants de `src/magic/`, ainsi que leurs
  feuilles `*.module.scss`. Depuis la 2.0, ce ne sont plus un sous-chemin du
  paquet mais **son point d'entrée racine** — `import { Button } from
  '@thomascaron/opale'` sert ce code, et `@thomascaron/opale/opale.css` sert sa
  feuille. Le code est gardé **fidèle au caractère** ; les seuls écarts sont
  énumérés dans `src/magic/README.md` et chaque fichier porte un bandeau qui dit
  d'où il vient.
- **Ce qui n'en vient pas** : ce qui reste d'Opale, c'est-à-dire la charte et son
  garde. Les jetons de `src/tokens/` (publiés en `./tokens.css`) et le contrat de
  couleur exécutable de `src/contract/` (publié en `./contract`) ne contiennent
  aucune ligne de ce projet. Les dix-huit composants de `src/components/` et les
  points d'entrée CSS de la 1.x n'en contenaient pas davantage ; ils ont été
  supprimés en 2.0 et ne sont donc plus à distinguer.
- **Source** : <https://github.com/tweeedlex/react-magic-ui>
- **Version copiée** : 1.0.9
- **Licence** : MIT

```
MIT License

Copyright (c) 2025 tweeedlex

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Ce qu'Opale, elle, ne dit pas

**Opale n'a aucun fichier de licence à elle**, et `package.json` porte
`"private": true`. En l'absence de licence explicite, le droit d'auteur par
défaut s'applique : tous droits réservés. C'est cohérent avec un paquet privé
consommé par `portfolio` et `travels_in_world`, et ça n'entre pas en conflit avec
la MIT ci-dessus — la MIT autorise la sous-licence, donc rien n'oblige Opale à
être MIT parce qu'elle en incorpore.

**La 2.0 donne du poids à ce silence, et c'est le point à retenir de cette
section.** En 1.x, le code MIT était un sous-chemin optionnel à côté de dix-huit
composants maison ; il est devenu le point d'entrée racine, et les composants
maison ont disparu. Ce que le paquet publie aujourd'hui, c'est donc **du code MIT
de tweeedlex à la racine, plus une charte et un contrat qui sont les seules
parties dont Thomas Caron est l'auteur**. Un paquet dont la surface principale est
sous une licence permissive et dont le tout est « tous droits réservés » par
défaut n'est pas une contradiction juridique, mais c'est une combinaison qu'un
lecteur extérieur ne peut pas deviner : elle mérite d'être écrite plutôt que
laissée à l'absence de fichier.

Ce serait à trancher le jour où le paquet est publié pour de vrai — et ce jour-là,
la question n'est plus « quelle licence pour Opale » mais « quelle licence pour une
charte de quelques centaines de lignes et un contrat de test, distribués avec
quatorze composants MIT qui ne sont pas d'elle ». C'est signalé ici, pas décidé.
