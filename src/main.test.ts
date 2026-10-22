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

// Run debounced work immediately so errors surface in the test.
Object.defineProperty(globalThis, 'activeWindow', {
	value: {
		setTimeout: (fn: () => void) => {
			fn();
			return 0;
		},
	},
	writable: true,
});

Object.defineProperty(globalThis, 'document', {
	value: {
		styleSheets: { length: 0, item: (): null => null },
	},
	writable: true,
});

vi.mock('./SettingsManager', () => ({
	CSSSettingsManager: class {},
}));

vi.mock('./settingsView/CSSSettingsTab', () => ({
	CSSSettingsTab: class {},
}));

vi.mock('./settingsView/SettingsMarkup', () => ({
	SettingsMarkup: class {
		setSettings = vi.fn();
	},
}));

vi.mock('./css/pickerOverrides.css', () => ({}));
vi.mock('./css/settings.css', () => ({}));
vi.mock('@simonwep/pickr/dist/themes/nano.min.css', () => ({}));

const { default: CSSSettingsPlugin } = await import('./main');
const { SettingsView } = await import('./settingsView/SettingsView');

function createPlugin(leaves: Array<{ view: unknown }>) {
	const app = {
		workspace: {
			getLeavesOfType: vi.fn(() => leaves),
			on: vi.fn(),
		},
		plugins: { plugins: {} },
		commands: { removeCommand: vi.fn() },
	};
	const plugin = new (CSSSettingsPlugin as any)(app, {});
	plugin.settingsManager = {
		removeClasses: vi.fn(),
		setConfig: vi.fn(),
		initClasses: vi.fn(),
	};
	plugin.settingsTab = { setSettings: vi.fn() };
	return plugin;
}

describe('parseCSS with a deferred Style Settings leaf (#178)', () => {
	it('still applies the settings when a restored leaf has not loaded yet', () => {
		// Since Obsidian 1.7.2 a restored leaf holds a placeholder view
		// without setSettings until the tab is first shown.
		const deferredLeaf = { view: { getViewType: () => 'style-settings' } };
		const plugin = createPlugin([deferredLeaf]);

		expect(() => plugin.parseCSS()).not.toThrow();
		expect(plugin.settingsManager.setConfig).toHaveBeenCalledTimes(1);
		expect(plugin.settingsManager.initClasses).toHaveBeenCalledTimes(1);
	});

	it('still passes the settings to loaded views', () => {
		const plugin = createPlugin([]);
		const view = new (SettingsView as any)(plugin, {});
		const setSettings = vi.spyOn(view, 'setSettings');
		plugin.app.workspace.getLeavesOfType = vi.fn(() => [{ view }]);

		plugin.parseCSS();

		expect(setSettings).toHaveBeenCalledWith(
			plugin.settingsList,
			plugin.errorList
		);
	});

	it('gives a view that loads later the settings parsed before it', () => {
		const plugin = createPlugin([]);
		plugin.parseCSS();

		const view = new (SettingsView as any)(plugin, {});
		view.onload();

		expect(view.settingsMarkup.setSettings).toHaveBeenCalledWith(
			plugin.settingsList,
			plugin.errorList
		);
	});
});
