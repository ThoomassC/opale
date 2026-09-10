import type { ReactElement, ReactNode } from 'react';

import { Backdrop } from '../../../components/backdrop';
import { Button } from '../../../components/button';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { DARK_PLATE, LIGHT_PLATE } from '../../palette-data';
import type { Plate } from '../../palette-data';
import { Specimen } from '../../section';
import { PageBody, UsageBlock } from '../api';

/* =============================================================================
   LE BOUTON BULLE, ET LE FOND QU'IL LUI FAUT.

   Une bulle ne se voit que sur un fond qui a de la matière. Sur un aplat uni,
   la réfraction ne déplace que des pixels identiques : le rendu est
   rigoureusement le même qu'avec le filtre éteint, et un spécimen posé sur
   `--surface` — le fond de tous les spécimens du site — ne montrerait donc
   RIEN. C'est la raison d'être de cette page, et c'est pour la même raison
   qu'elle vit dans « Compositions » et non sur la page de `Button` : ce qu'on y
   juge n'est pas le bouton, c'est le bouton PLUS son fond.

   TROIS FONDS, ET AUCUN N'EST DÉCORATIF :
   — le décor de la librairie (`Backdrop`), c'est-à-dire le cas réel d'un
     consommateur : six halos, donc un dégradé franc juste derrière la boîte ;
   — un damier chargé de texte gras, en thème CLAIR ;
   — le même en thème SOMBRE.

   LES DEUX DAMIERS SONT EN STYLE EN LIGNE, avec les littéraux des plaques de
   `palette-data.ts`. Même dérogation, et même raison, que les plaques de la
   page palette : un fond qui documente un thème ne doit pas suivre celui du
   lecteur, sans quoi la moitié de la démonstration disparaît selon la bascule
   du haut. Les valeurs ne sont pas recopiées à la main ici — elles viennent des
   plaques, que `palette-data.test.ts` rejoue contre les jetons résolus.
   ========================================================================== */

const USAGE = `import { Button, GlassLens } from '@thomascaron/opale';
import '@thomascaron/opale/lens.css';

// Le verre liquide se pose AU-DESSUS d'un contenu, jamais dedans : ce n'est pas
// un bouton de formulaire. Sans <GlassLens />, le bouton reste correct — son
// fond n'est simplement pas déformé.
<>
  <GlassLens />
  <Button variant="bubble" onClick={zoomIn}>Zoom</Button>
</>`;

/** Le côté d'une case du damier, en pixels. Deux cases par période. */
const CHECKER_CELL_PX = 20;

interface StateCell {
  /** La légende de la figure — l'état, pas le libellé du bouton. */
  readonly label: string;
  readonly text: string;
  /**
   * Le survol et l'appui sont FORCÉS par une classe : on ne peut pas demander
   * au lecteur de maintenir la souris sur quatre boutons à la fois. Ces deux
   * classes sont déclarées PAR VARIANTE dans `doc.css`, comme pour les trois
   * autres variantes de `Button`.
   */
  readonly className?: string;
  readonly inert?: true;
}

const STATE_CELLS: readonly StateCell[] = [
  { label: 'repos', text: 'Zoom' },
  { label: 'survol', text: 'Zoom', className: 'tc-doc-state--hover' },
  { label: 'appui', text: 'Zoom', className: 'tc-doc-state--active' },
  { label: 'aria-disabled', text: 'Zoom', inert: true },
];

/**
 * Un fond de démonstration : damier de 20 px, texte gras, encres de la plaque.
 *
 * Une fonction et non un composant local : une page de doc n'exporte que sa
 * constante `DocPage`, et un composant défini ici sans être exporté ferait
 * perdre le rafraîchissement à chaud du module entier.
 *
 * Le damier est peint en `background-image` translucide PAR-DESSUS le sol de la
 * plaque : le filet `--rule` est un lavis, il se compose donc sur le sol et
 * donne la seconde case sans qu'aucune couleur soit inventée ici.
 */
