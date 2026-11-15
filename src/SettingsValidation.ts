import {
	CSSSetting,
	ClassMultiToggle,
	ClassToggle,
	ColorGradient,
	Heading,
	VariableColor,
	VariableNumber,
	VariableNumberSlider,
	VariableSelect,
	VariableText,
	VariableThemedColor,
	ColorFormat,
} from './SettingHandlers';
import { SettingType } from './settingsView/SettingComponents/types';
import { isValidDefaultColor } from './Utils';
import type { en } from './lang/locale/en';

export interface ValidationWarning {
	code: string;
	message: keyof typeof en;
	settingId?: string;
}

export interface ValidationResult {
	setting: CSSSetting;
	warnings: ValidationWarning[];
}

const validColorFormats = new Set<ColorFormat>([
	'hex',
	'hsl',
	'hsl-values',
	'hsl-split',
	'hsl-split-decimal',
	'rgb',
	'rgb-values',
	'rgb-split',
]);

const validGradientFormats = new Set<ColorGradient['format']>(['hex', 'hsl', 'rgb']);

const getOptionValues = (options: Array<string | { value: string }>) =>
	options.map((option) => (typeof option === 'string' ? option : option.value));

const addWarning = (
	warnings: ValidationWarning[],
	code: string,
	message: keyof typeof en,
	settingId?: string
) => {
	warnings.push({ code, message, settingId });
};

