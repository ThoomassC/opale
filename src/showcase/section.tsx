import type { ReactNode } from 'react';

export interface SectionProps {
  id: string;
  /** Numéro de section, affiché en filet cuivre. */
  index: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}

/** Une section de la charte : numéro, titre, chapeau, contenu. */
export function Section({ id, index, title, lede, children }: SectionProps) {
  return (
    <section className="tc-doc-section" id={id} aria-labelledby={`${id}-title`}>
      <header className="tc-doc-section__head">
        <p className="tc-doc-section__index" aria-hidden="true">
          {index}
        </p>
        <h2 className="tc-doc-section__title" id={`${id}-title`}>
          {title}
        </h2>
        {lede ? <p className="tc-doc-prose tc-doc-section__lede">{lede}</p> : null}
      </header>
      <div className="tc-doc-section__body">{children}</div>
    </section>
  );
}

export interface SpecimenProps {
  title: string;
  note?: ReactNode;
  /** Dispose les enfants en ligne fluide plutôt qu'en pile. */
  inline?: boolean;
  children: ReactNode;
}

/**
 * Cadre d'un spécimen : un titre, une note, une scène.
 *
 * UN `<div>` ET NON UN `<article>`, et ce n'était pas un détail : un spécimen
 * n'est pas un contenu distribuable indépendamment, et `role="article"` sans
 * nom accessible se présentait cinq fois par page comme « article » dans les
 * rotors — cinquante-neuf fois sur le site. Le `<h2>` structure déjà le
 * spécimen, et lui apparaît dans le plan de titres.
 *
 * Le titre est un `<h2>` : la coquille de documentation rend le `<h1>` de la
 * page, si bien qu'un spécimen se pose juste sous lui — et les titres à
 * l'intérieur d'un spécimen commencent donc à `<h3>`. La classe reste
 * `tc-doc-specimen__title` : c'est le niveau VISUEL voulu, indépendamment du
 * niveau de titre.
 */
export function Specimen({ title, note, inline = false, children }: SpecimenProps) {
  return (
    <div className="tc-doc-specimen">
      <h2 className="tc-doc-specimen__title">{title}</h2>
      {note ? <p className="tc-doc-specimen__note">{note}</p> : null}
      <div
        className={
          inline
            ? 'tc-doc-specimen__stage tc-doc-specimen__stage--inline'
            : 'tc-doc-specimen__stage'
        }
      >
        {children}
      </div>
    </div>
  );
}
