import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Backdrop } from './backdrop';
import type { BackdropProps } from './backdrop';

/**
 * Le DOMAINE MESURÉ EST FERMÉ, et c'est le type qui le tient.
 *
 * Les deux teintes de halo sont des jetons dont le contrat épingle la parité à
 * 0,086 de ΔE OKLab près ; le nombre de disques et leur répartition
 * froid/chaud sont mesurés ensemble. Une prop de teinte ou de nombre serait la
 * porte par laquelle une couleur non mesurée entre — ces assertions échouent à
 * la compilation si quelqu'un l'ouvre.
 */
type Absent<K extends string> = K extends keyof BackdropProps ? never : 'absente';

const TINT_PROP: Absent<'tint'> = 'absente';
const COUNT_PROP: Absent<'count'> = 'absente';
const HALOS_PROP: Absent<'halos'> = 'absente';

const HALO_SELECTOR = '.tc-backdrop__halo';

describe('Backdrop', () => {
  it('devrait rendre les six disques', () => {
    const { container } = render(<Backdrop />);

    expect(container.querySelectorAll(HALO_SELECTOR)).toHaveLength(6);
  });

  it('devrait nommer les six disques dans l’ordre du document', () => {
    const { container } = render(<Backdrop />);
    const ordinals = [...container.querySelectorAll(HALO_SELECTOR)].map((halo) =>
      halo.className.replace('tc-backdrop__halo tc-backdrop__halo--', ''),
    );

    expect(ordinals).toEqual(['one', 'two', 'three', 'four', 'five', 'six']);
  });

  /*
   * Du décor, jamais un contrôle : six divs vides annoncées à un lecteur
   * d'écran ne seraient que du bruit.
   */
  it('devrait masquer les six disques aux technologies d’assistance', () => {
    const { container } = render(<Backdrop />);

    for (const halo of container.querySelectorAll(HALO_SELECTOR)) {
      expect(halo).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('ne devrait exposer ni teinte ni nombre : le domaine mesuré est fermé', () => {
    expect([TINT_PROP, COUNT_PROP, HALOS_PROP]).toEqual(['absente', 'absente', 'absente']);
  });

  it('devrait rendre son contenu', () => {
    render(
      <Backdrop>
        <h1>Titre</h1>
      </Backdrop>,
    );

    expect(screen.getByRole('heading', { name: 'Titre' })).toBeInTheDocument();
  });

  /*
   * L'ordre ne porte PLUS la garantie de peinture — les disques sont à
   * `z-index: -1` dans un hôte isolé, donc ils passent sous le contenu où qu'il
   * soit dans le document. Il reste néanmoins un contrat, parce que six enfants
   * qui apparaissent au MILIEU du contenu de l'appelant déplaceraient ses
   * sélecteurs de position (`:nth-child`, `+`, `~`) et ses items de grille. Les
   * six disques ouvrent l'hôte, toujours, et rien ne s'insère entre eux.
   */
  it('devrait rendre les disques AVANT son contenu', () => {
    const { container } = render(
      <Backdrop>
        <p data-testid="contenu">Texte</p>
      </Backdrop>,
    );
    const children = [...(container.firstElementChild?.children ?? [])];
    const lastHalo = children.findLastIndex((child) => child.matches(HALO_SELECTOR));
    const content = children.findIndex((child) => child.matches('[data-testid="contenu"]'));

    expect(lastHalo).toBeGreaterThan(-1);
    expect(content).toBeGreaterThan(lastHalo);
  });

  it('ne devrait imposer aucun rôle : la sémantique appartient à l’appelant', () => {
    render(
      <Backdrop>
        <main>Contenu</main>
      </Backdrop>,
    );

    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  /*
   * Le même contrat que les autres composants (className fusionné, ref posée,
   * props natives transmises). Il est rejoué ici parce que
   * `shared-contract.test.tsx` ne connaît pas encore `Backdrop` : c'est à
   * l'agent de recouture d'y ajouter le cas.
   */
  describe('contrat commun', () => {
    it('devrait fusionner le className de l’appelant avec ses propres classes', () => {
      const { container } = render(<Backdrop className="ma-classe" />);
      const root = container.firstElementChild;

      expect(root).toHaveClass('tc-backdrop');
      expect(root).toHaveClass('ma-classe');
    });

    it('ne devrait pas laisser une classe vide traîner dans l’attribut', () => {
      const { container } = render(<Backdrop className={undefined} />);

      expect(container.firstElementChild?.getAttribute('class')).toBe('tc-backdrop');
    });

    it('devrait poser la ref sur le div hôte', () => {
      const captured: Array<HTMLDivElement | null> = [];
      render(
        <Backdrop
          ref={(element) => {
            captured.push(element);
          }}
        />,
      );

      expect(captured[0]).toBeInstanceOf(HTMLDivElement);
      expect(captured[0]).toHaveClass('tc-backdrop');
    });

    it('devrait transmettre data-testid et title au DOM', () => {
      render(<Backdrop data-testid="sonde" title="Info-bulle" />);

      expect(screen.getByTestId('sonde')).toHaveAttribute('title', 'Info-bulle');
    });
  });
});
