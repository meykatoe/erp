import { redact } from './audit.interceptor';

describe('redact', () => {
  it('遮蔽密碼欄位', () => {
    expect(redact({ email: 'a@b.c', password: 'secret' })).toEqual({
      email: 'a@b.c',
      password: '***',
    });
  });

  it('非物件原樣回傳', () => {
    expect(redact(undefined)).toBeUndefined();
  });
});
