import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';
import {
	applyDidiAuthToRequest,
	buildAuthorizeParams,
	DIDI_AUTHORIZE_PATH,
	DIDI_DEFAULT_BASE_URL,
	parseAuthorizeResponse,
	signDidiParams,
} from '../nodes/help/utils/didiAuth';

export class DidiEnterpriseAdminApi implements ICredentialType {
	name = 'didiEnterpriseAdminApi';
	displayName = '滴滴企业版管理 API';
	documentationUrl = 'https://opendocs.xiaojukeji.com/version2024/10951';
	icon = 'file:../nodes/DidiEnterpriseAdmin/icon.svg' as const;
	httpRequestNode = {
		name: '滴滴企业版管理 API',
		docsUrl: 'https://opendocs.xiaojukeji.com/version2024/10951',
		apiBaseUrl: DIDI_DEFAULT_BASE_URL,
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API 基础地址',
			name: 'baseUrl',
			type: 'string',
			default: DIDI_DEFAULT_BASE_URL,
			required: true,
			description: '滴滴企业版管理 API 基础地址，生产环境默认为 https://api.es.xiaojukeji.com',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: '应用唯一标识。滴滴开放平台创建应用时分配，用于识别调用方身份',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: '应用密钥，用于生成 access_token，请妥善保管',
		},
		{
			displayName: 'Sign Key',
			name: 'signKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description:
				'签名密钥，仅参与签名计算，不会作为请求参数传递。须与开放平台「开发配置 → 安全设置」中的签名算法配套使用',
		},
		{
			displayName: 'Company ID',
			name: 'companyId',
			type: 'string',
			default: '',
			required: true,
			description: '企业 ID，用于标识请求来源企业',
		},
		{
			displayName: '签名算法',
			name: 'signMethod',
			type: 'options',
			options: [
				{
					name: 'SHA256（平台默认）',
					value: 'sha256',
				},
				{
					name: 'MD5',
					value: 'md5',
				},
			],
			default: 'sha256',
			required: true,
			description:
				'须与开放平台「开发配置 → 安全设置 → 接口加密信息」中的签名算法一致。平台默认为 SHA256',
		},
		{
			displayName: '加密算法',
			name: 'encryptMethod',
			type: 'options',
			options: [
				{
					name: 'AES128',
					value: 'aes128',
				},
				{
					name: 'AES256',
					value: 'aes256',
				},
			],
			default: 'aes128',
			required: true,
			description:
				'须与开放平台「开发配置 → 安全设置 → 接口加密信息」中的加密算法一致。仅管理类 API 的隐私字段加密会用到',
		},
		{
			displayName: '密钥',
			name: 'encryptKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description:
				'开放平台「开发配置 → 安全设置 → 接口加密信息」中的密钥，用于 AES 加密。AES128 与 AES256 密钥不同',
		},
		{
			displayName: 'AccessToken',
			name: 'accessToken',
			type: 'hidden',
			default: '',
			typeOptions: {
				expirable: true,
				password: true,
			},
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const res = await this.helpers.httpRequest({
			method: 'POST',
			baseURL: String(credentials.baseUrl).replace(/\/$/, ''),
			url: DIDI_AUTHORIZE_PATH,
			headers: {
				'Content-Type': 'application/json',
			},
			body: signDidiParams(buildAuthorizeParams(credentials), credentials),
			json: true,
		});

		return parseAuthorizeResponse(res);
	}

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		return applyDidiAuthToRequest(credentials, requestOptions);
	}

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: DIDI_AUTHORIZE_PATH,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'errno',
					value: 19999,
					message: '签名失败，请检查 Sign Key 与签名算法是否与开放平台安全设置一致',
				},
			},
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'errno',
					value: 400,
					message: '请求参数错误，请检查 Client ID / Client Secret / grant_type',
				},
			},
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'errno',
					value: 10002,
					message: 'IP 验证失败，请将 n8n 出口 IP 加入开放平台「开发配置 → 安全设置 → IP 白名单」',
				},
			},
		],
	};
}
