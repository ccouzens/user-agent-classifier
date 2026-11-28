export function getElement<T extends HTMLElement>(
	id: string,
	ctor: new () => T,
): T {
	const element = document.getElementById(id);
	if (!(element instanceof ctor)) {
		throw new Error(`Expected #${id} to be ${ctor.name}`);
	}
	return element;
}
