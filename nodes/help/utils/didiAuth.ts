import type { ICredentialDataDecryptedObject, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import { applySign, type DidiSignMethod } from './didiCrypto';

export const DIDI_AUTHORIZE_PATH = '/river/Auth/authorize';
export const DIDI_DEFAULT_BASE_URL = 'https://api.es.xiaojukeji.com';

export interface DidiAuthorizeSuccess {
	access_token: string;
	expires_in: number;
	token_type?: string;
	scope?: string;
}

export interface DidiApiError {
	errno?: number | string;
	errmsg?: string;
	data?: {
		params_sign_str?: string;
		[key: string]: unknown;
	};
	request_id?: string;
}

export function getUnixTimestamp(): number {
	return Math.floor(Date.now() / 1000);
}

export function isAuthorizeUrl(url: string): boolean {
	return url.includes('/Auth/authorize');
}

export function normalizeRequestBody(body: IHttpRequestOptions['body']): Record<string, unknown> {
	if (body === undefined || body === null || body === '') {
		return {};
	}
	if (typeof body === 'string') {
		const trimmed = body.trim();
		if (!trimmed) {
			return {};
		}
		return JSON.parse(trimmed) as Record<string, unknown>;
	}
	if (typeof body === 'object' && !Buffer.isBuffer(body) && !Array.isArray(body)) {
		return { ...(body as Record<string, unknown>) };
	}
	throw new Error('滴滴接口请求体必须是 JSON 对象');
}

export function buildAuthorizeParams(
	credentials: ICredentialDataDecryptedObject,
): Record<string, unknown> {
	return {
		client_id: credentials.clientId,
		client_secret: credentials.clientSecret,
		grant_type: 'client_credentials',
		timestamp: getUnixTimestamp(),
	};
}

export function signDidiParams(
	params: Record<string, unknown>,
	credentials: ICredentialDataDecryptedObject,
): Record<string, unknown> & { sign: string } {
	return applySign(params, String(credentials.signKey), credentials.signMethod as DidiSignMethod);
}

export function applyDidiAuthToRequest(
	credentials: ICredentialDataDecryptedObject,
	requestOptions: IHttpRequestOptions,
): IHttpRequestOptions {
	const method = String(requestOptions.method ?? 'GET').toUpperCase();
	const url = `${requestOptions.baseURL ?? ''}${requestOptions.url ?? ''}`;
	const authorize = isAuthorizeUrl(url);
	const fromQuery = { ...((requestOptions.qs as Record<string, unknown> | undefined) ?? {}) };
	const fromBody = method === 'GET' ? {} : normalizeRequestBody(requestOptions.body);
	const params: Record<string, unknown> = { ...fromQuery, ...fromBody };

	params.client_id = credentials.clientId;

	if (authorize) {
		params.client_secret = credentials.clientSecret;
		params.grant_type = params.grant_type ?? 'client_credentials';
	} else {
		params.company_id = credentials.companyId;
		if (credentials.accessToken) {
			params.access_token = credentials.accessToken;
		}
	}

	params.timestamp = getUnixTimestamp();
	const signed = signDidiParams(params, credentials);

	if (method === 'GET') {
		requestOptions.qs = signed as IDataObject;
		delete requestOptions.body;
		requestOptions.headers = {
			...(requestOptions.headers ?? {}),
			'Content-Type': 'application/x-www-form-urlencoded',
		};
		requestOptions.json = true;
		return requestOptions;
	}

	requestOptions.body = signed;
	requestOptions.headers = {
		...(requestOptions.headers ?? {}),
		'Content-Type': 'application/json',
	};
	requestOptions.json = true;

	return requestOptions;
}

export function parseAuthorizeResponse(res: unknown): { accessToken: string; expiresIn: number } {
	const data = res as DidiAuthorizeSuccess & DidiApiError;
	const errno = data?.errno;

	if (errno !== undefined && errno !== 0 && errno !== '0') {
		const signHint = data.data?.params_sign_str ? `；签名原文：${data.data.params_sign_str}` : '';
		throw new Error(`滴滴授权失败：${data.errmsg || `errno=${errno}`}${signHint}`);
	}

	if (!data?.access_token) {
		throw new Error(`滴滴授权失败：未返回 access_token，响应：${JSON.stringify(res)}`);
	}

	const ttl = Number(data.expires_in) || 1800;
	const refreshBufferSec = Math.min(60, Math.max(0, ttl - 1));

	return {
		accessToken: data.access_token,
		expiresIn: Date.now() + (ttl - refreshBufferSec) * 1000,
	};
}
