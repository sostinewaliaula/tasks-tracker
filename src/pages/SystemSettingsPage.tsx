import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { ShieldIcon, SettingsIcon, KeyIcon, ServerIcon, SaveIcon } from 'lucide-react';

type LdapSettings = {
  host: string;
  port: number;
  useSSL: boolean;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  userFilter: string;
};

type RolePermissions = {
  superadmin: string[];
  manager: string[];
  employee: string[];
};

export function SystemSettingsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [ldap, setLdap] = useState<LdapSettings>({
    host: 'ldap://localhost',
    port: 389,
    useSSL: false,
    baseDN: 'dc=example,dc=com',
    bindDN: 'cn=admin,dc=example,dc=com',
    bindPassword: '',
    userFilter: '(mail={{email}})'
  });

  const [permissions, setPermissions] = useState<RolePermissions>({
    superadmin: ['manage_system', 'manage_roles', 'view_all_departments', 'manage_departments'],
    manager: ['view_department', 'create_task', 'assign_task', 'view_reports'],
    employee: ['create_task', 'view_own_tasks']
  });

  const handleSave = () => {
    // For now, just mock-save to console. Replace with API later.
    // eslint-disable-next-line no-console
    console.log('Saving LDAP settings', ldap);
    // eslint-disable-next-line no-console
    console.log('Saving Role permissions', permissions);
    showToast('Settings saved (mock). Backend integration pending.', 'info');
  };

  const handleLdapSync = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/sync-ldap-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      const contentType = res.headers.get('content-type') || '';
      const bodyText = await res.text();
      let data: any = null;
      if (contentType.includes('application/json')) {
        try { data = JSON.parse(bodyText); } catch {}
      }
      if (!res.ok) {
        const errMsg = (data && data.error) ? data.error : (bodyText || 'Sync failed');
        throw new Error(errMsg);
      }
      const synced = data?.synced ?? 0;
      setSyncMessage(`Synced ${synced} users from LDAP.`);
      showToast(`Synced ${synced} users from LDAP.`, 'success');
    } catch (e: any) {
      setSyncMessage(e?.message || 'Sync failed');
      showToast(e?.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePermToggle = (role: keyof RolePermissions, perm: string) => {
    setPermissions(prev => {
      const set = new Set(prev[role]);
      if (set.has(perm)) set.delete(perm); else set.add(perm);
      return { ...prev, [role]: Array.from(set) } as RolePermissions;
    });
  };

  const allPerms = Array.from(new Set(Object.values(permissions).flat()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
            <SettingsIcon className="h-7 w-7 mr-3 text-[#2e9d74]" />
            System Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">Configure LDAP integration and role permissions.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button onClick={handleSave} disabled={currentUser?.role !== 'superadmin'} className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${currentUser?.role === 'superadmin' ? 'bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}>
            <SaveIcon className="h-5 w-5 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LDAP Settings (viewable to all; editable only by super admin) */}
        <div className="card">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex items-center">
            <ServerIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">LDAP Integration</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Host</label>
              <input disabled={currentUser?.role !== 'superadmin'} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm disabled:bg-gray-100" value={ldap.host} onChange={e => setLdap({ ...ldap, host: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Port</label>
                <input disabled={currentUser?.role !== 'superadmin'} type="number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm disabled:bg-gray-100" value={ldap.port} onChange={e => setLdap({ ...ldap, port: Number(e.target.value) })} />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center text-sm text-gray-700">
                  <input disabled={currentUser?.role !== 'superadmin'} type="checkbox" className="mr-2" checked={ldap.useSSL} onChange={e => setLdap({ ...ldap, useSSL: e.target.checked })} />
                  Use SSL
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Base DN</label>
              <input disabled={currentUser?.role !== 'superadmin'} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm disabled:bg-gray-100" value={ldap.baseDN} onChange={e => setLdap({ ...ldap, baseDN: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bind DN</label>
                <input disabled={currentUser?.role !== 'superadmin'} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm disabled:bg-gray-100" value={ldap.bindDN} onChange={e => setLdap({ ...ldap, bindDN: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bind Password</label>
                <input disabled={currentUser?.role !== 'superadmin'} type="password" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm disabled:bg-gray-100" value={ldap.bindPassword} onChange={e => setLdap({ ...ldap, bindPassword: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">User Filter</label>
              <input disabled={currentUser?.role !== 'superadmin'} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm disabled:bg-gray-100" value={ldap.userFilter} onChange={e => setLdap({ ...ldap, userFilter: e.target.value })} />
              <p className="text-xs text-gray-500 mt-1">Use {'{{email}}'} placeholder for login input.</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-500">
                Values can be linked to server .env (admin-only backend integration).
              </div>
              <button
                onClick={handleLdapSync}
                disabled={isSyncing || (currentUser?.role !== 'admin')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border ${isSyncing || (currentUser?.role !== 'admin') ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-transparent text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90'}`}
              >
                {isSyncing ? 'Syncing…' : 'Sync Users from LDAP'}
              </button>
            </div>
            {syncMessage && (
              <div className="text-sm mt-2 text-gray-700">{syncMessage}</div>
            )}
          </div>
        </div>

        {/* Role Permissions (viewable; editable only by super admin) */}
        <div className="card">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex items-center">
            <ShieldIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Role Permissions</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Super Admin</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allPerms.map(perm => (
                    <tr key={perm}>
                      <td className="px-4 py-2 text-sm text-gray-700">{perm}</td>
                      {(['superadmin', 'manager', 'employee'] as const).map(role => (
                        <td key={role} className="px-4 py-2 text-center">
                          <input disabled={currentUser?.role !== 'superadmin'} type="checkbox" checked={permissions[role].includes(perm)} onChange={() => handlePermToggle(role, perm)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add new permission */}
            <div className="flex items-center space-x-2">
              <KeyIcon className="h-4 w-4 text-gray-500" />
              <input disabled={currentUser?.role !== 'superadmin'} placeholder="Add permission key (e.g., manage_system)" className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm disabled:bg-gray-100" onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (!val) return;
                  if (!allPerms.includes(val)) {
                    setPermissions(prev => ({
                      superadmin: [...prev.superadmin, val],
                      manager: prev.manager,
                      employee: prev.employee
                    }));
                  }
                  (e.target as HTMLInputElement).value = '';
                }
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


