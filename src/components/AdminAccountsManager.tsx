import React, { useState, useMemo } from 'react';
import { AdminAccountItem, AdminRoleType, ALL_ADMIN_PERMISSIONS } from '../types';
import { loadAdminAccounts, saveAdminAccounts, addAdminAccount, updateAdminAccount, deleteAdminAccount, resetAdminPassword, getActiveMadrasah } from '../utils/storage';
import { UserSession } from '../utils/auth';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  Check,
  Copy,
  KeyRound,
  Eye,
  EyeOff,
  Printer,
  X,
  Sparkles,
  RefreshCw,
  Lock,
  Users,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Building2,
  FileText,
  Clock,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  Filter,
  Save,
  Download
} from 'lucide-react';

interface AdminAccountsManagerProps {
  userSession?: UserSession | null;
  onClose?: () => void;
}

export const AdminAccountsManager: React.FC<AdminAccountsManagerProps> = ({ userSession, onClose }) => {
  const [accounts, setAccounts] = useState<AdminAccountItem[]>(() => loadAdminAccounts());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccountItem | null>(null);
  const [resetModalAccount, setResetModalAccount] = useState<AdminAccountItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState<{
    username: string;
    password: string;
    pin: string;
    namaLengkap: string;
    role: AdminRoleType;
    email: string;
    noWhatsapp: string;
    status: 'aktif' | 'nonaktif';
    jabatanKhusus: string;
    permissions: string[];
    notes: string;
  }>({
    username: '',
    password: '',
    pin: '123456',
    namaLengkap: '',
    role: 'admin',
    email: '',
    noWhatsapp: '',
    status: 'aktif',
    jabatanKhusus: '',
    permissions: ALL_ADMIN_PERMISSIONS.map(p => p.id),
    notes: ''
  });

  // Reset password states
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');

  const activeMadrasah = getActiveMadrasah();

  const refreshAccounts = () => {
    const list = loadAdminAccounts();
    setAccounts(list);
  };

  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  // Toggle password visibility
  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy credentials
  const handleCopyCredentials = (acc: AdminAccountItem) => {
    const text = `*KREDENSIAL LOGIN ADMIN SEKOLAH*\n` +
      `Madrasah: ${activeMadrasah?.nama || "MI Ma'arif NU"}\n` +
      `Nama: ${acc.namaLengkap}\n` +
      `Peran: ${acc.role.toUpperCase()}\n` +
      `Username: ${acc.username}\n` +
      `Kata Sandi: ${acc.password || 'admin'}\n` +
      `PIN: ${acc.pin || '123456'}\n` +
      `Akses: https://kbc.madrasah.id`;

    navigator.clipboard.writeText(text);
    setCopiedId(acc.id);
    showAlert(`Kredensial login untuk ${acc.namaLengkap} berhasil disalin ke clipboard!`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open add modal
  const handleOpenAddModal = () => {
    setFormData({
      username: '',
      password: '',
      pin: '123456',
      namaLengkap: '',
      role: 'admin',
      email: '',
      noWhatsapp: '',
      status: 'aktif',
      jabatanKhusus: '',
      permissions: ALL_ADMIN_PERMISSIONS.map(p => p.id),
      notes: ''
    });
    setEditingAccount(null);
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (acc: AdminAccountItem) => {
    setEditingAccount(acc);
    setFormData({
      username: acc.username,
      password: acc.password || '',
      pin: acc.pin || '123456',
      namaLengkap: acc.namaLengkap,
      role: acc.role,
      email: acc.email || '',
      noWhatsapp: acc.noWhatsapp || '',
      status: acc.status || 'aktif',
      jabatanKhusus: acc.jabatanKhusus || '',
      permissions: acc.permissions || ALL_ADMIN_PERMISSIONS.map(p => p.id),
      notes: acc.notes || ''
    });
    setIsAddModalOpen(true);
  };

  // Handle submit form (Add or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      showAlert('Username akun wajib diisi!', 'error');
      return;
    }
    if (!formData.namaLengkap.trim()) {
      showAlert('Nama lengkap admin wajib diisi!', 'error');
      return;
    }

    if (editingAccount) {
      // Update
      const res = updateAdminAccount(editingAccount.id, {
        username: formData.username.trim().toLowerCase(),
        password: formData.password.trim() || editingAccount.password,
        pin: formData.pin.trim() || editingAccount.pin,
        namaLengkap: formData.namaLengkap.trim(),
        role: formData.role,
        email: formData.email.trim(),
        noWhatsapp: formData.noWhatsapp.trim(),
        status: formData.status,
        jabatanKhusus: formData.jabatanKhusus.trim(),
        permissions: formData.permissions,
        notes: formData.notes.trim()
      });

      if (res.success) {
        showAlert(res.message, 'success');
        setIsAddModalOpen(false);
        setEditingAccount(null);
        refreshAccounts();
      } else {
        showAlert(res.message, 'error');
      }
    } else {
      // Create new
      if (!formData.password.trim()) {
        showAlert('Kata sandi wajib diisi untuk akun baru!', 'error');
        return;
      }
      const res = addAdminAccount({
        username: formData.username.trim().toLowerCase(),
        password: formData.password.trim(),
        pin: formData.pin.trim() || '123456',
        namaLengkap: formData.namaLengkap.trim(),
        role: formData.role,
        email: formData.email.trim(),
        noWhatsapp: formData.noWhatsapp.trim(),
        status: formData.status,
        jabatanKhusus: formData.jabatanKhusus.trim(),
        permissions: formData.permissions,
        notes: formData.notes.trim()
      });

      if (res.success) {
        showAlert(res.message, 'success');
        setIsAddModalOpen(false);
        refreshAccounts();
      } else {
        showAlert(res.message, 'error');
      }
    }
  };

  // Toggle status
  const handleToggleStatus = (acc: AdminAccountItem) => {
    if (acc.isProtected) {
      showAlert('Akun Super Admin Utama dilindungi dan tidak dapat dinonaktifkan!', 'error');
      return;
    }
    const newStatus = acc.status === 'aktif' ? 'nonaktif' : 'aktif';
    const res = updateAdminAccount(acc.id, { status: newStatus });
    if (res.success) {
      showAlert(`Status akun "${acc.namaLengkap}" diubah menjadi ${newStatus.toUpperCase()}`, 'success');
      refreshAccounts();
    }
  };

  // Delete account
  const handleDeleteAccount = (acc: AdminAccountItem) => {
    if (acc.isProtected || acc.username.toLowerCase() === 'jaenalmaskun@gmail.com') {
      showAlert('Akun Super Admin Utama dilindungi dan tidak dapat dihapus!', 'error');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun admin "${acc.namaLengkap}" (${acc.username})?`)) {
      const res = deleteAdminAccount(acc.id);
      if (res.success) {
        showAlert(res.message, 'success');
        refreshAccounts();
      } else {
        showAlert(res.message, 'error');
      }
    }
  };

  // Open reset password modal
  const handleOpenResetModal = (acc: AdminAccountItem) => {
    setResetModalAccount(acc);
    setNewPassword('');
    setNewPin(acc.pin || '123456');
  };

  // Handle submit reset password
  const handleSubmitResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalAccount) return;
    if (!newPassword.trim()) {
      showAlert('Kata sandi baru tidak boleh kosong!', 'error');
      return;
    }

    const res = resetAdminPassword(resetModalAccount.id, newPassword.trim(), newPin.trim());
    if (res.success) {
      showAlert(res.message, 'success');
      setResetModalAccount(null);
      refreshAccounts();
    } else {
      showAlert(res.message, 'error');
    }
  };

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        acc.username.toLowerCase().includes(q) ||
        acc.namaLengkap.toLowerCase().includes(q) ||
        (acc.email && acc.email.toLowerCase().includes(q)) ||
        (acc.noWhatsapp && acc.noWhatsapp.includes(q)) ||
        acc.role.toLowerCase().includes(q);

      const matchRole = roleFilter === 'all' || acc.role === roleFilter;
      const matchStatus = statusFilter === 'all' || acc.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  // Role Badge Helper
  const getRoleBadge = (role: AdminRoleType) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            <span>Super Admin</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span>Administrator</span>
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
            <Users className="w-3 h-3 text-blue-600" />
            <span>Operator</span>
          </span>
        );
      case 'kepala_madrasah':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Kepala Madrasah</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{role}</span>
          </span>
        );
    }
  };

  // Stats calculation
  const totalCount = accounts.length;
  const superCount = accounts.filter(a => a.role === 'superadmin').length;
  const adminCount = accounts.filter(a => a.role === 'admin').length;
  const operatorCount = accounts.filter(a => a.role === 'operator').length;
  const activeCount = accounts.filter(a => a.status === 'aktif').length;

  return (
    <div className="space-y-6">
      {/* Alert toast */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-md transition-all duration-200 ${
            alertMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : alertMessage.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            ) : alertMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-200" />
            ) : (
              <Shield className="w-5 h-5 shrink-0 text-blue-200" />
            )}
            <p className="text-sm font-semibold">{alertMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setAlertMessage(null)}
            className="p-1 hover:bg-white/20 rounded-lg text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300 backdrop-blur-md">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Kelola Akun Administrator & Operator Sekolah
              </h3>
            </div>
            <p className="text-xs text-slate-300/90 max-w-2xl leading-relaxed">
              Atur hak akses login pengelola sistem madrasah, mulai dari Super Admin, Administrator, Operator Sekolah, hingga Kepala Madrasah dengan kredensial mandiri dan perlindungan hak akses penuh.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 flex-wrap gap-y-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Cetak Kartu Login</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md active:scale-95 ring-2 ring-emerald-500/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Akun Admin</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Total Akun</span>
            <span className="text-lg font-black text-white">{totalCount}</span>
          </div>
          <div className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-purple-300 font-bold block">Super Admin</span>
            <span className="text-lg font-black text-purple-300">{superCount}</span>
          </div>
          <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">Administrator</span>
            <span className="text-lg font-black text-emerald-300">{adminCount}</span>
          </div>
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">Operator</span>
            <span className="text-lg font-black text-blue-300">{operatorCount}</span>
          </div>
          <div className="bg-teal-900/20 border border-teal-700/30 rounded-xl p-2.5 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase tracking-wider text-teal-300 font-bold block">Status Aktif</span>
            <span className="text-lg font-black text-teal-300">{activeCount} / {totalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, username, email, WhatsApp..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {/* Role Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Peran</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Administrator</option>
              <option value="operator">Operator</option>
              <option value="kepala_madrasah">Kepala Madrasah</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Account List Display */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-700">Tidak ada akun admin yang sesuai</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau filter peran/status untuk menemukan akun yang dicari.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
            className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const isPwVisible = visiblePasswords[acc.id] || false;
            const isSuper = acc.role === 'superadmin' || acc.isProtected;

            return (
              <div
                key={acc.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                  acc.status === 'nonaktif'
                    ? 'border-slate-200 opacity-75 bg-slate-50/50'
                    : isSuper
                    ? 'border-purple-200 ring-1 ring-purple-500/20'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Top Accent Strip */}
                <div
                  className={`h-1.5 w-full ${
                    acc.role === 'superadmin'
                      ? 'bg-purple-600'
                      : acc.role === 'admin'
                      ? 'bg-emerald-500'
                      : acc.role === 'operator'
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                />

                <div className="p-4 sm:p-5 space-y-4 flex-1">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                          {acc.namaLengkap}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {getRoleBadge(acc.role)}
                        {acc.isProtected && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Utama</span>
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            acc.status === 'aktif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {acc.status === 'aktif' ? '● Aktif' : '○ Nonaktif'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] font-semibold text-slate-400">Username / ID:</span>
                      <span className="font-mono font-bold text-slate-800 select-all bg-white px-2 py-0.5 rounded border border-slate-200">
                        {acc.username}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] font-semibold text-slate-400">Password:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {isPwVisible ? (acc.password || 'admin') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePassword(acc.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title={isPwVisible ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                        >
                          {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {acc.pin && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] font-semibold text-slate-400">PIN Cepat:</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {acc.pin}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {acc.email && (
                      <div className="flex items-center space-x-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{acc.email}</span>
                      </div>
                    )}
                    {acc.noWhatsapp && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <a
                          href={`https://wa.me/${acc.noWhatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline font-medium inline-flex items-center space-x-1"
                        >
                          <span>{acc.noWhatsapp}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                    {acc.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{acc.notes}"
                      </p>
                    )}
                  </div>

                  {/* Permissions pill list preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hak Akses Modul ({acc.permissions?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {(acc.permissions || []).map((permId) => {
                        const permDef = ALL_ADMIN_PERMISSIONS.find(p => p.id === permId);
                        return (
                          <span
                            key={permId}
                            className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200"
                          >
                            {permDef?.label.split('(')[0].trim() || permId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(acc)}
                      className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors"
                      title="Salin Kredensial Login"
                    >
                      {copiedId === acc.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px]">Salin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenResetModal(acc)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors"
                      title="Reset Kata Sandi / PIN"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Sandi</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(acc)}
                      disabled={acc.isProtected}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        acc.isProtected
                          ? 'text-slate-300 cursor-not-allowed'
                          : acc.status === 'aktif'
                          ? 'text-amber-700 hover:bg-amber-100 bg-amber-50'
                          : 'text-emerald-700 hover:bg-emerald-100 bg-emerald-50'
                      }`}
                      title={acc.isProtected ? 'Akun utama tidak dapat dinonaktifkan' : 'Ubah status aktif / nonaktif'}
                    >
                      {acc.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(acc)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Data Akun"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc)}
                      disabled={acc.isProtected}
                      className={`p-1.5 rounded-lg transition-colors ${
                        acc.isProtected
                          ? 'text-slate-200 cursor-not-allowed'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={acc.isProtected ? 'Akun utama tidak dapat dihapus' : 'Hapus Akun'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nama & Peran</th>
                  <th className="px-4 py-3">Username & Kontak</th>
                  <th className="px-4 py-3">Password / PIN</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredAccounts.map((acc) => {
                  const isPwVisible = visiblePasswords[acc.id] || false;
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 space-y-1">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {acc.namaLengkap}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {getRoleBadge(acc.role)}
                          {acc.isProtected && (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                              Utama
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 space-y-1">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 block w-fit">
                          {acc.username}
                        </span>
                        {acc.email && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{acc.email}</div>
                        )}
                        {acc.noWhatsapp && (
                          <div className="text-[11px] text-emerald-600 font-medium">{acc.noWhatsapp}</div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {isPwVisible ? (acc.password || 'admin') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePassword(acc.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {acc.pin && (
                          <div className="text-[11px] text-slate-400 mt-1">PIN: {acc.pin}</div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            acc.status === 'aktif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {acc.status === 'aktif' ? '● Aktif' : '○ Nonaktif'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(acc)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Salin Kredensial"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenResetModal(acc)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Reset Kata Sandi"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(acc)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Edit Akun"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc)}
                            disabled={acc.isProtected}
                            className={`p-1.5 rounded-lg ${
                              acc.isProtected
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Akun Admin */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {editingAccount ? 'Edit Akun Administrator / Operator' : 'Tambah Akun Admin / Operator Baru'}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Konfigurasikan username, peran, kata sandi, dan hak akses modul
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Username / ID Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="e.g. admin_kurikulum, op_sarpras"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Huruf kecil, angka, atau garis bawah tanpa spasi</p>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Peran / Hak Akses <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as AdminRoleType;
                      // Preset permissions based on role
                      let perms = ALL_ADMIN_PERMISSIONS.map(p => p.id);
                      if (newRole === 'operator') {
                        perms = ['kelola_modul', 'kelola_bank_materi', 'kelola_guru', 'kelola_siswa'];
                      } else if (newRole === 'kepala_madrasah') {
                        perms = ['kelola_modul', 'kelola_guru', 'kelola_pengaturan'];
                      }
                      setFormData({ ...formData, role: newRole, permissions: perms });
                    }}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="admin">Administrator Madrasah (Lengkap)</option>
                    <option value="operator">Operator Madrasah (Modul & Siswa)</option>
                    <option value="kepala_madrasah">Kepala Madrasah (Verifikator)</option>
                    <option value="superadmin">Super Admin (Akses Penuh)</option>
                  </select>
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaLengkap}
                    onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                    placeholder="e.g. Ahmad Fauzi, S.Pd. / Operator Madrasah"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi (Password) {editingAccount ? '(Biarkan kosong jika tidak diubah)' : <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingAccount ? 'Kata sandi tetap...' : 'Masukkan kata sandi login'}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                {/* PIN */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    PIN Akses Cepat (6 Digit)
                  </label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                    placeholder="123456"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Kontak
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@madrasah.id"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                {/* No WhatsApp */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.noWhatsapp}
                    onChange={(e) => setFormData({ ...formData, noWhatsapp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="aktif">Aktif (Dapat Login)</option>
                    <option value="nonaktif">Nonaktif (Diblokir Sementara)</option>
                  </select>
                </div>

                {/* Catatan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Catatan / Jabatan Tambahan
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. PJ Input Kurikulum Kelas Atas"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hak Akses Granular Permissions Checklist */}
              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Hak Akses Modul Aplikasi
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, permissions: ALL_ADMIN_PERMISSIONS.map(p => p.id) })}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, permissions: [] })}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      Hapus Semua
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {ALL_ADMIN_PERMISSIONS.map((perm) => {
                    const isChecked = formData.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start space-x-2 p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                          isChecked
                            ? 'bg-white border-indigo-200 text-indigo-950 shadow-2xs font-semibold'
                            : 'bg-slate-50/50 border-transparent text-slate-600 hover:bg-white/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, permissions: [...formData.permissions, perm.id] });
                            } else {
                              setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm.id) });
                            }
                          }}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="block leading-tight">{perm.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{perm.category}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingAccount ? 'Simpan Perubahan' : 'Tambah Akun Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password / PIN */}
      {resetModalAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">Reset Kata Sandi & PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalAccount(null)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResetPassword} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="text-slate-500 font-semibold">Mengubah kredensial akun:</p>
                <p className="font-extrabold text-slate-800 text-sm">{resetModalAccount.namaLengkap}</p>
                <p className="font-mono text-indigo-700">Username: {resetModalAccount.username}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  PIN 6 Digit Baru
                </label>
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResetModalAccount(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md active:scale-95 flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Sandi Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Printable Admin Login Cards */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base">Cetak Slip & Kartu Login Admin Sekolah</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Content */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50">
              <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                <h2 className="text-lg font-black uppercase text-slate-800">
                  KARTU KREDENSIAL LOGIN PENGELOLA SISTEM
                </h2>
                <p className="text-xs font-bold text-slate-600">
                  {activeMadrasah?.nama || "MI Ma'arif NU 2 Sanggreman"} • Tahun Pelajaran 2025/2026
                </p>
                <p className="text-[11px] text-slate-500">
                  Harap simpan dan jaga kerahasiaan username & kata sandi akun masing-masing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 space-y-3 relative shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          {activeMadrasah?.nama || 'Madrasah Ibtidaiyah'}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">{acc.namaLengkap}</h4>
                        <div className="mt-0.5">{getRoleBadge(acc.role)}</div>
                      </div>
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                        <Shield className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Username:</span>
                        <span className="font-mono font-bold text-slate-900">{acc.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kata Sandi:</span>
                        <span className="font-mono font-bold text-slate-900">{acc.password || 'admin'}</span>
                      </div>
                      {acc.pin && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">PIN Login:</span>
                          <span className="font-mono font-bold text-emerald-700">{acc.pin}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 text-center">
                      Portal Modul Ajar Berbasis Cinta (KBC)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
