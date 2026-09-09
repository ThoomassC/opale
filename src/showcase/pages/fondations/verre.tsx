import type { ReactNode } from 'react';

import { Button } from '../../../components/button';
import { Field } from '../../../components/field';
import { IconTile } from '../../../components/icon-tile';
import { Input } from '../../../components/input';
import { Message } from '../../../components/message';
import { Pill } from '../../../components/pill';
import { Tag } from '../../../components/tag';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, UsageBlock } from '../api';

/* =============================================================================
   LE THÈME VERRE, DOCUMENTÉ PAR SON PÉRIMÈTRE.

   Cette page n'explique pas ce qu'est un `backdrop-filter` : elle dit QUELLES
   surfaces en reçoivent un, lesquelles n'en reçoivent pas, et le chiffre qui a
   tranché à chaque ligne. Le tableau est donc le cœur de la page, et les
   spécimens n'en sont que la contre-épreuve à l'œil.

   ELLE NE PEUT PAS MONTRER LES DEUX ÉTATS CÔTE À CÔTE, et c'est structurel :
   le porteur est `data-material="glass"` sur `<html>`, donc il n'y a qu'un
   matériau par document. Un aperçu « aplat » posé ici demanderait un second
   document — une `<iframe>`, ou la recopie des sélecteurs de `glass.css` sous
   une classe locale, c'est-à-dire une seconde vérité à tenir alignée à la main.
   La page montre donc le thème COURANT et renvoie à la bascule de la barre du
   haut, qui est la seule chose qui change l'attribut.

   AUCUN ÉTAT, AUCUN HOOK ICI : la bascule vit dans `material-toggle.tsx`, et
   `use-material.ts` explique pourquoi la librairie ne la publie pas.
   ========================================================================== */

const USAGE = `// L'ORDRE EST UN INVARIANT : glass.css APRÈS tokens.css et ui.css.
import '@thomascaron/ui/tokens.css';
import '@thomascaron/ui/ui.css';
import '@thomascaron/ui/glass.css';

// Puis le porteur, sur <html> et nulle part ailleurs.
document.documentElement.dataset.material = 'glass';

// Le retour à l'aplat RETIRE l'attribut : il n'existe pas de data-material="flat".
delete document.documentElement.dataset.material;`;

/** L'identifiant du titre qui nomme le tableau des surfaces. */
const SURFACES_TITLE_ID = 'verre-surfaces-title';

interface GlassSurface {
  /** Le composant, tel qu'il s'appelle dans `src/index.ts`. */
  readonly component: string;
  /** Le sélecteur ciblé — absent quand le composant n'a aucune surface propre. */
  readonly selector?: string;
  /** Ce que `glass.css` lui pose. */
  readonly receives: string;
  readonly why: ReactNode;
}

/**
 * Les vingt surfaces, dans l'ordre des trois traitements.
 *
 * Sept flous, neuf liserés, huit composants intacts — et les trois contrôles de
 * saisie sont DANS les sept flous mais hors des neuf liserés, ce qui est la
 * seule asymétrie du tableau.
 */
