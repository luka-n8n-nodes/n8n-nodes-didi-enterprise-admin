# Changelog

## 0.1.0 - 2026-08-18

- 新增滴滴企业版管理 API 凭证：Client ID / Client Secret / Sign Key / Company ID
- 支持安全设置中的签名算法（MD5 / SHA256）与加密算法（AES128 / AES256）
- 保存凭证时自动调用授权认证接口获取并缓存 access_token
- 新增部门或项目：查询、新增、修改、删除、项目与人员关系
- 新增员工：查询、新增、修改、删除
