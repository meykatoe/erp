import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

export function ChangePassword() {
  const toast = useToast();
  const [oldPassword, setOld] = useState('');
  const [newPassword, setNew] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/auth/change-password', { body: { oldPassword, newPassword } });
      toast('ok', '密碼已更新');
      setOld('');
      setNew('');
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>修改密碼</h2>
      </div>
      <form onSubmit={submit} className="form card narrow">
        <label>
          <span>舊密碼</span>
          <input type="password" value={oldPassword} onChange={(e) => setOld(e.target.value)} required />
        </label>
        <label>
          <span>新密碼(至少 8 碼)</span>
          <input type="password" minLength={8} value={newPassword} onChange={(e) => setNew(e.target.value)} required />
        </label>
        <footer>
          <button className="primary">更新密碼</button>
        </footer>
      </form>
    </section>
  );
}
