import type { IDataObject } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
import RequestUtils from '../../../help/utils/RequestUtils';
import { asJsonString, pickFilled } from '../../../help/utils/parameters';
import { commonOptions } from '../../../help/utils/sharedOptions';

const EditOperate: ResourceOperations = {
	name: '部门或项目修改',
	value: 'edit',
	action: '修改部门或项目',
	description: 'POST /river/BudgetCenter/edit',
	order: 30,
	options: [
		{
			displayName:
				'未传字段保持原值；传空视为清空。文档：<a href="https://opendocs.xiaojukeji.com/version2024/11109" target="_blank">部门或项目修改</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: '滴滴侧 ID',
			name: 'id',
			type: 'string',
			default: '',
			description: '部门：id 或外部编号二选一；项目：id 或 外部编号+名称 二选一',
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
			description: '用外部编号定位时必传',
		},
		{
			displayName: '名称',
			name: 'name',
			type: 'string',
			default: '',
		},
		{
			displayName: '外部编号',
			name: 'out_budget_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '限额周期',
			name: 'budget_cycle',
			type: 'options',
			options: [
				{ name: '不修改', value: '' },
				{ name: '不限额', value: 0 },
				{ name: '自然月', value: 1 },
				{ name: '自然季度（需白名单）', value: 2 },
				{ name: '自然年（需白名单）', value: 3 },
				{ name: '一次性', value: 4 },
			],
			default: '',
		},
		{
			displayName: '限额金额',
			name: 'total_quota',
			type: 'string',
			default: '',
		},
		{
			displayName: '上级滴滴侧 ID',
			name: 'parent_id',
			type: 'string',
			default: '',
			description: '传 0 清空上级',
		},
		{
			displayName: '上级外部编码',
			name: 'out_parent_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '上级外部名称',
			name: 'out_parent_name',
			type: 'string',
			default: '',
		},
		{
			displayName: '主管滴滴侧 ID',
			name: 'leader_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '主管工号 JSON',
			name: 'leader_employee_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '项目可见范围',
			name: 'member_used',
			type: 'options',
			options: [
				{ name: '不修改', value: '' },
				{ name: '全员可见', value: 0 },
				{ name: '项目成员可见', value: 1 },
				{ name: '部分公司主体+部门可见（需白名单）', value: 2 },
			],
			default: '',
		},
		{
			displayName: '项目开始日期',
			name: 'start_date',
			type: 'string',
			default: '',
		},
		{
			displayName: '项目结束日期',
			name: 'expiry_date',
			type: 'string',
			default: '',
		},
		{
			displayName: '公司主体 ID',
			name: 'legal_entity_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '所属部门滴滴侧 ID',
			name: 'department_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '所属部门编码',
			name: 'out_department_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '部门范围',
			name: 'scope',
			type: 'options',
			options: [
				{ name: '不修改', value: '' },
				{ name: '仅当前部门', value: 'current_only' },
				{ name: '含下级部门', value: 'include_sub' },
			],
			default: '',
		},
		{
			displayName: '项目扩展信息 JSON',
			name: 'budget_extra_info',
			type: 'json',
			default: '',
		},
		{
			displayName: '扩展字段 JSON',
			name: 'extend_field',
			type: 'json',
			default: '',
		},
		{
			displayName: 'POI 列表 JSON',
			name: 'poi_list',
			type: 'json',
			default: '',
		},
		commonOptions,
	],
	async call(this, index) {
		const body = pickFilled({
			id: this.getNodeParameter('id', index, ''),
			type: this.getNodeParameter('type', index, ''),
			name: this.getNodeParameter('name', index, ''),
			out_budget_id: this.getNodeParameter('out_budget_id', index, ''),
			budget_cycle: this.getNodeParameter('budget_cycle', index, ''),
			total_quota: this.getNodeParameter('total_quota', index, ''),
			parent_id: this.getNodeParameter('parent_id', index, ''),
			out_parent_id: this.getNodeParameter('out_parent_id', index, ''),
			out_parent_name: this.getNodeParameter('out_parent_name', index, ''),
			leader_id: this.getNodeParameter('leader_id', index, ''),
			leader_employee_id: this.getNodeParameter('leader_employee_id', index, ''),
			member_used: this.getNodeParameter('member_used', index, ''),
			start_date: this.getNodeParameter('start_date', index, ''),
			expiry_date: this.getNodeParameter('expiry_date', index, ''),
			legal_entity_id: this.getNodeParameter('legal_entity_id', index, ''),
			department_id: this.getNodeParameter('department_id', index, ''),
			out_department_id: this.getNodeParameter('out_department_id', index, ''),
			scope: this.getNodeParameter('scope', index, ''),
			budget_extra_info: asJsonString(this.getNodeParameter('budget_extra_info', index, '')),
			extend_field: asJsonString(this.getNodeParameter('extend_field', index, '')),
			poi_list: asJsonString(this.getNodeParameter('poi_list', index, '')),
		});

		return (await RequestUtils.request.call(this, {
			method: 'POST',
			url: '/river/BudgetCenter/edit',
			body,
		})) as IDataObject;
	},
};

export default EditOperate;
