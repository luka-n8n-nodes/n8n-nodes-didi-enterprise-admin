import type { IDataObject } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
import RequestUtils from '../../../help/utils/RequestUtils';
import { pickFilled } from '../../../help/utils/parameters';
import { commonOptions, paginationOptions } from '../../../help/utils/sharedOptions';

const ProjectMemberOperate: ResourceOperations = {
	name: '项目与人员关系',
	value: 'projectMember',
	action: '维护项目与人员关系',
	description: '查询 / 绑定 / 解绑项目成员',
	order: 50,
	options: [
		{
			displayName:
				'文档：<a href="https://opendocs.xiaojukeji.com/version2024/27001" target="_blank">项目与人员关系</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: '动作',
			name: 'actionType',
			type: 'options',
			options: [
				{ name: '查询项目成员', value: 'query' },
				{ name: '绑定', value: 'bind' },
				{ name: '解绑', value: 'unbind' },
			],
			default: 'query',
		},
		{
			displayName: '项目 ID',
			name: 'project_id',
			type: 'string',
			default: '',
			description: '与「项目编号 + 项目名称」二选一，同时有值时以项目 ID 为准',
		},
		{
			displayName: '项目编号',
			name: 'project_code',
			type: 'string',
			default: '',
		},
		{
			displayName: '项目名称',
			name: 'project_name',
			type: 'string',
			default: '',
			description: '用编号查询时必须同时传名称',
		},
		{
			displayName: '员工滴滴侧 ID',
			name: 'member_ids',
			type: 'string',
			default: '',
			displayOptions: { show: { actionType: ['bind', 'unbind'] } },
			description: '多个用英文逗号分隔，最多 100 个。传了此项则忽略员工信息类型',
		},
		{
			displayName: '员工信息类型',
			name: 'member_type',
			type: 'options',
			displayOptions: { show: { actionType: ['bind', 'unbind'] } },
			options: [
				{ name: '不使用', value: '' },
				{ name: '手机号', value: 0 },
				{ name: '工号', value: 1 },
				{ name: '邮箱', value: 2 },
			],
			default: '',
		},
		{
			displayName: '员工信息',
			name: 'member_values',
			type: 'string',
			default: '',
			displayOptions: { show: { actionType: ['bind', 'unbind'] } },
			description: '按员工信息类型传手机号/工号/邮箱，多个用英文逗号分隔，最多 100 个',
		},
		{
			displayName: '解绑范围',
			name: 'unbindType',
			type: 'options',
			displayOptions: { show: { actionType: ['unbind'] } },
			options: [
				{ name: '全部删除', value: 1 },
				{ name: '按员工批量删除', value: 2 },
			],
			default: 2,
		},
		{
			...paginationOptions.returnAll,
			displayOptions: { show: { actionType: ['query'] } },
		},
		{
			...paginationOptions.limit(50),
			displayOptions: { show: { actionType: ['query'], returnAll: [false] } },
		},
		commonOptions,
	],
	async call(this, index) {
		const actionType = this.getNodeParameter('actionType', index) as string;
		const project = pickFilled({
			project_id: this.getNodeParameter('project_id', index, ''),
			project_code: this.getNodeParameter('project_code', index, ''),
			project_name: this.getNodeParameter('project_name', index, ''),
		});

		if (actionType === 'query') {
			const result = (await RequestUtils.requestPaged.call(this, {
				url: '/river/Project/detail',
				qs: project,
				returnAll: this.getNodeParameter('returnAll', index, false) as boolean,
				limit: this.getNodeParameter('limit', index, 50) as number,
				lengthKey: 'lenth',
			})) as IDataObject;

			return (result.records as IDataObject[]) ?? [];
		}

		const members = pickFilled({
			member_ids: this.getNodeParameter('member_ids', index, ''),
			member_type: this.getNodeParameter('member_type', index, ''),
			member_values: this.getNodeParameter('member_values', index, ''),
		});

		if (actionType === 'bind') {
			return (await RequestUtils.request.call(this, {
				method: 'POST',
				url: '/river/Project/updateMember',
				body: { ...project, ...members },
			})) as IDataObject;
		}

		return (await RequestUtils.request.call(this, {
			method: 'POST',
			url: '/river/Project/delMember',
			body: {
				...project,
				...members,
				type: this.getNodeParameter('unbindType', index, 2),
			},
		})) as IDataObject;
	},
};

export default ProjectMemberOperate;
