import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { Backdrop } from './backdrop';
import { Button } from './button';
import { Card } from './card';
import { Checkbox } from './checkbox';
import { ChipList } from './chip-list';
import { DateRange } from './date-range';
import { Field } from './field';
import type { FieldControlProps } from './field';
import { IconTile } from './icon-tile';
import { Input } from './input';
import { Message } from './message';
import { Pill } from './pill';
import { SectionHeading } from './section-heading';
import { Select } from './select';
import { Tag } from './tag';
import { Textarea } from './textarea';
import { Timeline, TimelineItem } from './timeline';

/** Ce qu'un appelant peut poser sur n'importe lequel des composants. */
interface CommonProps {
  className?: string;
  ref?: (element: HTMLElement | null) => void;
  'data-testid'?: string;
  title?: string;
  lang?: string;
}

/**
 * L'attribut HTML natif que le troisième volet pose puis relit.
 *
 * `title` partout, SAUF là où le composant a pris ce nom pour sa propre API.
 * `SectionHeading` est ce cas : sa prop `title: ReactNode` est le titre rendu,
 * et son type OMET délibérément l'attribut HTML homonyme (une infobulle au
 * survol d'un bloc de titre n'est ni atteignable au clavier ni lisible au
 * toucher). Y poser `title="Info-bulle"` ne produirait donc pas un attribut à
 * relire mais un titre de section — le volet mesurerait l'inverse de ce qu'il
 * croit mesurer, et il resterait rouge sans qu'aucun contrat soit cassé.
 *
 * Ce que le volet veut prouver est qu'un attribut HTML QUELCONQUE traverse le
 * composant jusqu'à sa racine ; `lang` le prouve aussi bien, et il n'entre en
 * collision avec l'API d'aucun composant de la librairie.
 */
type NativeProbe = 'title' | 'lang';

const PROBE_VALUES: Record<NativeProbe, string> = { title: 'Info-bulle', lang: 'fr' };

/** Les props du sondage, montées sans clé calculée pour rester typées. */
function probeProps(probe: NativeProbe): CommonProps {
  return probe === 'lang'
    ? { 'data-testid': 'probe-node', lang: PROBE_VALUES.lang }
    : { 'data-testid': 'probe-node', title: PROBE_VALUES.title };
}

interface ComponentCase {
  /** Classe interne que `className` ne doit jamais remplacer. */
  baseClass: string;
  /** Balise sur laquelle la `ref` est censée atterrir. */
  refTagName: string;
  /** @default 'title' — voir {@link NativeProbe}. */
  nativeProbe?: NativeProbe;
  render: (props: CommonProps) => ReactElement;
}

