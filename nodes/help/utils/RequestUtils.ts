import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';
import { Credentials } from '../type/enums';
import { pickFilled } from './parameters';
import { getCommonOptions } from './sharedOptions';

const MAX_PAGE_SIZE = 100;

export interface DidiApiResponse {
	errno?: number | string;
	errmsg?: string;
	data?: unknown;
	request_id?: string;
}

function isTokenExpired(errno: unknown): boolean {
	return Number(errno) === 401;
}

function isSuccess(errno: unknown): boolean {
	return errno === undefined || errno === 0 || errno === '0';
}

/** 各列表接口的集合字段名不完全一致（records / members ...），优先取 records，否则取第一个数组字段 */
function extractRecords(page: IDataObject | IDataObject[]): IDataObject[] {
	if (Array.isArray(page)) {
		return page;
	}
	if (Array.isArray(page.records)) {
		return page.records as IDataObject[];
	}
	const firstArray = Object.values(page).find((value) => Array.isArray(value));
	return (firstArray as IDataObject[]) ?? [];
}

class RequestUtils {
	static unwrap(res: DidiApiResponse): IDataObject | IDataObject[] {
		const meta: IDataObject = {};
		if (res.request_id) {
			meta.request_id = res.request_id;
		}
		if (res.errmsg) {
			meta.errmsg = res.errmsg;
		}

		if (res.data === null || res.data === undefined) {
			return { success: true, ...meta };
		}
		if (Array.isArray(res.data)) {
			return res.data as IDataObject[];
		}
		if (typeof res.data === 'object') {
			return { ...(res.data as IDataObject), ...meta };
		}
		return { data: res.data as IDataObject[string], ...meta };
	}

	static async originRequest(
		this: IExecuteFunctions,
		options: IHttpRequestOptions,
		clearAccessToken = false,
	) {
		const credentials = await this.getCredentials(Credentials.DidiEnterpriseAdminApi);
		options.baseURL = String(credentials.baseUrl).replace(/\/$/, '');
		if (options.json === undefined) {
			options.json = true;
		}

		const timeout = getCommonOptions(this).timeout;
		if (options.timeout === undefined && timeout) {
			options.timeout = timeout;
		}

		return this.helpers.httpRequestWithAuthentication.call(
			this,
			Credentials.DidiEnterpriseAdminApi,
			options,
			{
				credentialsDecrypted: {
					id: '',
					name: Credentials.DidiEnterpriseAdminApi,
					type: Credentials.DidiEnterpriseAdminApi,
					data: {
						...credentials,
						accessToken: clearAccessToken ? '' : credentials.accessToken,
					},
				},
			},
		);
	}

	static async request(
		this: IExecuteFunctions,
		options: IHttpRequestOptions,
	): Promise<IDataObject | IDataObject[]> {
		let res = (await RequestUtils.originRequest.call(this, options)) as DidiApiResponse;

		if (isTokenExpired(res?.errno)) {
			res = (await RequestUtils.originRequest.call(this, options, true)) as DidiApiResponse;
		}

		if (!isSuccess(res?.errno)) {
			const signHint =
				res?.data && typeof res.data === 'object' && (res.data as IDataObject).params_sign_str
					? `；签名原文：${(res.data as IDataObject).params_sign_str}`
					: '';
			throw new NodeApiError(this.getNode(), res as JsonObject, {
				message: `滴滴接口错误：${res.errmsg || `errno=${res.errno}`}${signHint}`,
			});
		}

		return RequestUtils.unwrap(res);
	}

	static async requestPaged(
		this: IExecuteFunctions,
		options: {
			url: string;
			qs?: IDataObject;
			returnAll: boolean;
			limit?: number;
			lengthKey?: string;
		},
	): Promise<IDataObject> {
		const lengthKey = options.lengthKey ?? 'length';
		const limit = Math.max(options.limit ?? MAX_PAGE_SIZE, 1);
		// 接口单页最多 100 条，limit 超过时内部翻页拼接
		const pageSize = options.returnAll ? MAX_PAGE_SIZE : Math.min(limit, MAX_PAGE_SIZE);
		const baseQs = pickFilled(options.qs ?? {});

		const records: IDataObject[] = [];
		let offset = 0;
		let total = 0;

		while (true) {
			const page = (await RequestUtils.request.call(this, {
				method: 'GET',
				url: options.url,
				qs: {
					...baseQs,
					offset,
					[lengthKey]: pageSize,
				},
			})) as IDataObject | IDataObject[];

			const items = extractRecords(page);
			const pageTotal = Array.isArray(page) ? undefined : page.total;
			total = Number(pageTotal ?? offset + items.length);
			records.push(...items);

			if (items.length < pageSize) {
				break;
			}
			if (!options.returnAll && records.length >= limit) {
				break;
			}
			offset += pageSize;
			if (Number.isFinite(total) && offset >= total) {
				break;
			}
		}

		return {
			total,
			records: options.returnAll ? records : records.slice(0, limit),
		};
	}
}

export default RequestUtils;
