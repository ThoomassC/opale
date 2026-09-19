import { describe, expect, it } from 'vitest';

import { ruleBody } from '../test/css-rules';
import canopSource from '../magic/canop.css?raw';
import docSource from './doc-v3.css?raw';

describe('la forme interactive CanopUI', () => {
  it('épingle la palette saphir et la géométrie mesurée sur la référence', () => {
    const root = canopSource.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
    const darkRoot = ruleBody(canopSource, ":root[data-theme='dark']") ?? '';
    const button = ruleBody(canopSource, '.canop-button') ?? '';
    const small = ruleBody(canopSource, '.canop-button--small') ?? '';
    const large = ruleBody(canopSource, '.canop-button--large') ?? '';

    expect(root).toMatch(/--canop-primary:\s*#315c9e/);
    expect(root).toMatch(/--canop-primary-dark:\s*#23457a/);
    expect(root).toMatch(/--canop-primary-light:\s*#5f87c4/);
    expect(root).toMatch(/--canop-font-display:\s*'Chivo'/);
    expect(root).not.toMatch(/--canop-font-display:\s*'Titan One'/);
    expect(root).toMatch(/--canop-font-mono:\s*'Hack'/);
    expect(darkRoot).toMatch(/--canop-primary:\s*#5d87cb/);
    expect(darkRoot).toMatch(/--canop-primary-dark:\s*#739cda/);
    expect(root).toMatch(/--canop-secondary-dark:\s*#6a7455/);
    expect(root).toMatch(/--canop-accent:\s*#f4ad15/);
    expect(root).toMatch(/--canop-danger:\s*#b3261e/);
    expect(root).toMatch(/--canop-radius-md:\s*1\.375rem/);
    expect(root).toMatch(/--canop-squircle-clip:\s*polygon\(/);
    expect(root).toContain('0.0057');
    expect(root).toContain('0.7427');

    expect(button).toMatch(/min-height:\s*2\.75rem/);
    expect(button).toMatch(/padding:\s*0\.375rem\s+1\.25rem/);
    expect(button).toMatch(/font:\s*600\s+0\.875rem\/1\.75/);
    expect(button).toMatch(/border-radius:\s*0/);
    expect(small).toMatch(/min-height:\s*2\.25rem/);
    expect(large).toMatch(/min-height:\s*3rem/);
  });

  it('allège et réduit la typographie d’affichage', () => {
    const pageTitle = ruleBody(docSource, '.tc-doc-page__title') ?? '';
    const homeTitle = ruleBody(docSource, '.tc-doc-main--home .tc-doc-page__title') ?? '';

    expect(canopSource).not.toContain('family=Titan+One');
    expect(pageTitle).toMatch(/font:\s*400\s+clamp\(1\.8rem,\s*3vw,\s*2\.75rem\)/);
    expect(pageTitle).toMatch(/letter-spacing:\s*-0\.03em/);
    expect(homeTitle).toMatch(/font-size:\s*clamp\(1\.8rem,\s*3vw,\s*2\.75rem\)/);
    expect(homeTitle).toMatch(/font-weight:\s*400/);
    expect(ruleBody(docSource, '.tc-doc-home__stats dt') ?? '').toMatch(
      /font:\s*400\s+clamp\(1\.4rem,\s*2\.5vw,\s*2rem\)/,
    );
    expect(ruleBody(canopSource, '.canop-text--metric') ?? '').toMatch(/font-size:\s*2rem/);
  });

  it('dessine Button avec le polygone sur un calque qui ne rogne pas le focus', () => {
    const shape = canopSource.match(/\.canop-button::before\s*\{([\s\S]*?)\}/)?.[1] ?? '';

    expect(shape).toMatch(/clip-path:\s*var\(--canop-squircle-clip\)/);
    expect(shape).toMatch(/background:\s*var\(--canop-button-background\)/);
    expect(canopSource).toMatch(
      /\.canop-button:focus-visible,[\s\S]{0,240}outline:\s*3px\s+solid\s+var\(--canop-focus\)/,
    );
    expect(canopSource).toMatch(/outline-offset:\s*3px/);
  });

  it.each([
    '.tc-doc-topbar__tab::before',
    '.tc-doc-search::before',
    '.tc-doc-search__option::before',
    '.tc-doc-nav__link::before',
    '.tc-doc-home__action::before',
  ])('%s devrait réutiliser la même squircle', (selector) => {
    expect(ruleBody(docSource, selector) ?? '').toMatch(
      /clip-path:\s*var\(--canop-squircle-clip\)/,
    );
  });

  it('garde les actions de code, leur dévoilement animé et le filet anti-mouvement', () => {
    expect(ruleBody(docSource, '.tc-doc-codeexample__actions') ?? '').toMatch(
      /justify-content:\s*flex-end/,
    );
    expect(ruleBody(docSource, '.tc-doc-codeexample__reveal') ?? '').toMatch(
      /grid-template-rows:\s*0fr/,
    );
    expect(ruleBody(docSource, ".tc-doc-codeexample__reveal[data-open='true']") ?? '').toMatch(
      /grid-template-rows:\s*1fr/,
    );
    expect(docSource).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.tc-doc-codeexample__reveal/,
    );
  });

  it('rend le panneau de code minimal, sans rail gauche et avec une palette syntaxique', () => {
    const code = ruleBody(docSource, '.tc-doc-codeexample__reveal .tc-doc-code') ?? '';
    const theme = ruleBody(docSource, '.tc-doc-topbar__actions .tc-doc-themetoggle') ?? '';

    expect(code).toMatch(/border:\s*0\s*!important/);
    expect(code).toMatch(/border-inline-start:\s*0\s*!important/);
    expect(code).toMatch(/font-family:\s*var\(--canop-font-mono\)/);
    expect(ruleBody(docSource, '.tc-doc-token--string') ?? '').toMatch(
      /color:\s*var\(--tc-doc-code-string\)/,
    );
    expect(theme).toMatch(/background:\s*transparent\s*!important/);
  });

  it('garde la recherche nette au focus et renforce seulement les éléments sélectionnés', () => {
    const searchFocus = ruleBody(docSource, '.tc-doc-search:focus-within') ?? '';

    expect(docSource).toMatch(
      /\.tc-doc-search::after\s*\{[\s\S]*?z-index:\s*-1;[\s\S]*?background:\s*var\(--canop-surface\)/,
    );
    expect(searchFocus).toMatch(/box-shadow:\s*none\s*!important/);
    expect(docSource).toMatch(
      /\.tc-doc-nav__link\[aria-current='page'\]\s*\{\s*font-weight:\s*600/,
    );
    expect(docSource).toMatch(
      /\.tc-doc-topbar__tab\[aria-current='page'\]\s*\{\s*font-weight:\s*600/,
    );
    expect(docSource).toMatch(
      /\.tc-doc-search__option\[aria-selected='true'\]\s+\.tc-doc-search__label\s*\{\s*font-weight:\s*600/,
    );
  });
});
