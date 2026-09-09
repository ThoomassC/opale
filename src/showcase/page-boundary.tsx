import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

/* =============================================================================
   LA FRONTIÈRE D'ERREUR DU CONTENU, ET ELLE A UNE HISTOIRE DANS CE DÉPÔT.

   L'en-tête de `src/index.ts` raconte le cas : un `Pill` sans libellé LEVAIT,
   au motif que « les deux consommateurs sont prérendus, donc la faute se voit
   au build ». C'était faux — le portfolio fait un `createRoot` nu, sans aucune
   frontière d'erreur — et une pastille fautive démontait la racine React :
   page blanche pour tout le monde. Le composant a été corrigé pour signaler
   sans lever.

   La vitrine reproduisait exactement le même pari : `page.render()` était
   appelé au beau milieu du rendu de la coquille, sans filet. Une page sur
   vingt-trois qui jette emportait la barre du haut, le sommaire et la bascule
   de thème avec elle — alors que la coquille, elle, est saine, et que le
   sommaire est précisément ce qui permet d'aller voir ailleurs.

   La frontière n'enveloppe donc QUE le contenu de la page. Elle ne prétend
   rien réparer : elle nomme la page fautive, garde le site navigable, et
   laisse l'erreur dans la console pour qu'elle se corrige.

   Une CLASSE parce qu'il n'y a pas d'autre façon : `componentDidCatch` n'a
   aucun équivalent en hook, et le dépôt n'ajoute pas une dépendance pour
   trente lignes.
   ========================================================================== */

export interface PageBoundaryProps {
  /**
   * Le slug de la page rendue. Sert de CLÉ DE REMISE À ZÉRO : sans lui, une
   * page qui a jeté laisserait la frontière en état d'erreur pour toutes les
   * suivantes, et le site paraîtrait cassé après un seul incident.
   */
  readonly resetKey: string;
  readonly children: ReactNode;
}

interface PageBoundaryState {
  readonly failed: boolean;
  readonly message: string;
}

const CLEAR: PageBoundaryState = { failed: false, message: '' };

export class PageBoundary extends Component<PageBoundaryProps, PageBoundaryState> {
  state: PageBoundaryState = CLEAR;

  static getDerivedStateFromError(error: unknown): PageBoundaryState {
    return { failed: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidUpdate(previous: PageBoundaryProps): void {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState(CLEAR);
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    /* La console et non un rapport silencieux : la vitrine est un outil de
       développement, et cette trace est le seul endroit où la pile survit. */
    console.error(
      `[vitrine] la page « ${this.props.resetKey || 'accueil'} » a jeté pendant son rendu.`,
      error,
      info.componentStack,
    );
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="tc-doc-section__body">
        {/* `role="alert"` ici, et pas la région polie de la coquille : la page
            demandée n'est pas à l'écran, c'est le seul cas de cette vitrine
            qui mérite de couper la parole. */}
        <p className="tc-doc-prose" role="alert">
          <strong>Cette page a échoué pendant son rendu.</strong> Le sommaire reste utilisable —
          choisissez une autre page. Le message est&nbsp;: <code>{this.state.message}</code>
        </p>
        <p className="tc-doc-prose tc-doc-aside">
          La pile complète est dans la console. Le reste du site n’est pas en cause : la coquille et
          le sommaire sont rendus hors de cette frontière.
        </p>
      </div>
    );
  }
}
