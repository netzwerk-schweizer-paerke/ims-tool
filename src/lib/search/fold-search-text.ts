/**
 * One text under the accent fold, which is lower case and carries no accent.
 *
 * Both sides of a comparison pass through it, so `evaluation` finds `évaluation`. The fold keeps
 * the length of the source, so an offset into the result names the same character in the source.
 */
export const plainSearchText = (value: unknown): string =>
  typeof value === 'string' ? value.normalize('NFD').replaceAll(/\p{M}/gu, '').toLowerCase() : ''

/** The written form an upload uses, because a file name avoids an umlaut. */
const GERMAN_EXPANSION: Record<string, string> = { ä: 'ae', ö: 'oe', ß: 'ss', ü: 'ue' }

/**
 * The accent fold, with every umlaut written as the two letters an upload uses.
 *
 * A park stores `Stolperunfaelle` while a person types `Stolperunfälle`. This maps both to one
 * form, so the search finds the file either way.
 *
 * The map replaces one character with two, so it never joins two neighbours. A map of `ue` to `u`
 * would join them, and `Bauelement` would then stop matching `Element`.
 */
export const foldSearchText = (value: unknown): string =>
  typeof value === 'string'
    ? plainSearchText(value.toLowerCase().replaceAll(/[äöüß]/gu, (mark) => GERMAN_EXPANSION[mark]))
    : ''
