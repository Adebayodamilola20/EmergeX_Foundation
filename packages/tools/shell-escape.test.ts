import { describe, expect, test } from "bun:test";
import {
	buildCommand,
	escapeArg,
	escapeArgs,
	shellQuote,
	shellSplit,
} from "./shell-escape";

describe("escapeArg", () => {
	test("returns '' for the empty string", () => {
		expect(escapeArg("")).toBe("''");
	});

	test("leaves shell-safe strings unquoted", () => {
		expect(escapeArg("safe123")).toBe("safe123");
		expect(escapeArg("a-b_c.d/e@%+=:,")).toBe("a-b_c.d/e@%+=:,");
	});

	test("quotes strings containing whitespace", () => {
		expect(escapeArg("hello world")).toBe("'hello world'");
		expect(escapeArg("tab\there")).toBe("'tab\there'");
		expect(escapeArg("line\nbreak")).toBe("'line\nbreak'");
	});

	test("escapes embedded single quotes via the '\\'' sequence", () => {
		expect(escapeArg("it's fine")).toBe("'it'\\''s fine'");
	});

	test("quotes every shell metacharacter so it cannot be interpreted", () => {
		for (const meta of [
			";",
			"&",
			"|",
			">",
			"<",
			"$",
			"`",
			"(",
			")",
			"*",
			"?",
			"!",
			"#",
			"~",
		]) {
			const escaped = escapeArg(`x${meta}y`);
			expect(escaped).toBe(`'x${meta}y'`);
		}
	});

	test("renders an injection attempt inert", () => {
		expect(escapeArg("; rm -rf /")).toBe("'; rm -rf /'");
		expect(escapeArg("$(whoami)")).toBe("'$(whoami)'");
		expect(escapeArg("a'; rm -rf /; '")).toBe("'a'\\''; rm -rf /; '\\'''");
	});
});

describe("escapeArgs", () => {
	test("escapes each argument independently", () => {
		expect(escapeArgs(["git", "commit", "-m", "fix: my bug"])).toEqual([
			"git",
			"commit",
			"-m",
			"'fix: my bug'",
		]);
	});

	test("returns an empty array unchanged", () => {
		expect(escapeArgs([])).toEqual([]);
	});
});

describe("buildCommand", () => {
	test("joins the escaped command and arguments with spaces", () => {
		expect(buildCommand("git", ["commit", "-m", "fix: my bug"])).toBe(
			"git commit -m 'fix: my bug'",
		);
	});

	test("escapes the command name as well as the arguments", () => {
		expect(buildCommand("my cmd", [])).toBe("'my cmd'");
	});

	test("emits '' for an empty argument", () => {
		expect(buildCommand("cmd", ["a", "", "b"])).toBe("cmd a '' b");
	});
});

describe("shellQuote", () => {
	test("wraps the value in double quotes", () => {
		expect(shellQuote("plain")).toBe('"plain"');
	});

	test("escapes backslashes before the characters that need them", () => {
		// The backslash pass must run first, or the escapes it adds get re-escaped.
		expect(shellQuote("back\\slash")).toBe('"back\\\\slash"');
	});

	test("escapes the characters that stay special inside double quotes", () => {
		expect(shellQuote('say "hello" $USER `id` !')).toBe(
			'"say \\"hello\\" \\$USER \\`id\\` \\!"',
		);
	});
});

describe("shellSplit", () => {
	test("splits an unquoted command on whitespace", () => {
		expect(shellSplit("git commit -m msg")).toEqual([
			"git",
			"commit",
			"-m",
			"msg",
		]);
	});

	test("collapses runs of whitespace and ignores leading and trailing padding", () => {
		expect(shellSplit("  a   b  ")).toEqual(["a", "b"]);
		expect(shellSplit("a\tb\nc")).toEqual(["a", "b", "c"]);
	});

	test("returns an empty array for empty and whitespace-only input", () => {
		expect(shellSplit("")).toEqual([]);
		expect(shellSplit("   ")).toEqual([]);
	});

	test("keeps single-quoted sections intact", () => {
		expect(shellSplit("git commit -m 'fix: my bug'")).toEqual([
			"git",
			"commit",
			"-m",
			"fix: my bug",
		]);
	});

	test("keeps double-quoted sections intact", () => {
		expect(shellSplit('echo "hello world"')).toEqual(["echo", "hello world"]);
	});

	test("concatenates quoted and unquoted runs into one token", () => {
		expect(shellSplit('a"b"c')).toEqual(["abc"]);
		expect(shellSplit("a'b'c")).toEqual(["abc"]);
	});

	test("treats a backslash as escaping the next character when unquoted", () => {
		expect(shellSplit("a\\ b")).toEqual(["a b"]);
	});

	test("honours backslash escapes only for special characters inside double quotes", () => {
		expect(shellSplit('"a\\$b"')).toEqual(["a$b"]);
		expect(shellSplit('"a\\"b"')).toEqual(['a"b']);
		// A backslash before an ordinary character is literal, matching POSIX.
		expect(shellSplit('"a\\nb"')).toEqual(["a\\nb"]);
	});

	test("does not treat a backslash as an escape inside single quotes", () => {
		expect(shellSplit("'a\\b'")).toEqual(["a\\b"]);
	});

	test("throws when a quoted section is never closed", () => {
		expect(() => shellSplit("a 'b")).toThrow(
			"Unterminated single quote in shell string",
		);
		expect(() => shellSplit('a "b')).toThrow(
			"Unterminated double quote in shell string",
		);
	});

	test("preserves an explicitly quoted empty argument", () => {
		expect(shellSplit("''")).toEqual([""]);
		expect(shellSplit('""')).toEqual([""]);
		expect(shellSplit('echo ""')).toEqual(["echo", ""]);
		expect(shellSplit("cmd a '' b")).toEqual(["cmd", "a", "", "b"]);
	});
});

describe("buildCommand and shellSplit round-trip", () => {
	const cases: Array<[string, string[]]> = [
		["git", ["commit", "-m", "fix: my bug"]],
		["echo", ["hello world"]],
		["cmd", ["it's fine"]],
		["cmd", ["$(whoami)", "; rm -rf /"]],
		["cmd", ["--flag", "", "file.txt"]],
		["my cmd", []],
		["cmd", ["a\tb", "c\nd"]],
	];

	for (const [cmd, args] of cases) {
		test(`recovers ${JSON.stringify([cmd, ...args])}`, () => {
			expect(shellSplit(buildCommand(cmd, args))).toEqual([cmd, ...args]);
		});
	}
});
