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

/* Les trois variantes, avec la prose de la charte — elle dit ce qu'aucun
   tableau ne dit : combien de fois par vue on a le droit de s'en servir. */
const BUTTON_SPECS: readonly ButtonSpec[] = [
  {
    variant: 'primary',
    title: 'Primary — l’aplat teal',
    note: 'Un seul par vue. C’est la sortie attendue de l’écran, et il n’y en a qu’une.',
  },
  {
    variant: 'secondary',
    title: 'Secondary — le liseré teal',
    note: 'Toutes les autres actions. Fond transparent, liseré discret qui s’affirme au survol.',
  },
  {
    variant: 'danger',
    title: 'Danger — le liseré rouge',
    note: 'Jamais un aplat : l’aplat plein est le monopole du teal. Une suppression se signale, elle ne se peint pas en rouge pour attirer le clic.',
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
    description: (
      <>
        L’aplat teal, le liseré teal, ou le liseré rouge. <code>danger</code> n’est jamais un aplat.
      </>
    ),
  },
  {
    name: 'href',
    type: 'string',
    description: (
      <>
        Présent et non vide, le composant rend un <code>&lt;a&gt;</code> au lieu d’un{' '}
        <code>&lt;button&gt;</code>. C’est lui qui discrimine l’union : sur la branche bouton il est
        typé <code>undefined</code>.
      </>
    ),
  },
  {
    name: 'type',
    type: "'button' | 'submit' | 'reset'",
    defaultValue: "'button'",
    description: (
      <>
        Branche <code>&lt;button&gt;</code> seulement — le type refuse <code>type</code> dès qu’un{' '}
        <code>href</code> est présent, parce que le <code>type</code> d’une ancre est un indice de
        type MIME et accepterait <code>&quot;submit&quot;</code> sans protester.
      </>
    ),
  },
  {
    name: 'disabled',
    type: 'boolean',
    description: (
      <>
        Branche <code>&lt;button&gt;</code> seulement, et refusé à la compilation sur une ancre.
        Retire le bouton de l’ordre de tabulation : préférez <code>aria-disabled</code> là où le
        bouton est la sortie attendue de l’écran.
      </>
    ),
  },
  {
    name: 'aria-disabled',
    type: "boolean | 'true' | 'false'",
    description: (
      <>
        Rend le contrôle inerte <em>sans</em> le retirer du clavier : le composant intercepte le
        clic, appelle <code>preventDefault()</code> et <code>stopPropagation()</code>, et n’émet
        plus <code>href</code> du tout sur une ancre.
      </>
    ),
  },
  {
    name: 'aria-busy',
    type: "boolean | 'true' | 'false'",
    description: (
      <>
        Marque l’attente, et ne neutralise <em>rien</em> : pour refuser le second clic, posez aussi{' '}
        <code>aria-disabled</code>. Donnez un libellé de substitution («&nbsp;Envoi…&nbsp;») plutôt
        que de vider le texte.
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
      en pilule, aucun état React et aucun hook — survol, appui, focus, attente et désactivation
      sont des sélecteurs CSS. Deux décisions structurent son interface : <code>href</code>{' '}
      discrimine une union, parce qu’une navigation doit être un lien et non un bouton qui appelle{' '}
      <code>router.push</code> ; et <code>aria-disabled</code> est recommandé plutôt que{' '}
      <code>disabled</code> partout où l’utilisateur au clavier doit encore pouvoir atteindre le
      contrôle pour apprendre pourquoi il est inerte.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Button" code={USAGE} />

      <p className="tc-doc-prose tc-doc-aside">
        Cette page déroge sciemment à sa propre règle « un seul bouton primaire par vue » : un
        catalogue montre des spécimens, pas une interface.
      </p>

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

      <Specimen
        title="Les boutons — et le bouton qui est un lien"
        note="href fait basculer l’élément rendu de <button> à <a> : une navigation doit être un lien, sinon elle perd l’ouverture en nouvel onglet, la copie d’adresse et l’annonce « lien » du lecteur d’écran. aria-disabled plutôt que disabled : l’élément reste focusable, donc atteignable au clavier, et le composant neutralise le clic lui-même."
        inline
      >
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
        note='Intercepter onClick ne suffisait pas, et ne pouvait pas : le clic du milieu passe par auxclick, « ouvrir dans un nouvel onglet » et le glisser vers la barre d’adresse ne passent par aucun événement. Un lien peint inerte s’ouvrait donc par trois chemins. Sous aria-disabled, le composant n’émet plus href du tout — il n’y a plus rien à ouvrir, copier ni glisser — et rétablit role="link" et tabIndex=0, sans quoi l’élément retomberait sur generic et le lecteur d’écran n’annoncerait plus ni « lien » ni son indisponibilité.'
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
            L’interface est une{' '}
            <strong>
              union discriminée sur <code>href</code>
            </strong>
            . Sans <code>href</code>, le composant est un <code>&lt;button&gt;</code> et accepte
            tout <code>ComponentPropsWithoutRef&lt;&apos;button&apos;&gt;</code>. Avec{' '}
            <code>href</code>, c’est un <code>&lt;a&gt;</code> et il accepte{' '}
            <code>
              Omit&lt;ComponentPropsWithoutRef&lt;&apos;a&apos;&gt;, &apos;href&apos; |
              &apos;type&apos;&gt;
            </code>{' '}
            — donc ni <code>type</code> ni <code>disabled</code>, refusés à la compilation. Les
            lignes ci-dessous ne listent que les props propres au composant et les attributs natifs
            dont il change le traitement ; tous les autres traversent jusqu’à l’élément rendu.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        Un <code>href</code> vide n’est pas une erreur de type — l’appel est légitime, c’est la
        donnée qui manque. Le composant retombe alors sur un <code>&lt;button&gt;</code>, n’émet
        aucun <code>href</code>, et signale la faute en <code>console.error</code> : un{' '}
        <code>&lt;a href=&quot;&quot;&gt;</code> pointe vers l’adresse courante, donc le clic
        rechargerait la page. Il ne lève jamais — voir{' '}
        <a className="tc-doc-link" href={hrefFor('composants/pill')}>
          Pill
        </a>{' '}
        pour la même politique et le défaut qui l’a imposée.
      </p>
    </PageBody>
  ),
};
