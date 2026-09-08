import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field } from './field';
import type { FieldControlProps } from './field';

const HINT = 'Format attendu : nom@domaine.fr';
const ERROR = 'Adresse invalide';

function renderField(props: { hint?: string; error?: string }) {
  return render(
    <Field id="email" label="Adresse e-mail" {...props}>
      {(control: FieldControlProps) => <input {...control} type="email" />}
    </Field>,
  );
}

describe('Field', () => {
  describe('câblage du libellé', () => {
    it.each([
      ['ni aide ni erreur', {}],
      ['une aide seule', { hint: HINT }],
      ['une erreur seule', { error: ERROR }],
      ['une aide et une erreur', { hint: HINT, error: ERROR }],
    ])(
      'devrait exposer le contrôle sous son libellé quand il y a %s',
      (_label, props) => {
        renderField(props);

        const control = screen.getByLabelText('Adresse e-mail');

        expect(control).toHaveAttribute('id', 'email');
        expect(control.tagName).toBe('INPUT');
      },
    );
  });

  describe('aria-describedby', () => {
    it("devrait ne poser aucun aria-describedby quand il n'y a ni aide ni erreur", () => {
      renderField({});

      const control = screen.getByLabelText('Adresse e-mail');

      expect(control).not.toHaveAttribute('aria-describedby');
      expect(control).toHaveAccessibleDescription('');
    });

    it("devrait référencer la seule aide quand il n'y a pas d'erreur", () => {
      renderField({ hint: HINT });

      const control = screen.getByLabelText('Adresse e-mail');

      expect(control).toHaveAttribute('aria-describedby', 'email-hint');
      expect(document.getElementById('email-hint')).toHaveTextContent(HINT);
      expect(control).toHaveAccessibleDescription(HINT);
    });

    it("devrait référencer la seule erreur quand il n'y a pas d'aide", () => {
      renderField({ error: ERROR });

      const control = screen.getByLabelText('Adresse e-mail');

      expect(control).toHaveAttribute('aria-describedby', 'email-error');
      expect(document.getElementById('email-error')).toHaveTextContent(ERROR);
      expect(control).toHaveAccessibleDescription(ERROR);
    });

    it("devrait énoncer l'aide puis l'erreur quand les deux sont présentes", () => {
      renderField({ hint: HINT, error: ERROR });

      const control = screen.getByLabelText('Adresse e-mail');

      expect(control).toHaveAttribute(
        'aria-describedby',
        'email-hint email-error',
      );
      expect(control).toHaveAccessibleDescription(`${HINT} ${ERROR}`);
    });

    it.each([
      ['une aide seule', { hint: HINT }, ['email-hint']],
      ['une erreur seule', { error: ERROR }, ['email-error']],
      [
        'une aide et une erreur',
        { hint: HINT, error: ERROR },
        ['email-hint', 'email-error'],
      ],
    ])(
      'devrait ne référencer que des éléments réellement présents quand il y a %s',
      (_label, props, expectedIds) => {
        renderField(props);

        const control = screen.getByLabelText('Adresse e-mail');
        const referenced = (
          control.getAttribute('aria-describedby') ?? ''
        ).split(' ');

        expect(referenced).toEqual(expectedIds);
        // Un aria-describedby qui pointe dans le vide est silencieux pour
        // l'utilisateur : on résout chaque identifiant et on exige un nœud
        // porteur de texte. `getElementById` est le seul moyen de suivre la
        // référence, aucune requête accessible ne le fait.
        const resolved = referenced.map((id) => document.getElementById(id));

        expect(resolved).not.toContain(null);
        expect(resolved.map((node) => node?.textContent?.trim())).not.toContain(
          '',
        );
      },
    );
  });

  describe('aria-invalid', () => {
    it.each([
      ['ni aide ni erreur', {}],
      ['une aide seule', { hint: HINT }],
    ])(
      'devrait omettre aria-invalid — et non le poser à false — quand il y a %s',
      (_label, props) => {
        renderField(props);

        expect(screen.getByLabelText('Adresse e-mail')).not.toHaveAttribute(
          'aria-invalid',
        );
      },
    );

    it.each([
      ['une erreur seule', { error: ERROR }],
      ['une aide et une erreur', { hint: HINT, error: ERROR }],
    ])('devrait poser aria-invalid à true quand il y a %s', (_label, props) => {
      renderField(props);

      expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });
  });

  describe('contenu visible', () => {
    it("devrait afficher l'aide et le message d'erreur", () => {
      renderField({ hint: HINT, error: ERROR });

      expect(screen.getByText(HINT)).toBeInTheDocument();
      expect(screen.getByText(ERROR)).toBeInTheDocument();
    });

    it("devrait rendre le glyphe d'erreur décoratif pour les technologies d'assistance", () => {
      renderField({ error: ERROR });

      expect(screen.getByText('▲')).toHaveAttribute('aria-hidden', 'true');
      // Le glyphe est masqué : il ne doit pas s'entendre dans la description.
      expect(screen.getByLabelText('Adresse e-mail')).toHaveAccessibleDescription(
        ERROR,
      );
    });

    it("ne devrait afficher ni aide ni erreur quand aucune n'est fournie", () => {
      renderField({});

      expect(screen.queryByText(HINT)).not.toBeInTheDocument();
      expect(screen.queryByText(ERROR)).not.toBeInTheDocument();
    });
  });

  /*
   * LE TROISIÈME PIED DU TRÉPIED, QUI MANQUAIT (WCAG 4.1.3).
   *
   * Le composant avait la relation (`aria-describedby`) et l'atteinte au
   * défilement (`scroll-margin-block-start`), pas l'annonce. Scénario du
   * défaut : NVDA, formulaire de contact, le serveur refuse, l'appelant re-rend
   * `<Field error="Adresse invalide">` — le glyphe apparaît, le libellé rougit,
   * et rien n'est dit. L'utilisateur reste sur le bouton d'envoi.
   *
   * Le rôle est mesuré sur le NŒUD, et son effet sur l'ARBRE : `getByRole`
   * prouve que l'alerte est atteignable comme telle, et `getAllByRole('alert')`
   * qu'il n'y en a pas deux pour un seul champ.
   */
  describe('annonce de l’erreur', () => {
    it("devrait porter role=alert sur le message d'erreur", () => {
      renderField({ error: ERROR });

      const alert = screen.getByRole('alert');

      expect(alert).toHaveClass('tc-field__error');
      expect(alert).toHaveAttribute('id', 'email-error');
      expect(alert).toHaveTextContent(ERROR);
    });

    it.each([
      ['ni aide ni erreur', {}],
      ['une aide seule', { hint: HINT }],
    ])('ne devrait poser aucune alerte quand il y a %s', (_label, props) => {
      renderField(props);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // L'aide n'est PAS une alerte : elle est permanente, elle ne signale aucun
    // changement, et l'annoncer interromprait la lecture sans raison.
    it("ne devrait pas annoncer l'aide, même quand une erreur l'accompagne", () => {
      renderField({ hint: HINT, error: ERROR });

      const alerts = screen.getAllByRole('alert');

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveTextContent(ERROR);
      expect(alerts[0]).not.toHaveTextContent(HINT);
    });

    // Le glyphe reste décoratif DANS l'alerte : une alerte annonce tout son
    // contenu, donc un glyphe non masqué s'y entendrait — « triangle noir
    // pointant vers le haut, Adresse invalide ».
    it("devrait annoncer le texte de l'erreur sans son glyphe", () => {
      renderField({ error: ERROR });

      expect(screen.getByRole('alert')).toHaveAccessibleName('');
      expect(screen.getByText('▲')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByLabelText('Adresse e-mail')).toHaveAccessibleDescription(ERROR);
    });

    it('devrait poser une alerte par champ en erreur, et une seule', () => {
      render(
        <form>
          <Field id="email" label="Adresse e-mail" error={ERROR}>
            {(control: FieldControlProps) => <input {...control} type="email" />}
          </Field>
          <Field id="phone" label="Téléphone" error="Numéro trop court">
            {(control: FieldControlProps) => <input {...control} type="tel" />}
          </Field>
        </form>,
      );

      expect(screen.getAllByRole('alert')).toHaveLength(2);
    });
  });

  describe('plusieurs champs sur la même page', () => {
    it('devrait dériver des identifiants disjoints pour deux champs distincts', () => {
      render(
        <form>
          <Field id="email" label="Adresse e-mail" hint={HINT} error={ERROR}>
            {(control: FieldControlProps) => <input {...control} type="email" />}
          </Field>
          <Field
            id="phone"
            label="Téléphone"
            hint="Dix chiffres"
            error="Numéro trop court"
          >
            {(control: FieldControlProps) => <input {...control} type="tel" />}
          </Field>
        </form>,
      );

      const email = screen.getByLabelText('Adresse e-mail');
      const phone = screen.getByLabelText('Téléphone');

      expect(email).toHaveAttribute('id', 'email');
      expect(phone).toHaveAttribute('id', 'phone');
      expect(email).toHaveAttribute(
        'aria-describedby',
        'email-hint email-error',
      );
      expect(phone).toHaveAttribute(
        'aria-describedby',
        'phone-hint phone-error',
      );
      expect(email).toHaveAccessibleDescription(`${HINT} ${ERROR}`);
      expect(phone).toHaveAccessibleDescription('Dix chiffres Numéro trop court');
    });

    it('devrait garder un seul élément par identifiant dérivé', () => {
      render(
        <form>
          <Field id="email" label="Adresse e-mail" hint={HINT}>
            {(control: FieldControlProps) => <input {...control} type="email" />}
          </Field>
          <Field id="phone" label="Téléphone" hint="Dix chiffres">
            {(control: FieldControlProps) => <input {...control} type="tel" />}
          </Field>
        </form>,
      );

      // Un identifiant dupliqué casserait silencieusement la résolution
      // ARIA ; seule une requête sur le DOM brut peut compter les doublons.
      expect(document.querySelectorAll('#email-hint')).toHaveLength(1);
      expect(document.querySelectorAll('#phone-hint')).toHaveLength(1);
    });
  });
});
