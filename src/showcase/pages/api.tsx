import type { ReactNode } from 'react';

/* =============================================================================
   LES TROIS BRIQUES QUE TOUTE PAGE DE COMPOSANT RÉEMPLOIE.

   Un site de doc dit trois choses de chaque composant : ce qu'il rend (les
   spécimens, `Specimen`), comment on l'appelle (`UsageBlock`) et ce qu'il
   accepte (`PropsTable`). Les deux dernières sont ici pour que les seize pages
   les servent dans la MÊME forme — seize tableaux écrits à la main
   divergeraient à la troisième page.

   Aucune classe nouvelle : tout est habillé par des règles qui existent déjà
   dans `doc.css`. Le titre réemploie `tc-doc-specimen__title` parce que c'est
   exactement le niveau visuel voulu — un `<h2>` sous le `<h1>` de la page.
   ========================================================================== */

/** Le conteneur d'un corps de page : pile verticale, écart de la charte. */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="tc-doc-section__body">{children}</div>;
}

export interface PropRow {
  /** Le nom exact de la prop, tel qu'il est écrit dans le type. */
  readonly name: string;
  /** Le type, recopié du source — jamais reformulé. */
  readonly type: string;
  /** Requise : la colonne « Défaut » l'annonce alors en toutes lettres. */
  readonly required?: boolean;
  /** La valeur par défaut, si le composant en pose une. */
  readonly defaultValue?: string;
  readonly description: ReactNode;
}

export interface PropsTableProps {
  /** Préfixe des identifiants — le slug du composant suffit. */
  readonly id: string;
  /** Titre du bloc. Par défaut « L'interface ». */
  readonly title?: string;
  /** Une ligne d'introduction, quand la signature demande une explication. */
  readonly note?: ReactNode;
  readonly rows: readonly PropRow[];
}

/**
 * Le tableau des props.
 *
 * `tabIndex={0}` + `role="group"` sur l'enveloppe : le tableau défile
 * horizontalement sur écran étroit, et un conteneur à défilement doit être
 * atteignable au clavier (WCAG 2.1.1). C'est la même recette que les tableaux
 * de la page palette, et la règle `jsx-a11y` ne modélise pas ce cas.
 *
 * UN SEUL NOM ACCESSIBLE, ET IL EST SUR LE TABLEAU. La première écriture en
 * posait quatre à la file — un `<section aria-labelledby>` (donc un point de
 * repère « région : L'interface », identique sur dix-neuf pages), le `<h2>`,
 * le groupe défilant et la table — si bien qu'atteindre le tableau de props
 * faisait entendre « L'interface » quatre fois. L'enveloppe est donc un
 * `<div>` sans nom : le `<h2>` structure déjà le bloc et apparaît, lui, dans
 * le plan de titres. Le conteneur défilant garde une étiquette parce qu'un
 * arrêt de tabulation muet n'a pas de sens, mais elle dit ce qu'il EST plutôt
 * que de redire le titre.
 */
export function PropsTable({ id, title = 'L’interface', note, rows }: PropsTableProps) {
  const titleId = `${id}-api-title`;

  return (
    /* PAS DE `tc-doc-specimen` ICI, ET C'EST UN CHOIX DE REGISTRE. La carte du
       spécimen posait un liseré `--border-subtle` arrondi autour d'un
       `tc-doc-tablewrap` qui porte déjà le même : deux cadres concentriques de
       la même couleur à 24 px l'un de l'autre, sur vingt-deux pages. Et surtout
       l'API se déguisait en démonstration, alors qu'elle est d'un autre
       registre : le tableau EST son propre cadre. Les deux classes de titre et
       de note restent, elles ne portent que de la typographie. */
    <div>
      <h2 className="tc-doc-specimen__title" id={titleId}>
        {title}
      </h2>
      {note ? <p className="tc-doc-specimen__note">{note}</p> : null}
      <div
        className="tc-doc-tablewrap"
        tabIndex={0}
        role="group"
        aria-label="Tableau, défilement horizontal"
      >
        <table className="tc-doc-table" aria-labelledby={titleId}>
          <thead>
            <tr>
              <th scope="col">Prop</th>
              <th scope="col">Type</th>
              <th scope="col">Défaut</th>
              <th scope="col">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  <code>{row.name}</code>
                </th>
                <td>
                  <code>{row.type}</code>
                </td>
                <td>
                  {row.required ? (
                    'requise'
                  ) : row.defaultValue ? (
                    <code>{row.defaultValue}</code>
                  ) : (
                    /* Un tiret cadratin, et il est ANNONCÉ : une cellule vide
                       laisse le lecteur d'écran passer sans rien dire, ce qui
                       ne distingue pas « aucun défaut » d'un oubli.

                       DEUX ÉLÉMENTS ET NON UN `aria-label`, parce qu'un `<span>`
                       nu porte le rôle `generic`, dont `aria-label` est une
                       propriété PROHIBÉE par l'ARIA : le nom pouvait être
                       calculé puis ignoré, et les soixante et une cellules
                       concernées se lisaient « tiret cadratin » ou rien.

                       « aucun » et pas « aucun défaut » : l'en-tête de colonne
                       « Défaut » est déjà annoncé avec chaque cellule. */
                    <>
                      <span className="tc-visually-hidden">aucun</span>
                      <span aria-hidden="true">—</span>
                    </>
                  )}
                </td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface UsageBlockProps {
  /** Ce que le bloc montre, pour le nom accessible du conteneur défilant. */
  readonly label: string;
  readonly code: string;
}

/** Un bloc de code, atteignable au clavier parce qu'il défile. */
export function UsageBlock({ label, code }: UsageBlockProps) {
  return (
    <pre
      className="tc-doc-code"
      tabIndex={0}
      role="group"
      aria-label={`${label}, défilement horizontal`}
    >
      <code>{code}</code>
    </pre>
  );
}
