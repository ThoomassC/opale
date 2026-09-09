import { Field } from '../../../components/field';
import { Input } from '../../../components/input';
import { Select } from '../../../components/select';
import { Textarea } from '../../../components/textarea';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Field, Input } from '@thomascaron/ui';

<Field id="email" label="Adresse e-mail" hint="Nous ne l’affichons jamais." error={error}>
  {(control) => <Input {...control} type="email" name="email" />}
</Field>`;

/* Le seul cas où l'appelant a le droit d'écrire son propre
   `aria-describedby` : il COMPOSE celui que `Field` a calculé au lieu de
   l'écraser. Rendu en bloc de code parce que le défaut qu'il évite est
   silencieux — ni le typage ni le rendu ne le signalent. */
const COMPOSE_DESCRIBEDBY = `{(control) => (
  <Input
    {...control}
    aria-describedby={[control['aria-describedby'], 'ma-note']
      .filter(Boolean)
      .join(' ')}
  />
)}`;

const PROPS: readonly PropRow[] = [
  {
    name: 'id',
    type: 'string',
    required: true,
    description: (
      <>
        Identifiant du contrôle, et <strong>requis volontairement</strong> : <code>useId</code> est
        un hook, l’appeler ici interdirait le rendu en Server Component. Deux identifiants en sont
        dérivés — <code>{'${id}-hint'}</code> et <code>{'${id}-error'}</code>.
      </>
    ),
  },
  {
    name: 'label',
    type: 'ReactNode',
    required: true,
    description: (
      <>
        Libellé visible, câblé au contrôle par <code>htmlFor</code>.
      </>
    ),
  },
  {
    name: 'hint',
    type: 'ReactNode',
    description: (
      <>
        Aide permanente, référencée par <code>aria-describedby</code>. Elle n’est <em>jamais</em>{' '}
        annoncée d’elle-même : ce n’est pas une région dynamique.
      </>
    ),
  },
  {
    name: 'error',
    type: 'ReactNode',
    description: (
      <>
        Message d’erreur. Sa présence pose <code>aria-invalid</code> sur le contrôle, ajoute le
        message à <code>aria-describedby</code>, et <strong>l’annonce</strong> : le paragraphe porte{' '}
        <code>role=&quot;alert&quot;</code>.
      </>
    ),
  },
  {
    name: 'children',
    type: '(control: FieldControlProps) => ReactNode',
    required: true,
    description: (
      <>
        Fonction-enfant recevant les attributs calculés. Choix assumé contre{' '}
        <code>cloneElement</code>, qui devine la forme de l’enfant, écrase silencieusement un{' '}
        <code>aria-describedby</code> déjà posé, et casse dès qu’on interpose un fragment.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-field</code> et, en erreur, <code>tc-field--invalid</code>.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLDivElement>',
    description: 'Atterrit sur le <div> enveloppe, non sur le contrôle.',
  },
];

const CONTROL_PROPS: readonly PropRow[] = [
  {
    name: 'id',
    type: 'string',
    required: true,
    description: (
      <>
        L’<code>id</code> reçu, tel quel : c’est lui que désigne le <code>&lt;label for&gt;</code>.
      </>
    ),
  },
  {
    name: 'aria-describedby',
    type: 'string | undefined',
    required: true,
    description: (
      <>
        Les identifiants de l’aide puis de l’erreur, dans cet ordre, séparés par une espace.{' '}
        <code>undefined</code> quand il n’y a ni l’une ni l’autre — et la clé disparaît alors du
        DOM.
      </>
    ),
  },
  {
    name: 'aria-invalid',
    type: 'true | undefined',
    required: true,
    description: (
      <>
        <code>true</code> dès qu’une erreur est présente, <code>undefined</code> sinon. Jamais{' '}
        <code>&quot;false&quot;</code> : un <code>aria-invalid=&quot;false&quot;</code> parasite
        n’apporte rien.
      </>
    ),
  },
];

export const fieldPage: DocPage = {
  slug: 'composants/field',
  label: 'Field',
  group: 'composants',
  title: 'Field',
  lede: (
    <>
      L’enveloppe d’un contrôle de formulaire : libellé, aide, message d’erreur, et le câblage ARIA
      entre les trois. Aucun état, aucun hook — et c’est ce qui explique sa seule prop surprenante :{' '}
      <code>id</code> est <strong>requise</strong>, parce que <code>useId</code> est un hook et
      qu’un hook interdirait le rendu en Server Component. Les attributs calculés sont remis à une
      fonction-enfant plutôt qu’injectés par <code>cloneElement</code>, pour que le câblage soit
      visible à la lecture.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appel représentatif de Field" code={USAGE} />

      <Specimen
        title="Champs — les six états"
        note="Field ne génère aucun identifiant : useId est un hook, et un hook interdirait le rendu serveur. L’id est donc une prop requise, et Field câble lui-même htmlFor et aria-describedby."
      >
        <div className="tc-doc-form">
          <Field id="field-demo-nom" label="Nom de l’étape">
            {(control) => <Input {...control} defaultValue="Col du Galibier" />}
          </Field>

          <Field
            id="field-demo-altitude"
            label="Altitude"
            hint="En mètres, arrondie à la dizaine. Laissez vide si la mesure manque."
          >
            {(control) => <Input {...control} inputMode="numeric" placeholder="2 642" />}
          </Field>

          <Field
            id="field-demo-date"
            label="Date de passage"
            hint="Format JJ/MM/AAAA."
            error="Cette date est postérieure à l’arrivée du voyage."
          >
            {(control) => <Input {...control} defaultValue="31/02/2024" />}
          </Field>

          <Field
            id="field-demo-moyen"
            label="Moyen de transport"
            hint="Ce qui a servi sur la majorité du tronçon."
          >
            {(control) => (
              <Select {...control} defaultValue="velo">
                <option value="marche">À pied</option>
                <option value="velo">À vélo</option>
                <option value="train">En train</option>
                <option value="bateau">En bateau</option>
              </Select>
            )}
          </Field>

          <Field
            id="field-demo-ref"
            label="Référence interne"
            hint="Attribuée à la publication, non modifiable."
          >
            {(control) => <Input {...control} defaultValue="TIW-2024-018" disabled />}
          </Field>

          <Field
            id="field-demo-recit"
            label="Récit"
            hint="Deux paragraphes suffisent. La zone se redimensionne en hauteur seulement."
          >
            {(control) => (
              <Textarea
                {...control}
                defaultValue="La route monte sans une ligne droite, et le vent tourne à chaque lacet."
              />
            )}
          </Field>
        </div>
      </Specimen>

      {/* Le focus, qui ne se voit que sur la page d'accessibilité alors qu'il
          fait partie du contrat de ce composant : le liseré du champ et
          l'anneau double sont deux couches distinctes, et l'une ne remplace
          pas l'autre. */}
      <Specimen
        title="Le focus du contrôle"
        note="Tabulez dans le cadre. Le double anneau — --focus-inner et --focus-outer — se pose SUR le contrôle, jamais sur l’enveloppe : c’est le contrôle qui reçoit le focus, et le libellé n’est pas focusable. Les deux anneaux s’inversent entre les thèmes, si bien que l’un des deux contraste toujours avec le fond local."
      >
        <div className="tc-doc-focusdemo">
          <Field id="field-demo-focus" label="Un champ" hint="L’aide reste lisible sous l’anneau.">
            {(control) => <Input {...control} placeholder="Tabulez jusqu’ici" />}
          </Field>
        </div>
      </Specimen>

      <PropsTable
        id="field"
        note={
          <>
            Le reste de <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code> traverse
            jusqu’à l’enveloppe, à l’exception de <code>children</code> et <code>id</code> — tous
            deux redéfinis ci-dessous.
          </>
        }
        rows={PROPS}
      />

      <PropsTable
        id="field-control"
        title="Ce que la fonction-enfant reçoit"
        note={
          <>
            Le type <code>FieldControlProps</code>, conçu pour être <strong>étalé tel quel</strong>{' '}
            sur l’élément de formulaire. Étalez-le en dernier et ne posez pas votre propre{' '}
            <code>aria-describedby</code> après : le faire écrase la valeur calculée sans que rien
            ne le signale — l’aide reste affichée, garde son <code>id</code>, et n’est plus
            référencée par personne. C’est le revers du choix de la fonction-enfant : elle rend le
            câblage visible plutôt que magique, au prix de pouvoir le défaire.
          </>
        }
        rows={CONTROL_PROPS}
      />

      <UsageBlock
        label="Composer sa propre description sans écraser celle de Field"
        code={COMPOSE_DESCRIBEDBY}
      />

      <p className="tc-doc-prose tc-doc-aside">
        <strong>
          L’erreur est annoncée, et le rôle est en dur : <code>role=&quot;alert&quot;</code>.
        </strong>{' '}
        Sans lui, le composant avait deux des trois pieds du trépied — <code>aria-describedby</code>{' '}
        pour la relation, <code>scroll-margin-block-start</code> pour l’atteinte au défilement — et
        pas le troisième : après un envoi refusé par le serveur, le glyphe apparaissait, le libellé
        rougissait, et le lecteur d’écran ne disait <em>rien</em>. Le nœud d’erreur étant monté à l’
        <em>apparition</em> de l’erreur, un <code>aria-live</code> y serait posé sur un nœud qui
        arrive déjà rempli — le cas que les lecteurs d’écran annoncent le moins fiablement ;{' '}
        <code>role=&quot;alert&quot;</code> est précisément l’exception documentée. Ce que ce choix
        coûte : une validation déclenchée à chaque frappe interrompt le lecteur d’écran à chaque
        frappe. Validez à la perte de focus ou à l’envoi. Le glyphe <code>▲</code>, lui, est{' '}
        <code>aria-hidden</code> : seul le texte de l’erreur est entendu — voir{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Le contrat d’accessibilité
        </a>
        .
      </p>

      <p className="tc-doc-prose tc-doc-aside">
        <strong>
          Les deux identifiants dérivés sont collisionnables, et aucun garde n’est possible ici.
        </strong>{' '}
        Un champ nommé <code>date</code> et un second nommé <code>date-hint</code> produisent deux
        éléments portant <code>id=&quot;date-hint&quot;</code> ; le <code>&lt;label for&gt;</code>{' '}
        du second désigne alors le paragraphe d’aide du premier — libellé plus cliquable, contrôle
        sans nom accessible. Sans <code>useId</code>, c’est à l’appelant de ne pas nommer un champ
        d’après un autre. En contrepartie, <code>{'${id}-error'}</code> est une adresse{' '}
        <em>stable</em>&nbsp;: un formulaire peut y poser le focus après un envoi refusé.
      </p>
    </PageBody>
  ),
};
