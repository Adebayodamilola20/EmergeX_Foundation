import { describe, expect, test } from "bun:test";
import { applyEdit, countOccurrences, replaceLiteral } from "./apply-edit";

describe("countOccurrences", () => {
	test("counts non-overlapping matches", () => {
		expect(countOccurrences("abcabc", "abc")).toBe(2);
		expect(countOccurrences("aaaa", "aa")).toBe(2);
	});

	test("returns 0 when absent and for an empty needle", () => {
		expect(countOccurrences("abc", "xyz")).toBe(0);
		expect(countOccurrences("abc", "")).toBe(0);
	});
});

describe("replaceLiteral", () => {
	test("replaces the first match only when all is false", () => {
		expect(replaceLiteral("a a a", "a", "b", false)).toEqual({
			content: "b a a",
			replacements: 1,
		});
	});

	test("replaces every match when all is true", () => {
		expect(replaceLiteral("a a a", "a", "b", true)).toEqual({
			content: "b b b",
			replacements: 3,
		});
	});

	test("inserts $ replacement patterns literally", () => {
		// String.prototype.replace would interpret each of these and splice
		// surrounding text into the result. They must survive verbatim.
		const patterns = ["$&", "$`", "$'", "$$", "$1", "$<name>"];
		for (const pattern of patterns) {
			const { content } = replaceLiteral("ABColdDEF", "old", pattern, false);
			expect(content).toBe(`ABC${pattern}DEF`);
		}
	});

	test("preserves a replacement that is entirely $ patterns", () => {
		const newText = "const price = `$${amount}`; // $& $' $`";
		const { content } = replaceLiteral("x = OLD;", "OLD", newText, false);
		expect(content).toBe(`x = ${newText};`);
	});

	test("leaves the source untouched for an empty needle", () => {
		expect(replaceLiteral("abc", "", "x", true)).toEqual({
			content: "abc",
			replacements: 0,
		});
	});

	test("handles a match at the start and at the end", () => {
		expect(replaceLiteral("aXa", "a", "b", true).content).toBe("bXb");
	});
});

describe("applyEdit", () => {
	test("replaces a unique match", () => {
		const result = applyEdit("const a = 1;\n", "1", "2");
		expect(result).toEqual({
			ok: true,
			content: "const a = 2;\n",
			replacements: 1,
		});
	});

	test("rejects an ambiguous match instead of editing the first one", () => {
		const source = "const a = 1;\nconst b = 1;\n";
		const result = applyEdit(source, "const", "let");
		expect(result.ok).toBe(false);
		if (result.ok) throw new Error("expected failure");
		expect(result.reason).toBe("ambiguous");
		expect(result.occurrences).toBe(2);
		expect(result.message).toContain("2");
	});

	test("replaces every occurrence when replaceAll is set", () => {
		const source = "const a = 1;\nconst b = 1;\n";
		const result = applyEdit(source, "const", "let", { replaceAll: true });
		expect(result).toEqual({
			ok: true,
			content: "let a = 1;\nlet b = 1;\n",
			replacements: 2,
		});
	});

	test("reports text that is not present", () => {
		const result = applyEdit("abc", "xyz", "q");
		expect(result.ok).toBe(false);
		if (result.ok) throw new Error("expected failure");
		expect(result.reason).toBe("not-found");
		expect(result.occurrences).toBe(0);
	});

	test("rejects an empty oldText", () => {
		const result = applyEdit("abc", "", "x");
		expect(result.ok).toBe(false);
		if (result.ok) throw new Error("expected failure");
		expect(result.reason).toBe("empty-search");
	});

	test("rejects an edit that would change nothing", () => {
		const result = applyEdit("abc", "abc", "abc");
		expect(result.ok).toBe(false);
		if (result.ok) throw new Error("expected failure");
		expect(result.reason).toBe("no-op");
	});

	test("does not corrupt the file when newText contains $ patterns", () => {
		// Regression: shell scripts, sed/awk, regex replacements and template
		// literals all legitimately contain these sequences.
		const source = "function fmt() {\n  return OLD;\n}\n";
		const newText = 'text.replace(/x/g, "$&!")';
		const result = applyEdit(source, "OLD", newText);
		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("expected success");
		expect(result.content).toBe(`function fmt() {\n  return ${newText};\n}\n`);
		expect(result.content).toContain("$&");
	});

	test("does not splice surrounding text in via a backtick pattern", () => {
		const result = applyEdit("PREFIX-OLD-SUFFIX", "OLD", "$`");
		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("expected success");
		expect(result.content).toBe("PREFIX-$`-SUFFIX");
		expect(result.content).not.toContain("PREFIX-PREFIX");
	});

	test("preserves exact whitespace and indentation", () => {
		const source = "if (x) {\n\t\treturn 1;\n}\n";
		const result = applyEdit(source, "\t\treturn 1;", "\t\treturn 2;");
		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("expected success");
		expect(result.content).toBe("if (x) {\n\t\treturn 2;\n}\n");
	});

	test("supports multi-line oldText", () => {
		const source = "a\nb\nc\n";
		const result = applyEdit(source, "a\nb", "x\ny");
		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("expected success");
		expect(result.content).toBe("x\ny\nc\n");
	});

	test("allows deleting text by replacing it with the empty string", () => {
		const result = applyEdit("keep REMOVE keep", "REMOVE ", "");
		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("expected success");
		expect(result.content).toBe("keep keep");
	});
});
