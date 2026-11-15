import { Meta, WithDescription, WithTitle } from './SettingHandlers';
import { normalizedLang, t } from './lang/helpers';
import Pickr from '@simonwep/pickr';

export const settingRegExp = /\/\*!?\s*@settings[\r\n]+?([\s\S]+?)\*\//g;
export const nameRegExp = /^name:\s*(.+)$/m;
export type ErrorList = Array<{ name: string; error: string }>;

export function getTitle<T extends Meta>(config: T): string {
	return config[`title.${normalizedLang}` as keyof WithTitle] || config.title;
}

export function getDescription<T extends Meta>(config: T): string | undefined {
	return (
		config[`description.${normalizedLang}` as keyof WithDescription] ||
		config.description
	);
}

export function isValidDefaultColor(color: string) {
	return /^(#|rgb|hsl)/.test(color);
}

/**
 * Validates a saved color value before persisting or applying it.
 * Stricter than isValidDefaultColor: rejects obviously corrupt values
 * such as strings containing "NaN" that can result from a broken color picker.
 */
export function isValidSavedColor(color: string): boolean {
	if (!isValidDefaultColor(color)) return false;
	if (/NaN/i.test(color)) return false;
	return true;
}

export function getPickrSettings(opts: {
	isView: boolean;
	el: HTMLElement;
	containerEl: HTMLElement;
	swatches: string[];
	opacity: boolean | undefined;
	defaultColor: string;
}): Pickr.Options {
	const { el, isView, containerEl, swatches, opacity, defaultColor } = opts;

	return {
		el,
		container: isView ? document.body : containerEl,
		theme: 'nano',
		swatches,
		lockOpacity: !opacity,
		default: defaultColor,
		position: 'left-middle',
		components: {
			preview: true,
			hue: true,
			opacity: !!opacity,
			interaction: {
				hex: true,
				rgba: true,
				hsla: true,
				input: true,
				cancel: true,
				save: true,
			},
		},
	};
}

export function onPickrCancel(instance: Pickr) {
	instance.hide();
}

export function sanitizeText(str: string): string {
	if (str === '') {
		return `""`;
	}

	return str.replace(/[;<>]/g, '');
}

export function createDescription(
	description: string | undefined,
	def: string,
	defLabel?: string
): DocumentFragment {
	const fragment = createFragment();

	if (description) {
		fragment.appendChild(document.createTextNode(description));
	}

	if (def) {
		const small = createEl('small');
		small.appendChild(createEl('strong', { text: `${t('Default:')} ` }));
		small.appendChild(document.createTextNode(defLabel || def));

		const div = createEl('div');

		div.appendChild(small);

		fragment.appendChild(div);
	}

	return fragment;
}

/*
 * compatability with Settings Search Plugin
 */
export interface SettingsSeachResource {
	//Id of your settings tab. This is usually the ID of your plugin as defined in the manifest.
	tab: string;
	//Name of your settings tab. This is usually the name of your plugin as defined in the manifest. This is used to organize the settings under headers when searching.
	name: string;
	//The name of the setting to add.
	text: string;
	//An optional description string to add to the setting.
	desc: string;
}
