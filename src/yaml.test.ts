import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

// Style Settings parses the YAML in `@settings` comments of every theme,
// snippet and plugin stylesheet, so that YAML is untrusted input (#206).
describe('js-yaml prototype pollution (GHSA-mh29-5h37-fv8m, #206)', () => {
	const payload = [
		'name: Evil theme',
		'id: evil-theme',
		'<<: { __proto__: { polluted: true } }',
		'settings: []',
	].join('\n');

	it('does not let a settings block replace the parsed object prototype', () => {
		const parsed = yaml.load(payload) as Record<string, unknown>;

		expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
		expect(parsed.polluted).toBeUndefined();
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});
});
