import { resetTooltip, VariableThemedColor } from '../../SettingHandlers';
import {
	getDescription,
	getPickrSettings,
	getTitle,
	isValidDefaultColor,
	isValidSavedColor,
	onPickrCancel,
} from '../../Utils';
import { t } from '../../lang/helpers';
import { AbstractSettingComponent } from './AbstractSettingComponent';
import Pickr from '@simonwep/pickr';
import { ButtonComponent, Setting } from 'obsidian';

export class VariableThemedColorSettingComponent extends AbstractSettingComponent {
	settingEl: Setting;
	setting: VariableThemedColor;
	pickrLight: Pickr | null;
	pickrDark: Pickr | null;

	render(): void {
		if (!this.containerEl) return;
		const title = getTitle(this.setting);
		const description = getDescription(this.setting);

		if (
			typeof this.setting['default-light'] !== 'string' ||
			!isValidDefaultColor(this.setting['default-light'])
		) {
			return console.error(
				`${t('Error:')} ${title} ${t(
					'missing default light value, or value is not in a valid color format'
				)}`
			);
		}

		if (
			typeof this.setting['default-dark'] !== 'string' ||
			!isValidDefaultColor(this.setting['default-dark'])
		) {
			return console.error(
				`${t('Error:')} ${title} ${t(
					'missing default dark value, or value is not in a valid color format'
				)}`
			);
		}

		const idLight = `${this.setting.id}@@light`;
		const idDark = `${this.setting.id}@@dark`;
		const valueLight = this.settingsManager.getSetting(this.sectionId, idLight);
		const valueDark = this.settingsManager.getSetting(this.sectionId, idDark);
		const savedLight =
			valueLight !== undefined ? valueLight.toString() : undefined;
		const savedDark = valueDark !== undefined ? valueDark.toString() : undefined;
		const swatchesLight: string[] = [];
		const swatchesDark: string[] = [];

		if (this.setting['default-light']) {
			swatchesLight.push(this.setting['default-light']);
		}

		if (valueLight !== undefined) {
			swatchesLight.push(valueLight as string);
		}

		if (this.setting['default-dark']) {
			swatchesDark.push(this.setting['default-dark']);
		}

		if (valueDark !== undefined) {
			swatchesDark.push(valueDark as string);
		}

		this.settingEl = new Setting(this.containerEl);
		this.settingEl.setName(title);

		// Construct description
		this.settingEl.descEl.createSpan({}, (span) => {
			if (description) {
				span.appendChild(document.createTextNode(description));
			}
		});

		this.settingEl.descEl.createDiv({}, (div) => {
			div.createEl('small', {}, (sm) => {
				sm.appendChild(createEl('strong', { text: t('Default (light): ') }));
				sm.appendChild(document.createTextNode(this.setting['default-light']));
			});
			div.createEl('br');
			div.createEl('small', {}, (sm) => {
				sm.appendChild(createEl('strong', { text: t('Default (dark): ') }));
				sm.appendChild(document.createTextNode(this.setting['default-dark']));
			});
		});

		const wrapper = this.settingEl.controlEl.createDiv({
			cls: 'themed-color-wrapper',
		});

		// Create light color picker
		this.createColorPickerLight(
			wrapper,
			this.containerEl,
			swatchesLight,
			savedLight as string | undefined,
			idLight
		);

		// Create dark color picker
		this.createColorPickerDark(
			wrapper,
			this.containerEl,
			swatchesDark,
			savedDark as string | undefined,
			idDark
		);

		this.settingEl.settingEl.dataset.id = this.setting.id;
	}

	destroy(): void {
		this.pickrLight?.destroyAndRemove();
		this.pickrDark?.destroyAndRemove();
		this.pickrLight = null;
		this.pickrDark = null;
		this.settingEl?.settingEl.remove();
	}

