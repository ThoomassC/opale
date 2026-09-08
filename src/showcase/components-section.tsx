import type { ReactNode } from 'react';
import { Button } from '../components/button';
import type { ButtonVariant } from '../components/button';
import { Card } from '../components/card';
import { Checkbox } from '../components/checkbox';
import { Field } from '../components/field';
import { Input } from '../components/input';
import { Message } from '../components/message';
import { Pill } from '../components/pill';
import { Select } from '../components/select';
import { Tag } from '../components/tag';
import { Textarea } from '../components/textarea';
import { Section, Specimen } from './section';

interface ButtonSpec {
  readonly variant: ButtonVariant;
  readonly title: string;
  readonly note: string;
}

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

/**
 * Un spécimen de bouton et son étiquette d'état.
 *
 * `<figure>` / `<figcaption>` plutôt qu'un `<span>` frère : quinze boutons
 * nommés « Enregistrer » sont rigoureusement indiscernables dans une liste de
 * liens et de contrôles, et un `<span>` posé à côté n'est relié à rien. La
 * légende d'une figure, elle, nomme la figure — l'état devient lisible sans
 * qu'on invente un `aria-label` qui mentirait sur le libellé réel du bouton.
 */
function ButtonState({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="tc-doc-states__cell">
      {children}
      <figcaption className="tc-doc-states__label">{label}</figcaption>
    </figure>
  );
}

function ButtonStates({ variant }: { variant: ButtonVariant }) {
  return (
    <div className="tc-doc-states">
      <ButtonState label="repos">
        <Button variant={variant}>Enregistrer</Button>
      </ButtonState>
      <ButtonState label="survol">
        <Button variant={variant} className="tc-doc-state--hover">
          Enregistrer
        </Button>
      </ButtonState>
      <ButtonState label="appui">
        <Button variant={variant} className="tc-doc-state--active">
          Enregistrer
        </Button>
      </ButtonState>
      <ButtonState label="aria-busy">
        <Button variant={variant} aria-busy="true">
          Envoi
        </Button>
      </ButtonState>
      <ButtonState label="aria-disabled">
        <Button variant={variant} aria-disabled="true">
          Enregistrer
        </Button>
      </ButtonState>
    </div>
  );
}

