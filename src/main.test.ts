import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Command } from 'obsidian';
import type { ClassToggle, ParsedCSSSettings } from './SettingHandlers';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { URL } from 'node:url';
import ts from 'typescript';

// The Obsidian package only supplies types outside the app. Load the plugin with
// host stubs, while retaining the real translation and theme-field helpers.
const compiled = ts.transpileModule(
	readFileSync(new URL('./main.ts', import.meta.url), 'utf8'),
	{
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2018,
		},
	}
).outputText;

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe('theme toggle commands', () => {
	it.each([
		['en', 'Toggle English title'],
		['zh-CN', '切换简体标题'],
		['zh-Hant-HK', 'Toggle 繁體標題'],
	])(
		'uses localized titles while preserving command and setting IDs for %s',
		async (language, expectedName) => {
			vi.stubGlobal('window', {
				localStorage: { getItem: () => language },
			});
			const translations = await import('./lang/helpers');
			const utils = await import('./Utils');
			const exports = { default: class {} };
			runInNewContext(compiled, {
				exports,
				require: (id: string) => {
					if (id === 'obsidian') return { Plugin: class {} };
					if (id === './lang/helpers') return translations;
					if (id === './Utils') return utils;
					if (id === './settingsView/SettingsView')
						return { viewType: 'style-settings' };
					return {};
				},
			});
			const CSSSettingsPlugin = exports.default;
			const plugin = Object.create(CSSSettingsPlugin.prototype);
			const leaf = { view: { rerender: vi.fn() } };
			plugin.app = { workspace: { getLeavesOfType: () => [leaf] } };
			plugin.addCommand = vi.fn((command: Command) => command);
			plugin.commandList = [];
			plugin.settingsManager = {
				getSetting: vi.fn(() => false),
				setSetting: vi.fn(),
			};
			plugin.settingsTab = { rerender: vi.fn() };
			const setting: ClassToggle = {
				id: 'theme-toggle',
				type: 'class-toggle',
				title: 'English title',
				'title.zh': '简体标题',
				'title.zh-TW': '繁體標題',
				addCommand: true,
			};
			const section: ParsedCSSSettings = {
				id: 'theme-section',
				name: 'Theme',
				collapsed: false,
				settings: [setting],
			};
			plugin.addClassToggleCommand(section, setting);
			const command: Command = plugin.commandList[0];
			expect(command.name).toBe(expectedName);
			expect(command.id).toBe(
				'style-settings-class-toggle-theme-section-theme-toggle'
			);
			command.callback?.();
			expect(plugin.settingsManager.setSetting).toHaveBeenCalledWith(
				'theme-section',
				'theme-toggle',
				true
			);
			expect(plugin.settingsTab.rerender).toHaveBeenCalledOnce();
			expect(leaf.view.rerender).toHaveBeenCalledOnce();
			expect(setting.title).toBe('English title');
		}
	);
});
