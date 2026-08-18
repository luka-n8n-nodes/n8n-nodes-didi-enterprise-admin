import type { IDataObject } from 'n8n-workflow';

export function pickFilled(values: Record<string, unknown>): IDataObject {
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(values)) {
		if (value === undefined || value === null) {
			continue;
		}
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed === '') {
				continue;
			}
			out[key] = trimmed;
			continue;
		}
		out[key] = value as IDataObject[string];
	}
	return out;
}

export function asJsonString(value: unknown): string | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed === '' ? undefined : trimmed;
	}
	return JSON.stringify(value);
}

export function parseJsonValue(value: unknown): unknown {
	if (typeof value !== 'string') {
		return value;
	}
	const trimmed = value.trim();
	if (!trimmed) {
		return undefined;
	}
	try {
		return JSON.parse(trimmed);
	} catch {
		return trimmed;
	}
}
