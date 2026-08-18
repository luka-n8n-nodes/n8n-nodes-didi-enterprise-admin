import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	sleep,
} from 'n8n-workflow';
import ResourceFactory from '../help/builder/ResourceFactory';
import { Credentials } from '../help/type/enums';
import { OperationCallFunction } from '../help/type/IResource';
import { getCommonOptions, MIN_REQUEST_INTERVAL_MS } from '../help/utils/sharedOptions';

const resourceBuilder = ResourceFactory.build(__dirname);

interface IBatchConfig {
	/** 用户显式添加 Batching 选项后才启用并发 */
	enabled: boolean;
	batchSize: number;
	batchInterval: number;
}

function getBatchConfig(context: IExecuteFunctions, requestIntervalMs: number): IBatchConfig {
	const batch = getCommonOptions(context).batching?.batch;
	const batchSize = batch?.batchSize ?? 50;

	return {
		enabled: batch !== undefined,
		batchSize: batchSize === 0 ? 1 : batchSize,
		// 用户可以调大，但不能突破接口的频率限制
		batchInterval: Math.max(batch?.batchInterval ?? 0, requestIntervalMs),
	};
}

function toErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function normalizeError(context: IExecuteFunctions, error: unknown): Error {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		return error;
	}
	return new NodeApiError(context.getNode(), (error ?? {}) as JsonObject, {
		message: toErrorMessage(error),
	});
}

function toExecutionData(
	context: IExecuteFunctions,
	responseData: unknown,
	itemIndex: number,
): INodeExecutionData[] {
	return context.helpers.constructExecutionMetaData(
		context.helpers.returnJsonArray(responseData as IDataObject),
		{ itemData: { item: itemIndex } },
	);
}

function toErrorData(
	context: IExecuteFunctions,
	error: unknown,
	itemIndex: number,
): INodeExecutionData[] {
	return context.helpers.constructExecutionMetaData(
		context.helpers.returnJsonArray({ error: toErrorMessage(error) }),
		{ itemData: { item: itemIndex } },
	);
}

async function executeSerial(
	context: IExecuteFunctions,
	itemCount: number,
	callFunc: OperationCallFunction,
	requestIntervalMs: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
		if (itemIndex > 0 && requestIntervalMs > 0) {
			await sleep(requestIntervalMs);
		}

		try {
			returnData.push(
				...toExecutionData(context, await callFunc.call(context, itemIndex), itemIndex),
			);
		} catch (error) {
			if (context.continueOnFail()) {
				returnData.push(...toErrorData(context, error, itemIndex));
				continue;
			}
			throw normalizeError(context, error);
		}
	}

	return returnData;
}

async function executeParallel(
	context: IExecuteFunctions,
	itemCount: number,
	callFunc: OperationCallFunction,
	batchConfig: IBatchConfig,
): Promise<INodeExecutionData[]> {
	const { batchSize, batchInterval } = batchConfig;
	const requests: Array<Promise<{ result?: unknown; error?: unknown }>> = [];

	for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
		if (itemIndex > 0 && batchInterval > 0 && itemIndex % batchSize === 0) {
			await sleep(batchInterval);
		}

		requests.push(
			callFunc
				.call(context, itemIndex)
				.then((result) => ({ result }))
				.catch((error) => ({ error })),
		);
	}

	const responses = await Promise.all(requests);
	const returnData: INodeExecutionData[] = [];

	for (let itemIndex = 0; itemIndex < responses.length; itemIndex++) {
		const { result, error } = responses[itemIndex];

		if (error) {
			if (context.continueOnFail()) {
				returnData.push(...toErrorData(context, error, itemIndex));
				continue;
			}
			throw normalizeError(context, error);
		}

		returnData.push(...toExecutionData(context, result, itemIndex));
	}

	return returnData;
}

export class DidiEnterpriseAdmin implements INodeType {
	description: INodeTypeDescription = {
		displayName: '滴滴企业版管理',
		name: 'didiEnterpriseAdmin',
		subtitle: '={{ $parameter.resource }}:{{ $parameter.operation }}',
		icon: 'file:icon.svg',
		group: ['transform'],
		version: 1,
		description: '滴滴企业版管理后台 API，支持部门/项目与员工管理',
		defaults: {
			name: '滴滴企业版管理',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: Credentials.DidiEnterpriseAdminApi,
				required: true,
			},
		],
		properties: [...resourceBuilder.build()],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const callFunc = resourceBuilder.getCall(resource, operation);

		if (!callFunc) {
			throw new NodeOperationError(this.getNode(), `未实现方法: ${resource}.${operation}`);
		}

		const requestIntervalMs =
			resourceBuilder.getOperate(resource, operation)?.requestIntervalMs ?? MIN_REQUEST_INTERVAL_MS;
		const batchConfig = getBatchConfig(this, requestIntervalMs);
		const returnData = batchConfig.enabled
			? await executeParallel(this, items.length, callFunc, batchConfig)
			: await executeSerial(this, items.length, callFunc, requestIntervalMs);

		return [returnData];
	}
}