export function validateAndNormalizeSetting(
	setting: CSSSetting
): ValidationResult {
	const warnings: ValidationWarning[] = [];
	const normalized: CSSSetting = { ...setting } as CSSSetting;

	switch (setting.type) {
		case SettingType.HEADING: {
			const heading = normalized as Heading;
			const level = heading.level;
			if (!Number.isInteger(level) || level < 1 || level > 6) {
				const numericLevel = typeof level === 'number' ? Math.round(level) : 1;
				heading.level = Math.min(6, Math.max(1, numericLevel)) as Heading['level'];
				addWarning(
					warnings,
					'INVALID_HEADING_LEVEL',
					'Heading level must be an integer between 1 and 6.',
					setting.id
				);
			}
			break;
		}
		case SettingType.CLASS_TOGGLE: {
			const toggle = normalized as ClassToggle;
			if (toggle.default !== undefined && typeof toggle.default !== 'boolean') {
				toggle.default = false;
				addWarning(
					warnings,
					'INVALID_DEFAULT',
					'Class toggle default must be a boolean.',
					setting.id
				);
			}
			break;
		}
		case SettingType.CLASS_SELECT: {
			const select = normalized as ClassMultiToggle;
			const originalDefault = (setting as ClassMultiToggle).default;
			if (select.allowEmpty === undefined) {
				select.allowEmpty = false;
				addWarning(
					warnings,
					'MISSING_ALLOW_EMPTY',
					'Class select allowEmpty is missing; defaulting to false.',
					setting.id
				);
			}

			if (
				originalDefault !== undefined &&
				!getOptionValues(select.options).includes(originalDefault)
			) {
				addWarning(
					warnings,
					'INVALID_DEFAULT',
					'Class select default is not in the options list.',
					setting.id
				);
			}
			break;
		}
		case SettingType.VARIABLE_TEXT: {
			const variableText = normalized as VariableText;
			if (variableText.default === undefined) {
				variableText.default = '';
				addWarning(
					warnings,
					'MISSING_DEFAULT',
					'Variable text default is missing; defaulting to an empty string.',
					setting.id
				);
			}
			break;
		}
		case SettingType.VARIABLE_NUMBER: {
			const variableNumber = normalized as VariableNumber;
			if (
				variableNumber.default === undefined ||
				typeof variableNumber.default !== 'number'
			) {
				variableNumber.default = 0;
				addWarning(
					warnings,
					'MISSING_DEFAULT',
					'Variable number default is missing or invalid; defaulting to 0.',
					setting.id
				);
			}
			break;
		}
		case SettingType.VARIABLE_NUMBER_SLIDER: {
			const slider = normalized as VariableNumberSlider;
			const missingFields =
				slider.default === undefined ||
				slider.min === undefined ||
				slider.max === undefined ||
				slider.step === undefined;

			if (missingFields) {
				slider.default = slider.default ?? 0;
				slider.min = slider.min ?? 0;
				slider.max = slider.max ?? 100;
				slider.step = slider.step ?? 1;
				addWarning(
					warnings,
					'MISSING_SLIDER_FIELDS',
					'Slider fields are missing; default values have been applied.',
					setting.id
				);
			}

			if (slider.min > slider.max) {
				const min = slider.min;
				slider.min = slider.max;
				slider.max = min;
				addWarning(
					warnings,
					'INVALID_SLIDER_RANGE',
					'Slider min was greater than max; values were swapped.',
					setting.id
				);
			}

			if (slider.step <= 0) {
				slider.step = 1;
				addWarning(
					warnings,
					'INVALID_SLIDER_STEP',
					'Slider step must be greater than 0; defaulting to 1.',
					setting.id
				);
			}

			if (slider.default < slider.min) {
				slider.default = slider.min;
				addWarning(
					warnings,
					'INVALID_SLIDER_DEFAULT',
					'Slider default was below min and has been clamped.',
					setting.id
				);
			}

			if (slider.default > slider.max) {
				slider.default = slider.max;
				addWarning(
					warnings,
					'INVALID_SLIDER_DEFAULT',
					'Slider default was above max and has been clamped.',
					setting.id
				);
			}
			break;
		}
		case SettingType.VARIABLE_COLOR: {
			const variableColor = normalized as VariableColor;
			if (!variableColor.format) {
				variableColor.format = 'hex';
				addWarning(
					warnings,
					'MISSING_COLOR_FORMAT',
					'Variable color format is missing; defaulting to hex.',
					setting.id
				);
			} else if (!validColorFormats.has(variableColor.format)) {
				variableColor.format = 'hex';
				addWarning(
					warnings,
					'UNSUPPORTED_COLOR_FORMAT',
					'Variable color format is unsupported; defaulting to hex.',
					setting.id
				);
			}

			if (
				variableColor.default !== undefined &&
				!isValidDefaultColor(variableColor.default)
			) {
				addWarning(
					warnings,
					'INVALID_DEFAULT',
					'Variable color default is not a valid color.',
					setting.id
				);
			}
			break;
		}
		case SettingType.VARIABLE_THEMED_COLOR: {
			const themedColor = normalized as VariableThemedColor;
			if (!themedColor.format) {
				themedColor.format = 'hex';
				addWarning(
					warnings,
					'MISSING_COLOR_FORMAT',
					'Themed color format is missing; defaulting to hex.',
					setting.id
				);
			} else if (!validColorFormats.has(themedColor.format)) {
				themedColor.format = 'hex';
				addWarning(
					warnings,
					'UNSUPPORTED_COLOR_FORMAT',
					'Themed color format is unsupported; defaulting to hex.',
					setting.id
				);
			}

			if (themedColor['default-light'] === undefined) {
				themedColor['default-light'] = '#000000';
				addWarning(
					warnings,
					'MISSING_THEMED_COLOR_FIELDS',
					'Themed color default-light is missing; defaulting to #000000.',
					setting.id
				);
			}

			if (themedColor['default-dark'] === undefined) {
				themedColor['default-dark'] = '#000000';
				addWarning(
					warnings,
					'MISSING_THEMED_COLOR_FIELDS',
					'Themed color default-dark is missing; defaulting to #000000.',
					setting.id
				);
			}

			if (
				themedColor['default-light'] !== undefined &&
				!isValidDefaultColor(themedColor['default-light'])
			) {
				addWarning(
					warnings,
					'INVALID_DEFAULT',
					'Themed color default-light is not a valid color.',
					setting.id
				);
			}

			if (
				themedColor['default-dark'] !== undefined &&
				!isValidDefaultColor(themedColor['default-dark'])
			) {
				addWarning(
					warnings,
					'INVALID_DEFAULT',
					'Themed color default-dark is not a valid color.',
					setting.id
				);
			}
			break;
		}
		case SettingType.VARIABLE_SELECT: {
			const variableSelect = normalized as VariableSelect;
			const originalDefault = (setting as VariableSelect).default;
			if (variableSelect.default === undefined) {
				variableSelect.default = '';
				addWarning(
					warnings,
					'MISSING_DEFAULT',
					'Variable select default is missing; defaulting to an empty string.',
					setting.id
				);
			}

			if (
				originalDefault !== undefined &&
				!getOptionValues(variableSelect.options).includes(originalDefault)
			) {
				addWarning(
					warnings,
					'INVALID_DEFAULT',
					'Variable select default is not in the options list.',
					setting.id
				);
			}
			break;
		}
		case SettingType.COLOR_GRADIENT: {
			const gradient = normalized as ColorGradient;
			const missingFields =
				gradient.from === undefined ||
				gradient.to === undefined ||
				gradient.format === undefined ||
				gradient.step === undefined;

			if (missingFields) {
				gradient.from = gradient.from ?? '';
				gradient.to = gradient.to ?? '';
				gradient.format = gradient.format ?? 'hex';
				gradient.step = gradient.step ?? 1;
				addWarning(
					warnings,
					'MISSING_GRADIENT_FIELDS',
					'Gradient fields are missing; defaults have been applied.',
					setting.id
				);
			}

			if (!validGradientFormats.has(gradient.format)) {
				gradient.format = 'hex';
				addWarning(
					warnings,
					'UNSUPPORTED_GRADIENT_FORMAT',
					'Gradient format is unsupported; defaulting to hex.',
					setting.id
				);
			}

			if (gradient.step <= 0) {
				gradient.step = 1;
				addWarning(
					warnings,
					'INVALID_GRADIENT_STEP',
					'Gradient step must be greater than 0; defaulting to 1.',
					setting.id
				);
			}
			break;
		}
		case SettingType.INFO_TEXT:
		default:
			break;
	}

	return { setting: normalized, warnings };
}
