import type { IDataObject } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
import RequestUtils from '../../../help/utils/RequestUtils';
import { pickFilled } from '../../../help/utils/parameters';
import { paginationOptions, timeoutOnlyOptions } from '../../../help/utils/sharedOptions';

const GetOperate: ResourceOperations = {
	name: '员工列表(批量查询)',
	value: 'get',
	action: '批量查询员工列表',
	description: 'GET /river/Member/get',
	order: 10,
	requestIntervalMs: 0,
	options: [
		{
			displayName:
				'批量查询员工。工号、手机号精确匹配，姓名模糊匹配。文档：<a href="https://opendocs.xiaojukeji.com/version2024/11161" target="_blank">员工列表</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: '手机号',
			name: 'phone',
			type: 'string',
			default: '',
			description:
				'精确查询。大陆手机号可直接传 11 位，或按海外格式带区号；港澳台及海外须按「区号 + 空格 + 号码」，示例：+86 12345678910',
		},
		{
			displayName: '工号',
			name: 'employee_number',
			type: 'string',
			default: '',
			description: '精确查询',
		},
		{
			displayName: '邮箱',
			name: 'email',
			type: 'string',
			default: '',
		},
		{
			displayName: '姓名',
			name: 'realname',
			type: 'string',
			default: '',
			description: '模糊查询',
		},
		{
			displayName: '员工状态',
			name: 'status',
			type: 'multiOptions',
			options: [
				{ name: '正常', value: '1' },
				{ name: '离职', value: '4' },
				{ name: '未绑定手机号', value: '6' },
			],
			default: [],
			description: '为空或者没传，返回正常、离职和未绑定手机号的员工',
		},
		paginationOptions.returnAll,
		paginationOptions.limit(50),
		timeoutOnlyOptions,
	],
	async call(this, index) {
		const status = this.getNodeParameter('status', index, []) as string[] | string;
		const result = (await RequestUtils.requestPaged.call(this, {
			url: '/river/Member/get',
			qs: pickFilled({
				phone: this.getNodeParameter('phone', index, ''),
				employee_number: this.getNodeParameter('employee_number', index, ''),
				email: this.getNodeParameter('email', index, ''),
				realname: this.getNodeParameter('realname', index, ''),
				status: Array.isArray(status) ? status.filter(Boolean).join(',') : status,
			}),
			returnAll: this.getNodeParameter('returnAll', index, false) as boolean,
			limit: this.getNodeParameter('limit', index, 50) as number,
		})) as IDataObject;

		return (result.records as IDataObject[]) ?? [];
	},
};

export default GetOperate;
