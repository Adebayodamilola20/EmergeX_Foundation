/**
 * apply-edit.ts
 *
 * Pure text-replacement core behind the agent's edit_file tool.
 *
 * Kept free of I/O so the substitution rules can be tested directly. The
 * caller reads the file, applies the result, and writes it back.
 *
 * No dependencies.
 */

export interface ApplyEditOptions {
	/** Replace every occurrence instead of rejecting an ambiguous match. */
	replaceAll?: boolean;
}

export type ApplyEditFailure =
	| "empty-search"
	| "not-found"
	| "ambiguous"
	| "no-op";

export type ApplyEditResult =
	| { ok: true; content: string; replacements: number }
	| {
			ok: false;
			reason: ApplyEditFailure;
			occurrences: number;
			message: string;
	  };

/**
 * Count non-overlapping occurrences of `search` in `source`.
 *
 * Returns 0 for an empty needle rather than the infinite matches a naive
 * scan would report.
 */
export function countOccurrences(source: string, search: string): number {
	if (search === "") return 0;
	let count = 0;
	let from = 0;
	for (;;) {
		const index = source.indexOf(search, from);
		if (index === -1) return count;
		count++;
		from = index + search.length;
	}
}

/**
 * Replace `search` with `replacement`, treating both as literal text.
 *
 * String.prototype.replace assigns meaning to `$&`, `` $` ``, `$'`, `$$` and
 * `$<name>` inside the replacement, so passing source code through it can
 * substitute surrounding text into the output. This builds the result by
 * slicing instead, so the replacement is inserted exactly as given.
 *
 * @example
 * // String.replace: "ABCx = ABCyDEF"  (the $` injected the prefix)
 * // replaceLiteral: "ABCx = $`yDEF"
 * replaceLiteral("ABColdDEF", "old", "x = $`y", false)
 */
export function replaceLiteral(
	source: string,
	search: string,
	replacement: string,
	all: boolean,
): { content: string; replacements: number } {
	if (search === "") return { content: source, replacements: 0 };

	let result = "";
	let from = 0;
	let replacements = 0;

	for (;;) {
		const index = source.indexOf(search, from);
		if (index === -1) break;

		result += source.slice(from, index) + replacement;
		from = index + search.length;
		replacements++;

		if (!all) break;
	}

	result += source.slice(from);
	return { content: result, replacements };
}

/**
 * Apply a single find-and-replace edit to file content.
 *
 * Refuses rather than guessing when the intent is unclear:
 *
 * - an empty `oldText` has no insertion point
 * - text that does not appear cannot be edited
 * - text appearing more than once is ambiguous unless `replaceAll` is set,
 *   because silently taking the first match edits a line the caller may not
 *   have been looking at
 * - identical `oldText` and `newText` would report success having changed
 *   nothing
 */
export function applyEdit(
	content: string,
	oldText: string,
	newText: string,
	options: ApplyEditOptions = {},
): ApplyEditResult {
	const replaceAll = options.replaceAll ?? false;

	if (oldText === "") {
		return {
			ok: false,
			reason: "empty-search",
			occurrences: 0,
			message: "oldText is empty. Provide the exact text to replace.",
		};
	}

	if (oldText === newText) {
		return {
			ok: false,
			reason: "no-op",
			occurrences: countOccurrences(content, oldText),
			message:
				"oldText and newText are identical, so this edit would change nothing.",
		};
	}

	const occurrences = countOccurrences(content, oldText);

	if (occurrences === 0) {
		return {
			ok: false,
			reason: "not-found",
			occurrences: 0,
			message:
				"Could not find oldText in the file. It must match exactly, including whitespace and indentation. Read the file and copy the current text.",
		};
	}

	if (occurrences > 1 && !replaceAll) {
		return {
			ok: false,
			reason: "ambiguous",
			occurrences,
			message: `oldText matches ${occurrences} places in the file. Include surrounding lines so the match is unique, or set replaceAll to change all ${occurrences}.`,
		};
	}

	const { content: updated, replacements } = replaceLiteral(
		content,
		oldText,
		newText,
		replaceAll,
	);

	return { ok: true, content: updated, replacements };
}