const CASES: Array<[string, ComponentCase]> = [
  [
    'Backdrop',
    {
      baseClass: 'tc-backdrop',
      refTagName: 'DIV',
      render: (props) => <Backdrop {...props}>Contenu</Backdrop>,
    },
  ],
  [
    'Button',
    {
      baseClass: 'tc-btn',
      refTagName: 'BUTTON',
      render: (props) => <Button {...props}>Valider</Button>,
    },
  ],
  [
    'Card',
    {
      baseClass: 'tc-card',
      refTagName: 'DIV',
      render: (props) => <Card {...props}>Contenu</Card>,
    },
  ],
  [
    'Checkbox',
    {
      baseClass: 'tc-checkbox',
      refTagName: 'INPUT',
      render: (props) => <Checkbox label="Accepter" {...props} />,
    },
  ],
  [
    'ChipList',
    {
      baseClass: 'tc-chips',
      refTagName: 'UL',
      // `items` NON VIDE, et c'est une contrainte du composant, pas une
      // commodité de test : `ChipList` rend `null` sur une liste vide, donc un
      // tableau vide ne produirait aucune racine à mesurer et les trois volets
      // rougiraient sur un comportement documenté et voulu.
      render: (props) => <ChipList label="Technologies" items={['Bus', 'Train']} {...props} />,
    },
  ],
  [
    'DateRange',
    {
      baseClass: 'tc-daterange',
      refTagName: 'P',
      render: (props) => (
        <DateRange start={{ dateTime: '2023-09', label: 'Septembre 2023' }} {...props} />
      ),
    },
  ],
  [
    'Field',
    {
      baseClass: 'tc-field',
      refTagName: 'DIV',
      render: (props) => (
        <Field id="probe" label="Champ" {...props}>
          {(control: FieldControlProps) => <input {...control} />}
        </Field>
      ),
    },
  ],
  [
    'IconTile',
    {
      baseClass: 'tc-icontile',
      refTagName: 'SPAN',
      // La variante DÉCORATIVE, qui est le défaut : elle rend un `<span>`. La
      // variante lien (`href` fourni, rendue en `<a>`) porte le même `cx()` et
      // le même étalement de props ; elle est couverte par `icon-tile.test.tsx`,
      // qui vérifie la fusion du className et la transmission des attributs de
      // lien. Deux entrées ici mesureraient deux fois la même ligne de code.
      render: (props) => <IconTile {...props} />,
    },
  ],
  [
    'Input',
    {
      baseClass: 'tc-input',
      refTagName: 'INPUT',
      render: (props) => <Input aria-label="Champ" {...props} />,
    },
  ],
  [
    'Message',
    {
      baseClass: 'tc-message',
      refTagName: 'DIV',
      render: (props) => (
        <Message tone="ok" {...props}>
          Enregistré
        </Message>
      ),
    },
  ],
  [
    'Pill',
    {
      baseClass: 'tc-pill',
      refTagName: 'SPAN',
      // Un libellé textuel est OBLIGATOIRE : `Pill` lève au rendu sans lui,
      // parce que ses trois tons sont mesurés indiscernables en deutéranopie et
      // que le libellé est le garde-fou réel. Le ton suit le vocabulaire
      // d'AVANCEMENT du composant (`done | progress | upcoming`), pas celui de
      // sévérité qui vit dans `Message`.
      render: (props) => (
        <Pill tone="done" {...props}>
          Acquis
        </Pill>
      ),
    },
  ],
  [
    'SectionHeading',
    {
      baseClass: 'tc-section-heading',
      refTagName: 'DIV',
      // Voir {@link NativeProbe} : `title` est la prop de titre du composant,
      // pas l'attribut HTML. Le volet sonde donc `lang`.
      nativeProbe: 'lang',
      render: (props) => <SectionHeading title="Un parcours" {...props} />,
    },
  ],
  [
    'Select',
    {
      baseClass: 'tc-select',
      refTagName: 'SELECT',
      render: (props) => (
        <Select aria-label="Pays" {...props}>
          <option value="fr">France</option>
        </Select>
      ),
    },
  ],
  [
    'Tag',
    {
      baseClass: 'tc-tag',
      refTagName: 'SPAN',
      render: (props) => (
        <Tag variant="measured" {...props}>
          Mesuré
        </Tag>
      ),
    },
  ],
  [
    'Textarea',
    {
      baseClass: 'tc-textarea',
      refTagName: 'TEXTAREA',
      render: (props) => <Textarea aria-label="Biographie" {...props} />,
    },
  ],
  [
    'Timeline',
    {
      baseClass: 'tc-timeline',
      refTagName: 'OL',
      render: (props) => (
        <Timeline label="Étapes du voyage" {...props}>
          <TimelineItem>Kyoto</TimelineItem>
        </Timeline>
      ),
    },
  ],
  [
    'TimelineItem',
    {
      baseClass: 'tc-timeline__item',
      refTagName: 'LI',
      // Rendue HORS de sa `<ol>`, et il n'y a pas le choix : les trois volets
      // lisent `container.firstElementChild`, donc envelopper l'entrée dans une
      // `Timeline` ferait mesurer la liste à la place de l'entrée. Le contrat
      // vérifié ici est celui de la racine du composant ; l'imbrication
      // correcte est le sujet de `timeline.test.tsx`.
      render: (props) => <TimelineItem {...props}>Kyoto</TimelineItem>,
    },
  ],
];

describe('contrat commun à tous les composants', () => {
  describe('fusion de className', () => {
    // Ici la classe EST le contrat : c'est la promesse faite à l'appelant
    // qui veut placer le composant dans sa propre grille.
    it.each(CASES)(
      '%s devrait fusionner le className de l’appelant avec ses propres classes',
      (_name, subject) => {
        const { container } = render(subject.render({ className: 'caller-class' }));
        const root = container.firstElementChild;

        expect(root).toHaveClass(subject.baseClass);
        expect(root).toHaveClass('caller-class');
      },
    );

    it.each(CASES)(
      '%s devrait garder ses classes internes quand aucun className n’est fourni',
      (_name, subject) => {
        const { container } = render(subject.render({}));

        expect(container.firstElementChild).toHaveClass(subject.baseClass);
      },
    );

    it.each(CASES)(
      '%s ne devrait pas laisser une classe vide traîner dans l’attribut',
      (_name, subject) => {
        const { container } = render(subject.render({ className: undefined }));
        const className = container.firstElementChild?.getAttribute('class');

        expect(className).toBeTruthy();
        expect(className).not.toMatch(/\s{2,}|^\s|\s$/);
      },
    );
  });

  describe('transmission de la ref', () => {
    it.each(CASES)('%s devrait poser la ref sur un élément du document', (_name, subject) => {
      const captured: Array<HTMLElement | null> = [];
      const { container } = render(
        subject.render({
          ref: (element) => {
            captured.push(element);
          },
        }),
      );

      const element = captured[0];

      expect(element).not.toBeNull();
      expect(element?.tagName).toBe(subject.refTagName);
      expect(container.contains(element)).toBe(true);
    });
  });

  describe('transmission des props HTML natives', () => {
    it.each(CASES)(
      '%s devrait transmettre data-testid et un attribut HTML natif au DOM',
      (_name, subject) => {
        const probe = subject.nativeProbe ?? 'title';

        render(subject.render(probeProps(probe)));

        expect(screen.getByTestId('probe-node')).toHaveAttribute(probe, PROBE_VALUES[probe]);
      },
    );
  });
});
