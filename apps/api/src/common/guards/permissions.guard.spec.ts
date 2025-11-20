import { hasPermissions } from './permissions.guard';

describe('hasPermissions', () => {
  it('擁有全部所需權限', () => {
    expect(hasPermissions(['a', 'b'], ['a'])).toBe(true);
  });

  it('缺少任一權限即拒絕', () => {
    expect(hasPermissions(['a'], ['a', 'b'])).toBe(false);
  });
});
