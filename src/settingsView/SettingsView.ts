import CSSSettingsPlugin from '../main';
import { SettingsMarkup } from './SettingsMarkup';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { ParsedCSSSettings } from 'src/SettingHandlers';
import { ErrorList } from 'src/Utils';

export const viewType = 'style-settings';

/**
 * Returns the loaded Style Settings views among the given leaves.
 *
 * Since Obsidian 1.7.2, leaves restored from the workspace are deferred until
 * they are first shown, and `leaf.view` is then a placeholder that does not
 * have our methods. Calling `setSettings` on it throws and aborts the caller.
 */
export function getLoadedSettingsViews(
	leaves: WorkspaceLeaf[]
): SettingsView[] {
	return leaves
		.map((leaf) => leaf.view)
		.filter((view): view is SettingsView => view instanceof SettingsView);
}

export class SettingsView extends ItemView {
	settingsMarkup: SettingsMarkup | null;
	plugin: CSSSettingsPlugin;

	constructor(plugin: CSSSettingsPlugin, leaf: WorkspaceLeaf) {
		super(leaf);
		this.plugin = plugin;
	}

	rerender() {
		this.settingsMarkup?.rerender();
	}

	settings: ParsedCSSSettings[];
	errorList: ErrorList;
	setSettings(settings: ParsedCSSSettings[], errorList: ErrorList) {
		this.settings = settings;
		this.errorList = errorList;
		if (this.settingsMarkup) {
			this.settingsMarkup.setSettings(settings, errorList);
		}
	}

	onload(): void {
		this.settingsMarkup = this.addChild(
			new SettingsMarkup(this.plugin.app, this.plugin, this.contentEl, true)
		);
		// A view restored from the workspace can load after the plugin has
		// already parsed the CSS, so fall back to the plugin's current settings.
		const settings = this.settings ?? this.plugin.settingsList;
		const errorList = this.errorList ?? this.plugin.errorList;
		if (settings) {
			this.settingsMarkup.setSettings(settings, errorList);
		}
	}

	onunload(): void {
		this.settingsMarkup = null;
	}

	getViewType() {
		return viewType;
	}

	getIcon() {
		return 'gear';
	}

	getDisplayText() {
		return 'Style Settings';
	}
}