const SURFACES: readonly GlassSurface[] = [
  {
    component: 'Button — secondaire',
    selector: '.tc-btn--secondary',
    receives: 'Flou + liseré',
    why: (
      <>
        Son <code>--panel-surface</code> est déjà à alpha 0,05 : seul le filtre manquait.
      </>
    ),
  },
  {
    component: 'Button — danger',
    selector: '.tc-btn--danger',
    receives: 'Flou + liseré',
    why: (
      <>
        Fond transparent au repos, voile <code>--danger-quiet</code> au survol — rien d’opaque à
        préserver.
      </>
    ),
  },
  {
    component: 'Input',
    selector: '.tc-input',
    receives: 'Flou seul',
    why: (
      <>
        Un contrôle de formulaire <strong>ne génère pas de boîte de pseudo-élément</strong> : sondé,
        le témoin <code>&lt;span&gt;</code> peint son anneau, les trois contrôles n’en peignent
        aucun pixel.
      </>
    ),
  },
  {
    component: 'Select',
    selector: '.tc-select',
    receives: 'Flou seul',
    why: <>Même modèle de boîte : le liseré n’a nulle part où se peindre.</>,
  },
  {
    component: 'Textarea',
    selector: '.tc-textarea',
    receives: 'Flou seul',
    why: <>Même modèle de boîte : le liseré n’a nulle part où se peindre.</>,
  },
  {
    component: 'Message',
    selector: '.tc-message',
    receives: 'Flou + liseré',
    why: (
      <>
        Lavis à alpha 0,10 et 0,14 ; son bord de lecture fait <code>--space-1</code> et non 1 px,
        donc l’anneau est décalé de 4 px de ce seul côté.
      </>
    ),
  },
  {
    component: 'IconTile',
    selector: '.tc-icontile',
    receives: 'Flou + liseré',
    why: (
      <>
        Dégradé de 0,24 à 0,42, et la tuile d’action est à <code>--target-min</code> : c’est la plus
        petite surface verrée, celle qui fixe le rayon à <code>--glass-blur-control</code> (12 px) —
        à 32 px il ne reste 0,8 % de la modulation du fond, contre 16 % à 12 px.
      </>
    ),
  },
  {
    component: 'Button — primaire',
    selector: '.tc-btn--primary',
    receives: 'Liseré seul, aplat conservé',
    why: (
      <>
        <code>--accent</code> exige alpha ≥ 0,892 pour que <code>--text-on-accent</code> tienne
        4,5:1, et ≥ 0,811 pour que <code>--focus-inner</code> garde 3:1 : 11 % de transparence, que
        personne ne verrait.
      </>
    ),
  },
  {
    component: 'Tag',
    selector: '.tc-tag',
    receives: 'Liseré seul, aplat conservé',
    why: (
      <>Cardinalité : quarante étiquettes dans une liste feraient quarante passes de composition.</>
    ),
  },
  {
    component: 'Pill — acquis',
    selector: '.tc-pill--done',
    receives: 'Liseré seul, aplat conservé',
    why: <>Son blanc tombe à 3,74:1 dès alpha 0,60.</>,
  },
  {
    component: 'Pill — en cours',
    selector: '.tc-pill--progress',
    receives: 'Liseré seul, aplat conservé',
    why: (
      <>
        <code>--status-progress-text</code> tombe à 4,48:1 dès alpha 0,70 — sous le seuil.
      </>
    ),
  },
  {
    component: 'Pill — à venir',
    selector: '.tc-pill--upcoming',
    receives: 'Liseré seul, aplat conservé',
    why: <>Plafond commun de la pastille : alpha ≈ 0,78, ce qui n’est pas du verre.</>,
  },
  {
    component: 'Backdrop',
    selector: '.tc-backdrop',
    receives: 'Rien',
    why: <>C’est le sol : il n’a rien derrière lui à filtrer.</>,
  },
  {
    component: 'Card',
    selector: '.tc-card--glass',
    receives: 'Rien',
    why: (
      <>
        Le verre y est déjà, avec son ménisque à deux anneaux, et{' '}
        <a className="tc-doc-link" href={hrefFor('composants/card')}>
          <code>variant=&quot;flat&quot;</code>
        </a>{' '}
        reste l’échappatoire opaque.
      </>
    ),
  },
  {
    component: 'Checkbox',
    selector: '.tc-checkbox__input',
    receives: 'Rien',
    why: (
      <>
        <a className="tc-doc-link" href={hrefFor('composants/checkbox')}>
          Case dessinée par l’agent utilisateur
        </a>{' '}
        : la verrer exigerait <code>appearance: none</code>, donc perdre la coche système, le rendu{' '}
        <code>forced-colors</code> et l’état indéterminé.
      </>
    ),
  },
  {
    component: 'ChipList',
    receives: 'Rien',
    why: (
      <>
        Aucune <code>background</code> dans sa feuille : elle dispose des <code>Tag</code>, qui
        portent le liseré.
      </>
    ),
  },
  {
    component: 'DateRange',
    receives: 'Rien',
    why: <>Aucune surface propre : deux éléments de temps et un séparateur.</>,
  },
  {
    component: 'Field',
    receives: 'Rien',
    why: <>Aucune surface propre : elle habille le contrôle, qui reçoit le flou.</>,
  },
  {
    component: 'SectionHeading',
    receives: 'Rien',
    why: <>Aucune surface propre : un titre et son filet.</>,
  },
  {
    component: 'Timeline',
    receives: 'Rien',
    why: (
      <>
        Aucune surface propre : l’entrée emprunte la classe de <code>Card</code> quand elle veut du
        verre.
      </>
    ),
  },
];

