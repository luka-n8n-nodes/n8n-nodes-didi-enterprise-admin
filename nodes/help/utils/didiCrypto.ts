import { createCipheriv, createDecipheriv, createHash } from 'crypto';

export type DidiSignMethod = 'md5' | 'sha256';
export type DidiEncryptMethod = 'aes128' | 'aes256';

/**
 * 滴滴签名算法。
 * @see https://opendocs.xiaojukeji.com/version2024/10945
 *
 * 1. 将 sign_key 加入参数（不随请求传递）
 * 2. 按参数名升序，以 a=xxx&b=xxx 连接
 * 3. 对字符串做小写 MD5 或 SHA256
 */
export function genSign(
	params: Record<string, unknown>,
	signKey: string,
	signMethod: DidiSignMethod,
): string {
	const payload: Record<string, string> = {};

	for (const [key, value] of Object.entries(params)) {
		if (key === 'sign' || key === 'sign_key') {
			continue;
		}
		if (value === undefined || value === null) {
			continue;
		}
		payload[key] = stringifySignValue(value);
	}

	payload.sign_key = signKey;

	const raw = Object.keys(payload)
		.sort()
		.map((key) => `${key}=${payload[key]}`)
		.join('&');

	const algorithm = signMethod === 'sha256' ? 'sha256' : 'md5';
	return createHash(algorithm).update(raw, 'utf8').digest('hex');
}

export function stringifySignValue(value: unknown): string {
	if (typeof value === 'string') {
		return value.trim();
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value).trim();
	}
	return JSON.stringify(value);
}

export function applySign<T extends Record<string, unknown>>(
	params: T,
	signKey: string,
	signMethod: DidiSignMethod,
): T & { sign: string } {
	return {
		...params,
		sign: genSign(params, signKey, signMethod),
	};
}

function resolveAesKey(encryptKey: string, method: DidiEncryptMethod): Buffer {
	if (method === 'aes256') {
		const keyBytes = Buffer.from(encryptKey, 'hex');
		if (keyBytes.length !== 32) {
			throw new Error('AES256 密钥必须是 32 字节（64 位十六进制字符串）');
		}
		return keyBytes;
	}

	return Buffer.from(encryptKey, 'utf8');
}

function resolveAesAlgorithm(key: Buffer): string {
	if (key.length === 16) {
		return 'aes-128-ecb';
	}
	if (key.length === 24) {
		return 'aes-192-ecb';
	}
	if (key.length === 32) {
		return 'aes-256-ecb';
	}
	throw new Error(
		`不支持的 AES 密钥长度：${key.length} 字节（AES128 使用 UTF-8 原始字节，AES256 使用 hex 解码后的 32 字节）`,
	);
}

function base64UrlEncode(data: Buffer): string {
	return data.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(data: string): Buffer {
	const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
	const padding = (4 - (normalized.length % 4)) % 4;
	return Buffer.from(normalized + '='.repeat(padding), 'base64');
}

/**
 * 滴滴 AES/ECB/PKCS7 加密。
 * @see https://opendocs.xiaojukeji.com/version2024/10953
 *
 * - AES128：密钥按 UTF-8 原始字节使用，密文为标准 Base64
 * - AES256：密钥按十六进制解码为 32 字节，密文为 URL-Safe Base64（保留 =）
 */
export function aesEncrypt(
	plainText: string,
	encryptKey: string,
	method: DidiEncryptMethod,
): string {
	const key = resolveAesKey(encryptKey, method);
	const cipher = createCipheriv(resolveAesAlgorithm(key), key, null);
	const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
	return method === 'aes256' ? base64UrlEncode(encrypted) : encrypted.toString('base64');
}

export function travelerAesKey(companyId: string): string {
	return createHash('md5').update(`es_traveler_${companyId}`, 'utf8').digest('hex');
}

export function encryptTravelerField(plainText: string, companyId: string): string {
	if (!plainText) {
		return plainText;
	}
	return aesEncrypt(plainText, travelerAesKey(companyId), 'aes128');
}

export function aesDecrypt(
	cipherText: string,
	encryptKey: string,
	method: DidiEncryptMethod,
): string {
	const key = resolveAesKey(encryptKey, method);
	const decipher = createDecipheriv(resolveAesAlgorithm(key), key, null);
	const input =
		method === 'aes256' ? base64UrlDecode(cipherText) : Buffer.from(cipherText, 'base64');
	const decrypted = Buffer.concat([decipher.update(input), decipher.final()]);
	return decrypted.toString('utf8').trim();
}
