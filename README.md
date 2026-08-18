# @luka-cat-mimi/n8n-nodes-didi-enterprise-admin

滴滴企业版管理后台的 n8n 社区节点。提供凭证（授权、签名、AES）以及部门/项目、员工相关操作，用于把企业管理后台与滴滴企业版对接进工作流。

节点名称：`didiEnterpriseAdmin`  
凭证名称：`滴滴企业版管理 API`（`didiEnterpriseAdminApi`）

## 安装

参考：[n8n 社区节点安装指南](https://docs.n8n.io/integrations/community-nodes/installation/)

节点包名：`@luka-cat-mimi/n8n-nodes-didi-enterprise-admin`

```bash
npm install @luka-cat-mimi/n8n-nodes-didi-enterprise-admin
```

请将 n8n 出口 IP 加入开放平台「开发配置 → 安全设置 → IP 白名单」，否则接口会返回 `10002`。

## 功能列表

共计 **2 个资源**、**9 个操作**。

### 部门或项目 (5)

- 部门或项目查询
- 部门或项目新增
- 部门或项目修改
- 部门或项目删除
- 项目与人员关系（查询 / 绑定 / 解绑）

### 员工 (4)

- 员工列表（批量查询）
- 员工新增
- 员工修改
- 员工删除

## 凭证配置

对应开放平台应用信息 +「开发配置 → 安全设置 → 接口加密信息」：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| API 基础地址 | 是 | 默认 `https://api.es.xiaojukeji.com` |
| Client ID | 是 | 应用唯一标识 |
| Client Secret | 是 | 应用密钥，用于获取 `access_token` |
| Sign Key | 是 | 签名密钥，只参与签名，不随请求传递 |
| Company ID | 是 | 企业 ID |
| 签名算法 | 是 | `SHA256`（平台默认）或 `MD5`，须与安全设置一致 |
| 加密算法 | 是 | `AES128` 或 `AES256`，须与安全设置一致 |
| 密钥 | 是 | 接口加密信息中的密钥，用于 AES。AES128 与 AES256 密钥不同 |

保存凭证时会调用 [授权认证接口](https://opendocs.xiaojukeji.com/version2024/10951) `POST /river/Auth/authorize` 获取 `access_token`（有效期 30 分钟，凭证内自动缓存）。凭证测试会针对签名失败、参数错误、IP 白名单失败给出提示。

## 节点操作

### 部门或项目

模块文档：https://opendocs.xiaojukeji.com/version2024/11099

| 操作 | 接口 | 文档 |
| --- | --- | --- |
| 部门或项目查询 | `GET /river/BudgetCenter/get` | [查询](https://opendocs.xiaojukeji.com/version2024/11105) |
| 部门或项目新增 | `POST /river/BudgetCenter/add` | [新增](https://opendocs.xiaojukeji.com/version2024/11107) |
| 部门或项目修改 | `POST /river/BudgetCenter/edit` | [修改](https://opendocs.xiaojukeji.com/version2024/11109) |
| 部门或项目删除 | `POST /river/BudgetCenter/del` | [删除](https://opendocs.xiaojukeji.com/version2024/11111) |
| 项目与人员关系 | 查询 `GET /river/Project/detail`；绑定 `POST /river/Project/updateMember`；解绑 `POST /river/Project/delMember` | [项目与人员关系](https://opendocs.xiaojukeji.com/version2024/27001) |

查询支持按类型（部门/项目/全部）、滴滴侧 ID、外部编号、名称精确/模糊匹配；可选返回限额规则、POI、扩展字段。列表结果直接展开为多条 item。

### 员工

模块文档：https://opendocs.xiaojukeji.com/version2024/11101

| 操作 | 接口 | 文档 |
| --- | --- | --- |
| 员工列表（批量查询） | `GET /river/Member/get` | [员工列表](https://opendocs.xiaojukeji.com/version2024/11161) |
| 员工新增 | `POST /river/Member/single` | [新增](https://opendocs.xiaojukeji.com/version2024/11155) |
| 员工修改 | `POST /river/Member/edit` | [修改](https://opendocs.xiaojukeji.com/version2024/11157) |
| 员工删除 | `POST /river/Member/del` | [删除](https://opendocs.xiaojukeji.com/version2024/11159) |

员工列表支持手机号、工号精确匹配，姓名模糊匹配，以及按状态筛选。新增/修改时，出生日期与证件号会按官方规则 `MD5(es_traveler_{company_id})` 做 AES128 加密后传输。删除不可逆，单次最多 100 人，定位优先级：滴滴侧 ID > 手机号 > 工号 > 邮箱。

## 通用参数

查询类操作统一使用 `Return All` / `Limit` 分页：开启 `Return All` 自动翻页拉取全部，否则按 `Limit` 返回（单页上限 100 条，超出时内部翻页拼接），无需手动传起始位置。

所有操作都提供 `Options`：

| 选项 | 说明 | 适用范围 |
| --- | --- | --- |
| Batching → Items per Batch | 每批并发请求数量，添加该选项后启用并发模式 | 写操作 |
| Batching → Batch Interval (Ms) | 每批之间的等待时间，最小 150 毫秒 | 写操作 |
| Timeout | 单次请求超时时间（毫秒），0 表示不限制 | 全部操作 |

滴滴对写操作有频率限制（连续请求间隔须 ≥150 毫秒），因此新增/修改/删除类操作默认按 150 毫秒逐条限速，Batching 的批间隔也不会低于该值；查询类操作不受此限制，只提供 `Timeout`。

## 实现说明

- 签名算法：https://opendocs.xiaojukeji.com/version2024/10945
- AES 算法：https://opendocs.xiaojukeji.com/version2024/10953
- GET 接口把签名参数放在 Query；POST 接口放在 JSON Body
- 凭证会自动补齐 `client_id` / `company_id` / `access_token` / `timestamp` / `sign`
- 接口成功时节点直接输出 `data` 层；列表类查询会把数组拆成多条 n8n item
- 资源与操作按文件自动加载：在 `nodes/DidiEnterpriseAdmin/resource/` 新增模块即可，无需改节点入口

## 开发

```bash
npm install
npm run build
npm run lint
npm run test:crypto
npm run dev
```

发布到 npm 请使用 `npm run release`。打出版本 tag 后，GitHub Actions 会按 provenance 要求发布社区节点。

## 许可证

MIT。详见 [LICENSE.md](./LICENSE.md)。
