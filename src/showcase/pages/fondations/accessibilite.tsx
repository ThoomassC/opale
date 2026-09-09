import { Button } from '../../../components/button';
import { Field } from '../../../components/field';
import { Input } from '../../../components/input';
import { Pill } from '../../../components/pill';
import { Tag } from '../../../components/tag';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody } from '../api';

export const accessibilitePage: DocPage = {
  slug: 'accessibilite',
  label: 'Accessibilité',
  group: 'fondations',
  title: 'Le contrat d’accessibilité',
  lede: (
    <>
      Trois engagements, vérifiables sur cette page : le focus se voit sur n’importe quel fond, la
      couleur n’est jamais le seul porteur de sens, et rien de cliquable ne descend sous la taille
      du doigt.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen
        title="Le double anneau de focus"
        note="Tabulez dans le cadre : --focus-inner et --focus-outer s’inversent entre les thèmes, si bien que l’un des deux contraste toujours avec le fond local — y compris l’aplat teal, où un anneau unique disparaîtrait."
      >
        <div className="tc-doc-focusdemo">
          <Button variant="primary">Bouton primaire</Button>
          <Button variant="secondary">Bouton secondaire</Button>
          <Button variant="danger">Supprimer l’étape</Button>
          <a className="tc-doc-link" href={hrefFor('palette')}>
            Un lien vers la palette
          </a>
          <Field id="demo-focus" label="Un champ">
            {(control) => <Input {...control} placeholder="Tabulez jusqu’ici" />}
          </Field>
        </div>
        {/* Même raison que le tableau de la page palette : un bloc de code qui
            défile doit être atteignable au clavier (WCAG 2.1.1), et la liste
            blanche par défaut de la règle jsx-a11y ne modélise pas ce cas. */}
        <pre
          className="tc-doc-code"
          tabIndex={0}
          role="group"
          aria-label="Recette CSS du double anneau de focus, défilement horizontal"
        >
          <code>{`outline: 3px solid var(--focus-outer);
outline-offset: 2px;
box-shadow:
  0 0 0 2px var(--focus-inner),
  0 0 0 5px var(--focus-outer);`}</code>
        </pre>
        <p className="tc-doc-prose tc-doc-aside">
          L’<code>outline</code> porte l’anneau <strong>extérieur</strong> parce qu’il est peint
          au-dessus du <code>box-shadow</code> : l’intérieur ne contraste avec rien d’autre que
          l’aplat teal — 1,08:1 sur la carte, 1,16:1 sur le sol.
        </p>
      </Specimen>

      <Specimen
        title="La couleur n’est qu’un renfort"
        note="Les trois pastilles d’avancement tombent à 1,16:1 l’une contre l’autre en simulation deutéranope : ce qui les sépare est le glyphe et le libellé, jamais la teinte."
      >
        <div className="tc-doc-greyrow">
          <div className="tc-doc-greyrow__panel">
            <p className="tc-doc-greyrow__caption">En couleur</p>
            <div className="tc-doc-specimen__stage tc-doc-specimen__stage--inline">
              <Pill tone="done">Acquis</Pill>
              <Pill tone="progress">En cours</Pill>
              <Pill tone="upcoming">À venir</Pill>
              <Tag variant="measured">Mesuré</Tag>
              <Tag variant="proposed">Proposé</Tag>
              <Tag variant="open">Ouvert</Tag>
            </div>
          </div>
          <div className="tc-doc-greyrow__panel tc-doc-greyrow__panel--grey">
            <p className="tc-doc-greyrow__caption">En niveaux de gris</p>
            {/* La démonstration est purement visuelle : la scène redit mot pour
                mot les six libellés du panneau de gauche. `aria-hidden` évite
                de les faire entendre deux fois ; la légende, elle, reste. */}
            <div
              className="tc-doc-specimen__stage tc-doc-specimen__stage--inline"
              aria-hidden="true"
            >
              <Pill tone="done">Acquis</Pill>
              <Pill tone="progress">En cours</Pill>
              <Pill tone="upcoming">À venir</Pill>
              <Tag variant="measured">Mesuré</Tag>
              <Tag variant="proposed">Proposé</Tag>
              <Tag variant="open">Ouvert</Tag>
            </div>
          </div>
        </div>
      </Specimen>

      <Specimen title="Les cibles : 44 et 48 px">
        <div className="tc-doc-targets">
          <figure className="tc-doc-target">
            <div className="tc-doc-target__box tc-doc-target__box--min" aria-hidden="true">
              44 px
            </div>
            <figcaption className="tc-doc-target__caption">
              <code className="tc-doc-scale__token">--target-min</code>
              <span className="tc-doc-scale__usage">
                Champ, ligne de case à cocher, entrée de menu.
              </span>
            </figcaption>
          </figure>
          <figure className="tc-doc-target">
            <div className="tc-doc-target__box tc-doc-target__box--button" aria-hidden="true">
              48 px
            </div>
            <figcaption className="tc-doc-target__caption">
              <code className="tc-doc-scale__token">--target-button</code>
              <span className="tc-doc-scale__usage">
                Bouton — un plancher, pas une hauteur fixe.
              </span>
            </figcaption>
          </figure>
        </div>
      </Specimen>

      <Specimen title="Ce que la librairie promet, en clair">
        <ul className="tc-doc-checklist">
          <li>
            Sémantique native d’abord : <code>&lt;button&gt;</code>, <code>&lt;a href&gt;</code>,{' '}
            <code>&lt;label for&gt;</code>. ARIA ne vient qu’après.
          </li>
          <li>
            Aucun état visuel porté par du JavaScript : survol, appui, focus, erreur et attente sont
            des sélecteurs CSS.
          </li>
          <li>
            <code>prefers-reduced-motion</code> restreint les propriétés animables aux couleurs et
            garde les 160 ms — on ne coupe pas la transition.
          </li>
          <li>
            Zéro requête hors origine : pas de police distante, pas de <code>@font-face</code>, pas
            même un <code>preconnect</code>.
          </li>
        </ul>
      </Specimen>
    </PageBody>
  ),
};