export const verrePage: DocPage = {
  slug: 'verre',
  label: 'Verre liquide',
  group: 'fondations',
  title: 'Verre liquide',
  lede: (
    <>
      Un porteur sur <code>&lt;html&gt;</code>, <code>data-material=&quot;glass&quot;</code>, et une
      feuille de plus : <strong>sept surfaces</strong> reçoivent un <code>backdrop-filter</code>,{' '}
      <strong>neuf</strong> un liseré spéculaire, <strong>huit composants</strong> ne bougent pas.
      Aucun fond, aucune encre et aucune bordure n’y est repeinte — la couleur reste au jeton, la
      matière à la feuille.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Activation du thème verre" code={USAGE} />

      <p className="tc-doc-prose">
        <strong>L’ordre des imports est un invariant.</strong> Le bloc de jetons du verre pèse
        (0,2,0), exactement le poids des deux blocs sombres de <code>roles.css</code> et de{' '}
        <code>materials.css</code> : déclaré avant eux, le thème verre disparaîtrait{' '}
        <em>en sombre seulement</em>.
      </p>

      <p className="tc-doc-prose">
        La bascule de cette page est celle de la barre du haut, et la librairie{' '}
        <strong>ne publie pas</strong> de sélecteur : les trois consommateurs ont des mécaniques de
        thème incompatibles, donc ce qui est publié, c’est la feuille.
      </p>

      <div>
        <h2 className="tc-doc-specimen__title" id={SURFACES_TITLE_ID}>
          Ce qui devient du verre, et ce qui n’en devient pas
        </h2>
        <p className="tc-doc-specimen__note">
          Un aplat qui porte du texte ne devient pas translucide : il reçoit le bord et le reflet,
          jamais le flou — c’est aussi la doctrine d’Apple, où le verre est la couche de navigation
          qui flotte au-dessus du contenu, jamais le contenu.
        </p>
        <div
          className="tc-doc-tablewrap"
          tabIndex={0}
          role="group"
          aria-label="Tableau des vingt surfaces, défilement horizontal"
        >
          <table className="tc-doc-table" aria-labelledby={SURFACES_TITLE_ID}>
            <thead>
              <tr>
                <th scope="col">Le composant</th>
                <th scope="col">Ce qu’il reçoit</th>
                <th scope="col">Pourquoi</th>
              </tr>
            </thead>
            <tbody>
              {SURFACES.map((surface) => (
                <tr key={surface.component}>
                  {/* Le sélecteur sur SA PROPRE LIGNE, et c'est ce qui l'a
                      motivé : dans la colonne étroite du tableau, un
                      `.tc-btn--secondary` posé à la suite du nom se coupait en
                      « .tc-btn-- » / « secondary », soit un nom de classe rendu
                      illisible à l'endroit exact où on vient le lire.
                      `tc-doc-cardtext` est le seul bloc de `doc.css` à ne porter
                      ni marge ni taille propre — il tient la ligne sans ajouter
                      de gouttière dans la cellule. */}
                  <th scope="row">
                    {surface.component}
                    {surface.selector ? (
                      <p className="tc-doc-cardtext">
                        <code>{surface.selector}</code>
                      </p>
                    ) : null}
                  </th>
                  <td>{surface.receives}</td>
                  <td>{surface.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Specimen
        title="Les surfaces filtrées, dans le thème courant"
        note="Basculez « Verre liquide » dans la barre du haut pour voir la différence : le porteur est sur <html>, donc une page ne peut pas rendre les deux matériaux côte à côte."
      >
        <div className="tc-doc-stack">
          <div className="tc-doc-specimen__stage tc-doc-specimen__stage--inline">
            <Button variant="primary">Enregistrer l’étape</Button>
            <Button variant="secondary">Annuler</Button>
            <Button variant="danger">Supprimer l’étape</Button>
            <IconTile>
              <span>◆</span>
            </IconTile>
          </div>
          <Field id="verre-etape" label="Nom de l’étape">
            {(control) => <Input {...control} placeholder="Kyoto" />}
          </Field>
          <Message tone="ok">Étape enregistrée.</Message>
        </div>
      </Specimen>

      <Specimen title="Les aplats, qui ne reçoivent que le bord" inline>
        <Pill tone="done">Acquis</Pill>
        <Pill tone="progress">En cours</Pill>
        <Pill tone="upcoming">À venir</Pill>
        <Tag>TypeScript</Tag>
        <Tag variant="measured">Mesuré</Tag>
      </Specimen>

      <Specimen title="Les trois replis">
        <ul className="tc-doc-checklist">
          <li>
            <code>@supports not</code> — sans <code>backdrop-filter</code>, les neuf liserés partent
            et les sept surfaces retrouvent au pixel près leur rendu de mode normal, cette feuille
            n’ayant posé aucun fond à restaurer.
          </li>
          <li>
            <code>prefers-reduced-transparency: reduce</code> <strong>ou</strong>{' '}
            <code>prefers-contrast: more</code> — les deux conditions, parce que la première n’est
            implémentée que par Chromium : filtres et liserés partent ensemble.
          </li>
          <li>
            <code>forced-colors: active</code> — un bloc à part, qui éteint <strong>aussi</strong>{' '}
            les filtres : mesuré, ce mode ne pose ni <code>prefers-contrast: more</code> ni{' '}
            <code>prefers-reduced-transparency</code>.
          </li>
        </ul>
      </Specimen>

      <Specimen title="Ce que le contrat ne mesure pas">
        <ul className="tc-doc-checklist">
          <li>
            Le flou échantillonne au-delà des bords avant de découper à la boîte — 24 px de première
            déviation standard pour un contrôle de 44 px — donc l’arrière-plan effectif inclut ce
            qui est <strong>à côté</strong> et non seulement ce qui est <strong>derrière</strong> :
            aucune arithmétique de couches ne l’exprime.
          </li>
          <li>
            Deux <code>backdrop-filter</code> imbriqués ne sont pas spécifiés partout de la même
            façon : selon le moteur, l’enfant échantillonne la sortie déjà filtrée du parent ou la
            page brute.
          </li>
          <li>
            <code>blur() saturate()</code> reste hors du domaine mesuré : les chiffres du dépôt sont
            des <strong>estimations</strong> — c’est le mot du dépôt, et on le garde.
          </li>
          <li>
            Le coût, lui, est connu : un <code>backdrop-filter</code> est une passe de composition{' '}
            <strong>par élément</strong> et non par composant, d’où l’absence de flou sur{' '}
            <code>Tag</code> et <code>Pill</code>, qui vivent dans des listes.
          </li>
        </ul>
      </Specimen>

      <p className="tc-doc-prose">
        Le matériau assemblé — décor, cartes de verre et frise — se regarde sur la page{' '}
        <a className="tc-doc-link" href={hrefFor('compositions/verre-et-frise')}>
          Verre et frise
        </a>
        .
      </p>
    </PageBody>
  ),
};