export function ComponentsSection() {
  return (
    <Section
      id="composants"
      index="06"
      title="Les composants"
      lede={
        <>
          Huit composants, aucun état React, aucun hook : ils se rendent tels quels comme
          Server Components. Tout ce que vous voyez ci-dessous — survol, appui, attente,
          erreur, désactivation — est porté par la feuille de style, pas par du
          JavaScript.
        </>
      }
    >
      <p className="tc-doc-prose tc-doc-aside">
        Cette page déroge sciemment à sa propre règle « un seul bouton primaire par vue » :
        un catalogue montre des spécimens, pas une interface.
      </p>

      {BUTTON_SPECS.map((spec) => (
        <Specimen title={spec.title} note={spec.note} key={spec.variant}>
          <ButtonStates variant={spec.variant} />
        </Specimen>
      ))}

      <Specimen
        title="Champs — les six états"
        note="Field ne génère aucun identifiant : useId est un hook, et un hook interdirait le rendu serveur. L’id est donc une prop requise, et Field câble lui-même htmlFor et aria-describedby."
      >
        <div className="tc-doc-form">
          <Field id="demo-nom" label="Nom de l’étape">
            {(control) => <Input {...control} defaultValue="Col du Galibier" />}
          </Field>

          <Field
            id="demo-altitude"
            label="Altitude"
            hint="En mètres, arrondie à la dizaine. Laissez vide si la mesure manque."
          >
            {(control) => <Input {...control} inputMode="numeric" placeholder="2 642" />}
          </Field>

          <Field
            id="demo-date"
            label="Date de passage"
            hint="Format JJ/MM/AAAA."
            error="Cette date est postérieure à l’arrivée du voyage."
          >
            {(control) => <Input {...control} defaultValue="31/02/2024" />}
          </Field>

          <Field id="demo-moyen" label="Moyen de transport" hint="Ce qui a servi sur la majorité du tronçon.">
            {(control) => (
              <Select {...control} defaultValue="velo">
                <option value="marche">À pied</option>
                <option value="velo">À vélo</option>
                <option value="train">En train</option>
                <option value="bateau">En bateau</option>
              </Select>
            )}
          </Field>

          <Field id="demo-ref" label="Référence interne" hint="Attribuée à la publication, non modifiable.">
            {(control) => <Input {...control} defaultValue="TIW-2024-018" disabled />}
          </Field>

          <Field id="demo-recit" label="Récit" hint="Deux paragraphes suffisent. La zone se redimensionne en hauteur seulement.">
            {(control) => (
              <Textarea
                {...control}
                defaultValue="La route monte sans une ligne droite, et le vent tourne à chaque lacet."
              />
            )}
          </Field>
        </div>
      </Specimen>

      <Specimen
        title="Cases à cocher"
        note="Le contrôle est imbriqué dans son libellé : toute la ligne est cliquable, et la ligne fait au moins 44 px."
      >
        <div className="tc-doc-form">
          <Checkbox name="demo-opt" value="brouillon" label="Conserver un brouillon local" />
          <Checkbox
            name="demo-opt"
            value="publier"
            label="Publier l’étape dès l’enregistrement"
            defaultChecked
          />
          <Checkbox
            name="demo-opt"
            value="archive"
            label="Archiver (indisponible tant que l’étape est publiée)"
            disabled
          />
        </div>
      </Specimen>

      <Specimen
        title="Pastilles — l’avancement"
        note="Trois tons d’avancement, et rien d’autre : la sévérité (succès, attention, erreur) est le vocabulaire de Message, pas celui d’une pastille. La bordure en currentColor n’est pas décorative — l’aplat de l’acquis mesure 2,20:1 contre une carte sombre, sous le seuil de WCAG 1.4.11, et c’est elle qui rattrape la forme à 18,48:1. Le glyphe non plus n’est pas un ornement : en simulation deutéranope, l’ambre et le violet tombent à 1,16:1 l’un contre l’autre. Retirez la couleur : le remplissage du glyphe et le libellé restent."
        inline
      >
        <Pill tone="done">Obtenu</Pill>
        <Pill tone="progress">En cours</Pill>
        <Pill tone="upcoming">À venir</Pill>
      </Specimen>

      <Specimen
        title="Messages"
        note="La prop live choisit le rôle : « polite » pose role=&quot;status&quot;, « assertive » pose role=&quot;alert&quot;. Par défaut, aucun rôle — un message présent au chargement n’a rien à annoncer, et les trois spécimens ci-dessous s’en tiennent donc au défaut : une page de catalogue n’a pas à se faire annoncer. Chaque bandeau porte en outre un préfixe masqué visuellement — « Succès : », « Attention : », « Erreur : » — parce que ni le glyphe, qui est aria-hidden, ni role=&quot;status&quot;, qui transporte l’urgence et non la nature, ne disent le ton."
      >
        <div className="tc-doc-stack">
          <Message tone="ok">
            <strong>Palette enregistrée.</strong> Les 47 jetons ont été recalculés, aucun
            ratio n’est passé sous son seuil.
          </Message>
          <Message tone="warn">
            <strong>Marge faible sur --accent-hover en thème sombre.</strong> 4,59:1 pour
            un seuil à 4,50:1 : toute retouche de cette teinte doit être remesurée.
          </Message>
          <Message tone="error">
            <strong>Deux jetons divergent entre les deux thèmes sombres.</strong>{' '}
            <code>--rule</code> et <code>--border-subtle</code> sont déclarés dans le bloc
            média mais absents du bloc explicite.
          </Message>
        </div>
      </Specimen>

      <Specimen title="Cartes — les quatre élévations">
        <div className="tc-doc-grid tc-doc-grid--elev">
          {([0, 1, 2, 3] as const).map((level) => (
            <Card elevation={level} key={level}>
              <h4 className="tc-doc-cardtitle">Élévation {level}</h4>
              <p className="tc-doc-cardtext">
                Fond <code>--surface</code>, liseré <code>--border-subtle</code>, rayon{' '}
                <code>--radius-md</code>.
              </p>
            </Card>
          ))}
        </div>
      </Specimen>

      <Specimen
        title="Étiquettes — le défaut est neutre"
        note="Sans variante, une étiquette est une chip : pilule, sans-serif, aucun glyphe. C’est ce qu’attend une liste de stack technique, où l’emplacement ne porte aucun sens à distinguer."
        inline
      >
        <Tag>TypeScript</Tag>
        <Tag>PostgreSQL</Tag>
        <Tag>Vitest</Tag>
      </Specimen>

      <Specimen
        title="Étiquettes — les trois variantes de charte"
        note="Elles restent parce que cette page en a besoin : c’est son seul moyen de marquer une donnée mesurée, proposée ou restée ouverte. La distinction passe par la forme de la bordure — pleine, tiretée, pointillée — et par le glyphe. Imprimée en noir et blanc, la nuance survit."
        inline
      >
        <Tag variant="measured">Mesuré</Tag>
        <Tag variant="proposed">Proposé</Tag>
        <Tag variant="open">Question ouverte</Tag>
      </Specimen>
    </Section>
  );
}
