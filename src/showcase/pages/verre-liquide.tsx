import type { DocPage } from '../doc-model';
import { hrefFor } from '../doc-model';
import { Glass } from '../../magic';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';
import { MagicCell, MagicStage } from './composants/stage';

/* =============================================================================
   COMMENT LE VERRE MARCHE, EN TROIS INGRÉDIENTS QU'ON PEUT VOIR SÉPARÉMENT.

   POURQUOI CETTE PAGE EXISTE. La vitrine montrait quatorze composants EN verre
   sans jamais montrer LE verre. Or l'effet n'est pas un fond translucide : il
   tient à trois choses distinctes, dont deux sont invisibles sur un aplat.
   C'est la raison pour laquelle les spécimens d'ici sont posés sur des RAYURES
   FINES et non sur le dégradé habituel des scènes : un flou de 2 px et une
   carte de déplacement ne se voient que s'il y a un détail à brouiller. Sur le
   dégradé lisse des autres pages, les deux sont rigoureusement indétectables
   — c'est mesurable à l'œil, et c'est le piège que cette page évite.

   LES TROIS PREMIÈRES CELLULES N'EMPLOIENT PAS `Glass`, ET C'EST VOULU. Le
   composant applique ses trois couches d'un coup et n'offre aucune prop pour
   n'en garder qu'une : montrer un ingrédient seul demande donc de le poser à
   la main. Les valeurs recopiées ici viennent de `Glass.module.scss` et de
   `Glass.tsx` ; si elles y changent, cette page mentira sans rougir, et c'est
   écrit dans « Reste ouvert » du README de `src/magic`.

   LA DÉPENDANCE CACHÉE DE LA CELLULE Nº 3 : `filter: url("#lg-dist")` renvoie
   à un `<filter>` que `Glass` injecte lui-même dans le document. La cellule
   n'affiche donc sa déformation QUE parce qu'un vrai `Glass` vit plus bas dans
   la même page. Retirer le dernier spécimen éteindrait la troisième cellule en
   silence — le filtre serait introuvable, et un filtre introuvable ne fait
   rien plutôt que d'échouer.
   ========================================================================== */

/**
 * Le sol rayé, et il est le sujet autant que le décor.
 *
 * `4px` de période : c'est la fréquence la plus haute qu'un flou de 2 px
 * efface complètement, donc celle qui rend la démonstration la plus lisible.
 * Les couleurs sont littérales et en ligne, sur le précédent des plaques de la
 * page palette et du dégradé de `stage.tsx` — `doc.css` s'interdit toute
 * couleur en dur, et cette contrainte reste entière.
 */
const RULED_GROUND = {
  background:
    'repeating-linear-gradient(115deg, #f0b3a4 0 2px, #17314f 2px 4px), linear-gradient(150deg, #17314f, #101a2c)',
} as const;

/** Ce que les trois premières cellules posent à la main, sans `Glass`. */
const PANE = {
  position: 'absolute',
  inset: '18%',
  borderRadius: '22px',
  border: '1px solid rgba(255, 255, 255, 0.25)',
} as const;

const RECIPE = `/* 1 — le flou, sur ce qui passe DERRIÈRE et non sur le contenu */
backdrop-filter: blur(2px);

/* 2 — la déformation, par une carte de déplacement SVG */
filter: url("#lg-dist");
/*   feTurbulence type="fractalNoise" baseFrequency="0.005 0.005" numOctaves="5"
     -> feGaussianBlur stdDeviation="2"
     -> feDisplacementMap scale="80" xChannelSelector="R" yChannelSelector="G" */

/* 3 — la bulle, au clic */
animation: liquidSquish 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);`;

