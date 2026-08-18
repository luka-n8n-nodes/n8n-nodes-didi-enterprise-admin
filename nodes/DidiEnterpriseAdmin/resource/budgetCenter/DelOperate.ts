import type { IDataObject } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
import RequestUtils from '../../../help/utils/RequestUtils';
import { pickFilled } from '../../../help/utils/parameters';
import { commonOptions } from '../../../help/utils/sharedOptions';

const DelOperate: ResourceOperations = {
	name: '部门或项目删除',
	value: 'del',
	action: '删除部门或项目',
	description: 'POST /river/BudgetCenter/del',
	order: 40,
	options: [
		{
			displayName:
				'删除不可逆，且不会返回已删除数据。部门下有员工时不能删。文档：<a href="https://opendocs.xiaojukeji.com/version2024/11111" target="_blank">部门或项目删除</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: '滴滴侧 ID',
			name: 'id',
			type: 'string',
			default: '',
			description: '优先使用 ID。部门也可用外部编号；项目需外部编号+名称',
		},
		{
			displayName: '类型',
			name: 'type',
			type: 'options',
			options: [
				{ name: '不指定', value: '' },
				{ name: '部门', value: 1 },
				{ name: '项目', value: 2 },
			],
			default: '',
			description: '用外部编号删除时必传',
		},
		{
			displayName: '外部编号',
			name: 'out_budget_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '名称',
			name: 'name',
			type: 'string',
			default: '',
			description: '用外部编号删除项目时必填',
		},
		commonOptions,
	],
	async call(this, index) {
		const body = pickFilled({
			id: this.getNodeParameter('id', index, ''),
			type: this.getNodeParameter('type', index, ''),
			out_budget_id: this.getNodeParameter('out_budget_id', index, ''),
			name: this.getNodeParameter('name', index, ''),
		});

		return (await RequestUtils.request.call(this, {
			method: 'POST',
			url: '/river/BudgetCenter/del',
			body,
		})) as IDataObject;
	},
};

export default DelOperate;
