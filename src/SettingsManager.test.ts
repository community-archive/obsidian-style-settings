import { describe, expect, it, vi } from 'vitest';

const localStorageMock: Storage = {
	length: 0,
	clear: () => undefined,
	getItem: () => null,
	key: () => null,
	removeItem: () => undefined,
	setItem: () => undefined,
};

Object.defineProperty(globalThis, 'window', {
	value: {
		localStorage: localStorageMock,
	},
	writable: true,
});

vi.mock('./ExportModal', () => ({
	ExportModal: class {},
}));

vi.mock('./ImportModal', () => ({
	ImportModal: class {},
}));

vi.mock('./main', () => ({
	default: class {},
}));

const { CSSSettingsManager, generateColorVariables, safeNum, safeRound } = await import(
	'./SettingsManager'
);

describe('safeRound', () => {
	it('returns 0 for NaN', () => {
		expect(safeRound(NaN)).toBe(0);
	});

	it('rounds up decimals', () => {
		expect(safeRound(3.7)).toBe(4);
	});

	it('rounds down decimals', () => {
		expect(safeRound(3.2)).toBe(3);
	});
});

describe('safeNum', () => {
	it('returns 0 for NaN', () => {
		expect(safeNum(NaN)).toBe(0);
	});

	it('passes through valid numbers', () => {
		expect(safeNum(0.5)).toBe(0.5);
	});
});

describe('generateColorVariables', () => {
	it('returns hex output for valid colors', () => {
		expect(
			generateColorVariables('test', 'hex', '#ff0000', false)
		).toEqual([{ key: 'test', value: '#ff0000' }]);
	});

	it('returns empty array for unparseable colors', () => {
		expect(
			generateColorVariables('test', 'hex', 'notacolor', false)
		).toEqual([]);
	});

	it('rounds rgb-values output to integers', () => {
		const result = generateColorVariables('test', 'rgb-values', '#336699', false);
		expect(result).toHaveLength(1);
		expect(result[0].value).toMatch(/^\d+, \d+, \d+$/);
	});

	it('rounds rgb-split output to integers', () => {
		const result = generateColorVariables('test', 'rgb-split', '#336699', false);
		const values = Object.fromEntries(
			result.map((entry) => [entry.key, entry.value])
		);
		expect(values['test-r']).toMatch(/^\d+$/);
		expect(values['test-g']).toMatch(/^\d+$/);
		expect(values['test-b']).toMatch(/^\d+$/);
	});

	it('does not emit NaN in hsl-values output', () => {
		const result = generateColorVariables('test', 'hsl-values', '#ff0000', false);
		expect(result).toHaveLength(1);
		expect(result[0].value).not.toMatch(/NaN/i);
	});
});

describe('CSSSettingsManager.reload', () => {
	it('swaps the old classes for the saved ones and applies the variables', async () => {
		const calls: string[] = [];
		const manager = Object.create(CSSSettingsManager.prototype);
		manager.plugin = {
			loadData: async () => {
				calls.push('loadData');
				return { 'section@@setting': true };
			},
		};
		manager.removeClasses = () => calls.push('removeClasses');
		manager.initClasses = () => calls.push('initClasses');
		manager.setCSSVariables = () => calls.push('setCSSVariables');

		await manager.reload();

		expect(calls).toEqual([
			'removeClasses',
			'loadData',
			'initClasses',
			'setCSSVariables',
		]);
		expect(manager.settings).toEqual({ 'section@@setting': true });
	});
});