export const verreLiquidePage: DocPage = {
  slug: 'verre-liquide',
  label: 'Le verre liquide',
  group: 'introduction',
  title: 'Le verre liquide, en trois ingrédients',
  lede: (
    <>
      L’effet qui donne son nom à cette version ne tient pas à un fond translucide. Il tient à{' '}
      <strong>trois choses distinctes</strong>, dont deux sont invisibles sur un aplat. Elles sont
      isolées ci-dessous, sur un sol rayé qui les rend visibles.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen
        title="Les trois ingrédients, séparés"
        note={
          <>
            Le sol est le même dans les quatre cellules : des rayures de 4 px de période. C’est le
            détail que le flou efface et que la carte de déplacement fait onduler — sur le dégradé
            lisse des autres pages, les deux seraient <strong>indétectables</strong>.
          </>
        }
      >
        <MagicStage>
          <MagicCell label="1 — le sol nu, pour comparer">
            <div style={{ ...RULED_GROUND, inlineSize: '100%', blockSize: '150px' }} />
          </MagicCell>

          <MagicCell label="2 — backdrop-filter: blur(2px)">
            <div
              style={{ ...RULED_GROUND, position: 'relative', inlineSize: '100%', blockSize: '150px' }}
            >
              <div style={{ ...PANE, backdropFilter: 'blur(2px)' }} />
            </div>
          </MagicCell>

          <MagicCell label="3 — et filter: url(#lg-dist)">
            <div
              style={{ ...RULED_GROUND, position: 'relative', inlineSize: '100%', blockSize: '150px' }}
            >
              <div
                style={{
                  ...PANE,
                  backdropFilter: 'blur(2px)',
                  filter: 'url("#lg-dist")',
                  isolation: 'isolate',
                }}
              />
            </div>
          </MagicCell>
        </MagicStage>
      </Specimen>

      <p className="tc-doc-prose">
        <strong>La deuxième cellule floute, la troisième ondule.</strong> C’est toute la différence
        entre du verre dépoli et du verre <em>liquide</em> : le flou est isotrope, la carte de
        déplacement décale chaque pixel d’une quantité tirée d’un bruit fractal, si bien que les
        rayures se mettent à serpenter. Le bruit est figé (<code>seed=&quot;92&quot;</code>) — rien
        ne bouge tant qu’on ne clique pas.
      </p>

      <Specimen
        title="La bulle d’eau, au clic"
        note={
          <>
            Cliquez la plaque. Trois animations partent ensemble, 0,8 s chacune :{' '}
            <code>liquidSquish</code> écrase la boîte puis la laisse rebondir,{' '}
            <code>liquidRipple</code> propage un disque depuis le point cliqué, et{' '}
            <code>liquidGlow</code> allume le liseré spéculaire.
          </>
        }
      >
        <MagicStage>
          <MagicCell label="un vrai Glass, enableLiquidAnimation">
            <div
              style={{
                ...RULED_GROUND,
                display: 'grid',
                placeItems: 'center',
                inlineSize: '100%',
                blockSize: '190px',
              }}
            >
              <Glass enableLiquidAnimation>
                <span style={{ display: 'block', padding: '18px 26px', fontWeight: 600 }}>
                  Cliquez-moi
                </span>
              </Glass>
            </div>
          </MagicCell>
        </MagicStage>
      </Specimen>

      <UsageBlock label="La recette, en trois déclarations" code={RECIPE} />

      <p className="tc-doc-prose">
        <strong>Le mouvement s’éteint sous une préférence système.</strong> Les quatre animations du
        verre tombent à <code>0,01 ms</code> sous <code>prefers-reduced-motion: reduce</code>, et le
        fondu de couleur, lui, reste. Ce garde vit dans la feuille des composants et non dans celle
        des jetons, précisément pour qu’un consommateur qui n’importe pas{' '}
        <code>tokens.css</code> l’obtienne quand même — c’est le sixième écart de{' '}
        <code>magic.scss</code>.
      </p>

      <p className="tc-doc-prose">
        Deux limites à connaître avant de s’en servir.{' '}
        <strong>
          Le <code>&lt;filter&gt;</code> est dupliqué une fois par instance
        </strong>{' '}
        : son <code>id</code> est écrit en dur dans <code>Glass.tsx</code>, donc dix composants sur
        une page donnent dix éléments de même identifiant. Et{' '}
        <strong>ce verre n’est pas couvert par le contrat de couleur</strong> — il peint son texte
        en <code>#ffffff</code> en dur, mesuré à 1,00:1 sur un fond clair, ce qui est la raison
        pour laquelle chaque scène de cette vitrine est sombre. Voir{' '}
        <a className="tc-doc-link" href={hrefFor('composants/glass')}>
          Glass
        </a>{' '}
        pour les mesures, et{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Accessibilité
        </a>{' '}
        pour ce que la charte garantit encore.
      </p>
    </PageBody>
  ),
};
