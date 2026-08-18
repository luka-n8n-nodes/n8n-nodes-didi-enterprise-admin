import type { IDataObject } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
import RequestUtils from '../../../help/utils/RequestUtils';
import { asJsonString, pickFilled } from '../../../help/utils/parameters';
import { commonOptions } from '../../../help/utils/sharedOptions';

const AddOperate: ResourceOperations = {
	name: '部门或项目新增',
	value: 'add',
	action: '新增部门或项目',
	description: 'POST /river/BudgetCenter/add',
	order: 20,
	options: [
		{
			displayName:
				'新增后请用查询接口核对。部门编号必填。文档：<a href="https://opendocs.xiaojukeji.com/version2024/11107" target="_blank">部门或项目新增</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: '类型',
			name: 'type',
			type: 'options',
			options: [
				{ name: '部门', value: 1 },
				{ name: '项目', value: 2 },
			],
			default: 1,
			required: true,
		},
		{
			displayName: '名称',
			name: 'name',
			type: 'string',
			default: '',
			required: true,
			description: '最长 200 字符',
		},
		{
			displayName: '外部编号',
			name: 'out_budget_id',
			type: 'string',
			default: '',
			description: '部门必填，项目选填。同一租户下不可重复',
		},
		{
			displayName: '限额周期',
			name: 'budget_cycle',
			type: 'options',
			options: [
				{ name: '不限额', value: 0 },
				{ name: '自然月', value: 1 },
				{ name: '自然季度（需白名单）', value: 2 },
				{ name: '自然年（需白名单）', value: 3 },
				{ name: '一次性', value: 4 },
			],
			default: 0,
			required: true,
		},
		{
			displayName: '限额金额',
			name: 'total_quota',
			type: 'string',
			default: '',
			description: '单位元。周期不为「不限额」时必填，传 0 表示不限制',
		},
		{
			displayName: '上级滴滴侧 ID',
			name: 'parent_id',
			type: 'string',
			default: '',
			description: '部门不传则挂到根部门；传 0 表示根部门',
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
			description: '项目用外部编码关联上级时需同时传名称',
		},
		{
			displayName: '主管滴滴侧 ID',
			name: 'leader_id',
			type: 'string',
			default: '',
			description: '多个用英文逗号分隔，第一个为主负责人，最多 30 个',
		},
		{
			displayName: '主管工号 JSON',
			name: 'leader_employee_id',
			type: 'string',
			default: '',
			description: 'JSON 数组字符串，例如 ["0012","1234"]',
		},
		{
			displayName: '项目可见范围',
			name: 'member_used',
			type: 'options',
			displayOptions: { show: { type: [2] } },
			options: [
				{ name: '全员可见', value: 0 },
				{ name: '项目成员可见', value: 1 },
				{ name: '部分公司主体+部门可见（需白名单）', value: 2 },
			],
			default: 0,
		},
		{
			displayName: '项目开始日期',
			name: 'start_date',
			type: 'string',
			default: '',
			displayOptions: { show: { type: [2] } },
			placeholder: '2018-01-02',
		},
		{
			displayName: '项目结束日期',
			name: 'expiry_date',
			type: 'string',
			default: '',
			displayOptions: { show: { type: [2] } },
			placeholder: '2018-01-02',
		},
		{
			displayName: '公司主体 ID',
			name: 'legal_entity_id',
			type: 'string',
			default: '',
			displayOptions: { show: { type: [2], member_used: [2] } },
			description: '多个用英文逗号分隔',
		},
		{
			displayName: '所属部门滴滴侧 ID',
			name: 'department_id',
			type: 'string',
			default: '',
			displayOptions: { show: { type: [2], member_used: [2] } },
		},
		{
			displayName: '所属部门编码',
			name: 'out_department_id',
			type: 'string',
			default: '',
			displayOptions: { show: { type: [2], member_used: [2] } },
		},
		{
			displayName: '部门范围',
			name: 'scope',
			type: 'options',
			displayOptions: { show: { type: [2], member_used: [2] } },
			options: [
				{ name: '仅当前部门', value: 'current_only' },
				{ name: '含下级部门', value: 'include_sub' },
			],
			default: 'current_only',
		},
		{
			displayName: '项目扩展信息 JSON',
			name: 'budget_extra_info',
			type: 'json',
			default: '',
			displayOptions: { show: { type: [2] } },
		},
		{
			displayName: '扩展字段 JSON',
			name: 'extend_field',
			type: 'json',
			default: '',
			displayOptions: { show: { type: [2] } },
			description: '[{"code":"custom_field_01","value":"扩展值1"}]',
		},
		{
			displayName: 'POI 列表 JSON',
			name: 'poi_list',
			type: 'json',
			default: '',
			displayOptions: { show: { type: [2] } },
		},
		commonOptions,
	],
	async call(this, index) {
		const type = this.getNodeParameter('type', index) as number;
		const body = pickFilled({
			type,
			name: this.getNodeParameter('name', index),
			out_budget_id: this.getNodeParameter('out_budget_id', index, ''),
			budget_cycle: this.getNodeParameter('budget_cycle', index),
			total_quota: this.getNodeParameter('total_quota', index, ''),
			parent_id: this.getNodeParameter('parent_id', index, ''),
			out_parent_id: this.getNodeParameter('out_parent_id', index, ''),
			out_parent_name: this.getNodeParameter('out_parent_name', index, ''),
			leader_id: this.getNodeParameter('leader_id', index, ''),
			leader_employee_id: this.getNodeParameter('leader_employee_id', index, ''),
			member_used: type === 2 ? this.getNodeParameter('member_used', index, 0) : undefined,
			start_date: type === 2 ? this.getNodeParameter('start_date', index, '') : undefined,
			expiry_date: type === 2 ? this.getNodeParameter('expiry_date', index, '') : undefined,
			legal_entity_id: type === 2 ? this.getNodeParameter('legal_entity_id', index, '') : undefined,
			department_id: type === 2 ? this.getNodeParameter('department_id', index, '') : undefined,
			out_department_id:
				type === 2 ? this.getNodeParameter('out_department_id', index, '') : undefined,
			scope: type === 2 ? this.getNodeParameter('scope', index, '') : undefined,
			budget_extra_info: asJsonString(this.getNodeParameter('budget_extra_info', index, '')),
			extend_field: asJsonString(this.getNodeParameter('extend_field', index, '')),
			poi_list: asJsonString(this.getNodeParameter('poi_list', index, '')),
		});

		return (await RequestUtils.request.call(this, {
			method: 'POST',
			url: '/river/BudgetCenter/add',
			body,
		})) as IDataObject;
	},
};

export default AddOperate;
