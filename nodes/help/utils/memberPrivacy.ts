import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { Credentials } from '../type/enums';
import { encryptTravelerField } from './didiCrypto';
import { parseJsonValue } from './parameters';

export async function getCompanyId(context: IExecuteFunctions): Promise<string> {
	const credentials = await context.getCredentials(Credentials.DidiEnterpriseAdminApi);
	return String(credentials.companyId);
}

export function encryptMemberPrivacy(data: IDataObject, companyId: string): IDataObject {
	const next: IDataObject = { ...data };

	if (typeof next.birth_date === 'string' && next.birth_date) {
		next.birth_date = encryptTravelerField(next.birth_date, companyId);
	}

	if (next.card_list !== undefined) {
		const list = Array.isArray(next.card_list) ? next.card_list : parseJsonValue(next.card_list);
		if (Array.isArray(list)) {
			next.card_list = list.map((item) => {
				const card = { ...((item as IDataObject) ?? {}) };
				if (typeof card.card_no === 'string' && card.card_no) {
					card.card_no = encryptTravelerField(card.card_no, companyId);
				}
				if (typeof card.expire_date === 'string' && card.expire_date) {
					card.expire_date = encryptTravelerField(card.expire_date, companyId);
				}
				return card;
			});
		}
	}

	return next;
}