function renderGround(plate: Plate, children: ReactNode): ReactElement {
  return (
    <div
      /* `--darkmaterial` SUR LA PLAQUE SOMBRE, et sans elle ce spécimen ment :
         les blocs de thème du dépôt sont portés par `:root`, donc une plaque
         qui peint un sol sombre avec des littéraux garde les jetons du thème
         du DOCUMENT. La plaque sombre montrait un voile blanc sous une encre
         sombre, c'est-à-dire le matériau clair. La classe rebascule les deux
         jetons concernés ; sa liste et ses valeurs sont dans `doc.css`. */
      className={
        plate.theme === 'dark' ? 'tc-doc-plate tc-doc-plate--darkmaterial' : 'tc-doc-plate'
      }
      key={plate.id}
      style={{
        backgroundColor: plate.ground,
        backgroundImage: `repeating-conic-gradient(${plate.rule} 0% 25%, transparent 0% 50%)`,
        backgroundSize: `${CHECKER_CELL_PX * 2}px ${CHECKER_CELL_PX * 2}px`,
        borderColor: plate.rule,
        color: plate.ink,
      }}
    >
      <div className="tc-doc-plate__head" style={{ borderColor: plate.rule }}>
        {/* Un `<h3>` : le spécimen qui contient ce fond porte déjà le `<h2>`,
            et la coquille le `<h1>`. La classe, elle, reste celle du titre de
            plaque — c'est le niveau VISUEL voulu. */}
        <h3 className="tc-doc-plate__title">{plate.title}</h3>
        <p className="tc-doc-plate__ground" style={{ color: plate.inkMuted }}>
          {plate.groundLabel} · damier de {CHECKER_CELL_PX} px
        </p>
      </div>

      {children}
    </div>
  );
}

/** Les deux libellés côte à côte, dans une coulée de texte gras. */
function renderLabels(): ReactElement {
  return (
    <div className="tc-doc-plate__group">
      {/* Les boutons sont DANS le paragraphe et non à côté : le filtre
          échantillonne au-delà des bords de la boîte avant de découper, donc
          ce qui compte est ce qui passe derrière ET à côté. Un `<button>` est
          du contenu de phrase, il est à sa place ici. */}
      <p className="tc-doc-cardtext">
        <strong>
          Le texte gras est le fond, pas un remplissage : c’est lui, avec le damier, que le filtre
          échantillonne.
        </strong>{' '}
        <Button variant="bubble">Zoom</Button>{' '}
        <strong>
          Un libellé court, puis un libellé long — la carte de déplacement s’étire sur la boîte, si
          bien que les deux ne se réfractent pas de la même façon.
        </strong>{' '}
        <Button variant="bubble">Agrandir la carte de l’étape</Button>
      </p>
    </div>
  );
}

