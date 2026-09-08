import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';
import { Card } from './card';
import { Checkbox } from './checkbox';
import { Field } from './field';
import type { FieldControlProps } from './field';
import { Input } from './input';
import { Message } from './message';
import { Pill } from './pill';
import { Select } from './select';
import { Tag } from './tag';
import { Textarea } from './textarea';

/** Ce qu'un appelant peut poser sur n'importe lequel des composants. */
interface CommonProps {
  className?: string;
  ref?: (element: HTMLElement | null) => void;
  'data-testid'?: string;
  title?: string;
}

interface ComponentCase {
  /** Classe interne que `className` ne doit jamais remplacer. */
  baseClass: string;
  /** Balise sur laquelle la `ref` est censée atterrir. */
  refTagName: string;
  render: (props: CommonProps) => ReactElement;
}

const CASES: Array<[string, ComponentCase]> = [
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
      render: (props) => (
        <Pill tone="done" {...props}>
          Publié
        </Pill>
      ),
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
];

describe('contrat commun à tous les composants', () => {
  describe('fusion de className', () => {
    // Ici la classe EST le contrat : c'est la promesse faite à l'appelant
    // qui veut placer le composant dans sa propre grille.
    it.each(CASES)(
      '%s devrait fusionner le className de l’appelant avec ses propres classes',
      (_name, subject) => {
        const { container } = render(
          subject.render({ className: 'caller-class' }),
        );
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
    it.each(CASES)(
      '%s devrait poser la ref sur un élément du document',
      (_name, subject) => {
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
      },
    );
  });

  describe('transmission des props HTML natives', () => {
    it.each(CASES)(
      '%s devrait transmettre data-testid et title au DOM',
      (_name, subject) => {
        render(
          subject.render({ 'data-testid': 'probe-node', title: 'Info-bulle' }),
        );

        expect(screen.getByTestId('probe-node')).toHaveAttribute(
          'title',
          'Info-bulle',
        );
      },
    );
  });
});
