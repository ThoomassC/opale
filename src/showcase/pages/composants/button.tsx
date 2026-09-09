import { Button } from '../../../components/button';
import type { ButtonVariant } from '../../../components/button';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

interface ButtonSpec {
  readonly variant: ButtonVariant;
  readonly title: string;
  readonly note: string;
}

/* Les trois variantes, avec la règle de dosage de la charte — elle dit ce
   qu'aucun tableau ne dit : combien de fois par vue on a le droit de s'en
   servir. */
const BUTTON_SPECS: readonly ButtonSpec[] = [
  {
    variant: 'primary',
    title: 'Primary — l’aplat teal',
    note: 'Un seul par vue : c’est la sortie attendue de l’écran.',
  },
  {
    variant: 'secondary',
    title: 'Secondary — le liseré teal',
    note: 'Toutes les autres actions.',
  },
  {
    variant: 'danger',
    title: 'Danger — le liseré rouge',
    note: 'Jamais un aplat : l’aplat plein est le monopole du teal.',
  },
];

interface StateCell {
  /** La légende de la figure — l'état, pas le libellé du bouton. */
  readonly label: string;
  readonly text: string;
  /** Le survol et l'appui sont FORCÉS par une classe : on ne peut pas
      demander au lecteur de maintenir la souris sur cinq boutons à la fois. */
  readonly className?: string;
  readonly busy?: true;
  readonly inert?: true;
}

const STATE_CELLS: readonly StateCell[] = [
  { label: 'repos', text: 'Enregistrer' },
  { label: 'survol', text: 'Enregistrer', className: 'tc-doc-state--hover' },
  { label: 'appui', text: 'Enregistrer', className: 'tc-doc-state--active' },
  { label: 'aria-busy', text: 'Envoi', busy: true },
  { label: 'aria-disabled', text: 'Enregistrer', inert: true },
];

