import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Users,
  Plus,
  KeyRound,
  Shield,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Search,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { ClientCompany, CompanyClientAccount, CompanyUserRole, Site } from '../types';
import { getCallUrl, getWhatsAppUrl, WhatsAppIcon } from '../utils/contactUtils';

interface CompanyManagementViewProps {
  companies: ClientCompany[];
  accounts: CompanyClientAccount[];
  sites: Site[];
  onSaveCompany: (company: ClientCompany) => void;
  onDeleteCompany: (companyId: string) => void;
  onSaveAccount: (account: CompanyClientAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  onLaunchOwnerApp?: (loginId?: string) => void;
}

export const CompanyManagementView: React.FC<CompanyManagementViewProps> = ({
  companies,
  accounts,
  sites,
  onSaveCompany,
  onDeleteCompany,
  onSaveAccount,
  onDeleteAccount,
  onLaunchOwnerApp
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'companies' | 'accounts'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Company Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ClientCompany | null>(null);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    code: '',
    industry: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    assignedSiteIds: [] as string[],
    loginId: '',
    password: '',
    notes: ''
  });

  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CompanyClientAccount | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    companyId: '',
    loginId: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'company_portal' as CompanyUserRole,
    assignedSiteIds: [] as string[],
    isActive: true
  });

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Open Company Form
  const handleOpenCompanyModal = (comp?: ClientCompany) => {
    if (comp) {
      setEditingCompany(comp);
      const matchedAccount = accounts.find((a) => a.companyId === comp.id);
      setCompanyFormData({
        name: comp.name,
        code: comp.code,
        industry: comp.industry || comp.industrySector || '',
        contactPerson: comp.contactPerson,
        contactEmail: comp.contactEmail,
        contactPhone: comp.contactPhone,
        address: comp.address,
        assignedSiteIds: comp.assignedSiteIds || comp.siteIds || [],
        loginId: comp.loginId || matchedAccount?.loginId || `${comp.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.company`,
        password: comp.password || matchedAccount?.password || 'company123',
        notes: comp.notes || ''
      });
    } else {
      setEditingCompany(null);
      const nextNum = companies.length + 1;
      const genCode = `CMP-${String(nextNum).padStart(3, '0')}`;
      setCompanyFormData({
        name: '',
        code: genCode,
        industry: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        assignedSiteIds: [],
        loginId: `company${nextNum}.portal`,
        password: `company${nextNum}pass`,
        notes: ''
      });
    }
    setIsCompanyModalOpen(true);
  };

  // Submit Company Form
  const handleSubmitCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyFormData.name.trim()) return;

    const cleanLoginId = companyFormData.loginId.trim().toLowerCase();
    const cleanPassword = companyFormData.password.trim();

    const companyToSave: ClientCompany = {
      id: editingCompany ? editingCompany.id : `comp-${Date.now()}`,
      name: companyFormData.name.trim(),
      code: companyFormData.code.trim().toUpperCase(),
      industry: companyFormData.industry.trim() || 'General Commercial',
      industrySector: companyFormData.industry.trim() || 'General Commercial',
      contactPerson: companyFormData.contactPerson.trim(),
      contactEmail: companyFormData.contactEmail.trim(),
      contactPhone: companyFormData.contactPhone.trim(),
      address: companyFormData.address.trim(),
      siteIds: companyFormData.assignedSiteIds,
      assignedSiteIds: companyFormData.assignedSiteIds,
      loginId: cleanLoginId,
      password: cleanPassword,
      isActive: editingCompany ? editingCompany.isActive : true,
      createdAt: editingCompany ? editingCompany.createdAt : new Date().toISOString(),
      notes: companyFormData.notes.trim()
    };

    onSaveCompany(companyToSave);

    // Also automatically create/update unified CompanyClientAccount (1-to-1 unified login)
    const existingAcc = accounts.find((a) => a.companyId === companyToSave.id);
    const accountToSave: CompanyClientAccount = {
      id: existingAcc ? existingAcc.id : `acc-${companyToSave.id}`,
      companyId: companyToSave.id,
      companyName: companyToSave.name,
      code: companyToSave.code,
      loginId: cleanLoginId,
      password: cleanPassword,
      name: companyFormData.contactPerson.trim() || companyToSave.name,
      fullName: `${companyFormData.contactPerson.trim() || companyToSave.name} (${companyToSave.name})`,
      email: companyFormData.contactEmail.trim(),
      phone: companyFormData.contactPhone.trim(),
      address: companyFormData.address.trim(),
      industry: companyFormData.industry.trim() || companyToSave.industry,
      role: 'company_portal',
      assignedSiteIds: companyFormData.assignedSiteIds,
      isActive: companyToSave.isActive,
      createdAt: existingAcc ? existingAcc.createdAt : new Date().toISOString()
    };
    onSaveAccount(accountToSave);

    setIsCompanyModalOpen(false);
    showNotification(`Client Company "${companyToSave.name}" and login credentials saved successfully.`);
  };

  // Open Account Form
  const handleOpenAccountModal = (acc?: CompanyClientAccount) => {
    setShowPassword(false);
    if (acc) {
      setEditingAccount(acc);
      setAccountFormData({
        companyId: acc.companyId,
        loginId: acc.loginId,
        password: acc.password || '',
        fullName: acc.name || acc.fullName || '',
        email: acc.email,
        phone: acc.phone,
        role: acc.role,
        assignedSiteIds: acc.assignedSiteIds || [],
        isActive: acc.isActive
      });
    } else {
      setEditingAccount(null);
      const defaultCompany = companies[0]?.id || '';
      const matchedC = companies.find(c => c.id === defaultCompany);
      setAccountFormData({
        companyId: defaultCompany,
        loginId: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'company_owner',
        assignedSiteIds: matchedC?.assignedSiteIds || matchedC?.siteIds || [],
        isActive: true
      });
    }
    setIsAccountModalOpen(true);
  };

  // Submit Account Form
  const handleSubmitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLoginId = accountFormData.loginId.trim().toLowerCase();
    if (!cleanLoginId || !accountFormData.password.trim()) {
      alert('Login ID and Password are required.');
      return;
    }

    // Check duplicate login ID
    const duplicate = accounts.find(
      (a) => a.loginId.toLowerCase() === cleanLoginId && a.id !== editingAccount?.id
    );
    if (duplicate) {
      alert(`Login ID "${cleanLoginId}" is already taken. Please choose another unique login ID.`);
      return;
    }

    const matchedComp = companies.find((c) => c.id === accountFormData.companyId);
    const companyName = matchedComp ? matchedComp.name : 'Client Company';

    const accountToSave: CompanyClientAccount = {
      id: editingAccount ? editingAccount.id : `acc-${Date.now()}`,
      companyId: accountFormData.companyId,
      companyName,
      loginId: cleanLoginId,
      password: accountFormData.password.trim(),
      name: accountFormData.fullName.trim() || cleanLoginId,
      fullName: accountFormData.fullName.trim() || cleanLoginId,
      email: accountFormData.email.trim(),
      phone: accountFormData.phone.trim(),
      role: accountFormData.role,
      assignedSiteIds: accountFormData.assignedSiteIds,
      isActive: accountFormData.isActive,
      createdAt: editingAccount ? editingAccount.createdAt : new Date().toISOString(),
      lastLoginAt: editingAccount?.lastLoginAt
    };

    onSaveAccount(accountToSave);
    setIsAccountModalOpen(false);
    showNotification(`Account "${accountToSave.loginId}" for ${companyName} saved.`);
  };

  // Toggle Account Active Status
  const handleToggleAccountActive = (acc: CompanyClientAccount) => {
    const updated = { ...acc, isActive: !acc.isActive };
    onSaveAccount(updated);
    showNotification(`Account "${acc.loginId}" marked as ${updated.isActive ? 'Active' : 'Deactivated'}.`);
  };

  // Filtered lists
  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAccounts = accounts.filter((a) => {
    const nameStr = (a.name || a.fullName || '').toLowerCase();
    const matchesSearch =
      a.loginId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nameStr.includes(searchQuery.toLowerCase()) ||
      a.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || a.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: CompanyUserRole) => {
    switch (role) {
      case 'company_owner':
      case 'Company Owner':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E8D8C5] text-[#4B3621] border border-[#D5C2AD]">
            Owner
          </span>
        );
      case 'company_hr':
      case 'Company HR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
            HR Manager
          </span>
        );
      case 'company_manager':
      case 'Company Manager':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            Plant / Site Mgr
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E8D8C5] text-[#4B3621] border border-[#D5C2AD]">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#6F4E37] text-white rounded-xl shadow-xs">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#4B3621]">
                Client Companies & Login Management
              </h2>
            </div>
            <p className="text-xs text-[#8B735B]">
              Register client companies, provision single unified login credentials for factory owners, HR, and plant managers, and control site-level access for the <strong>Rexon Field Patrolling Company Portal</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onLaunchOwnerApp && (
              <button
                type="button"
                onClick={() => onLaunchOwnerApp()}
                className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#D5C2AD] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Open Rexon Field Patrolling Company Portal"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Launch Rexon Company Portal (कंपनी पोर्टल खोलें)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenCompanyModal()}
              className="px-3.5 py-2 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Register Company (कंपनी जोड़ें)</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAccountModal()}
              className="px-3.5 py-2 bg-[#4B3621] hover:bg-[#382819] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
              <span>Create Login Account (लॉगिन खाता बनाएं)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#E7DED2]">
          <div className="p-3 bg-white rounded-xl border border-[#E7DED2]">
            <span className="text-[10px] font-bold text-[#8B735B] uppercase tracking-wider block">Registered Clients</span>
            <span className="text-xl font-bold font-mono text-[#4B3621] mt-0.5 block">{companies.length}</span>
            <span className="text-[10px] text-[#1B5E20]">Enterprise accounts</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E7DED2]">
            <span className="text-[10px] font-bold text-[#8B735B] uppercase tracking-wider block">Authorized Logins</span>
            <span className="text-xl font-bold font-mono text-[#4B3621] mt-0.5 block">{accounts.length}</span>
            <span className="text-[10px] text-[#1B5E20]">{accounts.filter(a => a.isActive).length} active credentials</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E7DED2]">
            <span className="text-[10px] font-bold text-[#8B735B] uppercase tracking-wider block">Site Linkages</span>
            <span className="text-xl font-bold font-mono text-[#6F4E37] mt-0.5 block">{sites.length}</span>
            <span className="text-[10px] text-[#8B735B]">Patrol facilities connected</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E7DED2]">
            <span className="text-[10px] font-bold text-[#8B735B] uppercase tracking-wider block">Data Isolation</span>
            <span className="text-xs font-bold text-[#1B5E20] mt-1 block flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Strict Tenant Wall Active
            </span>
            <span className="text-[10px] text-[#8B735B]">Zero cross-company leaks</span>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E7DED2]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('companies')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'companies'
                ? 'bg-[#6F4E37] text-white shadow-xs'
                : 'bg-white text-[#4B3621] border border-[#E7DED2] hover:bg-[#FAF7F2]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Registered Companies ({companies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('accounts')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'accounts'
                ? 'bg-[#6F4E37] text-white shadow-xs'
                : 'bg-white text-[#4B3621] border border-[#E7DED2] hover:bg-[#FAF7F2]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Login Accounts & Passwords ({accounts.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B735B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies or login IDs..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
            />
          </div>

          {activeSubTab === 'accounts' && (
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
            >
              <option value="all">All Roles</option>
              <option value="company_owner">Owner Only</option>
              <option value="company_hr">HR Only</option>
              <option value="company_manager">Manager Only</option>
            </select>
          )}
        </div>
      </div>

      {/* SUBTAB 1: REGISTERED COMPANIES */}
      {activeSubTab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.length === 0 ? (
            <div className="col-span-full p-10 bg-white border border-[#E7DED2] rounded-2xl text-center text-xs text-[#8B735B]">
              No client companies match your search. Click "Register Company" to add one.
            </div>
          ) : (
            filteredCompanies.map((comp) => {
              const compAccounts = accounts.filter((a) => a.companyId === comp.id);
              const assignedSitesList = sites.filter((s) => comp.assignedSiteIds?.includes(s.id) || comp.siteIds?.includes(s.id) || s.clientName === comp.name);

              return (
                <div
                  key={comp.id}
                  className="bg-white border border-[#E7DED2] rounded-2xl p-4.5 space-y-3.5 shadow-2xs hover:border-[#8B735B] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-[#8B735B] font-bold uppercase bg-[#F0E8DD] px-1.5 py-0.5 rounded border border-[#E7DED2]">
                          {comp.code}
                        </span>
                        <h3 className="text-sm font-bold text-[#4B3621] mt-1 truncate" title={comp.name}>
                          {comp.name}
                        </h3>
                        <p className="text-[11px] text-[#8B735B]">{comp.industry || comp.industrySector || 'Industrial Facilities'}</p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        comp.isActive
                          ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                          : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                      }`}>
                        {comp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#8B735B] pt-1 border-t border-[#E7DED2]">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                        <span className="text-[#4B3621] font-semibold truncate">{comp.contactPerson || 'Unassigned Contact'}</span>
                      </div>
                      {comp.contactEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#8B735B] shrink-0" />
                          <span className="truncate">{comp.contactEmail}</span>
                        </div>
                      )}
                      {comp.contactPhone && (
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-[#4B3621]">
                            <Phone className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                            <span>{comp.contactPhone}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={getCallUrl(comp.contactPhone)}
                              className="p-1 rounded-md bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors"
                              title={`Call ${comp.contactPerson || comp.name}`}
                            >
                              <Phone className="w-3 h-3 text-[#6F4E37]" />
                            </a>
                            <a
                              href={getWhatsAppUrl(comp.contactPhone, `नमस्ते ${comp.contactPerson || comp.name} जी, REXON ऑपरेशन्स टीम से संपर्क कर रहे हैं।`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 transition-colors"
                              title={`WhatsApp ${comp.contactPerson || comp.name}`}
                            >
                              <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {comp.address && (
                      <div className="flex items-start gap-1.5 text-xs text-[#8B735B]">
                        <MapPin className="w-3.5 h-3.5 text-[#6F4E37] shrink-0 mt-0.5" />
                        <span className="leading-snug text-[#4B3621]">{comp.address}</span>
                      </div>
                    )}

                    {/* Unified Company Login Credentials Preview */}
                    <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E7DED2] text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[#8B735B]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F4E37] flex items-center gap-1">
                          <KeyRound className="w-3 h-3" />
                          एकल कंपनी लॉगिन (Unified Login)
                        </span>
                        <span className="text-[9px] bg-white border border-[#E7DED2] px-1.5 py-0.2 rounded text-[#8B735B]">
                          1 Login per Company
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-xs">
                        <div>
                          <span className="text-[9px] text-[#8B735B] block font-sans">Login ID</span>
                          <strong className="text-[#6F4E37]">{comp.loginId || compAccounts[0]?.loginId || 'N/A'}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-[#8B735B] block font-sans">Password</span>
                          <strong className="text-[#4B3621]">{comp.password || compAccounts[0]?.password || '••••••'}</strong>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#8B735B] pt-0.5 border-t border-[#E7DED2]">
                        मालिक, HR व प्रबंधक तीनों द्वारा उपयोग योग्य
                      </div>
                    </div>

                    {/* Assigned Sites Preview */}
                    <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E7DED2] text-xs space-y-1">
                      <span className="text-[10px] font-bold text-[#8B735B] uppercase block">
                        Assigned Patrol Sites ({assignedSitesList.length})
                      </span>
                      {assignedSitesList.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedSitesList.map((st) => (
                            <span key={st.id} className="px-1.5 py-0.5 bg-white border border-[#E7DED2] rounded text-[10px] text-[#4B3621] font-medium truncate max-w-[150px]">
                              {st.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8B735B] italic">No specific site restricted (all company sites)</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E7DED2] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#8B735B]">
                      {comp.code} · Active Portal
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onLaunchOwnerApp && (
                        <button
                          type="button"
                          onClick={() => onLaunchOwnerApp(comp.loginId || compAccounts[0]?.loginId)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#E7DED2] transition-colors cursor-pointer flex items-center gap-1"
                          title="Open Raxon Company Portal with this account"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>पोर्टल खोलें</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenCompanyModal(comp)}
                        className="p-1.5 text-[#4B3621] hover:text-[#6F4E37] hover:bg-[#F0E8DD] rounded-lg transition-colors cursor-pointer"
                        title="Edit Company"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete client company "${comp.name}"? This will not delete reports or sites.`)) {
                            onDeleteCompany(comp.id);
                            showNotification(`Deleted company "${comp.name}".`);
                          }
                        }}
                        className="p-1.5 text-[#8B735B] hover:text-[#C62828] hover:bg-[#FFEBEE] rounded-lg transition-colors cursor-pointer"
                        title="Delete Company"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB 2: LOGIN ACCOUNTS & PASSWORDS */}
      {activeSubTab === 'accounts' && (
        <div className="bg-white border border-[#E7DED2] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E7DED2] text-[#8B735B] uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Login ID</th>
                  <th className="py-3 px-4">User Name & Role</th>
                  <th className="py-3 px-4">Assigned Sites</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DED2]">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-[#8B735B]">
                      No accounts found. Click "Create Login Account" to set up credentials for factory owners or HR.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => {
                    const assignedNames = sites
                      .filter((s) => acc.assignedSiteIds?.includes(s.id))
                      .map((s) => s.name);

                    return (
                      <tr key={acc.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        {/* Company */}
                        <td className="py-3 px-4 font-bold text-[#4B3621]">
                          {acc.companyName}
                        </td>

                        {/* Login ID */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#6F4E37] bg-[#F0E8DD] px-2 py-0.5 rounded border border-[#E7DED2]">
                            {acc.loginId}
                          </span>
                        </td>

                        {/* Name & Role */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#4B3621]">{acc.name || acc.fullName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {getRoleBadge(acc.role)}
                            {acc.phone && <span className="text-[11px] text-[#8B735B] font-mono">{acc.phone}</span>}
                          </div>
                        </td>

                        {/* Assigned Sites */}
                        <td className="py-3 px-4">
                          {assignedNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {assignedNames.map((nm, idx) => (
                                <span key={idx} className="px-1.5 py-0.2 rounded text-[10px] bg-[#FAF7F2] border border-[#E7DED2] text-[#4B3621] truncate max-w-[120px]">
                                  {nm}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8B735B] italic">All Company Sites</span>
                          )}
                        </td>

                        {/* Password */}
                        <td className="py-3 px-4 font-mono">
                          <span className="text-[#8B735B] select-all bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E7DED2]">
                            {acc.password}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleAccountActive(acc)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                              acc.isActive
                                ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                                : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                            }`}
                            title="Click to toggle Active / Inactive"
                          >
                            {acc.isActive ? <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" /> : <XCircle className="w-3 h-3 text-[#C62828]" />}
                            <span>{acc.isActive ? 'Active' : 'Disabled'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onLaunchOwnerApp && (
                              <button
                                type="button"
                                onClick={() => onLaunchOwnerApp(acc.loginId)}
                                className="px-2 py-1 rounded bg-[#F0E8DD] hover:bg-[#6F4E37] text-[#4B3621] hover:text-white transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
                                title="Login directly to Raxon Company Portal with this account"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Test Login</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenAccountModal(acc)}
                              className="p-1.5 text-[#4B3621] hover:text-[#6F4E37] hover:bg-[#F0E8DD] rounded-lg transition-colors cursor-pointer"
                              title="Edit Account / Reset Password"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete login account "${acc.loginId}"?`)) {
                                  onDeleteAccount(acc.id);
                                  showNotification(`Deleted account "${acc.loginId}".`);
                                }
                              }}
                              className="p-1.5 text-[#8B735B] hover:text-[#C62828] hover:bg-[#FFEBEE] rounded-lg transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER / EDIT COMPANY */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7DED2] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7DED2] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#6F4E37]" />
                <h3 className="text-base font-bold text-[#4B3621]">
                  {editingCompany ? 'Edit Client Company' : 'Register New Client Company'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompanyModalOpen(false)}
                className="text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCompany} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyFormData.name}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                    placeholder="e.g. Apex Logistics Global"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>

                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Company Code *</label>
                  <input
                    type="text"
                    required
                    value={companyFormData.code}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, code: e.target.value })}
                    placeholder="e.g. CMP-APEX-01"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Industry / Sector</label>
                  <input
                    type="text"
                    value={companyFormData.industry}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                    placeholder="e.g. Warehousing & Logistics"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>

                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Primary Contact Person</label>
                  <input
                    type="text"
                    value={companyFormData.contactPerson}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, contactPerson: e.target.value })}
                    placeholder="e.g. David Miller"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={companyFormData.contactEmail}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, contactEmail: e.target.value })}
                    placeholder="e.g. dmiller@apexlogistics.com"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>

                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={companyFormData.contactPhone}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, contactPhone: e.target.value })}
                    placeholder="e.g. +1 (555) 392-8811"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">Office / Plant Address (साइट का पंजीकृत पता) *</label>
                <input
                  type="text"
                  required
                  value={companyFormData.address}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                  placeholder="e.g. 742 Logistics Way, Bay Area"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              {/* Unified Company Access Credentials */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E7DED2] space-y-2.5">
                <div className="flex items-center gap-1.5 text-[#6F4E37] font-bold">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>एकल कंपनी लॉगिन क्रेडेंशियल्स (Unified Company Login) *</span>
                </div>
                <p className="text-[10px] text-[#8B735B]">
                  इस एक ही आईडी और पासवर्ड को कंपनी के मालिक (Owner), HR और मैनेजर द्वारा पोर्टल लॉगिन हेतु इस्तेमाल किया जाएगा।
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#4B3621] font-semibold mb-1">Company Login ID *</label>
                    <input
                      type="text"
                      required
                      value={companyFormData.loginId}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, loginId: e.target.value })}
                      placeholder="e.g. apex.company"
                      className="w-full px-3 py-2 bg-white border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono font-bold focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4B3621] font-semibold mb-1">Company Password *</label>
                    <input
                      type="text"
                      required
                      value={companyFormData.password}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, password: e.target.value })}
                      placeholder="e.g. apex123"
                      className="w-full px-3 py-2 bg-white border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono font-bold focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>
                </div>
              </div>

              {/* Assign Sites */}
              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Link Associated Security Patrol Sites
                </label>
                <div className="max-h-36 overflow-y-auto border border-[#E7DED2] rounded-lg p-2 space-y-1 bg-[#FAF7F2]">
                  {sites.map((st) => {
                    const isChecked = companyFormData.assignedSiteIds.includes(st.id);
                    return (
                      <label key={st.id} className="flex items-center gap-2 p-1 rounded hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCompanyFormData({
                                ...companyFormData,
                                assignedSiteIds: [...companyFormData.assignedSiteIds, st.id]
                              });
                            } else {
                              setCompanyFormData({
                                ...companyFormData,
                                assignedSiteIds: companyFormData.assignedSiteIds.filter((id) => id !== st.id)
                              });
                            }
                          }}
                          className="rounded text-[#6F4E37] focus:ring-[#6F4E37]"
                        />
                        <span className="text-[#4B3621] font-medium">{st.name}</span>
                        <span className="text-[10px] text-[#8B735B]">({st.clientName || 'General'})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E7DED2]">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT LOGIN ACCOUNT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7DED2] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7DED2] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#6F4E37]" />
                <h3 className="text-base font-bold text-[#4B3621]">
                  {editingAccount ? 'Edit Account & Reset Password' : 'Create Raxon Company Login Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAccount} className="space-y-3.5 text-xs">
              {/* Company Selection */}
              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">Company *</label>
                <select
                  required
                  value={accountFormData.companyId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const comp = companies.find((c) => c.id === cId);
                    setAccountFormData({
                      ...accountFormData,
                      companyId: cId,
                      assignedSiteIds: comp?.assignedSiteIds || comp?.siteIds || []
                    });
                  }}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-semibold focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Login ID & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Unique Login ID *</label>
                  <input
                    type="text"
                    required
                    value={accountFormData.loginId}
                    onChange={(e) => setAccountFormData({ ...accountFormData, loginId: e.target.value })}
                    placeholder="e.g. apex.owner or apex.hr"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                  <p className="text-[10px] text-[#8B735B] mt-0.5">Used by company owner/HR to sign in.</p>
                </div>

                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={accountFormData.password}
                      onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
                      placeholder="e.g. apexowner123"
                      className="w-full pl-3 pr-8 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8B735B] mt-0.5">Admin can reset anytime.</p>
                </div>
              </div>

              {/* Full Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">User Full Name</label>
                  <input
                    type="text"
                    value={accountFormData.fullName}
                    onChange={(e) => setAccountFormData({ ...accountFormData, fullName: e.target.value })}
                    placeholder="e.g. David Miller"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>

                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">User Role</label>
                  <select
                    value={accountFormData.role}
                    onChange={(e) => setAccountFormData({ ...accountFormData, role: e.target.value as CompanyUserRole })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  >
                    <option value="company_owner">Company Owner (मालिक)</option>
                    <option value="company_hr">HR Manager (एचआर मैनेजर)</option>
                    <option value="company_manager">Authorized Plant / Site Manager</option>
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={accountFormData.email}
                    onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                    placeholder="e.g. owner@apexlogistics.com"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>

                <div>
                  <label className="block text-[#4B3621] font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={accountFormData.phone}
                    onChange={(e) => setAccountFormData({ ...accountFormData, phone: e.target.value })}
                    placeholder="e.g. +1 (555) 392-8811"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>
              </div>

              {/* Site Access Restrictions */}
              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Authorized Sites Access (Strict Data Isolation)
                </label>
                <div className="max-h-32 overflow-y-auto border border-[#E7DED2] rounded-lg p-2 space-y-1 bg-[#FAF7F2]">
                  {sites.map((st) => {
                    const isChecked = accountFormData.assignedSiteIds.includes(st.id);
                    return (
                      <label key={st.id} className="flex items-center gap-2 p-1 rounded hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAccountFormData({
                                ...accountFormData,
                                assignedSiteIds: [...accountFormData.assignedSiteIds, st.id]
                              });
                            } else {
                              setAccountFormData({
                                ...accountFormData,
                                assignedSiteIds: accountFormData.assignedSiteIds.filter((id) => id !== st.id)
                              });
                            }
                          }}
                          className="rounded text-[#6F4E37] focus:ring-[#6F4E37]"
                        />
                        <span className="text-[#4B3621] font-medium">{st.name}</span>
                        <span className="text-[10px] text-[#8B735B]">({st.area})</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#8B735B] mt-1">
                  Leave empty to grant access to all sites belonging to this company.
                </p>
              </div>

              {/* Status toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accountFormData.isActive}
                    onChange={(e) => setAccountFormData({ ...accountFormData, isActive: e.target.checked })}
                    className="rounded text-[#6F4E37] focus:ring-[#6F4E37]"
                  />
                  <span className="text-xs font-semibold text-[#4B3621]">Account is Active & Permitted to Login</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E7DED2]">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Account & Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
