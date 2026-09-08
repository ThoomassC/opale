import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionHeading } from './section-heading';
import type { SectionHeadingLevel } from './section-heading';
import sheet from '../styles/components/section-heading.css?raw';

describe('SectionHeading', () => {
  it('devrait rendre le titre', () => {
    render(<SectionHeading title="Un parcours" />);

    expect(screen.getByRole('heading', { name: 'Un parcours' })).toBeInTheDocument();
  });

  // Le niveau appartient à l'appelant : un composant ne connaît pas sa
  // profondeur dans le document, et un plan de document faux est exactement ce
  // sur quoi un lecteur d'écran navigue.
  describe('niveau de titre', () => {
    it.each<SectionHeadingLevel>([2, 3, 4])(
      'devrait rendre un titre de niveau %i quand il est demandé',
      (level) => {
        render(<SectionHeading level={level} title="Section" />);

        expect(screen.getByRole('heading', { level, name: 'Section' })).toBeInTheDocument();
      },
    );

    it('devrait retomber sur le niveau 2 sans niveau fourni', () => {
      render(<SectionHeading title="Section" />);

      expect(screen.getByRole('heading', { level: 2, name: 'Section' })).toBeInTheDocument();
    });
  });

  describe('sourcil', () => {
    it('devrait rendre le sourcil quand il est fourni', () => {
      const { container } = render(<SectionHeading eyebrow="Expérience" title="Section" />);

      const eyebrow = container.querySelector('.tc-eyebrow');

      expect(eyebrow).toHaveTextContent('Expérience');
    });

    // Le sourcil n'est pas un titre : c'est un mot de catégorie. En faire un
    // `<h*>` ajouterait un niveau parasite au plan du document.
    it('ne devrait pas rendre le sourcil comme un titre', () => {
      render(<SectionHeading eyebrow="Expérience" title="Section" />);

      expect(screen.getAllByRole('heading')).toHaveLength(1);
    });

    it("ne devrait rien rendre quand le sourcil n'est pas fourni", () => {
      const { container } = render(<SectionHeading title="Section" />);

      expect(container.querySelector('.tc-eyebrow')).toBeNull();
    });
  });

  describe('chapô', () => {
    it('devrait rendre le chapô quand il est fourni', () => {
      const { container } = render(<SectionHeading title="Section" lede="Une phrase." />);

      expect(container.querySelector('.tc-section-heading__lede')).toHaveTextContent('Une phrase.');
    });

    it("ne devrait rien rendre quand le chapô n'est pas fourni", () => {
      const { container } = render(<SectionHeading title="Section" />);

      expect(container.querySelector('.tc-section-heading__lede')).toBeNull();
    });
  });

  // L'identifiant va SUR LE TITRE et non sur le conteneur : c'est ce qui permet
  // à la section englobante de se nommer par `aria-labelledby` sans renoncer à
  // l'ancre de navigation posée sur le conteneur.
  it('devrait poser headingId sur le titre et id sur le conteneur', () => {
    const { container } = render(
      <SectionHeading headingId="titre-parcours" id="parcours" title="Un parcours" />,
    );

    expect(screen.getByRole('heading', { name: 'Un parcours' })).toHaveAttribute(
      'id',
      'titre-parcours',
    );
    expect(container.firstElementChild).toHaveAttribute('id', 'parcours');
  });

  describe('variante compacte', () => {
    it('devrait porter la classe compacte quand elle est demandée', () => {
      const { container } = render(<SectionHeading compact title="Section" />);

      expect(container.firstElementChild).toHaveClass('tc-section-heading--compact');
    });

    it('ne devrait pas la porter par défaut', () => {
      const { container } = render(<SectionHeading title="Section" />);

      expect(container.firstElementChild).not.toHaveClass('tc-section-heading--compact');
    });
  });

  it('devrait fusionner le className reçu au lieu de l’écraser', () => {
    const { container } = render(<SectionHeading className="ma-classe" title="Section" />);

    expect(container.firstElementChild).toHaveClass('tc-section-heading');
    expect(container.firstElementChild).toHaveClass('ma-classe');
  });

  /*
   * L'ÉCHELLE DOIT SUIVRE LE NIVEAU, ET RIEN NE LE VÉRIFIAIT.
   *
   * Une taille d'affichage unique, quel que soit le niveau, produisait un piège
   * mesurable : rendu en `level={4}`, ce titre faisait 49,9 px face au `h3` de
   * 23 px du bloc qui le contient. Un composant qui GROSSIT quand on l'imbrique
   * plus profond inverse la hiérarchie du document au lieu de la servir, et
   * l'œil croit le pixel avant de croire la balise.
   *
   * LE TEST LIT LA FEUILLE EN TEXTE, ET C'EST LE SEUL MOYEN DISPONIBLE ICI.
   * jsdom n'applique pas les feuilles importées : `getComputedStyle` rendrait
   * la même valeur pour les trois niveaux, donc un test de rendu serait vert
   * quoi qu'il arrive. Ce que ce bloc garantit est donc la FORME des règles —
   * un sélecteur par niveau, trois tailles distinctes, prises dans l'échelle —
   * pas le pixel peint. La même limite et la même technique que
   * `styles/glass.structure.test.ts`.
   */
  describe('échelle typographique par niveau', () => {
    /** La `font-size` déclarée pour un niveau, lue dans la feuille. */
    function fontSizeOf(level: SectionHeadingLevel): string | undefined {
      const rule = new RegExp(
        `h${level}\\.tc-section-heading__title\\s*\\{([^}]*)\\}`,
      ).exec(sheet);

      return /font-size:\s*([^;]+);/.exec(rule?.[1] ?? '')?.[1].trim();
    }

    it('devrait charger la vraie feuille', () => {
      // Sans cette garde, un `?raw` vide ferait passer tout le bloc en ne
      // trouvant simplement aucune règle.
      expect(sheet.length).toBeGreaterThan(500);
    });

    it.each<SectionHeadingLevel>([2, 3, 4])(
      'devrait déclarer une taille pour le niveau %i',
      (level) => {
        expect(fontSizeOf(level), `h${level}.tc-section-heading__title`).toBeDefined();
      },
    );

    it('devrait donner trois tailles deux à deux distinctes', () => {
      const sizes = ([2, 3, 4] as const).map(fontSizeOf);

      expect(new Set(sizes).size, `tailles déclarées : ${sizes.join(' / ')}`).toBe(3);
    });

    /*
     * L'ORDRE DOIT TENIR À TOUTE LARGEUR DE FENÊTRE, et ce n'était pas gratuit :
     * `--text-xl` (28 px fixe) dépasserait `--text-display-sm` (24 → 34 px)
     * entre 923 et 1077 px de fenêtre, et h4 repasserait devant h3 dans cette
     * bande. `--text-lg` (23 px) est sous le plancher de `display-sm`, donc
     * l'ordre tient partout. Épingler les trois jetons est ce qui empêche de
     * remplacer l'un par un clamp qui se croiserait avec son voisin.
     */
    it.each<[SectionHeadingLevel, string]>([
      [2, 'var(--text-display-md)'],
      [3, 'var(--text-display-sm)'],
      [4, 'var(--text-lg)'],
    ])('devrait prendre le niveau %i dans l’échelle : %s', (level, expected) => {
      expect(fontSizeOf(level)).toBe(expected);
    });

    // Le quatrième niveau quitte l'échelle d'affichage : à 23 px, le resserrage
    // de −0,02em et l'interlignage de 1,08 d'un grand titre cognent les
    // jambages. C'est un intertitre, il se compose comme tel.
    it('devrait rendre le niveau 4 à la typographie d’un intertitre', () => {
      const body = /h4\.tc-section-heading__title\s*\{([^}]*)\}/.exec(sheet)?.[1] ?? '';

      expect(body).toMatch(/letter-spacing:\s*normal/);
      expect(body).toMatch(/line-height:\s*var\(--leading-heading\)/);
    });
  });
});
