import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

/** 滴滴对写操作有频率限制：连续请求间隔必须 ≥150 毫秒 */
export const MIN_REQUEST_INTERVAL_MS = 150;

export const batchingOption: INodeProperties = {
	displayName: 'Batching',
	name: 'batching',
	placeholder: 'Add Batching',
	type: 'fixedCollection',
	typeOptions: {
		multipleValues: false,
	},
	default: {
		batch: {},
	},
	options: [
		{
			displayName: 'Batching',
			name: 'batch',
			values: [
				{
					displayName: 'Items per Batch',
					name: 'batchSize',
					type: 'number',
					typeOptions: {
						minValue: 1,
					},
					default: 50,
					description: '每批并发请求数量。添加此选项后启用并发模式。0 将被视为 1。',
				},
				{
					displayName: 'Batch Interval (Ms)',
					name: 'batchInterval',
					type: 'number',
					typeOptions: {
						minValue: MIN_REQUEST_INTERVAL_MS,
					},
					default: 1000,
					description: '每批请求之间的时间（毫秒）。受接口频率限制，最小 150 毫秒。',
				},
			],
		},
	],
};

export const timeoutOption: INodeProperties = {
	displayName: 'Timeout',
	name: 'timeout',
	type: 'number',
	typeOptions: {
		minValue: 0,
	},
	default: 0,
	description:
		'等待服务器发送响应头（并开始响应体）的时间（毫秒），超过此时间将中止请求。0 表示不限制超时。',
};

export const commonOptions: INodeProperties = {
	displayName: 'Options',
	name: 'options',
	type: 'collection',
	placeholder: 'Add option',
	default: {},
	options: [batchingOption, timeoutOption],
};

/** 查询类操作不受写入频率限制，无需 Batching */
export const timeoutOnlyOptions: INodeProperties = {
	displayName: 'Options',
	name: 'options',
	type: 'collection',
	placeholder: 'Add option',
	default: {},
	options: [timeoutOption],
};

export interface ICommonOptionsValue {
	batching?: {
		batch?: {
			batchSize?: number;
			batchInterval?: number;
		};
	};
	timeout?: number;
}

export function getCommonOptions(context: IExecuteFunctions, index = 0): ICommonOptionsValue {
	try {
		return (context.getNodeParameter('options', index, {}) as ICommonOptionsValue) ?? {};
	} catch {
		return {};
	}
}

export const paginationOptions = {
	returnAll: {
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	} as INodeProperties,

	limit: (defaultValue = 50): INodeProperties => ({
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-limit
		default: defaultValue,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	}),
};
