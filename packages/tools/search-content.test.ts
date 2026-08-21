import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	buildMatcher,
	escapeRegExp,
	looksBinary,
	searchContent,
	searchText,
} from "./search-content";

describe("escapeRegExp", () => {
	test("neutralises regex metacharacters", () => {
		expect(new RegExp(escapeRegExp("a.b")).test("a.b")).toBe(true);
		expect(new RegExp(escapeRegExp("a.b")).test("axb")).toBe(false);
	});

	test("survives a pattern that is entirely metacharacters", () => {
		const pattern = "$^.*+?()[]{}|\\";
		expect(new RegExp(escapeRegExp(pattern)).test(pattern)).toBe(true);
	});
});

describe("buildMatcher", () => {
	test("treats the pattern literally unless regex is set", () => {
		expect(buildMatcher({ pattern: "a.c" }).test("abc")).toBe(false);
		expect(buildMatcher({ pattern: "a.c", regex: true }).test("abc")).toBe(
			true,
		);
	});

	test("is case-insensitive by default and honours caseSensitive", () => {
		expect(buildMatcher({ pattern: "todo" }).test("TODO")).toBe(true);
		expect(
			buildMatcher({ pattern: "todo", caseSensitive: true }).test("TODO"),
		).toBe(false);
	});

	test("reports an invalid regular expression instead of throwing raw", () => {
		expect(() => buildMatcher({ pattern: "a(", regex: true })).toThrow(
			/Invalid regular expression/,
		);
	});
});

describe("searchText", () => {
	const content = "alpha\nbeta\ngamma\nbeta again\n";

	test("returns 1-indexed line and column numbers", () => {
		const hits = searchText(content, buildMatcher({ pattern: "beta" }));
		expect(hits.map((h) => h.line)).toEqual([2, 4]);
		expect(hits[0]?.column).toBe(1);
	});

	test("reports the column of the match within the line", () => {
		const hits = searchText("xxbeta", buildMatcher({ pattern: "beta" }));
		expect(hits[0]?.column).toBe(3);
	});

	test("reports one match per line even when the line matches twice", () => {
		const hits = searchText(
			"beta beta beta",
			buildMatcher({ pattern: "beta" }),
		);
		expect(hits).toHaveLength(1);
	});

	test("returns no context lines by default", () => {
		const hits = searchText(content, buildMatcher({ pattern: "gamma" }));
		expect(hits[0]?.before).toEqual([]);
		expect(hits[0]?.after).toEqual([]);
	});

	test("includes surrounding lines when contextLines is set", () => {
		const hits = searchText(content, buildMatcher({ pattern: "gamma" }), 1);
		expect(hits[0]?.before).toEqual(["beta"]);
		expect(hits[0]?.after).toEqual(["beta again"]);
	});

	test("clamps context at the start and end of the file", () => {
		const hits = searchText(content, buildMatcher({ pattern: "alpha" }), 5);
		expect(hits[0]?.before).toEqual([]);
		expect(hits[0]?.after).toEqual(["beta", "gamma", "beta again", ""]);
	});

	test("clips a very long line instead of returning all of it", () => {
		const hits = searchText(
			`${"x".repeat(5000)}needle`,
			buildMatcher({ pattern: "needle" }),
		);
		expect(hits[0]?.text.length).toBeLessThan(500);
		expect(hits[0]?.text.endsWith("...")).toBe(true);
	});

	test("finds nothing in empty content", () => {
		expect(searchText("", buildMatcher({ pattern: "x" }))).toEqual([]);
	});

	test("is not affected by lastIndex carried between lines", () => {
		// A global regex reused across lines would skip matches if lastIndex
		// were not reset, so every line here must be reported.
		const hits = searchText("hit\nhit\nhit", buildMatcher({ pattern: "hit" }));
		expect(hits.map((h) => h.line)).toEqual([1, 2, 3]);
	});
});

describe("looksBinary", () => {
	test("detects a NUL byte", () => {
		expect(looksBinary(Buffer.from([0x61, 0x00, 0x62]))).toBe(true);
	});

	test("accepts plain text and UTF-8", () => {
		expect(looksBinary(Buffer.from("hello world"))).toBe(false);
		expect(looksBinary(Buffer.from("héllo → 世界"))).toBe(false);
	});
});

describe("searchContent", () => {
	let root: string;

	beforeAll(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "search-content-"));
		fs.mkdirSync(path.join(root, "src"));
		fs.mkdirSync(path.join(root, "node_modules"));
		fs.mkdirSync(path.join(root, ".git"));

		fs.writeFileSync(
			path.join(root, "src", "a.ts"),
			"const needle = 1;\nconst other = 2;\n",
		);
		fs.writeFileSync(path.join(root, "src", "b.js"), "// needle here\n");
		fs.writeFileSync(path.join(root, "readme.md"), "no match in here\n");
		fs.writeFileSync(
			path.join(root, "node_modules", "dep.ts"),
			"needle in a dependency\n",
		);
		fs.writeFileSync(path.join(root, ".git", "config"), "needle in git\n");
		fs.writeFileSync(
			path.join(root, "binary.bin"),
			Buffer.from([0x00, 0x01, 0x6e]),
		);
	});

	afterAll(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	test("finds matches and reports the relative path", () => {
		const result = searchContent(root, { pattern: "needle" });
		expect(result.matches.map((m) => m.file).sort()).toEqual([
			path.join("src", "a.ts"),
			path.join("src", "b.js"),
		]);
	});

	test("skips node_modules and dot directories", () => {
		const files = searchContent(root, { pattern: "needle" }).matches.map(
			(m) => m.file,
		);
		expect(files.some((f) => f.includes("node_modules"))).toBe(false);
		expect(files.some((f) => f.includes(".git"))).toBe(false);
	});

	test("skips binary files", () => {
		const result = searchContent(root, { pattern: "n", regex: false });
		expect(result.matches.some((m) => m.file === "binary.bin")).toBe(false);
	});

	test("filters by extension", () => {
		const result = searchContent(root, {
			pattern: "needle",
			extensions: [".ts"],
		});
		expect(result.matches).toHaveLength(1);
		expect(result.matches[0]?.file).toBe(path.join("src", "a.ts"));
	});

	test("stops at maxResults and flags the result as truncated", () => {
		const result = searchContent(root, { pattern: "needle", maxResults: 1 });
		expect(result.matches).toHaveLength(1);
		expect(result.truncated).toBe(true);
	});

	test("is not truncated when everything fits", () => {
		expect(searchContent(root, { pattern: "needle" }).truncated).toBe(false);
	});

	test("returns an empty result rather than failing when nothing matches", () => {
		const result = searchContent(root, { pattern: "definitely-absent-xyz" });
		expect(result.matches).toEqual([]);
		expect(result.truncated).toBe(false);
		expect(result.filesSearched).toBeGreaterThan(0);
	});

	test("returns results in a stable order across runs", () => {
		const once = searchContent(root, { pattern: "needle" }).matches.map(
			(m) => m.file,
		);
		const twice = searchContent(root, { pattern: "needle" }).matches.map(
			(m) => m.file,
		);
		expect(once).toEqual(twice);
	});

	test("supports regex search", () => {
		const result = searchContent(root, { pattern: "^const \\w+", regex: true });
		expect(result.matches.length).toBeGreaterThan(0);
		expect(result.matches.every((m) => m.file.endsWith("a.ts"))).toBe(true);
	});
});
