/**
 * search-content.ts
 *
 * Content search across a directory tree, for the agent's search_content tool.
 *
 * Deliberately does not shell out to grep or ripgrep: those are not guaranteed
 * to be installed, differ in flags between platforms, return unstructured text,
 * and produce unbounded output that can exhaust the model's context.
 *
 * The matching half is pure so it can be tested without fixtures. The walking
 * half does the I/O.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/** Directories never worth searching, skipped before any file is opened. */
export const DEFAULT_SKIP_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	".next",
	"coverage",
	".emergex",
	".turbo",
	".cache",
]);

/** Files above this size are treated as data, not source. */
const MAX_FILE_BYTES = 1_000_000;

/** Longest line returned verbatim; beyond this the line is clipped. */
const MAX_LINE_CHARS = 400;

export interface SearchOptions {
	/** Literal text, or a regular expression when `regex` is true. */
	pattern: string;
	regex?: boolean;
	caseSensitive?: boolean;
	/** Only search files whose relative path ends with one of these suffixes. */
	extensions?: string[];
	/** Stop after this many matches. Default 100. */
	maxResults?: number;
	/** Lines of surrounding context to include. Default 0. */
	contextLines?: number;
}

export interface SearchMatch {
	file: string;
	line: number;
	column: number;
	text: string;
	before: string[];
	after: string[];
}

export interface SearchResult {
	matches: SearchMatch[];
	filesSearched: number;
	/** True when the result was cut short at maxResults. */
	truncated: boolean;
}

/** Escape a string so it matches literally inside a RegExp. */
export function escapeRegExp(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build the matcher for a search.
 *
 * Throws a readable error for an invalid regular expression so the caller can
 * surface it rather than crashing mid-walk.
 */
export function buildMatcher(options: SearchOptions): RegExp {
	const source = options.regex
		? options.pattern
		: escapeRegExp(options.pattern);
	const flags = options.caseSensitive ? "g" : "gi";
	try {
		return new RegExp(source, flags);
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		// The engine's own message already carries this prefix; do not double it.
		throw new Error(
			reason.startsWith("Invalid regular expression")
				? reason
				: `Invalid regular expression: ${reason}`,
		);
	}
}

/** Clip a long line so one minified file cannot flood the output. */
function clip(line: string): string {
	return line.length > MAX_LINE_CHARS
		? `${line.slice(0, MAX_LINE_CHARS)}...`
		: line;
}

/**
 * Find matching lines in already-loaded text.
 *
 * Reports at most one match per line, since the line is the useful unit for a
 * reader, and returns 1-indexed line and column numbers to match editor and
 * grep conventions.
 */
export function searchText(
	content: string,
	matcher: RegExp,
	contextLines = 0,
): Omit<SearchMatch, "file">[] {
	const lines = content.split("\n");
	const results: Omit<SearchMatch, "file">[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		matcher.lastIndex = 0;
		const hit = matcher.exec(line);
		if (!hit) continue;

		results.push({
			line: i + 1,
			column: hit.index + 1,
			text: clip(line),
			before:
				contextLines > 0
					? lines.slice(Math.max(0, i - contextLines), i).map(clip)
					: [],
			after:
				contextLines > 0
					? lines.slice(i + 1, i + 1 + contextLines).map(clip)
					: [],
		});
	}

	return results;
}

/** Treat a NUL byte in the leading bytes as the signal for a binary file. */
export function looksBinary(buffer: Buffer): boolean {
	return buffer.subarray(0, 1024).includes(0);
}

/** Walk `root` depth-first, yielding files in a stable alphabetical order. */
function* walk(root: string, relative = ""): Generator<string> {
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(path.join(root, relative), {
			withFileTypes: true,
		});
	} catch {
		return; // unreadable directory, skip rather than abort the whole search
	}

	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		if (entry.name.startsWith(".") && entry.name !== ".github") continue;
		const next = relative ? path.join(relative, entry.name) : entry.name;

		if (entry.isDirectory()) {
			if (DEFAULT_SKIP_DIRS.has(entry.name)) continue;
			yield* walk(root, next);
		} else if (entry.isFile()) {
			yield next;
		}
	}
}

/** Search every text file under `root`, stopping once maxResults is reached. */
export function searchContent(
	root: string,
	options: SearchOptions,
): SearchResult {
	const matcher = buildMatcher(options);
	const maxResults = options.maxResults ?? 100;
	const contextLines = options.contextLines ?? 0;
	const extensions = options.extensions?.filter(Boolean) ?? [];

	const matches: SearchMatch[] = [];
	let filesSearched = 0;

	for (const relativePath of walk(root)) {
		if (matches.length >= maxResults) {
			return { matches, filesSearched, truncated: true };
		}

		if (
			extensions.length > 0 &&
			!extensions.some((ext) => relativePath.endsWith(ext))
		) {
			continue;
		}

		const absolute = path.join(root, relativePath);
		let buffer: Buffer;
		try {
			if (fs.statSync(absolute).size > MAX_FILE_BYTES) continue;
			buffer = fs.readFileSync(absolute);
		} catch {
			continue; // vanished or unreadable between walk and read
		}

		if (looksBinary(buffer)) continue;
		filesSearched++;

		for (const hit of searchText(
			buffer.toString("utf-8"),
			matcher,
			contextLines,
		)) {
			if (matches.length >= maxResults) {
				return { matches, filesSearched, truncated: true };
			}
			matches.push({ file: relativePath, ...hit });
		}
	}

	return { matches, filesSearched, truncated: false };
}
