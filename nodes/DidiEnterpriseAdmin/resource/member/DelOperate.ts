import type { IDataObject } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
import RequestUtils from '../../../help/utils/RequestUtils';
import { pickFilled } from '../../../help/utils/parameters';
import { commonOptions } from '../../../help/utils/sharedOptions';

const DelOperate: ResourceOperations = {
	name: '员工删除',
	value: 'del',
	action: '删除员工',
	description: 'POST /river/Member/del',
	order: 40,
	options: [
		{
			displayName:
				'删除不可逆，单次最多 100 人。四个标识选一，优先级：滴滴侧 ID > 手机号 > 工号 > 邮箱。文档：<a href="https://opendocs.xiaojukeji.com/version2024/11159" target="_blank">员工删除</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: '定位方式',
			name: 'identifyBy',
			type: 'options',
			options: [
				{ name: '滴滴侧 ID', value: 'member_id' },
				{ name: '手机号', value: 'employee_phone' },
				{ name: '工号', value: 'employee_number' },
				{ name: '邮箱', value: 'employee_email' },
			],
			default: 'member_id',
		},
		{
			displayName: '员工滴滴侧 ID',
			name: 'member_id',
			type: 'string',
			default: '',
			displayOptions: { show: { identifyBy: ['member_id'] } },
			description: '多个用 _ 分隔',
		},
		{
			displayName: '手机号列表',
			name: 'employee_phone',
			type: 'string',
			default: '',
			displayOptions: { show: { identifyBy: ['employee_phone'] } },
			description: 'JSON 数组，例如 ["18012345678","+86 00012014076"]',
		},
		{
			displayName: '工号列表',
			name: 'employee_number',
			type: 'string',
			default: '',
			displayOptions: { show: { identifyBy: ['employee_number'] } },
			description: 'JSON 数组，例如 ["D1001","D1002"]',
		},
		{
			displayName: '邮箱列表',
			name: 'employee_email',
			type: 'string',
			default: '',
			displayOptions: { show: { identifyBy: ['employee_email'] } },
			description: 'JSON 数组',
		},
		commonOptions,
	],
	async call(this, index) {
		const identifyBy = this.getNodeParameter('identifyBy', index) as string;
		const raw = String(this.getNodeParameter(identifyBy, index, '')).trim();
		const value =
			identifyBy === 'member_id'
				? raw
				: raw.startsWith('[')
					? raw
					: JSON.stringify(
							raw
								.split(/[,_\n]/)
								.map((item) => item.trim())
								.filter(Boolean),
						);
		const body = pickFilled({
			[identifyBy]: value,
		});

		return (await RequestUtils.request.call(this, {
			method: 'POST',
			url: '/river/Member/del',
			body,
		})) as IDataObject;
	},
};

export default DelOperate;
