import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';

/* =============================================================================
   GLASSLENS — UNE PIÈCE D'INFRASTRUCTURE DANS LE GROUPE DES COMPOSANTS.

   Ce n'est pas un composant visuel : il ne rend aucune boîte, aucun pixel, et
   il n'y a rien à en montrer. Sa page est pourtant dans « Composants » et non
   dans « Fondations », et ce n'est pas un choix de rangement — c'est un
   CONTRAT EXÉCUTABLE. `registry.test.tsx` lit les exports réels de
   `src/index.ts` et exige, pour chacun, une page du groupe « composants » dont
   le libellé est le nom du composant et l'adresse son kebab-case. `GlassLens`
   étant publié, sa page est ici, s'appelle `GlassLens` et vit à
   `composants/glass-lens` : la ranger ailleurs ferait rougir la suite, ce qui
   est exactement le garde-fou voulu — un composant publié sans entrée de nav.

   Ce que la page montre, du coup, n'est pas un rendu mais un EMPLOI : où le
   monter, combien de fois, et ce qui se passe quand il manque.
   ========================================================================== */

const USAGE = `import { Button, GlassLens } from '@thomascaron/opale';

import '@thomascaron/opale/tokens.css';
import '@thomascaron/opale/ui.css';
// Optionnelle, et APRÈS ui.css, jamais avant : sans elle, aucune surface ne
// référence le filtre — importée trop tôt, elle est inopérante en silence.
import '@thomascaron/opale/lens.css';

// UNE SEULE FOIS PAR DOCUMENT, dans le gabarit de l'application : deux
// montages, c'est deux <filter> de même identifiant. La fin du gabarit est
// l'endroit habituel — l'élément n'a pas de boîte, sa place dans l'ordre du
// document ne change rien à la résolution du url(#tc-lens).
<>
  <Button variant="bubble" onClick={zoomIn}>Zoom</Button>
  <GlassLens />
</>`;

export const glassLensPage: DocPage = {
  slug: 'composants/glass-lens',
  label: 'GlassLens',
  group: 'composants',
  title: 'GlassLens',
  lede: (
    <>
      Un <code>&lt;svg aria-hidden&gt;</code> de taille nulle, et rien d’autre : il ne porte que le{' '}
      <code>&lt;filter&gt;</code> que <code>lens.css</code> référence pour déplacer le fond sous un
      bouton <code>bubble</code>. Il se monte <strong>une fois par document</strong>, dans le
      gabarit de l’application.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Montage de GlassLens et de sa feuille" code={USAGE} />

      <Specimen
        title="Ce qu’il rend — et pourquoi cette page ne le rend pas"
        note="Un composant sans spécimen : il n’a ni boîte, ni couleur, ni état. La seule chose observable est ce qui arrive AUX AUTRES surfaces quand il est là."
      >
        <ul className="tc-doc-checklist">
          <li>
            Un <code>&lt;svg aria-hidden&gt;</code> de taille nulle : aucune boîte à placer dans une
            mise en page, aucun pixel peint, rien à annoncer à un lecteur d’écran.
          </li>
          <li>
            Le <code>&lt;filter&gt;</code> que <code>lens.css</code> va chercher par son
            identifiant. C’est la seule raison d’exister du composant : une feuille de style ne peut
            pas déclarer un filtre SVG, seul un fragment de document le peut.
          </li>
          <li>
            <strong>Cette page ne le monte pas.</strong> La coquille de ce site l’a déjà monté une
            fois pour toutes, et un second montage poserait deux <code>&lt;filter&gt;</code> de même
            identifiant dans le même document.
          </li>
        </ul>
      </Specimen>

      <Specimen
        title="Ce qui se passe quand il manque"
        note="Le rendu sans déformation est le rendu de BASE, pas un mode dégradé : rien à détecter, rien à replier."
      >
        <ul className="tc-doc-checklist">
          <li>
            <strong>Un filtre absent est inerte, et c’est mesuré</strong> (Chromium 151) : le fond
            n’est pas déformé, le bouton ne disparaît pas, et le reste de la déclaration — flou,
            saturation — s’applique normalement. Il n’y a donc rien à vérifier avant de poser{' '}
            <code>variant=&quot;bubble&quot;</code>.
          </li>
          <li>
            Le voile du bouton ne dépend pas du filtre : il est à alpha 0,32 sous un flou de 8 px,
            le couple le plus transparent qui garde le libellé à 4,5:1 au-dessus d’un damier 20 px
            noir/blanc chargé de texte gras — 5,39:1 en thème clair et 4,60:1 en sombre.
          </li>
          <li>
            La déformation, elle, n’a été vérifiée que sur <strong>Chromium 151</strong>. Safari et
            Firefox ne le sont pas, et <code>@supports</code> ne permet pas de trancher : il répond
            vrai dans les trois moteurs.
          </li>
        </ul>
      </Specimen>

      <PropsTable
        id="glass-lens"
        note={
          <>
            <code>GlassLensProps</code> n’a qu’une propriété, et le composant n’accepte ni enfant ni{' '}
            <code>className</code> : il n’y a aucune surface à habiller.
          </>
        }
        rows={[
          {
            name: 'idPrefix',
            type: 'string',
            defaultValue: "'tc'",
            description: (
              <>
                Le préfixe des identifiants rendus — <code>tc</code> produit <code>#tc-lens</code>,
                le seul identifiant que <code>lens.css</code> connaisse. Il n’existe que pour deux
                situations réelles : une page qui possède déjà un <code>#tc-lens</code> à elle, et
                un second jeu de définitions monté volontairement — et dans les deux cas, c’est à
                l’appelant d’écrire la règle qui cite son propre identifiant.
              </>
            ),
          },
        ]}
      />

      <p className="tc-doc-prose">
        La bulle qu’il déforme se regarde sur{' '}
        <a className="tc-doc-link" href={hrefFor('compositions/bouton-bulle')}>
          Bouton bulle
        </a>{' '}
        ; l’interface du bouton, elle, est sur{' '}
        <a className="tc-doc-link" href={hrefFor('composants/button')}>
          la page de Button
        </a>
        .
      </p>
    </PageBody>
  ),
};
