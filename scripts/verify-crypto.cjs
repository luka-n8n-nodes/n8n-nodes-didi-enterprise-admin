'use strict';

const assert = require('assert');
const { aesDecrypt, aesEncrypt, genSign } = require('../dist/nodes/help/utils/didiCrypto');

const signParams = {
	client_id: 'client_id1',
	client_secret: 'client_secret1',
	grant_type: 'client_credentials',
	phone: '11000001234',
	timestamp: 1566477389,
};

assert.strictEqual(
	genSign(signParams, 'sign_key1', 'md5'),
	'c52b8bac5e980da9ac557db412c20580',
	'MD5 签名与官方示例不一致',
);
assert.strictEqual(
	genSign(signParams, 'sign_key1', 'sha256'),
	'6f296c236346659f6351d548e3ec4260ac9847b117a1cc9428fd709a5976a8c5',
	'SHA256 签名与官方示例不一致',
);

const aes128Key = '64ecd6a08ced45ad5d7fedd0c347f6c9';
const aes128Plain =
	'{"phone": "00016270252","birth_date": "2050-01-01", "name": "\\u5916\\u90e8\\u51fa\\u884c\\u4eba_\\u6d4b\\u8bd5_1", "card_list": [{"card_type": 1, "card_no": "513126199803290017", "expire_date": "2050-01-01"}]}';
const aes128Cipher =
	'UyCHdn/a5NOCBo9iY+3bTk9hsa4wFK6w1JBjc6L/LKxBuG2/uEgWleRsdtsFT1T6ZkJsbHGC3CBis3IxZN5//SxrZT2VB0gbiewV0cLQH4re6ekMTLWu6AKtJ4IU9ys62QApFypCWVUy2aGlN9WbhvIRD5iJYgXD2J5CIJ5xbpBpzMvLqiBfb3tmicVI3+p8hxXxfSqKr2z99BMzQiFeSsL0TkGniLHUUiuYmfkZVblpnhqYuKidE6Xzeqh6vvMVxlmUjUZ3ZPkrWx+b6ypbTg==';

assert.strictEqual(aesEncrypt(aes128Plain, aes128Key, 'aes128'), aes128Cipher, 'AES128 加密与官方示例不一致');
assert.strictEqual(aesDecrypt(aes128Cipher, aes128Key, 'aes128'), aes128Plain, 'AES128 解密与官方示例不一致');

const aes256Key = '0495ad3bc8f9e8e9d425fde24af5ca03225465ef37e242c6243df32baf79f48e';
const aes256Plain =
	'ent=2&companyId=1125909874810584&company_id=1125909874810584&timestamp=1741774912437&offset=0&length=100';
const aes256Cipher = aesEncrypt(aes256Plain, aes256Key, 'aes256');
assert.strictEqual(aesDecrypt(aes256Cipher, aes256Key, 'aes256'), aes256Plain, 'AES256 往返解密失败');
assert.match(aes256Cipher, /^[A-Za-z0-9_-]+=*$/, 'AES256 密文应为 URL-Safe Base64');

console.log('didi crypto official vectors: ok');