	private createColorPickerLight(
		wrapper: HTMLDivElement,
		containerEl: HTMLElement,
		swatchesLight: string[],
		valueLight: string | undefined,
		idLight: string
	) {
		const themeLightWrapper = wrapper.createDiv({ cls: 'theme-light' });

		// fix, so that the color is correctly shown before the color picker has been opened
		const savedColor =
			valueLight && isValidSavedColor(valueLight) ? valueLight : undefined;
		const defaultColor = savedColor || this.setting['default-light'];
		themeLightWrapper.style.setProperty('--pcr-color', defaultColor);
		const pickerEl = themeLightWrapper.createDiv({ cls: 'picker' });

		const pickrLight = (this.pickrLight = Pickr.create(
			getPickrSettings({
				isView: this.isView,
				el: pickerEl,
				containerEl,
				swatches: swatchesLight,
				opacity: this.setting.opacity,
				defaultColor: defaultColor,
			})
		));

		pickrLight.on('show', () => {
			const { result } = (pickrLight.getRoot() as any).interaction;
			activeWindow.requestAnimationFrame(() =>
				activeWindow.requestAnimationFrame(() => result.select())
			);
		});

		pickrLight.on('save', (color: Pickr.HSVaColor, instance: Pickr) =>
			this.onSave(idLight, color, instance, themeLightWrapper)
		);

		pickrLight.on('cancel', onPickrCancel);

		const themeLightReset = new ButtonComponent(
			themeLightWrapper.createDiv({ cls: 'pickr-reset' })
		);
		themeLightReset.setIcon('reset');
		themeLightReset.onClick(() => {
			const resetColor = this.setting['default-light'];
			pickrLight.setColor(resetColor);
			themeLightWrapper.style.setProperty('--pcr-color', resetColor);
			this.settingsManager.clearSetting(this.sectionId, idLight);
		});
		themeLightReset.setTooltip(resetTooltip());
	}

	private createColorPickerDark(
		wrapper: HTMLDivElement,
		containerEl: HTMLElement,
		swatchesDark: string[],
		valueDark: string | undefined,
		idDark: string
	) {
		const themeDarkWrapper = wrapper.createDiv({ cls: 'theme-dark' });

		// fix, so that the color is correctly shown before the color picker has been opened
		const savedColor =
			valueDark && isValidSavedColor(valueDark) ? valueDark : undefined;
		const defaultColor = savedColor || this.setting['default-dark'];
		themeDarkWrapper.style.setProperty('--pcr-color', defaultColor);
		const pickerEl = themeDarkWrapper.createDiv({ cls: 'picker' });

		const pickrDark = (this.pickrDark = Pickr.create(
			getPickrSettings({
				isView: this.isView,
				el: pickerEl,
				containerEl,
				swatches: swatchesDark,
				opacity: this.setting.opacity,
				defaultColor: defaultColor,
			})
		));

		pickrDark.on('show', () => {
			const { result } = (pickrDark.getRoot() as any).interaction;
			activeWindow.requestAnimationFrame(() =>
				activeWindow.requestAnimationFrame(() => result.select())
			);
		});

		pickrDark.on('save', (color: Pickr.HSVaColor, instance: Pickr) =>
			this.onSave(idDark, color, instance, themeDarkWrapper)
		);

		pickrDark.on('cancel', onPickrCancel);

		const themeDarkReset = new ButtonComponent(
			themeDarkWrapper.createDiv({ cls: 'pickr-reset' })
		);
		themeDarkReset.setIcon('reset');
		themeDarkReset.onClick(() => {
			const resetColor = this.setting['default-dark'];
			pickrDark.setColor(resetColor);
			themeDarkWrapper.style.setProperty('--pcr-color', resetColor);
			this.settingsManager.clearSetting(this.sectionId, idDark);
		});
		themeDarkReset.setTooltip(resetTooltip());
	}

	private onSave(
		id: string,
		color: Pickr.HSVaColor,
		instance: Pickr,
		wrapperEl: HTMLElement
	) {
		if (!color) return;
		const hex = color.toHEXA().toString();
		if (!isValidSavedColor(hex)) {
			console.warn(
				`Style Settings: invalid saved color "${hex}" for --${id}; skipping.`
			);
			instance.hide();
			return;
		}

		this.settingsManager.setSetting(
			this.sectionId,
			id,
			hex
		);

		instance.hide();
		instance.addSwatch(hex);
		wrapperEl.style.setProperty('--pcr-color', hex);
	}
}
