import type { IDataObject } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
import RequestUtils from '../../../help/utils/RequestUtils';
import { pickFilled } from '../../../help/utils/parameters';
import { paginationOptions, timeoutOnlyOptions } from '../../../help/utils/sharedOptions';

const GetOperate: ResourceOperations = {
	name: '部门或项目查询',
	value: 'get',
	action: '查询部门或项目',
	description: 'GET /river/BudgetCenter/get',
	order: 10,
	requestIntervalMs: 0,
	options: [
		{
			displayName:
				'查询企业在滴滴企业版管理后台的部门或项目。文档：<a href="https://opendocs.xiaojukeji.com/version2024/11105" target="_blank">部门或项目查询</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: '类型',
			name: 'type',
			type: 'options',
			options: [
				{ name: '全部', value: '' },
				{ name: '部门', value: 1 },
				{ name: '项目', value: 2 },
			],
			default: '',
			description: '不传则查询全部',
		},
		{
			displayName: '滴滴侧 ID',
			name: 'id',
			type: 'string',
			default: '',
			description: '与外部编号二者选一',
		},
		{
			displayName: '外部编号',
			name: 'out_budget_id',
			type: 'string',
			default: '',
			description: '与滴滴侧 ID 二者选一',
		},
		{
			displayName: '名称',
			name: 'name',
			type: 'string',
			default: '',
		},
		{
			displayName: '精确匹配名称',
			name: 'is_exact_name',
			type: 'boolean',
			default: false,
		},
		paginationOptions.returnAll,
		paginationOptions.limit(50),
		{
			displayName: '返回限额规则',
			name: 'is_need_limit_rule',
			type: 'options',
			options: [
				{ name: '返回', value: 1 },
				{ name: '不返回', value: 0 },
			],
			default: 1,
		},
		{
			displayName: '返回 POI',
			name: 'is_get_poi',
			type: 'options',
			options: [
				{ name: '不返回', value: 0 },
				{ name: '返回', value: 1 },
			],
			default: 0,
		},
		{
			displayName: '返回扩展字段',
			name: 'is_get_extend_fields',
			type: 'options',
			options: [
				{ name: '不返回', value: 0 },
				{ name: '返回', value: 1 },
			],
			default: 0,
		},
		timeoutOnlyOptions,
	],
	async call(this, index) {
		const type = this.getNodeParameter('type', index, '');
		const result = (await RequestUtils.requestPaged.call(this, {
			url: '/river/BudgetCenter/get',
			qs: pickFilled({
				type,
				id: this.getNodeParameter('id', index, ''),
				out_budget_id: this.getNodeParameter('out_budget_id', index, ''),
				name: this.getNodeParameter('name', index, ''),
				is_exact_name: this.getNodeParameter('is_exact_name', index, false) ? 1 : 0,
				is_need_limit_rule: this.getNodeParameter('is_need_limit_rule', index, 1),
				is_get_poi: this.getNodeParameter('is_get_poi', index, 0),
				is_get_extend_fields: this.getNodeParameter('is_get_extend_fields', index, 0),
			}),
			returnAll: this.getNodeParameter('returnAll', index, false) as boolean,
			limit: this.getNodeParameter('limit', index, 50) as number,
		})) as IDataObject;

		return (result.records as IDataObject[]) ?? [];
	},
};

export default GetOperate;