const USAGE = `import { Button } from '@thomascaron/ui';

<Button variant="secondary" onClick={close}>Annuler</Button>
<Button href="/contact" variant="secondary">Me contacter</Button>
<Button aria-disabled={isSending} aria-busy={isSending} onClick={send}>
  {isSending ? 'Envoi…' : 'Envoyer'}
</Button>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'variant',
    type: "'primary' | 'secondary' | 'danger'",
    defaultValue: "'primary'",
    description: <>L’aplat teal, le liseré teal, ou le liseré rouge.</>,
  },
  {
    name: 'href',
    type: 'string',
    description: (
      <>
        Présent et non vide, le composant rend un <code>&lt;a&gt;</code> au lieu d’un{' '}
        <code>&lt;button&gt;</code> ; vide, il retombe sur le bouton et le signale en{' '}
        <code>console.error</code>.
      </>
    ),
  },
  {
    name: 'type',
    type: "'button' | 'submit' | 'reset'",
    defaultValue: "'button'",
    description: (
      <>
        Branche <code>&lt;button&gt;</code> seulement : refusé dès qu’un <code>href</code> est
        présent.
      </>
    ),
  },
  {
    name: 'disabled',
    type: 'boolean',
    description: (
      <>
        Branche <code>&lt;button&gt;</code> seulement, et retire le bouton de l’ordre de tabulation.
      </>
    ),
  },
  {
    name: 'aria-disabled',
    type: "boolean | 'true' | 'false'",
    description: (
      <>
        Rend le contrôle inerte <em>sans</em> le retirer du clavier ; sur une ancre, plus aucun{' '}
        <code>href</code> n’est émis.
      </>
    ),
  },
  {
    name: 'aria-busy',
    type: "boolean | 'true' | 'false'",
    description: (
      <>
        Marque l’attente, et ne neutralise <em>rien</em> : posez aussi <code>aria-disabled</code>{' '}
        pour refuser le second clic.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-btn</code> et la classe de variante, jamais substitué.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLButtonElement> | Ref<HTMLAnchorElement>',
    description: 'Atterrit sur l’élément réellement rendu, bouton ou ancre.',
  },
];

export const buttonPage: DocPage = {
  slug: 'composants/button',
  label: 'Button',
  group: 'composants',
  title: 'Button',
  lede: (
    <>
      Le bouton de la charte : hauteur plancher <code>--target-button</code> (48&nbsp;px), bordure
      en pilule, aucun état React — survol, appui, focus, attente et désactivation sont des
      sélecteurs CSS. <code>href</code> discrimine une union, parce qu’une navigation doit être un
      lien, et <code>aria-disabled</code> est préféré à <code>disabled</code> pour que le contrôle
      reste atteignable au clavier.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Button" code={USAGE} />

      {/* `<figure>` / `<figcaption>` plutôt qu'un `<span>` frère : quinze
          boutons nommés « Enregistrer » sont rigoureusement indiscernables
          dans une liste de liens et de contrôles, et un `<span>` posé à côté
          n'est relié à rien. La légende d'une figure, elle, nomme la figure —
          l'état devient lisible sans qu'on invente un `aria-label` qui
          mentirait sur le libellé réel du bouton. */}
      {BUTTON_SPECS.map((spec) => (
        <Specimen title={spec.title} note={spec.note} key={spec.variant}>
          <div className="tc-doc-states">
            {STATE_CELLS.map((cell) => (
              <figure className="tc-doc-states__cell" key={cell.label}>
                <Button
                  variant={spec.variant}
                  className={cell.className}
                  aria-busy={cell.busy}
                  aria-disabled={cell.inert}
                >
                  {cell.text}
                </Button>
                <figcaption className="tc-doc-states__label">{cell.label}</figcaption>
              </figure>
            ))}
          </div>
        </Specimen>
      ))}

      <Specimen title="Les boutons — et le bouton qui est un lien" inline>
        <Button>Publier l’étape</Button>
        <Button variant="secondary">Enregistrer le brouillon</Button>
        <Button variant="danger">Supprimer l’étape</Button>
        <Button href={hrefFor('palette')} variant="secondary">
          Revenir à la palette
        </Button>
        <Button aria-disabled="true">Publier l’étape</Button>
      </Specimen>

      {/* Le spécimen qui manque partout ailleurs, et c'est le seul endroit où
          la correction se constate : les deux ancres ci-dessous sont peintes à
          l'identique, et une seule des deux est encore un lien. */}
      <Specimen
        title="Le lien inerte — sous aria-disabled, le href n’est plus émis"
        note='Intercepter onClick ne pouvait pas suffire — le clic du milieu, « ouvrir dans un nouvel onglet » et le glisser vers la barre d’adresse n’émettent pas de clic — donc sous aria-disabled le composant n’émet plus href du tout, et rétablit role="link" et tabIndex=0.'
      >
        <div className="tc-doc-states">
          <figure className="tc-doc-states__cell">
            <Button href={hrefFor('accessibilite')} variant="secondary">
              Le contrat d’accessibilité
            </Button>
            <figcaption className="tc-doc-states__label">
              lien vivant — un <code>&lt;a href&gt;</code>, aucun <code>role</code> posé
            </figcaption>
          </figure>
          <figure className="tc-doc-states__cell">
            <Button href={hrefFor('accessibilite')} variant="secondary" aria-disabled="true">
              Le contrat d’accessibilité
            </Button>
            <figcaption className="tc-doc-states__label">
              lien inerte — pas de <code>href</code>, <code>role=&quot;link&quot;</code>,{' '}
              <code>tabIndex=0</code>
            </figcaption>
          </figure>
        </div>
      </Specimen>

      <PropsTable
        id="button"
        note={
          <>
            <strong>
              Union discriminée sur <code>href</code>
            </strong>{' '}
            : sans lui, <code>ComponentPropsWithoutRef&lt;&apos;button&apos;&gt;</code> ; avec lui,{' '}
            <code>
              Omit&lt;ComponentPropsWithoutRef&lt;&apos;a&apos;&gt;, &apos;href&apos; |
              &apos;type&apos;&gt;
            </code>{' '}
            — donc ni <code>type</code> ni <code>disabled</code>.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <code>Pill</code> applique la même politique sur un <code>href</code> vide —{' '}
        <a className="tc-doc-link" href={hrefFor('composants/pill')}>
          voir sa page
        </a>
        .
      </p>
    </PageBody>
  ),
};
