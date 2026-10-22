// Minimal runtime stand-in for the `obsidian` package, which ships types only.
// Tests that need specific behaviour should override it with `vi.mock`.
export class Plugin {
	app: unknown;
	constructor(app: unknown) {
		this.app = app;
	}
}

export class ItemView {
	leaf: unknown;
	constructor(leaf: unknown) {
		this.leaf = leaf;
	}
	addChild<T>(child: T): T {
		return child;
	}
}
