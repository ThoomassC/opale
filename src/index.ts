/**
 * `@thomascaron/ui` — the components.
 *
 * None of them holds state, calls a hook, or needs `"use client"`: they render
 * as Server Components in Next.js and cost a consumer's JavaScript budget
 * nothing. Every visual state — hover, active, focus, invalid, busy, disabled —
 * is carried by CSS, which is why `ui.css` has to be imported once per app:
 *
 *     import '@thomascaron/ui/tokens.css';
 *     import '@thomascaron/ui/ui.css';
 *
 * Three components decide something at render time, and none needs a client
 * boundary to do it. `ChipList` returns `null` on an empty list rather than
 * announcing a list with nothing in it. `Pill` falls back to its tone's name
 * when its children carry no readable label — the colour of its three tones is
 * measured indiscernible under deuteranopia, so the label is the real
 * safeguard — and reports the fault through `console.error`. `TimelineItem`
 * reports a heading written at a level other than the one it declares.
 *
 * NONE OF THEM THROWS, AND `Pill` USED TO. Its reasoning was that "both
 * consumers are prerendered, so the fault shows at build time"; that is false,
 * and verified false — `portfolio` runs `tsc -b && vite build`, with no
 * `react-dom/server` and no prerender plugin, its `main.tsx` is a bare
 * `createRoot`, and there is no `ErrorBoundary` anywhere in it. A `Pill`
 * without a label therefore unmounted the React root on load: a blank page for
 * every visitor, because of one badge. A library component may report a fault
 * loudly; it may not take the page down with it.
 *
 * The one thing that is *not* re-exported here is `cx`: it is a four-line
 * class joiner, and a shared library that exports its own helpers invites
 * consumers to depend on them.
 *
 * RELATIVE IMPORTS CARRY THE `.js` EXTENSION, and that is not optional. The
 * package ships as ESM built by `tsc`, which rewrites nothing: an extensionless
 * specifier fails to resolve under Node's ESM resolver and under webpack's
 * `fullySpecified` handling of `.mjs`/`type: module` graphs. The extension is
 * `.js` and not `.ts` because it names the EMITTED file.
 */

/*
 * Le nom accessible d'un GROUPE — `label` ou `aria-labelledby`, jamais les
 * deux. Exporté parce qu'il apparaît dans la signature publique de `ChipList`
 * et de `Timeline` : un consommateur qui écrit un composant enveloppant l'un
 * des deux doit pouvoir transmettre ce choix sans le retaper.
 */
export type { AccessibleNameProps } from './components/accessible-name.js';

export type { BackdropProps } from './components/backdrop.js';
export { Backdrop } from './components/backdrop.js';

export type {
  ButtonAsAnchorProps,
  ButtonAsButtonProps,
  ButtonProps,
  ButtonVariant,
} from './components/button.js';
export { Button } from './components/button.js';

export type {
  CardElevation,
  CardFlatProps,
  CardGlassProps,
  CardProps,
  CardVariant,
} from './components/card.js';
export { Card } from './components/card.js';

export type { CheckboxProps } from './components/checkbox.js';
export { Checkbox } from './components/checkbox.js';

export type { ChipListProps } from './components/chip-list.js';
export { ChipList } from './components/chip-list.js';

export type { DateMark, DateRangeProps } from './components/date-range.js';
export { DateRange } from './components/date-range.js';

export type { FieldControlProps, FieldProps } from './components/field.js';
export { Field } from './components/field.js';

export type {
  IconTileDecorProps,
  IconTileLinkProps,
  IconTileProps,
  IconTileTone,
} from './components/icon-tile.js';
export { IconTile } from './components/icon-tile.js';

export type { InputProps } from './components/input.js';
export { Input } from './components/input.js';

export type { MessageLive, MessageProps, MessageTone } from './components/message.js';
export { Message } from './components/message.js';

export type { PillProps, PillTone } from './components/pill.js';
export { Pill } from './components/pill.js';

export type { SectionHeadingLevel, SectionHeadingProps } from './components/section-heading.js';
export { SectionHeading } from './components/section-heading.js';

export type { SelectProps } from './components/select.js';
export { Select } from './components/select.js';

export type { TagProps, TagVariant } from './components/tag.js';
export { Tag } from './components/tag.js';

export type { TextareaProps } from './components/textarea.js';
export { Textarea } from './components/textarea.js';

export type {
  TimelineItemLevel,
  TimelineItemProps,
  TimelineProps,
} from './components/timeline.js';
export { Timeline, TimelineItem } from './components/timeline.js';
