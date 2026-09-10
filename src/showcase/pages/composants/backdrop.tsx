import { Backdrop } from '../../../components/backdrop';
import { Card } from '../../../components/card';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';

/* =============================================================================
   BACKDROP — LE DÉCOR SEUL.

   Cette page rend l'hôte du décor avec un contenu SIMPLE, et rien de plus :
   la scène de verre à quatre cartes est une composition, elle vit sur la page
   « Verre et frise ». Ce qui reste ici est l'affaire du décor lui-même — le
   nombre fermé de disques, l'ordre de peinture, et la carte opaque qui a fait
   descendre les halos à `z-index: -1`.
   ========================================================================== */

const USAGE = `import { Backdrop, Card } from '@thomascaron/opale';

<Backdrop>
  {/* Votre grille va dans un ENFANT, jamais sur l'hôte : les six disques
      sont des enfants directs, ils deviendraient des items de grille. */}
  <div className="page-grid">
    <Card>
      <h2>Étapes du printemps</h2>
    </Card>
  </div>
</Backdrop>`;

/**
 * La mesure du piège `sticky`, recopiée du commentaire d'en-tête du composant.
 *
 * Elle est rendue en tableau et non en prose parce que c'est une mesure à trois
 * cas : Chromium 151 headless, sonde de layout, trois positions de défilement
 * par cas. Le résultat est ce qui justifie `overflow: clip` dans la feuille, et
 * c'est le genre de ligne qu'on remplace par `hidden` en croyant corriger un
 * détail d'écriture.
 */
const STICKY_ROWS: readonly { readonly overflow: string; readonly effect: string }[] = [
  { overflow: 'aucun (témoin)', effect: 'colle — rect.top === 0' },
  { overflow: 'clip (ce composant)', effect: 'colle — rect.top === 0' },
  { overflow: 'hidden', effect: 'ne colle jamais — rect.top = −300, −900, −1000' },
];

export const backdropPage: DocPage = {
  slug: 'composants/backdrop',
  label: 'Backdrop',
  group: 'composants',
  title: 'Backdrop',
  lede: (
    <>
      L’hôte du décor : positionné, isolé, clippé en <code>clip</code>, il peint{' '}
      <code>--site-background</code> puis six halos — trois froids, trois chauds — avant ses
      enfants. <strong>Ni prop de teinte ni prop de nombre</strong> : le domaine mesuré est fermé.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel de Backdrop" code={USAGE} />

      <Specimen
        title="Le décor seul, sous un contenu NON positionné"
        note={
          <>
            Parité des deux teintes, mesurée contre le sol de son thème : ΔE OKLab 13,28 (froid)
            contre 13,36 (chaud) en clair, 12,83 contre 12,89 en sombre.
          </>
        }
      >
        <Backdrop className="tc-doc-scene">
          {/* Un titre et un paragraphe NUS, sans carte ni matériau : ils ne
              portent ni `position` ni `isolation`, et c'est exactement ce que
              la garantie du composant doit couvrir. Si ces deux lignes se
              lisent sans voile coloré au travers, l'ordre de peinture tient. */}
          <div className="tc-doc-scene__stack">
            <h3 className="tc-doc-cardtitle">Six disques, puis le contenu</h3>
            <p className="tc-doc-cardtext">
              Les halos sont rendus <strong>avant</strong> les enfants, à <code>z-index: -1</code>{' '}
              dans un hôte isolé : la garantie ne demande <em>rien</em> à vos enfants, positionnés
              ou pas.
            </p>
          </div>
        </Backdrop>
      </Specimen>

      <Specimen
        title="L’aplat opaque — la carte qui a fait bouger le z-index"
        note={
          <>
            Mesuré (Chromium 151, capture recadrée à l’intérieur d’une carte opaque) : à{' '}
            <code>z-index: 0</code>, le décor se peint <strong>par-dessus</strong> une{' '}
            <code>Card variant=&quot;flat&quot;</code> et son texte — d’où le <code>-1</code> de ce
            composant.
          </>
        }
      >
        <Backdrop className="tc-doc-scene">
          <div className="tc-doc-scene__grid">
            {/* `flat` ne pose ni `position` ni `isolation`. Son intérieur doit
                rester net : c'est pour elle que la divergence existe. */}
            <Card variant="flat" elevation={1}>
              <h3 className="tc-doc-cardtitle">Aplat opaque</h3>
              <p className="tc-doc-cardmeta">variant=&quot;flat&quot; · elevation=1</p>
              <p className="tc-doc-cardtext">
                Ni <code>position</code> ni <code>isolation</code> : c’est elle que les halos
                recouvraient à <code>z-index: 0</code>. Son intérieur doit rester net.
              </p>
            </Card>
          </div>
        </Backdrop>
      </Specimen>

      <Specimen
        title="Le piège : n’enveloppez pas votre application entière"
        note={
          <>
            Un <code>position: sticky</code> à l’intérieur d’un hôte clippé, mesuré en Chromium 151
            headless, sonde de layout, trois positions de défilement par cas.
          </>
        }
      >
        {/* Même recette que les tableaux de `api.tsx` : une zone qui défile
            horizontalement doit être atteignable au clavier (WCAG 2.1.1), et
            la règle `jsx-a11y` ne modélise pas ce cas. */}
        <div
          className="tc-doc-tablewrap"
          tabIndex={0}
          role="group"
          aria-label="Mesure du sticky selon l’overflow de l’hôte, défilement horizontal"
        >
          <table className="tc-doc-table">
            <thead>
              <tr>
                <th scope="col">
                  <code>overflow</code> de l’hôte
                </th>
                <th scope="col">
                  barre <code>sticky</code> à l’intérieur
                </th>
              </tr>
            </thead>
            <tbody>
              {STICKY_ROWS.map((row) => (
                <tr key={row.overflow}>
                  <th scope="row">
                    <code>{row.overflow}</code>
                  </th>
                  <td>{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Specimen>

      <p className="tc-doc-prose">
        Le halo <strong>dégrade</strong> le contraste, il ne le fournit pas : le texte fort passe de
        9,02:1 sur page nue à 7,27:1 sur halo froid, jusqu’à 3,01:1 dans le pire cas mesuré. Les
        chiffres sont sur la{' '}
        <a className="tc-doc-link" href={hrefFor('palette')}>
          page de la palette
        </a>{' '}
        ; le décor <em>composé</em> est sur{' '}
        <a className="tc-doc-link" href={hrefFor('compositions/verre-et-frise')}>
          Verre et frise
        </a>
        .
      </p>

      <PropsTable
        id="backdrop"
        note={
          <>
            <code>BackdropProps</code> étend{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code> — et n’expose ni teinte ni
            nombre de disques.
          </>
        }
        rows={[
          {
            name: 'children',
            type: 'ReactNode',
            description: (
              <>
                Rendu <strong>après</strong> les six halos ; jamais un conteneur de grille ou de
                flex — les disques sont des enfants directs.
              </>
            ),
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-backdrop</code>, jamais écrasée.
              </>
            ),
          },
          {
            name: 'ref',
            type: 'Ref<HTMLDivElement>',
            description: (
              <>
                Posée sur le <code>&lt;div&gt;</code> hôte.
              </>
            ),
          },
        ]}
      />
    </PageBody>
  ),
};
