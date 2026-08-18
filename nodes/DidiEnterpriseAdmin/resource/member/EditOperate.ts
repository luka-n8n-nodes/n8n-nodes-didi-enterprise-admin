import type { IDataObject } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
import RequestUtils from '../../../help/utils/RequestUtils';
import { parseJsonValue, pickFilled } from '../../../help/utils/parameters';
import { encryptMemberPrivacy, getCompanyId } from '../../../help/utils/memberPrivacy';
import { commonOptions } from '../../../help/utils/sharedOptions';

const EditOperate: ResourceOperations = {
	name: '员工修改',
	value: 'edit',
	action: '修改员工',
	description: 'POST /river/Member/edit',
	order: 30,
	options: [
		{
			displayName:
				'未传字段保持原值；部分字段传空视为清空。连续修改间隔 ≥200ms。文档：<a href="https://opendocs.xiaojukeji.com/version2024/11157" target="_blank">员工修改</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: '员工滴滴侧 ID',
			name: 'member_id',
			type: 'string',
			default: '',
			description: '与工号二选一，ID 优先',
		},
		{
			displayName: '员工工号',
			name: 'employee_number',
			type: 'string',
			default: '',
		},
		{
			displayName: '姓名',
			name: 'realname',
			type: 'string',
			default: '',
		},
		{
			displayName: '手机号',
			name: 'phone',
			type: 'string',
			default: '',
		},
		{
			displayName: '邮箱',
			name: 'email',
			type: 'string',
			default: '',
		},
		{
			displayName: '工号（写入 data）',
			name: 'data_employee_number',
			type: 'string',
			default: '',
			description: '用于修改工号本身。定位员工请用上方「员工工号」',
		},
		{
			displayName: '企业支付',
			name: 'use_company_money',
			type: 'options',
			options: [
				{ name: '不修改', value: '' },
				{ name: '否', value: 0 },
				{ name: '是', value: 1 },
			],
			default: '',
		},
		{
			displayName: '主部门滴滴侧 ID',
			name: 'budget_center_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '主部门编号',
			name: 'out_budget_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '所属项目 ID',
			name: 'project_ids',
			type: 'string',
			default: '',
			description: '多个用 _ 分隔。传空清空项目',
		},
		{
			displayName: '附加字段',
			name: 'additionalFields',
			type: 'collection',
			placeholder: '添加字段',
			default: {},
			options: [
				{ displayName: '用车制度 ID', name: 'regulation_id', type: 'string', default: '' },
				{
					displayName: '用车备注',
					name: 'is_remark',
					type: 'options',
					options: [
						{ name: '无需填写', value: 0 },
						{ name: '需填写', value: 1 },
						{ name: '按制度填写', value: 2 },
					],
					default: 2,
				},
				{
					displayName: '系统角色',
					name: 'system_role',
					type: 'options',
					options: [
						{ name: '员工', value: 1 },
						{ name: '超级管理员', value: 2 },
					],
					default: 1,
				},
				{ displayName: '角色 ID', name: 'role_ids', type: 'string', default: '' },
				{
					displayName: '直属上级手机号',
					name: 'immediate_superior_phone',
					type: 'string',
					default: '',
				},
				{
					displayName: '直属上级邮箱',
					name: 'immediate_superior_email',
					type: 'string',
					default: '',
				},
				{
					displayName: '直属上级工号',
					name: 'immediate_superior_employee_number',
					type: 'string',
					default: '',
				},
				{
					displayName: '直属上级滴滴侧 ID',
					name: 'immediate_superior_memberID',
					type: 'string',
					default: '',
				},
				{ displayName: '兼岗部门 ID', name: 'con_department_ids', type: 'string', default: '' },
				{ displayName: '兼岗部门编号', name: 'con_department_codes', type: 'string', default: '' },
				{
					displayName: '所属项目信息 JSON',
					name: 'project_codes_detail',
					type: 'json',
					default: '',
				},
				{ displayName: '公司主体 ID', name: 'legal_entity_id', type: 'string', default: '' },
				{ displayName: '公司主体编号', name: 'out_legal_entity_id', type: 'string', default: '' },
				{ displayName: '职级 ID', name: 'rank_id', type: 'string', default: '' },
				{ displayName: '职级编号', name: 'out_rank_id', type: 'string', default: '' },
				{ displayName: '常驻地名称', name: 'residentsname', type: 'string', default: '' },
				{ displayName: '常驻地 ID', name: 'residents_ids', type: 'string', default: '' },
				{ displayName: '常驻地行政区划', name: 'residents_adcode', type: 'string', default: '' },
				{ displayName: '个人限额', name: 'total_quota', type: 'string', default: '' },
				{ displayName: '英文姓', name: 'english_surname', type: 'string', default: '' },
				{ displayName: '英文名', name: 'english_name', type: 'string', default: '' },
				{ displayName: '昵称', name: 'nickname', type: 'string', default: '' },
				{
					displayName: '性别',
					name: 'sex',
					type: 'options',
					options: [
						{ name: '未知', value: 0 },
						{ name: '男', value: 1 },
						{ name: '女', value: 2 },
					],
					default: 0,
				},
				{ displayName: '出生日期', name: 'birth_date', type: 'string', default: '' },
				{ displayName: '证件信息 JSON', name: 'card_list', type: 'json', default: '' },
				{ displayName: '证件中文姓名', name: 'cert_realname', type: 'string', default: '' },
				{ displayName: '证件英文姓', name: 'cert_english_surname', type: 'string', default: '' },
				{ displayName: '证件英文名', name: 'cert_english_name', type: 'string', default: '' },
				{ displayName: '家庭住址 JSON', name: 'home_address', type: 'json', default: '' },
				{ displayName: '离职日期', name: 'set_dismiss_time', type: 'string', default: '' },
				{
					displayName: '添加证件信息',
					name: 'has_card_info',
					type: 'options',
					options: [
						{ name: '不添加', value: 0 },
						{ name: '添加', value: 1 },
					],
					default: 0,
				},
			],
		},
		commonOptions,
	],
	async call(this, index) {
		const additional = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
		const { has_card_info, project_codes_detail, card_list, home_address, ...rest } = additional;
		const companyId = await getCompanyId(this);
		const data = encryptMemberPrivacy(
			pickFilled({
				realname: this.getNodeParameter('realname', index, ''),
				phone: this.getNodeParameter('phone', index, ''),
				email: this.getNodeParameter('email', index, ''),
				employee_number: this.getNodeParameter('data_employee_number', index, ''),
				use_company_money: this.getNodeParameter('use_company_money', index, ''),
				budget_center_id: this.getNodeParameter('budget_center_id', index, ''),
				out_budget_id: this.getNodeParameter('out_budget_id', index, ''),
				project_ids: this.getNodeParameter('project_ids', index, ''),
				...rest,
				project_codes_detail: parseJsonValue(project_codes_detail),
				card_list: parseJsonValue(card_list),
				home_address: parseJsonValue(home_address),
			}),
			companyId,
		);

		const body = pickFilled({
			member_id: this.getNodeParameter('member_id', index, ''),
			employee_number: this.getNodeParameter('employee_number', index, ''),
			has_card_info,
			data: JSON.stringify(data),
		});

		return (await RequestUtils.request.call(this, {
			method: 'POST',
			url: '/river/Member/edit',
			body,
		})) as IDataObject;
	},
};

export default EditOperate;
