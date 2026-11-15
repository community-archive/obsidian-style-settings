import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from './locale/en';
import { zh } from './locale/zh';
import { zhTw } from './locale/zhTw';

async function loadLanguage(language: string | null) {
	vi.resetModules();
	vi.stubGlobal('window', {
		localStorage: { getItem: () => language },
	});
	return {
		...(await import('./helpers')),
		...(await import('../Utils')),
	};
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.resetModules();
});

describe('language selection', () => {
	it.each(['zh', 'zh-CN', 'zh_cn', 'zh-SG', 'zh-Hans-CN', 'zh-Hans-TW'])(
		'uses Simplified Chinese for %s',
		async (language) => {
			const { normalizedLang, t } = await loadLanguage(language);
			expect(normalizedLang).toBe('zh');
			expect(t('Restore default')).toBe('恢复默认值');
		}
	);

	it.each([
		'zh-TW',
		'zh_tw',
		'ZH-tw',
		'zh-Hant',
		'zh-Hant-TW',
		'zh_Hant_HK',
		'zh-Hant-CN',
		'zh-HK',
		'zh-MO',
	])('keeps Traditional Chinese separate for %s', async (language) => {
		const { normalizedLang, t, getTitle, getDescription } =
			await loadLanguage(language);
		expect(normalizedLang).toBe('zh-TW');
		expect(t('Restore default')).toBe(en['Restore default']);
		const setting = {
			id: 'theme-setting',
			type: 'class-toggle' as const,
			title: 'English title',
			'title.zh': '简体标题',
			'title.zh-TW': '繁體標題',
			description: 'English description',
			'description.zh': '简体说明',
			'description.zh-TW': '繁體說明',
		};
		expect(getTitle(setting)).toBe('繁體標題');
		expect(getDescription(setting)).toBe('繁體說明');
	});

	it('preserves exact theme language fields before using canonical fields', async () => {
		const { getTitle, getDescription } = await loadLanguage('zh-CN');
		const setting = {
			id: 'theme-setting',
			type: 'class-toggle' as const,
			title: 'English title',
			'title.zh-CN': '地区标题',
			'title.zh': '简体标题',
			description: 'English description',
			'description.zh-CN': '地区说明',
			'description.zh': '简体说明',
		};
		expect(getTitle(setting)).toBe('地区标题');
		expect(getDescription(setting)).toBe('地区说明');
		setting['title.zh-CN'] = '';
		setting['description.zh-CN'] = '';
		expect(getTitle(setting)).toBe('简体标题');
		expect(getDescription(setting)).toBe('简体说明');
		setting['title.zh'] = '';
		setting['description.zh'] = '';
		expect(getTitle(setting)).toBe('English title');
		expect(getDescription(setting)).toBe('English description');
	});

	it('falls back to the base theme text instead of Simplified Chinese for zhTw', async () => {
		const { getTitle, getDescription } = await loadLanguage('zh-TW');
		const setting = {
			id: 'theme-setting',
			type: 'class-toggle' as const,
			title: 'English title',
			'title.zh': '简体标题',
			'description.zh': '简体说明',
		};
		expect(getTitle(setting)).toBe('English title');
		expect(getDescription(setting)).toBeUndefined();
	});

	it('keeps base theme text when no language is stored', async () => {
		const { t, getTitle, getDescription } = await loadLanguage(null);
		expect(t('Save')).toBe('Save');
		const setting = {
			id: 'theme-setting',
			type: 'class-toggle' as const,
			title: 'Base title',
			'title.en': 'English override',
			description: 'Base description',
			'description.en': 'English override',
		};
		expect(getTitle(setting)).toBe('Base title');
		expect(getDescription(setting)).toBe('Base description');
	});

	it('preserves a supported non-Chinese language', async () => {
		const { normalizedLang, t, getTitle } = await loadLanguage('pt-BR');
		expect(normalizedLang).toBe('pt-BR');
		expect(t('Default:')).toBe('Default:');
		expect(t('Restore default')).toBe('Restore default');
		expect(
			getTitle({
				id: 'theme-setting',
				type: 'class-toggle',
				title: 'Base title',
				'title.pt-BR': 'Título',
			})
		).toBe('Título');
	});

	it('falls back to English and retains exact theme fields for an unknown language', async () => {
		const error = vi
			.spyOn(console, 'error')
			.mockImplementation(() => undefined);
		const { t, getTitle } = await loadLanguage('xx');
		expect(t('Export settings for: {{section}}', { section: 'Theme' })).toBe(
			'Export settings for: Theme'
		);
		expect(error).toHaveBeenCalledWith(
			'Error: Style Settings locale not found',
			'xx'
		);
		expect(
			getTitle({
				id: 'theme-setting',
				type: 'class-toggle',
				title: 'Base title',
				'title.xx': 'Custom title',
			})
		).toBe('Custom title');
	});

	it.each([
		['en', 'Save', 'Cancel', 'save and close', 'cancel and close'],
		['zh', '保存', '取消', '保存并关闭', '取消并关闭'],
		['zh-TW', 'Save', 'Cancel', 'save and close', 'cancel and close'],
	])(
		'localizes visible color picker buttons and accessible labels for %s',
		async (language, save, cancel, saveLabel, cancelLabel) => {
			const { getPickrSettings } = await loadLanguage(language);
			const element = {} as HTMLElement;
			const options = getPickrSettings({
				isView: false,
				el: element,
				containerEl: element,
				swatches: ['#ff0000'],
				opacity: true,
				defaultColor: '#ff0000',
			});
			expect(options.i18n?.['btn:save']).toBe(save);
			expect(options.i18n?.['btn:cancel']).toBe(cancel);
			expect(options.i18n?.['aria:btn:save']).toBe(saveLabel);
			expect(options.i18n?.['aria:btn:cancel']).toBe(cancelLabel);
			expect(options.components?.interaction?.save).toBe(true);
			expect(options.components?.interaction?.cancel).toBe(true);
		}
	);
});

describe('translation content', () => {
	it('keeps every English value identical to its source key', () => {
		for (const [key, value] of Object.entries(en)) {
			expect(value).toBe(key);
		}
	});

	it('covers all English keys in Simplified Chinese and preserves placeholders', () => {
		expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
		for (const key of Object.keys(en) as Array<keyof typeof en>) {
			expect(zh[key].trim()).not.toBe('');
			expect(zh[key].match(/\{\{\w+\}\}/g) || []).toEqual(
				en[key].match(/\{\{\w+\}\}/g) || []
			);
		}
	});

	it('falls back to English for every missing zhTw entry', async () => {
		const { t } = await loadLanguage('zh-TW');
		const translations: Partial<typeof en> = zhTw;
		for (const key of Object.keys(en) as Array<keyof typeof en>) {
			expect(t(key)).toBe(translations[key] || en[key]);
		}
	});

	it('inserts counts and preserves arbitrary user text literally', async () => {
		const { t } = await loadLanguage('zh');
		expect(t('{{count}} Results', { count: '0' })).toBe('0 个结果');
		const section = '$& $1 {{section}} <Theme>';
		expect(t('Export settings for: {{section}}', { section })).toBe(
			`导出设置：${section}`
		);
		const error = 'Unexpected token $& {{error}}';
		expect(t('Error importing style settings: {{error}}', { error })).toBe(
			`导入样式设置出错：${error}`
		);
	});
});