/** Les quatre états figés, en figures légendées. */
function renderStates(plate: Plate): ReactElement {
  return (
    <div className="tc-doc-plate__group">
      {/* `<figure>` / `<figcaption>` plutôt qu'un `<span>` frère : quatre
          boutons nommés « Zoom » sont indiscernables dans une liste de
          contrôles, et un `<span>` posé à côté n'est relié à rien. La légende
          d'une figure, elle, nomme la figure. */}
      <div className="tc-doc-states">
        {STATE_CELLS.map((cell) => (
          <figure className="tc-doc-states__cell" key={cell.label}>
            <Button variant="bubble" className={cell.className} aria-disabled={cell.inert}>
              {cell.text}
            </Button>
            {/* L'encre de la légende vient de la PLAQUE et non du thème de la
                page : `tc-doc-states__label` pose `--text-muted`, qui serait
                l'encre du thème du lecteur sur un sol qui, lui, ne l'est
                pas. */}
            <figcaption className="tc-doc-states__label" style={{ color: plate.inkMuted }}>
              {cell.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Le bouton bulle et un secondaire, pour comparer les deux anneaux de focus. */
function renderFocusPair(): ReactElement {
  return (
    <div className="tc-doc-plate__group">
      <div className="tc-doc-specimen__stage tc-doc-specimen__stage--inline">
        <Button variant="bubble">Zoom</Button>
        <Button variant="secondary">Annuler</Button>
      </div>
    </div>
  );
}

const GROUNDS: readonly Plate[] = [LIGHT_PLATE, DARK_PLATE];

export const boutonBullePage: DocPage = {
  slug: 'compositions/bouton-bulle',
  label: 'Bouton bulle',
  group: 'compositions',
  title: 'Le bouton bulle, et le fond qu’il lui faut',
  lede: (
    <>
      Une bulle ne se voit que sur un fond qui a de la matière : sur un aplat uni, la réfraction ne
      déplace que des pixels identiques et le filtre ne se constate pas. Cette page pose donc{' '}
      <code>variant=&quot;bubble&quot;</code> au-dessus du décor de la librairie, puis d’un damier
      chargé de texte gras, dans les deux thèmes à la fois.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel du bouton bulle" code={USAGE} />

      <Specimen
        title="Au-dessus du décor de la librairie — le cas réel"
        note="Six halos derrière la boîte, donc un dégradé franc : c’est ce qu’un consommateur a sous les yeux, et c’est le seul fond de cette page qui suive le thème du lecteur."
      >
        <Backdrop className="tc-doc-scene">
          <div className="tc-doc-scene__stack">
            <p className="tc-doc-cardtext">
              <strong>
                Le verre liquide se pose au-dessus d’un contenu, jamais dedans : c’est une couche de
                navigation, pas un bouton de formulaire.
              </strong>{' '}
              <Button variant="bubble">Zoom</Button>{' '}
              <strong>
                Le même bouton, avec un libellé long, pour voir la déformation s’étirer avec la
                boîte.
              </strong>{' '}
              <Button variant="bubble">Agrandir la carte de l’étape</Button>
            </p>
          </div>
        </Backdrop>
      </Specimen>

      <Specimen
        title="Les quatre états figés, sur fond clair ET sur fond sombre"
        note="Les deux damiers sont rendus avec les hexadécimaux littéraux de leur thème : ils ne suivent donc pas la bascule du haut, sans quoi la moitié de la démonstration disparaîtrait à chaque changement de thème."
      >
        <div className="tc-doc-plates">
          {/* Un fragment et non un tableau : les deux blocs sont alors des
              FRÈRES dans le DOM, ce dont dépend la gouttière que `doc.css`
              pose par `.tc-doc-plate__group + .tc-doc-plate__group`. */}
          {GROUNDS.map((plate) =>
            renderGround(
              plate,
              <>
                {renderLabels()}
                {renderStates(plate)}
              </>,
            ),
          )}
        </div>
      </Specimen>

      <Specimen
        title="Le focus visible — tabulez dans les deux cadres"
        note="Le double anneau ne se force pas par une classe : il n’existe que sous un vrai focus clavier. Le bouton bulle est suivi d’un secondaire, parce que c’est l’écart entre les deux anneaux qui se juge, pas l’anneau seul."
      >
        <div className="tc-doc-plates">
          {GROUNDS.map((plate) => renderGround(plate, renderFocusPair()))}
        </div>
      </Specimen>

      <Specimen
        title="Ce qui est mesuré, et ce qui ne l’est pas"
        note="Quatre faits, et aucun n’est une estimation : ils viennent de la mesure qui a fixé la variante."
      >
        <ul className="tc-doc-checklist">
          <li>
            <strong>Le voile est à alpha 0,32 et le flou à 8 px</strong>, le couple le plus
            transparent qui garde le libellé à 4,5:1 sans rien supposer du fond : mesuré sur les
            pixels composités au-dessus d’un damier 20 px noir/blanc chargé de texte gras, 5,39:1 en
            thème clair et 4,60:1 en sombre — les pires relevés, la phase du damier déplaçant le
            pixel le plus défavorable d’environ 0,2 point. Le flou est un jeton — à 0 la réfraction
            est pleine et le libellé tient 9,82:1 sur un fond réaliste, 2,87:1 sur ce damier.
          </li>
          <li>
            <strong>Les deux damiers ne rebasculent pas tout.</strong> <code>--glass-specular</code>{' '}
            et <code>--glass-highlight</code> sont des dégradés littéraux et non des jetons : sur la
            plaque sombre, le reflet et le liseré spéculaire restent ceux du thème clair, donc plus
            lumineux que la réalité.
          </li>
          <li>
            <strong>La déformation n’a été vérifiée que sur Chromium 151.</strong> Safari et Firefox
            ne le sont pas, et <code>@supports</code> ne permet pas de trancher : il répond vrai
            dans les trois moteurs.
          </li>
          <li>
            <strong>Un filtre absent est inerte, mesuré</strong> (Chromium 151) : le fond n’est pas
            déformé, le bouton ne disparaît pas, et le flou s’applique quand même. Le rendu sans
            déformation est donc le rendu de base, pas un mode dégradé.
          </li>
        </ul>
      </Specimen>

      <p className="tc-doc-prose">
        Le filtre lui-même, et l’endroit où le monter, sont sur{' '}
        <a className="tc-doc-link" href={hrefFor('composants/glass-lens')}>
          la page de GlassLens
        </a>{' '}
        ; l’interface du bouton est sur{' '}
        <a className="tc-doc-link" href={hrefFor('composants/button')}>
          la page de Button
        </a>
        .
      </p>
    </PageBody>
  ),
};
