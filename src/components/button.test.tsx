import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  describe('rendu de base', () => {
    it('devrait exposer un bouton portant son libellé', () => {
      render(<Button>Valider</Button>);

      expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
    });

    it('devrait valoir type=button par défaut pour ne pas soumettre un formulaire par accident', () => {
      render(<Button>Valider</Button>);

      expect(screen.getByRole('button', { name: 'Valider' })).toHaveAttribute('type', 'button');
    });

    it('devrait accepter type=submit fourni par l’appelant', () => {
      render(<Button type="submit">Envoyer</Button>);

      expect(screen.getByRole('button', { name: 'Envoyer' })).toHaveAttribute('type', 'submit');
    });

    it('devrait déclencher le gestionnaire de clic', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Valider</Button>);

      await user.click(screen.getByRole('button', { name: 'Valider' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('variantes', () => {
    // La variante n'a pas de traduction accessible : elle ne change que
    // l'apparence. La classe EST donc le seul contrat observable ici.
    it.each([
      ['primary par défaut', undefined, 'tc-btn--primary'],
      ['primary', 'primary' as const, 'tc-btn--primary'],
      ['secondary', 'secondary' as const, 'tc-btn--secondary'],
      ['danger', 'danger' as const, 'tc-btn--danger'],
    ])('devrait porter la classe de la variante %s', (_label, variant, expected) => {
      render(<Button variant={variant}>Valider</Button>);

      const button = screen.getByRole('button', { name: 'Valider' });

      expect(button).toHaveClass('tc-btn');
      expect(button).toHaveClass(expected);
    });
  });

  describe('désactivation', () => {
    it('devrait retirer le bouton de la navigation clavier avec disabled', () => {
      render(<Button disabled>Valider</Button>);

      expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
    });

    it('ne devrait pas déclencher le clic quand le bouton est disabled', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          Valider
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: 'Valider' }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('devrait rester focusable avec aria-disabled, contrairement à disabled', async () => {
      const user = userEvent.setup();
      render(<Button aria-disabled="true">Valider</Button>);

      const button = screen.getByRole('button', { name: 'Valider' });
      await user.tab();

      expect(button).toHaveFocus();
      expect(button).not.toBeDisabled();
    });

    // Ces deux tests documentaient le comportement inverse — « au composant de
    // court-circuiter ». C'est le composant, désormais : laisser passer le clic
    // sous `aria-disabled` donnait un bouton d'apparence inerte qui soumettait
    // quand même, soit une double soumission sur tout bouton d'envoi.
    it('ne devrait pas déclencher le clic quand aria-disabled est posé', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button aria-disabled="true" onClick={onClick}>
          Valider
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: 'Valider' }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('ne devrait pas déclencher la validation clavier quand aria-disabled est posé', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button aria-disabled="true" onClick={onClick}>
          Valider
        </Button>,
      );

      await user.tab();
      await user.keyboard('{Enter}');

      expect(onClick).not.toHaveBeenCalled();
    });

    it('ne devrait pas soumettre son formulaire quand aria-disabled est posé', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" aria-disabled="true">
            Envoyer
          </Button>
        </form>,
      );

      await user.click(screen.getByRole('button', { name: 'Envoyer' }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('devrait déclencher le clic normalement sans aria-disabled', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button aria-disabled={false} onClick={onClick}>
          Valider
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: 'Valider' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('devrait exposer aria-disabled aux technologies d’assistance', () => {
      render(<Button aria-disabled="true">Valider</Button>);

      expect(screen.getByRole('button', { name: 'Valider' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  describe('attente', () => {
    it('devrait exposer aria-busy et garder un libellé de substitution', () => {
      render(<Button aria-busy="true">Envoi…</Button>);

      const button = screen.getByRole('button', { name: 'Envoi…' });

      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('élément rendu', () => {
    it('devrait rendre un button sans href', () => {
      render(<Button>Valider</Button>);

      const button = screen.getByRole('button', { name: 'Valider' });

      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
      // `href` reste dans le spread côté bouton, typé `undefined` : React ne
      // doit poser aucun attribut pour cette valeur.
      expect(button).not.toHaveAttribute('href');
    });

    it('devrait rendre un button quand href vaut explicitement undefined', () => {
      render(<Button href={undefined}>Valider</Button>);

      const button = screen.getByRole('button', { name: 'Valider' });

      expect(button.tagName).toBe('BUTTON');
      expect(button).not.toHaveAttribute('href');
    });

    it('devrait rendre une ancre quand href est fourni', () => {
      render(<Button href="/contact">Me contacter</Button>);

      const link = screen.getByRole('link', { name: 'Me contacter' });

      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/contact');
    });

    it('ne devrait pas poser de type sur une ancre', () => {
      render(<Button href="/contact">Me contacter</Button>);

      expect(screen.getByRole('link', { name: 'Me contacter' })).not.toHaveAttribute('type');
    });

    it('devrait porter les classes de variante sur une ancre comme sur un bouton', () => {
      render(
        <Button href="/contact" variant="secondary">
          Me contacter
        </Button>,
      );

      const link = screen.getByRole('link', { name: 'Me contacter' });

      expect(link).toHaveClass('tc-btn');
      expect(link).toHaveClass('tc-btn--secondary');
    });

    it('devrait fusionner le className fourni sur une ancre', () => {
      render(
        <Button href="/contact" className="tc-mt-4">
          Me contacter
        </Button>,
      );

      expect(screen.getByRole('link', { name: 'Me contacter' })).toHaveClass('tc-mt-4');
    });

    it('devrait transmettre les attributs d’ancre à l’élément', () => {
      render(
        <Button href="https://example.test" target="_blank" rel="noreferrer">
          Sortir
        </Button>,
      );

      const link = screen.getByRole('link', { name: 'Sortir' });

      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    });

    it('devrait déclencher le gestionnaire de clic sur une ancre', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
      render(
        <Button href="/contact" onClick={onClick}>
          Me contacter
        </Button>,
      );

      await user.click(screen.getByRole('link', { name: 'Me contacter' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('ancre inerte', () => {
    /**
     * Observe `defaultPrevented` APRÈS le passage de React.
     *
     * React 19 délègue ses gestionnaires au conteneur de rendu : un écouteur
     * posé sur le lien lui-même s'exécuterait AVANT celui du composant et
     * lirait un `defaultPrevented` encore à faux — le test passerait pour la
     * mauvaise raison. On écoute donc sur `document`, au-dessus du conteneur,
     * là où l'événement ne remonte qu'une fois React servi.
     *
     * `preventDefault` est aussi appelé par l'écouteur, mais après la mesure :
     * jsdom ne sait pas naviguer et se plaindrait d'un lien réellement suivi.
     */
    function watchClickOnDocument() {
      const prevented = vi.fn();
      const listener = (event: Event) => {
        prevented(event.defaultPrevented);
        event.preventDefault();
      };

      document.addEventListener('click', listener);
      onTestFinished(() => document.removeEventListener('click', listener));

      return prevented;
    }

    /**
     * Le verdict du DOM sur un clic, sans dépendre d'un ordre d'écouteurs.
     *
     * `watchClickOnDocument` ne suffit plus pour un contrôle inerte, et c'est
     * la correction elle-même qui l'a rendu aveugle : le composant appelle
     * désormais `stopPropagation()`, donc l'événement n'atteint plus `document`
     * et la sonde n'est jamais appelée. Le distinguer d'un `preventDefault()`
     * qui n'aurait pas eu lieu demande de mesurer les deux séparément.
     *
     * `dispatchEvent` rend `false` quand `preventDefault()` a été appelé —
     * c'est le DOM qui répond, pas un écouteur —, et l'écouteur de `document`
     * ne sert plus qu'à dire si l'événement est REMONTÉ. Aucun des deux ne
     * dépend de l'endroit où React attache ses gestionnaires.
     */
    function dispatchClick(target: Element) {
      const reachedDocument = vi.fn();
      const listener = (event: Event) => {
        reachedDocument();
        event.preventDefault();
      };

      document.addEventListener('click', listener);
      onTestFinished(() => document.removeEventListener('click', listener));

      const notPrevented = target.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );

      return { defaultPrevented: !notPrevented, reachedDocument };
    }

    /*
     * L'INTERCEPTION DU CLIC NE SUFFISAIT PAS, ET NE POUVAIT PAS SUFFIRE.
     *
     * Le composant s'appuyait sur `onClick` seul, en affirmant que « le clic à
     * la souris comme la validation au clavier passent par le même événement
     * `click` ». Vrai du bouton primaire, faux des boutons auxiliaires : le
     * clic du MILIEU produit un `auxclick` et plus aucun `click` depuis
     * Chrome 55 / Firefox 53, et « Ouvrir dans un nouvel onglet » du menu
     * contextuel comme le glisser vers la barre d'adresse ne produisent aucun
     * événement du tout. Un lien peint inerte s'ouvrait donc par trois chemins.
     *
     * La correction est structurelle : sous `aria-disabled`, plus de `href`.
     * C'est ce que ces tests mesurent — l'absence de l'attribut, pas l'absence
     * d'effet —, parce que c'est l'absence de l'attribut qui ferme AUSSI les
     * chemins que jsdom ne sait pas simuler.
     */
    it('ne devrait pas émettre de href du tout, ce qui ferme tous les chemins', () => {
      render(
        <Button href="/contact" aria-disabled="true">
          Me contacter
        </Button>,
      );

      const link = screen.getByRole('link', { name: 'Me contacter' });

      expect(link.tagName).toBe('A');
      expect(link).not.toHaveAttribute('href');
    });

    // Sans `href`, un `<a>` retombe sur le rôle `generic` : le lecteur d'écran
    // n'annonce plus ni « lien » ni son indisponibilité. Le rôle explicite est
    // ce qui rend la perte de `href` gratuite du point de vue de l'annonce.
    it('devrait garder le rôle de lien et son état indisponible', () => {
      render(
        <Button href="/contact" aria-disabled="true">
          Me contacter
        </Button>,
      );

      const link = screen.getByRole('link', { name: 'Me contacter' });

      expect(link).toHaveAttribute('role', 'link');
      expect(link).toHaveAttribute('aria-disabled', 'true');
    });

    it('ne devrait pas appeler onClick quand aria-disabled est posé', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button href="/contact" aria-disabled="true" onClick={onClick}>
          Me contacter
        </Button>,
      );

      await user.click(screen.getByRole('link', { name: 'Me contacter' }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('devrait annuler l’événement ET l’empêcher de remonter', () => {
      render(
        <Button href="/contact" aria-disabled="true">
          Me contacter
        </Button>,
      );

      const verdict = dispatchClick(screen.getByRole('link', { name: 'Me contacter' }));

      expect(verdict.defaultPrevented).toBe(true);
      expect(verdict.reachedDocument).not.toHaveBeenCalled();
    });

    it('ne devrait pas naviguer sur validation clavier quand aria-disabled est posé', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button href="/contact" aria-disabled="true" onClick={onClick}>
          Me contacter
        </Button>,
      );

      await user.tab();
      await user.keyboard('{Enter}');

      expect(onClick).not.toHaveBeenCalled();
    });

    // Un `<a>` sans `href` n'est PAS focusable par défaut : c'est ce que
    // `tabIndex={0}` rachète. L'exigence est inchangée — le lien inerte reste
    // atteignable au clavier et annoncé —, seul le moyen a changé, donc
    // l'assertion sur l'attribut aussi.
    it('devrait rester focusable, pour être annoncé « indisponible »', async () => {
      const user = userEvent.setup();
      render(
        <Button href="/contact" aria-disabled="true">
          Me contacter
        </Button>,
      );

      const link = screen.getByRole('link', { name: 'Me contacter' });
      await user.tab();

      expect(link).toHaveFocus();
      expect(link).toHaveAttribute('tabindex', '0');
    });

    it('devrait naviguer normalement sans aria-disabled', async () => {
      const user = userEvent.setup();
      const prevented = watchClickOnDocument();

      render(<Button href="/contact">Me contacter</Button>);

      await user.click(screen.getByRole('link', { name: 'Me contacter' }));

      expect(prevented).toHaveBeenCalledWith(false);
    });

    // Le lien VIVANT ne porte ni rôle explicite ni `tabIndex` : les deux ne
    // servent qu'à réparer l'absence de `href`, et un `tabIndex` inutile est
    // une entrée de plus dans l'ordre de tabulation à ne pas justifier.
    it('ne devrait poser ni role ni tabIndex sur un lien vivant', () => {
      render(<Button href="/contact">Me contacter</Button>);

      const link = screen.getByRole('link', { name: 'Me contacter' });

      expect(link).not.toHaveAttribute('role');
      expect(link).not.toHaveAttribute('tabindex');
      expect(link).toHaveAttribute('href', '/contact');
    });
  });

  /*
   * `href=""` PRODUISAIT UN LIEN VIVANT. `<a href="">` pointe vers l'adresse
   * courante : `<Button href={p.url}>` avec une URL vide venue des données
   * rendait un lien dont le clic RECHARGEAIT la page. Le type n'a rien à
   * redire — l'appel est légitime, c'est la donnée qui est vide — donc la
   * chaîne vide compte pour absente et le composant retombe sur son `<button>`.
   */
  describe('href vide', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Le report de la faute est ATTENDU : on l'observe, on ne l'avale pas. */
    function watchConsoleError() {
      return vi.spyOn(console, 'error').mockImplementation(() => {});
    }

    it('devrait rendre un button et non un lien', () => {
      watchConsoleError();

      render(<Button href="">Me contacter</Button>);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Me contacter' }).tagName).toBe('BUTTON');
    });

    it('ne devrait pas laisser traîner un href vide sur le button', () => {
      watchConsoleError();

      render(<Button href="">Me contacter</Button>);

      const button = screen.getByRole('button', { name: 'Me contacter' });

      expect(button).not.toHaveAttribute('href');
      expect(button).toHaveAttribute('type', 'button');
    });

    // Une URL vide est un défaut de DONNÉES : le composant le rend inoffensif
    // et le signale, il ne le fait pas passer pour un choix.
    it('devrait signaler la faute en console', () => {
      const spy = watchConsoleError();

      render(<Button href="">Me contacter</Button>);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/href="" reçu/);
    });

    it('ne devrait rien signaler pour un href absent', () => {
      const spy = watchConsoleError();

      render(<Button>Valider</Button>);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  /*
   * UN `<button disabled>` NATIF NE DISPATCHE AUCUN `click` : rien au-dessus de
   * lui ne l'entend. `aria-disabled` sans arrêt de propagation laissait au
   * contraire l'événement remonter — un clic sur un contrôle annoncé
   * indisponible déclenchait l'action de son conteneur.
   */
  describe('propagation sous aria-disabled', () => {
    it('ne devrait pas déclencher le gestionnaire du conteneur', async () => {
      const user = userEvent.setup();
      const openDetail = vi.fn();
      const send = vi.fn();

      render(
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={openDetail}>
          <Button aria-disabled="true" onClick={send}>
            Envoyer
          </Button>
        </div>,
      );

      await user.click(screen.getByRole('button', { name: 'Envoyer' }));

      expect(send).not.toHaveBeenCalled();
      expect(openDetail).not.toHaveBeenCalled();
    });

    it('devrait laisser remonter le clic quand le bouton est actif', async () => {
      const user = userEvent.setup();
      const openDetail = vi.fn();

      render(
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={openDetail}>
          <Button>Envoyer</Button>
        </div>,
      );

      await user.click(screen.getByRole('button', { name: 'Envoyer' }));

      expect(openDetail).toHaveBeenCalledTimes(1);
    });

    it('ne devrait pas non plus laisser remonter le clic d’un lien inerte', async () => {
      const user = userEvent.setup();
      const openDetail = vi.fn();

      render(
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={openDetail}>
          <Button href="/etape/12" aria-disabled="true">
            Publier
          </Button>
        </div>,
      );

      await user.click(screen.getByRole('link', { name: 'Publier' }));

      expect(openDetail).not.toHaveBeenCalled();
    });
  });

  // Ces deux cas font EXÉCUTER la discrimination par le compilateur au lieu de
  // la croire. `strict` est actif et `src` entier est dans le programme de
  // `tsc`, donc un `@ts-expect-error` non consommé fait échouer le typecheck :
  // si l'un des deux est signalé inutilisé, c'est l'union qu'il faut réparer,
  // pas le test qu'il faut retirer.
  describe('discrimination de l’union à la compilation', () => {
    it('devrait refuser type sur la branche ancre', () => {
      // `AnchorHTMLAttributes` porte un `type` (indice MIME) : sans l'`Omit`,
      // `type="submit"` passerait silencieusement sur un lien.
      // @ts-expect-error — `type` n'existe pas sur la branche ancre.
      const rejected = <Button href="/x" type="submit" />;

      expect(rejected).toBeTruthy();
    });

    it('devrait refuser disabled sur la branche ancre', () => {
      // @ts-expect-error — `disabled` n'existe pas sur un `<a>`.
      const rejected = <Button href="/x" disabled />;

      expect(rejected).toBeTruthy();
    });
  });
});
