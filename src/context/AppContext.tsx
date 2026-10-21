import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PageRoute, 
  Santri, 
  Pelanggaran, 
  PelanggaranKategori,
  RiwayatPelanggaran, 
  UserAccount, 
  MasterPembinaan,
  PembinaanRecord,
  UnitPesantren,
  UnitFilter,
  UserRole,
  ActivityItem
} from '../types';
import { 
  initialUsers, 
  initialPelanggaranList, 
  initialSantriList, 
  initialRiwayatPelanggaran,
  initialMasterPembinaanList,
  initialPembinaanRecords
} from '../data/mockData';
import { 
  fetchSantriFromDB,
  insertSantriToDB,
  updateSantriInDB,
  deleteSantriFromDB,
  importSantriBatchToDB,
  fetchPelanggaranFromDB,
  insertPelanggaranToDB,
  updatePelanggaranStatusInDB,
  updatePelanggaranRecordInDB,
  deletePelanggaranRecordFromDB,
  fetchMasterPelanggaranFromDB,
  insertMasterPelanggaranToDB,
  updateMasterPelanggaranInDB,
  deleteMasterPelanggaranFromDB,
  deleteAllMasterPelanggaranFromDB,
  importMasterPelanggaranBatchToDB,
  fetchMasterPembinaanFromDB, 
  findPembinaanBySinglePoin,
  fetchPembinaanRecordsFromDB,
  fetchHiddenNotificationIdsFromDB,
  saveHiddenNotificationToDB,
  fetchUsersFromDB,
  insertUserToDB,
  updateUserInDB,
  deleteUserFromDB,
  toggleUserActiveInDB,
  resetUserPasswordInDB,
  importUsersBatchToDB,
  ImportUserPayload,
  ImportUsersResult,
  authenticateUser,
  isSupabaseConfigured,
  getActiveSupabaseConfig
} from '../lib/supabase';
import { 
  canRoleAccessRoute, 
  getDefaultRouteForRole, 
  getRoleDisplayName,
  getUnitDisplayName,
  hashPassword,
  hashPasswordSync,
  mapJabatanToRole
} from '../lib/auth';
import { getKategoriFromPoin } from '../components/common/PointBadge';
import { sortSantriList, sortMasterPelanggaranList, sortSantriByPoints } from '../lib/sortingHelper';

export interface ToastInfo {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
}

export type { ActivityItem };

interface AppContextType {
  currentRoute: PageRoute;
  setCurrentRoute: (route: PageRoute) => void;
  user: UserAccount | null;
  isAuthenticated: boolean;
  usersList: UserAccount[];
  selectedKasieUnitFilter: UnitFilter;
  setSelectedKasieUnitFilter: (filter: UnitFilter) => void;
  // Scoped lists based on active user and selected unit filter
  santriList: Santri[];
  allSantriList: Santri[];
  pelanggaranList: Pelanggaran[];
  masterPembinaanList: MasterPembinaan[];
  riwayatList: RiwayatPelanggaran[];
  allRiwayatList: RiwayatPelanggaran[];
  pembinaanList: PembinaanRecord[];
  allPembinaanList: PembinaanRecord[];
  selectedSantriForDetail: Santri | null;
  setSelectedSantriForDetail: (santri: Santri | null) => void;
  // Auth & Session
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  // Data Refresh
  refreshData: () => Promise<void>;
  isLoadingData: boolean;
  // Rekap Pelanggaran Record Management
  deleteRiwayatPelanggaran: (id: string) => Promise<{ success: boolean; message: string }>;
  updateRiwayatPelanggaran: (
    id: string,
    updates: {
      jenisPelanggaranId: string;
      jenisPelanggaranNama?: string;
      poin: number;
      hukuman?: string;
      catatan?: string;
      tanggal?: string;
      timestamp?: string;
      status?: 'Selesai' | 'Belum Selesai';
    }
  ) => Promise<{ success: boolean; message: string }>;
  // Master Pelanggaran Management (Kasie Superadmin)
  addPelanggaran: (data: {
    kode?: string;
    jenis: string;
    poin: number;
    konsekuensi: string;
  }) => Promise<{ success: boolean; message?: string }>;
  updatePelanggaran: (
    id: string,
    data: {
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
    }
  ) => Promise<{ success: boolean; message?: string }>;
  deletePelanggaran: (id: string) => Promise<{ success: boolean; message?: string }>;
  deleteAllMasterPelanggaran: (onlyUnused?: boolean) => Promise<{
    success: boolean;
    deletedCount: number;
    remainingCount: number;
    message: string;
  }>;
  checkMasterPelanggaranUsage: (masterId?: string) => {
    isUsed: boolean;
    count: number;
    totalMasterCount: number;
    usedCount: number;
    unusedCount: number;
    totalTransactionsCount: number;
    affectedTransactionsCount: number;
    usedIds: string[];
    unusedIds: string[];
  };
  importPelanggaranBatch: (
    items: Array<{
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
      kategori?: string;
    }>
  ) => Promise<{ success: boolean; insertedCount: number; message: string }>;
  // User Management (Kasie/Kabid Superadmin)
  addUser: (data: {
    id?: string;
    nama: string;
    username: string;
    password: string;
    role: UserRole;
    unit: 'ALL' | UnitPesantren;
    email?: string;
    title?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  editUser: (
    id: string,
    data: {
      nama: string;
      username: string;
      email?: string;
      role: UserRole;
      unit: 'ALL' | UnitPesantren;
      is_active?: boolean;
    }
  ) => Promise<{ success: boolean; message?: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  importUsersBatch: (
    usersData: ImportUserPayload[]
  ) => Promise<{
    success: boolean;
    insertedCount: number;
    duplicateCount?: number;
    errorCount?: number;
    totalRows?: number;
    details?: string[];
    message: string;
  }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
  toggleUserActive: (userId: string) => Promise<void>;
  // Santri Management
  addSantri: (data: {
    nis: string;
    nama: string;
    kelas: string;
    unit: UnitPesantren;
    musyrifId?: string;
    asrama?: string;
    kamar?: string;
    keterangan?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  updateSantri: (
    id: string,
    data: {
      nis: string;
      nama: string;
      kelas: string;
      unit: UnitPesantren;
      musyrifId?: string;
      asrama?: string;
      kamar?: string;
      keterangan?: string;
      statusPembinaan?: Santri['statusPembinaan'];
    }
  ) => Promise<{ success: boolean; message?: string }>;
  deleteSantri: (
    id: string,
    options?: { deleteViolations?: boolean }
  ) => Promise<{ success: boolean; message?: string; violationCount?: number }>;
  importSantriBatch: (
    santriDataList: Array<{
      nis: string;
      nama: string;
      kelas: string;
      unit: UnitPesantren;
      musyrifId?: string;
      musyrifNama?: string;
      asrama?: string;
      kamar?: string;
      statusPembinaan?: Santri['statusPembinaan'];
      keterangan?: string;
    }>
  ) => Promise<{ success: boolean; insertedCount: number; message: string }>;
  // Pembinaan Management
  addPembinaan: (data: {
    santriId: string;
    jenisPembinaan: string;
    catatan: string;
    pembina?: string;
    tanggalTargetSelesai?: string;
  }) => { success: boolean; message?: string };
  updatePembinaanStatus: (
    id: string,
    status: 'BELUM DIMULAI' | 'PROSES' | 'SELESAI',
    catatan?: string,
    tanggalSelesai?: string
  ) => { success: boolean; message?: string };
  deletePembinaan: (id: string) => { success: boolean; message?: string };
  // Notifications
  toasts: ToastInfo[];
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
  // Core Business Logic
  getPembinaanBySinglePoin: (poin: number) => MasterPembinaan | null;
  catatPelanggaranBaru: (data: {
    santriId: string;
    pelanggaranId: string;
    catatan?: string;
  }) => Promise<boolean>;
  toggleStatusPelanggaran: (id: string) => Promise<void>;
  updateUserPassword: (oldPass: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message: string }>;
  // Dynamic Scoped Dashboard Statistics
  stats: {
    pelanggaranHariIni: number;
    totalSantri: number;
    belumSelesai: number;
    terseelesaikan: number;
  };
  getMonthlyData: () => { bulan: string; jumlah: number }[];
  getDonutData: () => { name: string; value: number; color: string }[];
  getTop5Santri: () => Santri[];
  getAllSortedSantriByPoints: () => Santri[];
  getDashboardSantriBinaan: () => {
    santri: Santri[];
    subtitle: string;
    isOwnBinaan: boolean;
  };
  getTopPelanggaran: () => Array<{ id: string; nama: string; kategori: string; count: number; totalPoin: number }>;
  getRecentPembinaan: () => PembinaanRecord[];
  getRecentActivities: () => ActivityItem[];
  // Aktivitas & Pemberitahuan Management
  hiddenActivityIds: string[];
  activitiesError: string | null;
  hideActivity: (activityId: string, summary?: { santriNama: string; jenis: string; unit: UnitPesantren }) => Promise<{ success: boolean; message: string }>;
  markPembinaanSelesai: (pelanggaranId: string) => Promise<{ success: boolean; message: string }>;
  updatePelanggaranStatus: (pelanggaranId: string, newStatus: 'Selesai' | 'Belum Selesai') => Promise<{ success: boolean; message: string }>;
  canUserManageItem: (itemUnit: UnitPesantren) => boolean;
  // Database Modal & Offline Sync
  isDatabaseModalOpen: boolean;
  setIsDatabaseModalOpen: (open: boolean) => void;
  openDatabaseModal: () => void;
  closeDatabaseModal: () => void;
  isOfflineMode: boolean;
  isSupabaseOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. User & Session State (Persistent across reload or session storage)
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const savedSession = localStorage.getItem('simka_session') || sessionStorage.getItem('simka_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.id && parsed.username && parsed.role) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved session:', e);
    }
    return null;
  });

  const isAuthenticated = Boolean(user);

  // Current Route: if not logged in, enforce login page
  const [currentRoute, setCurrentRouteState] = useState<PageRoute>(() => {
    try {
      const savedSession = localStorage.getItem('simka_session') || sessionStorage.getItem('simka_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.role) {
          return getDefaultRouteForRole(parsed.role);
        }
      }
    } catch (e) {
      // fallback
    }
    return 'login';
  });

  // Safe route navigator that checks role authorization
  const setCurrentRoute = (route: PageRoute) => {
    if (!user && route !== 'login') {
      setCurrentRouteState('login');
      return;
    }
    if (user && !canRoleAccessRoute(user.role, route)) {
      showToast('Akses Ditolak', `Role ${user.role} tidak memiliki hak akses ke halaman tersebut.`, 'warning');
      return;
    }
    setCurrentRouteState(route);
  };

  // Database modal state
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const openDatabaseModal = useCallback(() => setIsDatabaseModalOpen(true), []);
  const closeDatabaseModal = useCallback(() => setIsDatabaseModalOpen(false), []);

  const dbConfig = getActiveSupabaseConfig();
  const isOfflineMode = dbConfig.offlineMode;
  const isSupabaseOnline = isSupabaseConfigured();

  // Unit filter for Superadmin (Kasie/Kabid)
  const [selectedKasieUnitFilter, setSelectedKasieUnitFilter] = useState<UnitFilter>('ALL');

  // Loading state
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Users database
  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('simka_users');
      return saved ? JSON.parse(saved) : initialUsers;
    } catch (e) {
      return initialUsers;
    }
  });

  // Master Pelanggaran & Master Pembinaan
  const [pelanggaranList, setPelanggaranList] = useState<Pelanggaran[]>(() => {
    try {
      const saved = localStorage.getItem('simka_master_pelanggaran');
      if (saved) {
        const parsed: Pelanggaran[] = JSON.parse(saved);
        const mapped = parsed.map((p) => ({
          ...p,
          kategori: getKategoriFromPoin(p.poin).kategori
        }));
        return sortMasterPelanggaranList(mapped);
      }
      const mapped = initialPelanggaranList.map((p) => ({
        ...p,
        kategori: getKategoriFromPoin(p.poin).kategori
      }));
      return sortMasterPelanggaranList(mapped);
    } catch (e) {
      const mapped = initialPelanggaranList.map((p) => ({
        ...p,
        kategori: getKategoriFromPoin(p.poin).kategori
      }));
      return sortMasterPelanggaranList(mapped);
    }
  });

  const [masterPembinaanList, setMasterPembinaanList] = useState<MasterPembinaan[]>(() => {
    try {
      const saved = localStorage.getItem('simka_master_pembinaan');
      if (saved) {
        const parsed: MasterPembinaan[] = JSON.parse(saved);
        // Validasi: periksa apakah cached data masih memakai urutan terbalik lama (Tingkat 1 = 90-99)
        const isOldInverted = parsed.some(
          (p) => (p.tingkat === 1 && (p.min_poin ?? p.minPoin ?? 0) >= 50) ||
                 (p.tingkat === 8 && (p.min_poin ?? p.minPoin ?? 0) <= 10)
        );
        if (!isOldInverted && parsed.length >= 8) {
          return parsed;
        }
      }
      localStorage.setItem('simka_master_pembinaan', JSON.stringify(initialMasterPembinaanList));
      return initialMasterPembinaanList;
    } catch (e) {
      return initialMasterPembinaanList;
    }
  });

  // Santri & Riwayat Dataset (Supabase Single Source of Truth)
  const [allSantriList, setAllSantriList] = useState<Santri[]>(() => {
    try {
      const saved = localStorage.getItem('simka_santri');
      return saved ? sortSantriList(JSON.parse(saved)) : sortSantriList(initialSantriList);
    } catch (e) {
      return sortSantriList(initialSantriList);
    }
  });

  const [allRiwayatList, setAllRiwayatList] = useState<RiwayatPelanggaran[]>(() => {
    try {
      const saved = localStorage.getItem('simka_riwayat');
      if (saved) {
        const parsed: RiwayatPelanggaran[] = JSON.parse(saved);
        // Cleanse legacy mock records (e.g. log-ma-*)
        return parsed.filter((p) => p && !p.id.startsWith('log-ma-'));
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [allPembinaanList, setAllPembinaanList] = useState<PembinaanRecord[]>(() => {
    try {
      const saved = localStorage.getItem('simka_pembinaan_records');
      if (saved) {
        const parsed: PembinaanRecord[] = JSON.parse(saved);
        // Cleanse legacy mock records (e.g. pbn-*)
        return parsed.filter((p) => p && !p.id.startsWith('pbn-'));
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [hiddenActivityIds, setHiddenActivityIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('simka_hidden_activities');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const [selectedSantriForDetail, setSelectedSantriForDetail] = useState<Santri | null>(null);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Local caching for offline / fast startup
  useEffect(() => {
    localStorage.setItem('simka_users', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('simka_master_pelanggaran', JSON.stringify(pelanggaranList));
  }, [pelanggaranList]);

  useEffect(() => {
    localStorage.setItem('simka_santri', JSON.stringify(allSantriList));
  }, [allSantriList]);

  useEffect(() => {
    localStorage.setItem('simka_riwayat', JSON.stringify(allRiwayatList));
  }, [allRiwayatList]);

  useEffect(() => {
    localStorage.setItem('simka_pembinaan_records', JSON.stringify(allPembinaanList));
  }, [allPembinaanList]);

  useEffect(() => {
    localStorage.setItem('simka_hidden_activities', JSON.stringify(hiddenActivityIds));
  }, [hiddenActivityIds]);

  // Central Supabase Fetch & Synchronization
  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch reference tables and hidden notification IDs
      const [
        dbSantri,
        dbMasterPelanggaran,
        dbMasterPembinaan,
        dbUsers,
        dbPembinaan,
        dbHidden
      ] = await Promise.all([
        fetchSantriFromDB(),
        fetchMasterPelanggaranFromDB(),
        fetchMasterPembinaanFromDB(),
        fetchUsersFromDB(),
        fetchPembinaanRecordsFromDB(),
        fetchHiddenNotificationIdsFromDB()
      ]);

      if (dbHidden && dbHidden.length > 0) {
        setHiddenActivityIds((prev) => Array.from(new Set([...prev, ...dbHidden])));
      }

      const effectiveSantri = dbSantri || allSantriList;
      const effectiveMaster = dbMasterPelanggaran || pelanggaranList;
      const referenceUsers = (dbUsers && dbUsers.length > 0) ? dbUsers : usersList;

      // 2. Fetch violations passing known reference datasets to guarantee real names & classes
      const dbPelanggaran = await fetchPelanggaranFromDB(
        effectiveSantri,
        effectiveMaster,
        referenceUsers
      );

      let effectivePelanggaran = dbPelanggaran;
      if (effectivePelanggaran !== null) {
        setAllRiwayatList(effectivePelanggaran);
        localStorage.setItem('simka_riwayat', JSON.stringify(effectivePelanggaran));
        setActivitiesError(null);
      } else {
        effectivePelanggaran = allRiwayatList;
        if (isSupabaseConfigured()) {
          setActivitiesError('Aktivitas gagal dimuat. Silakan coba lagi.');
        }
      }

      let activeUsers = dbUsers;
      if (activeUsers !== null && activeUsers.length > 0) {
        setUsersList(activeUsers);
        localStorage.setItem('simka_users', JSON.stringify(activeUsers));

        // Keep current logged-in user profile & unit in sync with Supabase
        setUser((currentUser) => {
          if (!currentUser) return null;
          const fresh = activeUsers!.find(
            (u) => (u.id && u.id === currentUser.id) || (u.username && u.username.toLowerCase() === currentUser.username.toLowerCase())
          );
          if (fresh) {
            const updated: UserAccount = {
              ...currentUser,
              nama: fresh.nama,
              username: fresh.username,
              role: fresh.role,
              unit: fresh.unit,
              is_active: fresh.is_active
            };
            if (localStorage.getItem('simka_session')) {
              localStorage.setItem('simka_session', JSON.stringify(updated));
            } else if (sessionStorage.getItem('simka_session')) {
              sessionStorage.setItem('simka_session', JSON.stringify(updated));
            }
            return updated;
          }
          return currentUser;
        });
      } else {
        activeUsers = usersList;
      }

      if (dbSantri !== null) {
        // Build fast lookup maps for Musyrif users
        const musyrifByIdMap = new Map<string, UserAccount>();
        const musyrifByNameMap = new Map<string, UserAccount>();
        (activeUsers || []).forEach((u) => {
          if (u.role === 'MUSYRIF') {
            if (u.id) musyrifByIdMap.set(u.id, u);
            if (u.nama) musyrifByNameMap.set(u.nama.toLowerCase().trim(), u);
          }
        });

        // Calculate dynamic totalPoin and sync Musyrif relations
        const santriWithPoin = dbSantri.map((santri) => {
          const matchingViolations = (effectivePelanggaran || []).filter(
            (v) => v.santriId === santri.id || (v.santriNama && v.santriNama.toLowerCase() === santri.nama.toLowerCase() && v.santriUnit === santri.unit)
          );
          const totalPoin = matchingViolations.reduce((sum, item) => sum + (Number(item.poin) || 0), 0);
          let statusPembinaan = santri.statusPembinaan || 'Baik';
          if (totalPoin >= 100) statusPembinaan = 'SP 3';
          else if (totalPoin >= 70) statusPembinaan = 'SP 2';
          else if (totalPoin >= 40) statusPembinaan = 'SP 1';
          else if (totalPoin > 0) statusPembinaan = 'Peringatan Lisan';

          // Sync Musyrif relation stably:
          // 1. If musyrifId is present, resolve to current active user name
          // 2. If musyrifId is missing but musyrifNama matches exactly a Musyrif user, link them
          let matchedMusyrifId = santri.musyrifId;
          let matchedMusyrifNama = santri.musyrifNama;

          if (matchedMusyrifId && musyrifByIdMap.has(matchedMusyrifId)) {
            matchedMusyrifNama = musyrifByIdMap.get(matchedMusyrifId)!.nama;
          } else if (matchedMusyrifNama) {
            const cleanName = matchedMusyrifNama.toLowerCase().trim();
            if (musyrifByNameMap.has(cleanName)) {
              const matchedUser = musyrifByNameMap.get(cleanName)!;
              matchedMusyrifId = matchedUser.id;
              matchedMusyrifNama = matchedUser.nama;
            }
          }

          return {
            ...santri,
            musyrifId: matchedMusyrifId,
            musyrifNama: matchedMusyrifNama,
            totalPoin,
            statusPembinaan
          };
        });

        const sortedSantri = sortSantriList(santriWithPoin);
        setAllSantriList(sortedSantri);
        localStorage.setItem('simka_santri', JSON.stringify(sortedSantri));
      }

      if (dbMasterPelanggaran !== null && dbMasterPelanggaran.length > 0) {
        const sortedPelanggaran = sortMasterPelanggaranList(dbMasterPelanggaran);
        setPelanggaranList(sortedPelanggaran);
        localStorage.setItem('simka_master_pelanggaran', JSON.stringify(sortedPelanggaran));
      }

      if (dbMasterPembinaan !== null && dbMasterPembinaan.length > 0) {
        setMasterPembinaanList(dbMasterPembinaan);
        localStorage.setItem('simka_master_pembinaan', JSON.stringify(dbMasterPembinaan));
      }

      if (dbPembinaan !== null) {
        setAllPembinaanList(dbPembinaan);
        localStorage.setItem('simka_pembinaan_records', JSON.stringify(dbPembinaan));
      }
    } catch (err) {
      console.warn('Supabase data synchronization note:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Fetch Supabase data on mount and whenever user logs in
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --------------------------------------------------------------------------
  // DATA ISOLATION LOGIC
  // --------------------------------------------------------------------------
  const activeUnitScope = useMemo((): UnitFilter => {
    if (!user) return 'ALL';
    if (user.role === 'KASIE_KEPESANTRENAN') {
      return selectedKasieUnitFilter;
    }
    return user.unit as UnitPesantren;
  }, [user, selectedKasieUnitFilter]);

  // Scoped Santri
  const santriList = useMemo(() => {
    if (!user) return [];
    if (user.role === 'KASIE_KEPESANTRENAN') {
      if (selectedKasieUnitFilter === 'ALL') return allSantriList;
      return allSantriList.filter((s) => s.unit === selectedKasieUnitFilter);
    }
    return allSantriList.filter((s) => s.unit === user.unit);
  }, [user, selectedKasieUnitFilter, allSantriList]);

  // Scoped Riwayat
  const riwayatList = useMemo(() => {
    if (!user) return [];
    if (user.role === 'KASIE_KEPESANTRENAN') {
      if (selectedKasieUnitFilter === 'ALL') return allRiwayatList;
      return allRiwayatList.filter((r) => r.santriUnit === selectedKasieUnitFilter);
    }
    return allRiwayatList.filter((r) => r.santriUnit === user.unit);
  }, [user, selectedKasieUnitFilter, allRiwayatList]);

  // Scoped Pembinaan
  const pembinaanList = useMemo(() => {
    if (!user) return [];
    if (user.role === 'KASIE_KEPESANTRENAN') {
      if (selectedKasieUnitFilter === 'ALL') return allPembinaanList;
      return allPembinaanList.filter((p) => p.santriUnit === selectedKasieUnitFilter);
    }
    return allPembinaanList.filter((p) => p.santriUnit === user.unit);
  }, [user, selectedKasieUnitFilter, allPembinaanList]);

  // Toast Helper
  const showToast = (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION & SESSION
  // --------------------------------------------------------------------------
  const login = async (
    usernameInput: string,
    passwordInput: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; message?: string }> => {
    const result = await authenticateUser(usernameInput, passwordInput, usersList);
    if (result.success && result.user) {
      setUser(result.user);
      if (rememberMe) {
        localStorage.setItem('simka_session', JSON.stringify(result.user));
        sessionStorage.removeItem('simka_session');
      } else {
        sessionStorage.setItem('simka_session', JSON.stringify(result.user));
        localStorage.removeItem('simka_session');
      }
      const targetRoute = getDefaultRouteForRole(result.user.role);
      setCurrentRouteState(targetRoute);
      showToast(
        'Login Berhasil',
        `Selamat datang, ${result.user.nama} (${getRoleDisplayName(result.user.role)} - ${getUnitDisplayName(result.user.unit)}).`,
        'success'
      );
      // Immediately refresh live data from Supabase upon login
      refreshData();
      return { success: true };
    }
    return { success: false, message: result.message || 'Kombinasi username atau password salah.' };
  };

  const logout = () => {
    localStorage.removeItem('simka_session');
    sessionStorage.removeItem('simka_session');
    setUser(null);
    setCurrentRouteState('login');
    showToast('Sesi Berakhir', 'Anda telah keluar dari sistem SIMKA.ID dengan aman.', 'info');
  };

  // --------------------------------------------------------------------------
  // MASTER PELANGGARAN MANAGEMENT (KASIE SUPERADMIN ONLY)
  // --------------------------------------------------------------------------
  const addPelanggaran = async (data: {
    kode?: string;
    jenis: string;
    poin: number;
    konsekuensi: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang menambah Master Pelanggaran.' };
    }

    const cleanJenis = data.jenis.trim();
    if (!cleanJenis) {
      return { success: false, message: 'Item Pelanggaran wajib diisi!' };
    }

    const cleanPoin = Number(data.poin);
    if (isNaN(cleanPoin) || cleanPoin < 1) {
      return { success: false, message: 'Poin pelanggaran harus berupa angka positif!' };
    }

    const isDuplicate = pelanggaranList.some(
      (p) => p.jenis.trim().toLowerCase() === cleanJenis.toLowerCase()
    );
    if (isDuplicate) {
      return { success: false, message: `Item pelanggaran "${cleanJenis}" sudah terdaftar di sistem.` };
    }

    const calculatedKategori = getKategoriFromPoin(cleanPoin).kategori;
    const nextKode = data.kode?.trim() || `P${String(pelanggaranList.length + 1).padStart(3, '0')}`;

    const res = await insertMasterPelanggaranToDB(
      {
        kode: nextKode,
        jenis: cleanJenis,
        poin: cleanPoin,
        kategori: calculatedKategori,
        konsekuensi: data.konsekuensi?.trim() || '-'
      },
      user.role
    );

    if (!res.success) {
      return { success: false, message: res.error || 'Gagal menyimpan master pelanggaran ke database.' };
    }

    const newPelanggaran = res.data || {
      id: `p-${Date.now()}`,
      kode: nextKode,
      jenis: cleanJenis,
      poin: cleanPoin,
      kategori: calculatedKategori,
      konsekuensi: data.konsekuensi?.trim() || '-'
    };

    setPelanggaranList((prev) => sortMasterPelanggaranList([newPelanggaran, ...prev]));
    showToast(
      'Pelanggaran Ditambahkan',
      `Item "${newPelanggaran.jenis}" (${newPelanggaran.poin} Poin - ${newPelanggaran.kategori}) berhasil ditambahkan.`,
      'success'
    );
    return { success: true };
  };

  const updatePelanggaran = async (
    id: string,
    data: {
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
    }
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang mengubah Master Pelanggaran.' };
    }

    const cleanJenis = data.jenis.trim();
    if (!cleanJenis) {
      return { success: false, message: 'Item Pelanggaran wajib diisi!' };
    }

    const cleanPoin = Number(data.poin);
    if (isNaN(cleanPoin) || cleanPoin < 1) {
      return { success: false, message: 'Poin pelanggaran harus berupa angka positif!' };
    }

    const calculatedKategori = getKategoriFromPoin(cleanPoin).kategori;

    const res = await updateMasterPelanggaranInDB(
      id,
      {
        kode: data.kode,
        jenis: cleanJenis,
        poin: cleanPoin,
        kategori: calculatedKategori,
        konsekuensi: data.konsekuensi?.trim() || '-'
      },
      user.role
    );

    if (!res.success) {
      return { success: false, message: res.error || 'Gagal memperbarui master pelanggaran di database.' };
    }

    setPelanggaranList((prev) =>
      sortMasterPelanggaranList(
        prev.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              kode: data.kode || p.kode,
              jenis: cleanJenis,
              poin: cleanPoin,
              kategori: calculatedKategori,
              konsekuensi: data.konsekuensi?.trim() || '-'
            };
          }
          return p;
        })
      )
    );

    showToast('Pelanggaran Diperbarui', `Item "${cleanJenis}" berhasil diperbarui.`, 'success');
    return { success: true };
  };

  const checkMasterPelanggaranUsage = (masterId?: string) => {
    const totalTransactionsCount = allRiwayatList.length;
    const totalMasterCount = pelanggaranList.length;

    if (masterId) {
      const targetMaster = pelanggaranList.find((p) => p.id === masterId);
      const usedInLogs = allRiwayatList.filter((r) => {
        if (r.jenisPelanggaranId && r.jenisPelanggaranId === masterId) return true;
        if (targetMaster && r.jenisPelanggaranNama && r.jenisPelanggaranNama.toLowerCase() === targetMaster.jenis.toLowerCase()) return true;
        return false;
      });
      const count = usedInLogs.length;
      return {
        isUsed: count > 0,
        count,
        totalMasterCount,
        usedCount: count > 0 ? 1 : 0,
        unusedCount: count > 0 ? 0 : 1,
        totalTransactionsCount,
        affectedTransactionsCount: count,
        usedIds: count > 0 ? [masterId] : [],
        unusedIds: count === 0 ? [masterId] : []
      };
    }

    const usedIdsSet = new Set<string>();
    let affectedTxCount = 0;

    for (const master of pelanggaranList) {
      const matchingLogs = allRiwayatList.filter((r) => {
        if (r.jenisPelanggaranId && r.jenisPelanggaranId === master.id) return true;
        if (r.jenisPelanggaranNama && r.jenisPelanggaranNama.toLowerCase() === master.jenis.toLowerCase()) return true;
        return false;
      });

      if (matchingLogs.length > 0) {
        usedIdsSet.add(master.id);
        affectedTxCount += matchingLogs.length;
      }
    }

    const usedIds = Array.from(usedIdsSet);
    const unusedIds = pelanggaranList.map((p) => p.id).filter((id) => !usedIdsSet.has(id));

    return {
      isUsed: usedIds.length > 0,
      count: usedIds.length,
      totalMasterCount,
      usedCount: usedIds.length,
      unusedCount: unusedIds.length,
      totalTransactionsCount,
      affectedTransactionsCount: affectedTxCount,
      usedIds,
      unusedIds
    };
  };

  const deletePelanggaran = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menghapus data.' };
    }

    const existing = pelanggaranList.find((p) => p.id === id);
    if (!existing) {
      return { success: false, message: 'Item pelanggaran tidak ditemukan.' };
    }

    const usage = checkMasterPelanggaranUsage(id);
    if (usage.isUsed) {
      return {
        success: false,
        message: `Tidak dapat menghapus item ini karena sedang digunakan oleh ${usage.count} catatan pelanggaran santri.`
      };
    }

    const res = await deleteMasterPelanggaranFromDB(id, user.role);
    if (!res.success) {
      return { success: false, message: res.error || 'Gagal menghapus dari database.' };
    }

    setPelanggaranList((prev) => prev.filter((p) => p.id !== id));
    showToast('Pelanggaran Dihapus', `Item "${existing.jenis}" berhasil dihapus dari sistem.`, 'info');
    return { success: true };
  };

  const deleteAllMasterPelanggaran = async (
    onlyUnused = false
  ): Promise<{
    success: boolean;
    deletedCount: number;
    remainingCount: number;
    message: string;
  }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return {
        success: false,
        deletedCount: 0,
        remainingCount: pelanggaranList.length,
        message: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mereset Master Pelanggaran.'
      };
    }

    if (pelanggaranList.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        remainingCount: 0,
        message: 'Master Pelanggaran sudah dalam keadaan kosong.'
      };
    }

    const usageStats = checkMasterPelanggaranUsage();

    if (usageStats.unusedCount === 0 && pelanggaranList.length > 0) {
      return {
        success: false,
        deletedCount: 0,
        remainingCount: usageStats.usedCount,
        message: `Tidak dapat menghapus master karena seluruh data (${usageStats.usedCount} item) sedang digunakan dalam ${usageStats.affectedTransactionsCount} riwayat pelanggaran santri.`
      };
    }

    if (usageStats.usedCount > 0 && !onlyUnused) {
      return {
        success: false,
        deletedCount: 0,
        remainingCount: usageStats.usedCount,
        message: `${usageStats.unusedCount} master dapat dihapus. ${usageStats.usedCount} master sedang digunakan oleh data transaksi dan tidak dapat dihapus.`
      };
    }

    const idsToDelete = usageStats.unusedIds;
    if (idsToDelete.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        remainingCount: usageStats.usedCount,
        message: 'Tidak ada master pelanggaran yang bebas transaksi untuk dihapus.'
      };
    }

    const recordsToDelete = pelanggaranList.filter((p) => idsToDelete.includes(p.id));
    const dbResult = await deleteAllMasterPelanggaranFromDB(recordsToDelete, user.role);
    if (!dbResult.success) {
      return {
        success: false,
        deletedCount: 0,
        remainingCount: pelanggaranList.length,
        message: dbResult.error || 'Gagal menghapus data master dari database Supabase.'
      };
    }

    const updated = pelanggaranList.filter((p) => !idsToDelete.includes(p.id));
    setPelanggaranList(updated);

    const isTotalReset = updated.length === 0;
    const msg = isTotalReset
      ? 'Semua master pelanggaran berhasil dihapus.'
      : `${idsToDelete.length} master pelanggaran yang tidak digunakan berhasil dihapus. ${updated.length} master tetap disimpan.`;

    showToast('Master Pelanggaran Dihapus', msg, 'success');
    return {
      success: true,
      deletedCount: idsToDelete.length,
      remainingCount: updated.length,
      message: msg
    };
  };

  const importPelanggaranBatch = async (
    items: Array<{
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
      kategori?: string;
    }>
  ): Promise<{ success: boolean; insertedCount: number; message: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, insertedCount: 0, message: 'Hanya Kasie Kepesantrenan yang berwenang melakukan import Master Pelanggaran.' };
    }

    if (items.length === 0) {
      return { success: false, insertedCount: 0, message: 'Tidak ada data valid yang dapat diimport.' };
    }

    const existingJenisSet = new Set(
      pelanggaranList.map((p) => p.jenis.trim().toLowerCase().replace(/\s+/g, ' '))
    );

    const validNewItems: Array<{
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
      kategori: PelanggaranKategori;
    }> = [];

    for (const item of items) {
      const cleanJenis = item.jenis.trim();
      const normKey = cleanJenis.toLowerCase().replace(/\s+/g, ' ');
      if (!cleanJenis || existingJenisSet.has(normKey)) {
        continue;
      }
      existingJenisSet.add(normKey);

      const cleanPoin = Number(item.poin) || 15;
      const calculatedKategori = getKategoriFromPoin(cleanPoin).kategori;

      validNewItems.push({
        kode: item.kode?.trim() || undefined,
        jenis: cleanJenis,
        poin: cleanPoin,
        kategori: calculatedKategori,
        konsekuensi: item.konsekuensi?.trim() || '-'
      });
    }

    if (validNewItems.length === 0) {
      return { success: false, insertedCount: 0, message: 'Semua item pelanggaran dalam file sudah ada di database.' };
    }

    const dbRes = await importMasterPelanggaranBatchToDB(validNewItems, user.role);
    if (!dbRes.success) {
      return { success: false, insertedCount: 0, message: dbRes.error || 'Gagal mengimpor ke database.' };
    }

    if (dbRes.insertedData && dbRes.insertedData.length > 0) {
      setPelanggaranList((prev) => sortMasterPelanggaranList([...dbRes.insertedData!, ...prev]));
    }

    showToast(
      'Import Pelanggaran Berhasil',
      `Sebanyak ${validNewItems.length} item pelanggaran baru berhasil ditambahkan ke database Supabase.`,
      'success'
    );
    return {
      success: true,
      insertedCount: validNewItems.length,
      message: `${validNewItems.length} data pelanggaran berhasil diimport.`
    };
  };

  // --------------------------------------------------------------------------
  // USER MANAGEMENT (KASIE SUPERADMIN ONLY)
  // --------------------------------------------------------------------------
  const addUser = async (data: {
    id?: string;
    nama: string;
    username: string;
    password: string;
    role: UserRole;
    unit: 'ALL' | UnitPesantren;
    email?: string;
    title?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang menambah user.' };
    }

    const cleanUsername = data.username.trim().toLowerCase();
    if (!cleanUsername || !data.password || !data.nama) {
      return { success: false, message: 'Nama, username, dan password wajib diisi!' };
    }

    const exists = usersList.some((u) => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { success: false, message: `Username "@${cleanUsername}" sudah digunakan.` };
    }

    const password_hash = await hashPassword(data.password);
    const assignedUnit = data.role === 'KASIE_KEPESANTRENAN' ? 'ALL' : (data.unit || 'SMP');

    const res = await insertUserToDB(
      {
        nama: data.nama.trim(),
        username: cleanUsername,
        password_hash,
        role: data.role,
        unit: assignedUnit,
        is_active: true,
        email: data.email?.trim() || `${cleanUsername}@simka.id`,
        title: data.title?.trim() || `${data.role} ${assignedUnit}`
      },
      user.role
    );

    if (!res.success || !res.data) {
      return { success: false, message: res.error || 'Gagal menyimpan user ke database.' };
    }

    setUsersList((prev) => [res.data!, ...prev]);
    showToast('Pengguna Ditambahkan', `Akun @${cleanUsername} (${res.data.nama}) berhasil dibuat.`, 'success');
    return { success: true };
  };

  const editUser = async (
    id: string,
    data: {
      nama: string;
      username: string;
      email?: string;
      role: UserRole;
      unit: 'ALL' | UnitPesantren;
      is_active?: boolean;
    }
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang mengedit pengguna.' };
    }

    const existing = usersList.find((u) => u.id === id);
    if (!existing) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const cleanUsername = data.username.trim().toLowerCase();
    const duplicate = usersList.some(
      (u) => u.id !== id && u.username.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      return { success: false, message: `Username "@${cleanUsername}" sudah dipakai oleh pengguna lain.` };
    }

    const assignedUnit = data.role === 'KASIE_KEPESANTRENAN' ? 'ALL' : data.unit;

    const res = await updateUserInDB(
      id,
      {
        nama: data.nama.trim(),
        username: cleanUsername,
        role: data.role,
        unit: assignedUnit,
        is_active: data.is_active !== undefined ? data.is_active : existing.is_active,
        email: data.email?.trim(),
        title: `${data.role} ${assignedUnit}`
      },
      user.role
    );

    if (!res.success) {
      return { success: false, message: res.error || 'Gagal memperbarui user di database.' };
    }

    // Refresh live database data to sync all components
    await refreshData();

    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return {
            ...u,
            nama: data.nama.trim(),
            username: cleanUsername,
            email: data.email?.trim() || u.email,
            role: data.role,
            unit: assignedUnit,
            is_active: data.is_active !== undefined ? data.is_active : u.is_active,
            title: `${data.role} ${assignedUnit}`
          };
        }
        return u;
      })
    );

    showToast('Pengguna Diperbarui', `Data akun @${cleanUsername} berhasil disimpan.`, 'success');
    return { success: true };
  };

  const resetUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang mereset kata sandi.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal 6 karakter!' };
    }

    const existing = usersList.find((u) => u.id === userId);
    if (!existing) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const newHash = await hashPassword(newPassword);
    const res = await resetUserPasswordInDB(userId, newHash, user.role);

    if (!res.success) {
      return { success: false, message: res.error || 'Gagal mereset kata sandi di database.' };
    }

    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password_hash: newHash } : u))
    );

    showToast('Password Direset', `Kata sandi akun @${existing.username} berhasil direset.`, 'success');
    return { success: true };
  };

  const importUsersBatch = async (
    usersData: ImportUserPayload[]
  ): Promise<{
    success: boolean;
    insertedCount: number;
    duplicateCount?: number;
    errorCount?: number;
    totalRows?: number;
    details?: string[];
    message: string;
  }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      const msg = 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengimpor akun pengguna.';
      showToast('Akses Ditolak', msg, 'error');
      return {
        success: false,
        insertedCount: 0,
        duplicateCount: 0,
        errorCount: usersData.length,
        totalRows: usersData.length,
        details: [msg],
        message: msg
      };
    }

    if (usersData.length === 0) {
      const msg = 'Tidak ada data pengguna yang dipilih untuk diimport.';
      showToast('Data Kosong', msg, 'warning');
      return {
        success: false,
        insertedCount: 0,
        duplicateCount: 0,
        errorCount: 0,
        totalRows: 0,
        details: [msg],
        message: msg
      };
    }

    const dbRes = await importUsersBatchToDB(usersData, user.role);

    if (dbRes.insertedCount > 0) {
      // Refresh single source of truth from database
      const freshUsers = await fetchUsersFromDB();
      if (freshUsers && freshUsers.length > 0) {
        setUsersList(freshUsers);
      }
      showToast(
        'Import Pengguna Berhasil',
        `Sebanyak ${dbRes.insertedCount} akun pengguna baru berhasil ditambahkan ke database.` +
          (dbRes.duplicateCount > 0 ? ` (${dbRes.duplicateCount} duplikat diabaikan)` : ''),
        'success'
      );
    } else {
      showToast(
        'Import Tidak Menambahkan Data',
        dbRes.message || 'Semua akun yang diunggah sudah terdaftar atau gagal validasi.',
        'warning'
      );
    }

    return {
      success: dbRes.insertedCount > 0,
      insertedCount: dbRes.insertedCount,
      duplicateCount: dbRes.duplicateCount,
      errorCount: dbRes.errorCount,
      totalRows: dbRes.totalRows,
      details: dbRes.details,
      message: dbRes.message
    };
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      const msg = 'Akses Ditolak: Hanya Kasie Kepesantrenan / Superadmin yang berwenang menghapus pengguna.';
      showToast('Akses Ditolak', msg, 'error');
      return { success: false, message: msg };
    }
    if (userId === user.id) {
      const msg = 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan!';
      showToast('Peringatan', msg, 'warning');
      return { success: false, message: msg };
    }

    const existing = usersList.find((u) => u.id === userId);
    if (!existing) {
      const msg = 'Pengguna tidak ditemukan.';
      showToast('Gagal Menghapus', msg, 'error');
      return { success: false, message: msg };
    }

    // Safety check: Prevent deleting the last active Superadmin account
    const activeKasieCount = usersList.filter((u) => u.role === 'KASIE_KEPESANTRENAN' && u.is_active).length;
    if (existing.role === 'KASIE_KEPESANTRENAN' && activeKasieCount <= 1) {
      const msg = 'Tindakan dibatalkan: Ini adalah satu-satunya akun Superadmin aktif. Sistem tidak mengizinkan penghapusan administrator terakhir.';
      showToast('Proteksi Sistem', msg, 'error');
      return { success: false, message: msg };
    }

    const res = await deleteUserFromDB(userId, user.role);
    if (!res.success) {
      const errMsg = res.error || 'Gagal menghapus pengguna dari database Supabase.';
      showToast('Gagal Menghapus', errMsg, 'error');
      return { success: false, message: errMsg };
    }

    // Reload users list directly from Supabase to guarantee single source of truth
    const freshUsers = await fetchUsersFromDB();
    if (freshUsers && freshUsers.length > 0) {
      setUsersList(freshUsers);
      localStorage.setItem('simka_users', JSON.stringify(freshUsers));
    } else {
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    }

    showToast(
      'Pengguna Berhasil Dihapus',
      `Akun @${existing.username} (${existing.nama}) telah berhasil dihapus dari database.`,
      'success'
    );
    return { success: true };
  };

  const toggleUserActive = async (userId: string) => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang dapat mengubah status user.', 'error');
      return;
    }
    if (userId === user.id) {
      showToast('Peringatan', 'Anda tidak dapat menonaktifkan akun sendiri yang sedang aktif.', 'warning');
      return;
    }

    const existing = usersList.find((u) => u.id === userId);
    if (!existing) return;

    const newStatus = !existing.is_active;
    const res = await toggleUserActiveInDB(userId, newStatus, user.role);
    if (!res.success) {
      showToast('Gagal Mengubah Status', res.error || 'Terjadi kesalahan sistem.', 'error');
      return;
    }

    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u))
    );
    showToast('Status Pengguna Diperbarui', `Akun ${existing.nama} ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`, 'info');
  };

  // --------------------------------------------------------------------------
  // SANTRI MANAGEMENT (SUPABASE SINGLE SOURCE OF TRUTH)
  // --------------------------------------------------------------------------
  const addSantri = async (data: {
    nis: string;
    nama: string;
    kelas: string;
    unit: UnitPesantren;
    musyrifId?: string;
    asrama?: string;
    kamar?: string;
    keterangan?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }

    if (user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Akses Ditolak: Hanya Kasie Kepesantrenan / Super Admin yang berwenang menambah data santri!' };
    }

    if (!data.nis || !data.nama || !data.kelas || !data.unit) {
      return { success: false, message: 'NIS, Nama, Kelas, dan Unit wajib diisi!' };
    }

    let musyrifNama: string | undefined;
    if (data.musyrifId) {
      const musy = usersList.find((u) => u.id === data.musyrifId);
      musyrifNama = musy ? musy.nama : undefined;
    }

    const dbRes = await insertSantriToDB(
      {
        ...data,
        musyrifNama
      },
      user.role,
      user.unit
    );

    if (!dbRes.success) {
      return { success: false, message: dbRes.error || 'Gagal menyimpan data santri ke database.' };
    }

    const newSantri = dbRes.data || {
      id: `s-${data.unit.toLowerCase()}-${Date.now()}`,
      nis: data.nis.trim(),
      nama: data.nama.trim().toUpperCase(),
      kelas: data.kelas.trim(),
      unit: data.unit,
      totalPoin: 0,
      statusPembinaan: 'Baik' as Santri['statusPembinaan'],
      musyrifId: data.musyrifId,
      musyrifNama,
      asrama: data.asrama?.trim() || `Asrama ${data.unit}`,
      kamar: data.kamar?.trim() || '-',
      keterangan: data.keterangan?.trim()
    };

    setAllSantriList((prev) => sortSantriList([newSantri, ...prev]));
    showToast('Santri Berhasil Ditambahkan', `Santri ${newSantri.nama} (${newSantri.unit}) telah terdaftar di database.`, 'success');
    return { success: true };
  };

  const updateSantri = async (
    id: string,
    data: {
      nis: string;
      nama: string;
      kelas: string;
      unit: UnitPesantren;
      musyrifId?: string;
      asrama?: string;
      kamar?: string;
      keterangan?: string;
      statusPembinaan?: Santri['statusPembinaan'];
    }
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      showToast('Gagal Memperbarui Data Santri', 'Silakan login terlebih dahulu.', 'error');
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }

    if (user.role !== 'KASIE_KEPESANTRENAN') {
      showToast('Akses Ditolak', 'Anda tidak memiliki hak untuk mengubah data santri.', 'error');
      return { success: false, message: 'Anda tidak memiliki hak untuk mengubah data santri.' };
    }

    const existing = allSantriList.find((s) => s.id === id);
    if (!existing) {
      showToast('Gagal Memperbarui Data Santri', 'Data santri tidak ditemukan.', 'error');
      return { success: false, message: 'Data santri tidak ditemukan.' };
    }

    let musyrifNama = existing.musyrifNama;
    if (data.musyrifId !== undefined) {
      if (data.musyrifId) {
        const musy = usersList.find((u) => u.id === data.musyrifId);
        musyrifNama = musy ? musy.nama : undefined;
      } else {
        musyrifNama = undefined;
      }
    }

    const dbRes = await updateSantriInDB(
      id,
      {
        ...data,
        musyrifNama
      },
      user.role,
      user.unit
    );

    if (!dbRes.success) {
      showToast('Gagal Memperbarui Data Santri', dbRes.error || 'Gagal memperbarui santri di database.', 'error');
      return { success: false, message: dbRes.error || 'Gagal memperbarui santri di database.' };
    }

    // Refresh from Supabase if configured to guarantee sync
    let synced = false;
    if (isSupabaseConfigured()) {
      try {
        const refreshed = await fetchSantriFromDB();
        if (refreshed && refreshed.length > 0) {
          const pointMap = new Map<string, number>();
          allRiwayatList.forEach((r) => {
            pointMap.set(r.santriId, (pointMap.get(r.santriId) || 0) + (r.poin || 0));
          });
          const withPoints = refreshed.map((s) => ({
            ...s,
            totalPoin: pointMap.get(s.id) || 0
          }));
          const sorted = sortSantriList(withPoints);
          setAllSantriList(sorted);
          localStorage.setItem('simka_santri', JSON.stringify(sorted));
          synced = true;
        }
      } catch (err) {
        console.warn('Re-fetch santri after update error, applying local state update', err);
      }
    }

    if (!synced) {
      setAllSantriList((prev) =>
        sortSantriList(
          prev.map((s) => {
            if (s.id === id) {
              return {
                ...s,
                nis: data.nis.trim(),
                nama: data.nama.trim().toUpperCase(),
                kelas: data.kelas.trim(),
                unit: data.unit,
                musyrifId: data.musyrifId,
                musyrifNama,
                asrama: data.asrama !== undefined ? data.asrama.trim() : s.asrama,
                kamar: data.kamar !== undefined ? data.kamar.trim() : s.kamar,
                keterangan: data.keterangan !== undefined ? data.keterangan.trim() : s.keterangan,
                statusPembinaan: data.statusPembinaan || s.statusPembinaan
              };
            }
            return s;
          })
        )
      );
    }

    showToast('Data Santri Berhasil Diperbarui', `Data santri ${data.nama.toUpperCase()} berhasil disimpan.`, 'success');
    return { success: true };
  };

  const deleteSantri = async (
    id: string,
    options?: { deleteViolations?: boolean }
  ): Promise<{ success: boolean; message?: string; violationCount?: number }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menghapus data santri.'
      };
    }

    const existing = allSantriList.find((s) => s.id === id);
    if (!existing) {
      return { success: false, message: 'Data santri tidak ditemukan.' };
    }

    const relatedViolations = allRiwayatList.filter(
      (r) =>
        r.santriId === id ||
        (r.santriNama && r.santriNama.toLowerCase() === existing.nama.toLowerCase() && r.santriUnit === existing.unit)
    );
    const violationCount = relatedViolations.length;

    if (violationCount > 0 && !options?.deleteViolations) {
      return {
        success: false,
        violationCount,
        message: `Santri ${existing.nama} tidak dapat dihapus karena masih memiliki ${violationCount} data pelanggaran.`
      };
    }

    const dbResult = await deleteSantriFromDB(
      existing,
      { deleteViolations: options?.deleteViolations },
      user.role,
      user.unit
    );

    if (!dbResult.success) {
      return {
        success: false,
        violationCount,
        message: dbResult.error || 'Gagal menghapus data santri dari database.'
      };
    }

    // Clean up local state
    if (violationCount > 0 || options?.deleteViolations) {
      setAllRiwayatList((prev) =>
        prev.filter(
          (r) =>
            r.santriId !== id &&
            !(r.santriNama && r.santriNama.toLowerCase() === existing.nama.toLowerCase() && r.santriUnit === existing.unit)
        )
      );

      setAllPembinaanList((prev) =>
        prev.filter(
          (p) =>
            p.santriId !== id &&
            !(p.santriNama && p.santriNama.toLowerCase() === existing.nama.toLowerCase() && p.santriUnit === existing.unit)
        )
      );
    }

    setAllSantriList((prev) => prev.filter((s) => s.id !== id));

    if (selectedSantriForDetail?.id === id) {
      setSelectedSantriForDetail(null);
    }

    if (violationCount > 0) {
      showToast(
        'Data Santri & Pelanggaran Dihapus',
        `Data santri ${existing.nama} beserta ${violationCount} data pelanggaran berhasil dibersihkan dari database.`,
        'info'
      );
    } else {
      showToast(
        'Santri Berhasil Dihapus',
        `Data santri ${existing.nama} telah dihapus dari sistem.`,
        'info'
      );
    }

    return { success: true, message: 'Data santri berhasil dihapus.' };
  };

  const importSantriBatch = async (
    santriDataList: Array<{
      nis: string;
      nama: string;
      kelas: string;
      unit: UnitPesantren;
      musyrifId?: string;
      musyrifNama?: string;
      asrama?: string;
      kamar?: string;
      statusPembinaan?: Santri['statusPembinaan'];
      keterangan?: string;
    }>
  ): Promise<{ success: boolean; insertedCount: number; message: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return {
        success: false,
        insertedCount: 0,
        message: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengimpor data santri.'
      };
    }

    if (!santriDataList || santriDataList.length === 0) {
      return { success: false, insertedCount: 0, message: 'Tidak ada data valid yang dapat diimport.' };
    }

    const existingNisSet = new Set(
      (allSantriList || [])
        .map((s) => String(s?.nis || (s as any)?.kode_santri || '').toLowerCase().trim())
        .filter(Boolean)
    );

    const validItems = santriDataList.filter((item) => {
      if (!item || !item.nis) return false;
      const cleanNis = String(item.nis).trim().toLowerCase();
      if (!cleanNis || existingNisSet.has(cleanNis)) return false;
      existingNisSet.add(cleanNis);
      return true;
    });

    if (validItems.length === 0) {
      return {
        success: false,
        insertedCount: 0,
        message: 'Semua data santri di dalam file sudah terdaftar (duplikat NIS) di database.'
      };
    }

    try {
      const dbRes = await importSantriBatchToDB(validItems, user.role);
      if (!dbRes.success) {
        return { success: false, insertedCount: 0, message: dbRes.error || 'Gagal menyimpan ke database Supabase.' };
      }

      // Refresh single source of truth from Supabase
      try {
        const latestSantri = await fetchSantriFromDB();
        if (latestSantri && latestSantri.length > 0) {
          setAllSantriList(sortSantriList(latestSantri));
        } else if (dbRes.insertedData && dbRes.insertedData.length > 0) {
          setAllSantriList((prev) => sortSantriList([...dbRes.insertedData!, ...(prev || [])]));
        }
      } catch (fetchErr) {
        console.warn('[REFRESH AFTER IMPORT WARNING]', fetchErr);
        if (dbRes.insertedData && dbRes.insertedData.length > 0) {
          setAllSantriList((prev) => sortSantriList([...dbRes.insertedData!, ...(prev || [])]));
        }
      }

      showToast(
        'Import Excel Berhasil',
        `Sebanyak ${dbRes.insertedCount} data santri baru berhasil disimpan permanen ke database Supabase.`,
        'success'
      );
      return {
        success: true,
        insertedCount: dbRes.insertedCount,
        message: `${dbRes.insertedCount} data santri berhasil diimport.`
      };
    } catch (err: any) {
      console.error('[IMPORT SANTRI BATCH EXCEPTION]', err);
      return {
        success: false,
        insertedCount: 0,
        message: err?.message || 'Terjadi kesalahan sistem saat mengimpor data santri.'
      };
    }
  };

  // --------------------------------------------------------------------------
  // REKOMENDASI PEMBINAAN & PENCATATAN PELANGGARAN
  // --------------------------------------------------------------------------
  const getPembinaanBySinglePoin = (poin: number): MasterPembinaan | null => {
    return findPembinaanBySinglePoin(poin, masterPembinaanList);
  };

  const catatPelanggaranBaru = async (data: {
    santriId: string;
    pelanggaranId: string;
    catatan?: string;
  }): Promise<boolean> => {
    if (!user) {
      showToast('Gagal Mencatat', 'Sesi login tidak valid. Silakan login kembali.', 'error');
      return false;
    }

    const targetSantri = allSantriList.find((s) => s.id === data.santriId);
    const targetPelanggaran = pelanggaranList.find((p) => p.id === data.pelanggaranId);

    if (!targetSantri || !targetPelanggaran) {
      showToast('Gagal Mencatat', 'Data santri atau jenis pelanggaran tidak valid.', 'error');
      return false;
    }

    if (user.role !== 'KASIE_KEPESANTRENAN' && user.unit !== targetSantri.unit) {
      showToast(
        'Akses Ditolak!',
        `Keamanan Database: Anda (${user.unit}) tidak diizinkan mencatat pelanggaran santri Unit ${targetSantri.unit}!`,
        'error'
      );
      return false;
    }

    const singlePoin = targetPelanggaran.poin;
    const rekomendasi = getPembinaanBySinglePoin(singlePoin);

    // Form frontend UUID using native crypto.randomUUID()
    const newViolationId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : undefined;

    const dbRes = await insertPelanggaranToDB(
      {
        id: newViolationId,
        santriId: targetSantri.id,
        santriNama: targetSantri.nama,
        santriKelas: targetSantri.kelas,
        santriUnit: targetSantri.unit,
        jenisPelanggaranId: targetPelanggaran.id,
        jenisPelanggaranNama: targetPelanggaran.jenis,
        poin: targetPelanggaran.poin,
        hukuman: targetPelanggaran.konsekuensi,
        catatan: data.catatan || 'Tercatat melalui sistem SIMKA.ID',
        pembinaanTingkat: rekomendasi ? rekomendasi.nama_tingkat : undefined,
        rekomendasiPembinaan: rekomendasi ? rekomendasi.jenis_pembinaan : undefined,
        pencatatId: user.id,
        pencatatNama: user.nama
      },
      user.role,
      user.unit
    );

    if (!dbRes.success || !dbRes.data) {
      showToast('Gagal Menyimpan', dbRes.error || 'Gagal menyimpan transaksi pelanggaran ke database.', 'error');
      return false;
    }

    setAllRiwayatList((prev) => [dbRes.data!, ...prev]);

    // Recalculate Santri's total point in state
    setAllSantriList((prev) =>
      prev.map((s) => {
        if (s.id === targetSantri.id) {
          const newPoin = s.totalPoin + targetPelanggaran.poin;
          let newStatus: Santri['statusPembinaan'] = s.statusPembinaan;
          if (newPoin >= 100) newStatus = 'SP 3';
          else if (newPoin >= 70) newStatus = 'SP 2';
          else if (newPoin >= 40) newStatus = 'SP 1';
          else if (newPoin > 0) newStatus = 'Peringatan Lisan';
          return {
            ...s,
            totalPoin: newPoin,
            statusPembinaan: newStatus
          };
        }
        return s;
      })
    );

    showToast(
      'Pelanggaran Tercatat!',
      `Pelanggaran santri ${targetSantri.nama} (${targetPelanggaran.poin} poin - Unit ${targetSantri.unit}) berhasil disimpan ke database.`,
      'success'
    );

    return true;
  };

  const canUserManageItem = (itemUnit: UnitPesantren): boolean => {
    if (!user) return false;
    if (user.role === 'KASIE_KEPESANTRENAN') return true;
    if (user.role === 'KOORDINATOR' && user.unit === itemUnit) return true;
    return false;
  };

  const markPembinaanSelesai = async (
    pelanggaranId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Sesi login tidak valid. Silakan login kembali.' };
    }
    if (user.role === 'MUSYRIF') {
      return {
        success: false,
        message: 'Akses Ditolak: Musyrif hanya dapat melihat status dan tidak berwenang menandai pembinaan selesai.'
      };
    }

    const target = allRiwayatList.find((r) => r.id === pelanggaranId);
    if (!target) {
      return { success: false, message: 'Data pelanggaran tidak ditemukan.' };
    }

    if (user.role === 'KOORDINATOR' && target.santriUnit !== user.unit) {
      return {
        success: false,
        message: `Akses Ditolak: Anda (${user.unit}) hanya berwenang menyelesaikan kasus untuk santri Unit ${user.unit}.`
      };
    }

    const dbRes = await updatePelanggaranStatusInDB(pelanggaranId, 'Selesai');
    if (!dbRes.success) {
      showToast('Gagal Menyimpan', dbRes.error || 'Gagal memperbarui status di database.', 'error');
      return { success: false, message: dbRes.error || 'Gagal memperbarui status di database.' };
    }

    setAllRiwayatList((prev) => {
      const updated = prev.map((item) => (item.id === pelanggaranId ? { ...item, status: 'Selesai' as const } : item));
      try {
        localStorage.setItem('simka_riwayat', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(
      'Pembinaan Selesai',
      `Tindak lanjut santri ${target.santriNama} (${target.jenisPelanggaranNama}) berhasil ditandai Selesai.`,
      'success'
    );
    return { success: true, message: 'Pembinaan berhasil ditandai selesai.' };
  };

  const updatePelanggaranStatus = async (
    pelanggaranId: string,
    newStatus: 'Selesai' | 'Belum Selesai'
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Sesi login tidak valid. Silakan login kembali.' };
    }
    if (user.role === 'MUSYRIF') {
      return {
        success: false,
        message: 'Akses Ditolak: Musyrif hanya dapat melihat status dan tidak berwenang mengubah status penyelesaian.'
      };
    }

    const target = allRiwayatList.find((r) => r.id === pelanggaranId);
    if (!target) {
      return { success: false, message: 'Data pelanggaran tidak ditemukan.' };
    }

    if (user.role === 'KOORDINATOR' && target.santriUnit !== user.unit) {
      return {
        success: false,
        message: `Akses Ditolak: Anda (${user.unit}) hanya berwenang mengubah status kasus untuk Unit ${user.unit}.`
      };
    }

    const dbRes = await updatePelanggaranStatusInDB(pelanggaranId, newStatus);
    if (!dbRes.success) {
      showToast('Gagal Menyimpan', dbRes.error || 'Gagal memperbarui status di database.', 'error');
      return { success: false, message: dbRes.error || 'Gagal memperbarui status di database.' };
    }

    setAllRiwayatList((prev) => {
      const updated = prev.map((item) => (item.id === pelanggaranId ? { ...item, status: newStatus } : item));
      try {
        localStorage.setItem('simka_riwayat', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast('Status Diperbarui', `Status pembinaan diubah menjadi "${newStatus}".`, 'info');
    return { success: true, message: `Status pembinaan diubah menjadi "${newStatus}".` };
  };

  const toggleStatusPelanggaran = async (id: string) => {
    const existing = allRiwayatList.find((r) => r.id === id);
    if (!existing) return;
    const targetStatus = existing.status === 'Selesai' ? 'Belum Selesai' : 'Selesai';
    await updatePelanggaranStatus(id, targetStatus);
  };

  const hideActivity = async (
    activityId: string,
    summary?: { santriNama: string; jenis: string; unit: UnitPesantren }
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Sesi login tidak valid. Silakan masuk kembali.' };
    }
    if (user.role === 'MUSYRIF') {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya Koordinator dan Kasie/Kabid yang berwenang menyembunyikan pemberitahuan.'
      };
    }
    if (user.role === 'KOORDINATOR' && summary?.unit && summary.unit !== user.unit) {
      return {
        success: false,
        message: `Akses Ditolak: Anda (${user.unit}) hanya berwenang mengelola pemberitahuan untuk Unit ${user.unit}.`
      };
    }

    try {
      const res = await saveHiddenNotificationToDB(activityId, user.id, user.role, user.unit);
      if (!res.success) {
        showToast('Gagal Menyembunyikan', res.error || 'Gagal menyimpan status ke database.', 'error');
        return { success: false, message: res.error || 'Gagal menyimpan status ke database.' };
      }

      setHiddenActivityIds((prev) => {
        const next = Array.from(new Set([...prev, activityId]));
        try {
          localStorage.setItem('simka_hidden_activities', JSON.stringify(next));
        } catch {}
        return next;
      });

      showToast('Pemberitahuan Disembunyikan', 'Pemberitahuan berhasil disembunyikan dari panel.', 'success');
      return { success: true, message: 'Pemberitahuan berhasil disembunyikan.' };
    } catch (err: any) {
      showToast('Gagal Menyembunyikan', err?.message || 'Terjadi kesalahan sistem.', 'error');
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const updateRiwayatPelanggaran = async (
    id: string,
    updates: {
      jenisPelanggaranId: string;
      jenisPelanggaranNama?: string;
      poin: number;
      hukuman?: string;
      catatan?: string;
      tanggal?: string;
      timestamp?: string;
      status?: 'Selesai' | 'Belum Selesai';
    }
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      showToast('Akses Ditolak', 'Sesi login tidak valid. Silakan login kembali.', 'error');
      return { success: false, message: 'Sesi login tidak valid.' };
    }

    if (user.role === 'MUSYRIF') {
      showToast('Akses Ditolak', 'Musyrif tidak memiliki hak akses untuk merevisi catatan pelanggaran.', 'error');
      return { success: false, message: 'Musyrif tidak berwenang merevisi catatan pelanggaran.' };
    }

    const currentRecord = allRiwayatList.find((r) => r.id === id);
    if (!currentRecord) {
      showToast('Gagal Memperbarui', 'Data pelanggaran tidak ditemukan.', 'error');
      return { success: false, message: 'Data pelanggaran tidak ditemukan.' };
    }

    if (user.role === 'KOORDINATOR' && user.unit !== 'ALL' && currentRecord.santriUnit !== user.unit) {
      showToast(
        'Akses Ditolak',
        `Koordinator Unit ${user.unit} hanya berwenang merevisi kasus santri Unit ${user.unit}.`,
        'error'
      );
      return { success: false, message: 'Akses Ditolak: Anda hanya berwenang merevisi kasus santri di unit Anda.' };
    }

    // Resolve Master Pelanggaran from list
    const masterItem = pelanggaranList.find((p) => p.id === updates.jenisPelanggaranId);
    const finalJenisNama = updates.jenisPelanggaranNama || masterItem?.jenis || currentRecord.jenisPelanggaranNama;
    const finalPoin = updates.poin > 0 ? updates.poin : (masterItem?.poin || currentRecord.poin);
    const finalHukuman = updates.hukuman !== undefined ? updates.hukuman : (masterItem?.konsekuensi || currentRecord.hukuman);
    const finalTimestamp = updates.timestamp || currentRecord.timestamp || new Date().toISOString();
    const finalTanggal = updates.tanggal || currentRecord.tanggal;
    const finalStatus = updates.status || currentRecord.status;

    // Call Supabase update
    const dbRes = await updatePelanggaranRecordInDB(
      id,
      {
        pelanggaran_id: updates.jenisPelanggaranId,
        poin: finalPoin,
        hukuman: finalHukuman,
        catatan: updates.catatan,
        tanggal_waktu: finalTimestamp,
        status: finalStatus
      },
      user.role,
      user.unit
    );

    if (!dbRes.success) {
      showToast('Gagal Memperbarui', dbRes.error || 'Gagal menyimpan perubahan ke database Supabase.', 'error');
      return { success: false, message: dbRes.error || 'Gagal menyimpan ke database.' };
    }

    // Update in-memory allRiwayatList
    setAllRiwayatList((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            jenisPelanggaranId: updates.jenisPelanggaranId,
            jenisPelanggaranNama: finalJenisNama,
            poin: finalPoin,
            hukuman: finalHukuman,
            catatan: updates.catatan,
            tanggal: finalTanggal,
            timestamp: finalTimestamp,
            status: finalStatus
          };
        }
        return r;
      });
      try {
        localStorage.setItem('simka_riwayat', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Recalculate affected santri's total points and status
    setAllSantriList((prev) => {
      const updated = prev.map((s) => {
        if (s.id === currentRecord.santriId || s.nama === currentRecord.santriNama) {
          const matchingLogs = allRiwayatList
            .map((r) => (r.id === id ? { ...r, poin: finalPoin } : r))
            .filter((r) => r.santriId === s.id || (r.santriNama && r.santriNama.toLowerCase() === s.nama.toLowerCase() && r.santriUnit === s.unit));

          const newTotal = matchingLogs.reduce((acc, cur) => acc + (Number(cur.poin) || 0), 0);
          let newStatus: Santri['statusPembinaan'] = 'Baik';
          if (newTotal >= 100) newStatus = 'SP 3';
          else if (newTotal >= 70) newStatus = 'SP 2';
          else if (newTotal >= 40) newStatus = 'SP 1';
          else if (newTotal > 0) newStatus = 'Peringatan Lisan';

          return {
            ...s,
            totalPoin: newTotal,
            statusPembinaan: newStatus
          };
        }
        return s;
      });
      try {
        localStorage.setItem('simka_santri', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(
      'Kasus Berhasil Diperbarui',
      `Catatan pelanggaran ${currentRecord.santriNama} (${finalJenisNama}) berhasil diperbarui dan tersimpan di database.`,
      'success'
    );
    return { success: true, message: 'Kasus berhasil diperbarui.' };
  };

  const deleteRiwayatPelanggaran = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      showToast('Akses Ditolak', 'Sesi tidak valid. Silakan login kembali.', 'error');
      return { success: false, message: 'Sesi tidak valid.' };
    }

    if (user.role === 'MUSYRIF') {
      showToast('Akses Ditolak', 'Musyrif tidak berwenang menghapus catatan pelanggaran.', 'error');
      return { success: false, message: 'Musyrif tidak berwenang menghapus catatan pelanggaran.' };
    }

    if (user.role !== 'KASIE_KEPESANTRENAN' && user.role !== 'KOORDINATOR') {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menghapus data pelanggaran.', 'error');
      return { success: false, message: 'Anda tidak memiliki izin untuk menghapus data pelanggaran.' };
    }

    const targetRecord = allRiwayatList.find((r) => r.id === id);
    if (!targetRecord) {
      showToast('Gagal Menghapus', 'Catatan pelanggaran tidak ditemukan.', 'error');
      return { success: false, message: 'Catatan pelanggaran tidak ditemukan.' };
    }

    if (user.role === 'KOORDINATOR' && user.unit !== 'ALL' && targetRecord.santriUnit !== user.unit) {
      showToast(
        'Akses Ditolak',
        `Koordinator Unit ${user.unit} hanya berwenang menghapus kasus santri Unit ${user.unit}.`,
        'error'
      );
      return { success: false, message: 'Akses Ditolak: Anda hanya berwenang menghapus kasus santri di unit Anda.' };
    }

    const dbRes = await deletePelanggaranRecordFromDB(id, user.role, user.unit);
    if (!dbRes.success) {
      showToast('Gagal Menghapus', dbRes.error || 'Gagal menghapus data dari database.', 'error');
      return { success: false, message: dbRes.error || 'Gagal menghapus data' };
    }

    setAllRiwayatList((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem('simka_riwayat', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setAllSantriList((prev) => {
      const updated = prev.map((s) => {
        if (s.id === targetRecord.santriId || s.nama === targetRecord.santriNama) {
          const newPoin = Math.max(0, s.totalPoin - targetRecord.poin);
          let newStatus: Santri['statusPembinaan'] = 'Baik';
          if (newPoin >= 100) newStatus = 'SP 3';
          else if (newPoin >= 70) newStatus = 'SP 2';
          else if (newPoin >= 40) newStatus = 'SP 1';
          else if (newPoin > 0) newStatus = 'Peringatan Lisan';
          return {
            ...s,
            totalPoin: newPoin,
            statusPembinaan: newStatus
          };
        }
        return s;
      });
      try {
        localStorage.setItem('simka_santri', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(
      'Pelanggaran Dihapus',
      `Catatan pelanggaran ${targetRecord.santriNama} (${targetRecord.jenisPelanggaranNama}) berhasil dihapus permanen.`,
      'success'
    );
    return { success: true, message: 'Catatan pelanggaran berhasil dihapus.' };
  };

  const updateUserPassword = async (oldPass: string, newPass: string, confirmPass: string): Promise<{ success: boolean; message: string }> => {
    if (!oldPass || !newPass || !confirmPass) {
      return { success: false, message: 'Semua field kata sandi wajib diisi!' };
    }
    if (newPass.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal 6 karakter!' };
    }
    if (newPass !== confirmPass) {
      return { success: false, message: 'Konfirmasi kata sandi baru tidak cocok!' };
    }

    if (user) {
      const newHash = await hashPassword(newPass);
      await resetUserPasswordInDB(user.id, newHash, 'KASIE_KEPESANTRENAN');
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, password_hash: newHash } : u))
      );
    }

    showToast('Berhasil', 'Kata sandi akun Anda berhasil diperbarui di database.', 'success');
    return { success: true, message: 'Kata sandi berhasil diperbarui.' };
  };

  // --------------------------------------------------------------------------
  // PEMBINAAN MANAGEMENT
  // --------------------------------------------------------------------------
  const addPembinaan = (data: {
    santriId: string;
    jenisPembinaan: string;
    catatan: string;
    pembina?: string;
    tanggalTargetSelesai?: string;
  }): { success: boolean; message?: string } => {
    if (!user) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }

    const targetSantri = allSantriList.find((s) => s.id === data.santriId);
    if (!targetSantri) {
      return { success: false, message: 'Santri tidak ditemukan.' };
    }

    if (user.role !== 'KASIE_KEPESANTRENAN' && user.unit !== targetSantri.unit) {
      return { success: false, message: `Akses ditolak: Anda tidak diizinkan membuat pembinaan untuk Unit ${targetSantri.unit}.` };
    }

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const formattedTanggal = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const newPembinaan: PembinaanRecord = {
      id: `pbn-${Date.now()}`,
      santriId: targetSantri.id,
      santriNama: targetSantri.nama,
      santriKelas: targetSantri.kelas,
      santriUnit: targetSantri.unit,
      jenisPembinaan: data.jenisPembinaan,
      tanggal: formattedTanggal,
      tanggalTargetSelesai: data.tanggalTargetSelesai || '',
      pembina: data.pembina || user.nama,
      pembinaId: user.id,
      catatan: data.catatan,
      status: 'PROSES',
      created_at: now.toISOString()
    };

    setAllPembinaanList((prev) => [newPembinaan, ...prev]);
    showToast('Pembinaan Dibuat', `Tindakan pembinaan untuk ${targetSantri.nama} berhasil didaftarkan.`, 'success');
    return { success: true };
  };

  const updatePembinaanStatus = (
    id: string,
    status: 'BELUM DIMULAI' | 'PROSES' | 'SELESAI',
    catatan?: string,
    tanggalSelesai?: string
  ): { success: boolean; message?: string } => {
    const existing = allPembinaanList.find((p) => p.id === id);
    if (!existing) {
      return { success: false, message: 'Data pembinaan tidak ditemukan.' };
    }

    setAllPembinaanList((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const now = new Date();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const defaultTglSelesai = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
          return {
            ...p,
            status,
            catatan: catatan !== undefined ? catatan : p.catatan,
            tanggalSelesai: status === 'SELESAI' ? (tanggalSelesai || defaultTglSelesai) : undefined
          };
        }
        return p;
      })
    );

    showToast('Status Pembinaan Diperbarui', `Status diubah menjadi "${status}".`, 'info');
    return { success: true };
  };

  const deletePembinaan = (id: string): { success: boolean; message?: string } => {
    setAllPembinaanList((prev) => prev.filter((p) => p.id !== id));
    showToast('Pembinaan Dihapus', 'Data pembinaan telah dihapus.', 'info');
    return { success: true };
  };

  // --------------------------------------------------------------------------
  // SCOPED DASHBOARD STATISTICS & ANALYTICS (CALCULATED LIVE FROM SUPABASE DATA)
  // --------------------------------------------------------------------------
  const belumSelesai = riwayatList.filter((r) => r.status === 'Belum Selesai').length;
  const terseelesaikan = riwayatList.filter((r) => r.status === 'Selesai').length;
  const totalSantri = santriList.length;

  const stats = {
    pelanggaranHariIni: riwayatList.filter((r) => {
      const now = new Date();
      const rDate = new Date(r.timestamp);
      return !isNaN(rDate.getTime()) &&
        rDate.getDate() === now.getDate() &&
        rDate.getMonth() === now.getMonth() &&
        rDate.getFullYear() === now.getFullYear();
    }).length,
    totalSantri,
    belumSelesai,
    terseelesaikan
  };

  const getTopPelanggaran = () => {
    const map: Record<string, { id: string; nama: string; kategori: string; count: number; totalPoin: number }> = {};
    riwayatList.forEach((r) => {
      if (!map[r.jenisPelanggaranNama]) {
        const cat = getKategoriFromPoin(r.poin).kategori;
        map[r.jenisPelanggaranNama] = {
          id: r.jenisPelanggaranId,
          nama: r.jenisPelanggaranNama,
          kategori: cat,
          count: 0,
          totalPoin: 0
        };
      }
      map[r.jenisPelanggaranNama].count += 1;
      map[r.jenisPelanggaranNama].totalPoin += r.poin;
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getRecentPembinaan = (): PembinaanRecord[] => {
    return [...pembinaanList].slice(0, 5);
  };

  const getRecentActivities = useCallback((): ActivityItem[] => {
    if (!user) return [];

    // Filter by role:
    // 1. Kasie / Kabid (Superadmin): see all or filtered by selectedKasieUnitFilter
    // 2. Koordinator: see only their unit
    // 3. Musyrif: see santri in their unit, and if specific binaan assigned, prioritize/scope to them
    let scopedRiwayat = allRiwayatList;
    let scopedPembinaan = allPembinaanList;

    if (user.role === 'KASIE_KEPESANTRENAN') {
      if (selectedKasieUnitFilter !== 'ALL') {
        scopedRiwayat = allRiwayatList.filter((r) => r.santriUnit === selectedKasieUnitFilter);
        scopedPembinaan = allPembinaanList.filter((p) => p.santriUnit === selectedKasieUnitFilter);
      }
    } else if (user.role === 'KOORDINATOR') {
      scopedRiwayat = allRiwayatList.filter((r) => r.santriUnit === user.unit);
      scopedPembinaan = allPembinaanList.filter((p) => p.santriUnit === user.unit);
    } else if (user.role === 'MUSYRIF') {
      const userUnit = user.unit as UnitPesantren;
      const cleanUserName = user.nama.toLowerCase().trim();
      const ownBinaan = allSantriList.filter((s) => {
        if (s.unit !== userUnit) return false;
        if (s.musyrifId && s.musyrifId === user.id) return true;
        if (s.musyrifNama && s.musyrifNama.toLowerCase().trim() === cleanUserName) return true;
        if (s.musyrif && s.musyrif.toLowerCase().trim() === cleanUserName) return true;
        return false;
      });

      if (ownBinaan.length > 0) {
        const ownBinaanIds = new Set(ownBinaan.map((s) => s.id));
        const ownBinaanNames = new Set(ownBinaan.map((s) => s.nama.toLowerCase().trim()));
        scopedRiwayat = allRiwayatList.filter((r) => {
          if (r.santriUnit !== userUnit) return false;
          if (r.santriId && ownBinaanIds.has(r.santriId)) return true;
          if (r.santriNama && ownBinaanNames.has(r.santriNama.toLowerCase().trim())) return true;
          if (r.pencatatId === user.id || (r.pencatat && r.pencatat.toLowerCase().trim() === cleanUserName)) return true;
          return false;
        });
        scopedPembinaan = allPembinaanList.filter((p) => {
          if (p.santriUnit !== userUnit) return false;
          if (p.santriId && ownBinaanIds.has(p.santriId)) return true;
          if (p.santriNama && ownBinaanNames.has(p.santriNama.toLowerCase().trim())) return true;
          if (p.pembinaId === user.id || (p.pembina && p.pembina.toLowerCase().trim() === cleanUserName)) return true;
          return false;
        });
      } else {
        scopedRiwayat = allRiwayatList.filter((r) => r.santriUnit === userUnit);
        scopedPembinaan = allPembinaanList.filter((p) => p.santriUnit === userUnit);
      }
    }

    const activities: ActivityItem[] = [];
    const seenRawIds = new Set<string>();

    // Map violations
    scopedRiwayat.forEach((r) => {
      const actId = `act-plg-${r.id}`;
      if (hiddenActivityIds.includes(actId) || hiddenActivityIds.includes(r.id)) {
        return;
      }
      if (seenRawIds.has(r.id)) return;
      seenRawIds.add(r.id);

      activities.push({
        id: actId,
        rawId: r.id,
        title: `Pelanggaran: ${r.santriNama}`,
        desc: `${r.jenisPelanggaranNama} (${r.poin} poin) - Dicatat oleh ${r.pencatat || 'Petugas'}`,
        timestamp: r.timestamp || new Date().toISOString(),
        timeFormatted: r.tanggal,
        type: 'pelanggaran',
        unit: r.santriUnit,
        santriId: r.santriId,
        santriNama: r.santriNama,
        santriKelas: r.santriKelas,
        poin: r.poin,
        hukuman: r.hukuman,
        status: (r.status as 'Selesai' | 'Belum Selesai') || 'Belum Selesai',
        pencatat: r.pencatat
      });
    });

    // Map pembinaan
    scopedPembinaan.forEach((p) => {
      const actId = `act-pbn-${p.id}`;
      if (hiddenActivityIds.includes(actId) || hiddenActivityIds.includes(p.id)) {
        return;
      }
      if (seenRawIds.has(p.id)) return;
      seenRawIds.add(p.id);

      activities.push({
        id: actId,
        rawId: p.id,
        title: `Pembinaan: ${p.santriNama}`,
        desc: `${p.jenisPembinaan} (${p.status}) - Pembina: ${p.pembina || 'Petugas'}`,
        timestamp: p.created_at || new Date().toISOString(),
        timeFormatted: p.tanggal,
        type: 'pembinaan',
        unit: p.santriUnit,
        santriId: p.santriId,
        santriNama: p.santriNama,
        santriKelas: p.santriKelas,
        status: p.status === 'SELESAI' ? 'Selesai' : 'Belum Selesai',
        pencatat: p.pembina
      });
    });

    // Sort strictly newest first
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [user, selectedKasieUnitFilter, allRiwayatList, allPembinaanList, allSantriList, hiddenActivityIds]);

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = months.map((m) => ({ bulan: m, jumlah: 0 }));

    riwayatList.forEach((r) => {
      const date = new Date(r.timestamp);
      if (!isNaN(date.getTime())) {
        const mIdx = date.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
          counts[mIdx].jumlah += 1;
        }
      } else {
        months.forEach((mName, idx) => {
          if (r.tanggal.includes(mName)) {
            counts[idx].jumlah += 1;
          }
        });
      }
    });

    return counts;
  };

  const getDonutData = () => {
    if (user?.role === 'KASIE_KEPESANTRENAN' && selectedKasieUnitFilter === 'ALL') {
      let countSMP = 0;
      let countMA = 0;
      let countSMA = 0;

      riwayatList.forEach((r) => {
        if (r.santriUnit === 'SMP') countSMP++;
        else if (r.santriUnit === 'MA') countMA++;
        else if (r.santriUnit === 'SMA') countSMA++;
      });

      const total = countSMP + countMA + countSMA || 1;
      return [
        { name: 'Unit SMP', value: Math.round((countSMP / total) * 100) || 0, color: '#3B82F6' },
        { name: 'Unit MA', value: Math.round((countMA / total) * 100) || 0, color: '#10B981' },
        { name: 'Unit SMA', value: Math.round((countSMA / total) * 100) || 0, color: '#F97316' }
      ];
    }

    let groupA = 0;
    let groupB = 0;
    let groupC = 0;
    let labelA = 'Kelas 10';
    let labelB = 'Kelas 11';
    let labelC = 'Kelas 12';

    if (activeUnitScope === 'SMP') {
      labelA = 'Kelas 7';
      labelB = 'Kelas 8';
      labelC = 'Kelas 9';
      riwayatList.forEach((r) => {
        if (r.santriKelas.startsWith('7')) groupA++;
        else if (r.santriKelas.startsWith('8')) groupB++;
        else if (r.santriKelas.startsWith('9')) groupC++;
      });
    } else if (activeUnitScope === 'SMA') {
      labelA = 'Kelas X';
      labelB = 'Kelas XI';
      labelC = 'Kelas XII';
      riwayatList.forEach((r) => {
        if (r.santriKelas.startsWith('X') || r.santriKelas.startsWith('10')) groupA++;
        else if (r.santriKelas.startsWith('XI') || r.santriKelas.startsWith('11')) groupB++;
        else if (r.santriKelas.startsWith('XII') || r.santriKelas.startsWith('12')) groupC++;
      });
    } else {
      // MA
      riwayatList.forEach((r) => {
        if (r.santriKelas.startsWith('10')) groupA++;
        else if (r.santriKelas.startsWith('11')) groupB++;
        else if (r.santriKelas.startsWith('12')) groupC++;
      });
    }

    const total = groupA + groupB + groupC || 1;
    return [
      { name: labelA, value: Math.round((groupA / total) * 100) || 50, color: '#3B82F6' },
      { name: labelB, value: Math.round((groupB / total) * 100) || 25, color: '#F97316' },
      { name: labelC, value: Math.round((groupC / total) * 100) || 25, color: '#10B981' }
    ];
  };

  const getTop5Santri = (): Santri[] => {
    return sortSantriByPoints(santriList).slice(0, 5);
  };

  const getAllSortedSantriByPoints = (): Santri[] => {
    return sortSantriByPoints(santriList);
  };

  /**
   * Aturan data pada kartu "ANAK BINAAN — RINGKASAN POIN" Dashboard:
   * A. Jika Musyrif memiliki anak binaan (terhubung musyrifId atau nama, unit sama):
   *    - Tampilkan santri miliknya, urutkan poin tertinggi -> terendah, lalu nama alfabetis.
   * B. Jika Musyrif belum memiliki anak binaan atau hasil relasi kosong:
   *    - Tampilkan santri dengan poin tertinggi di unit Musyrif tersebut.
   *    - Keterangan: "Santri dengan poin tertinggi di unit Anda — anak binaan belum terhubung."
   * C. Jika Koordinator:
   *    - Tampilkan santri dengan poin tertinggi dari seluruh santri pada unit tanggung jawabnya.
   *    - Keterangan: "Santri dengan poin tertinggi di unit Anda."
   * D. Jika Kasie Kepesantrenan / Kabid (super_admin):
   *    - Tampilkan santri dengan poin tertinggi dari seluruh unit (atau unit terpilih).
   *    - Keterangan: "Santri dengan poin tertinggi dari seluruh unit."
   */
  const getDashboardSantriBinaan = (): {
    santri: Santri[];
    subtitle: string;
    isOwnBinaan: boolean;
  } => {
    if (!user) {
      return { santri: [], subtitle: '', isOwnBinaan: false };
    }

    const normalizedRole = mapJabatanToRole(user.role);

    // KASIE / KABID / SUPERADMIN
    if (normalizedRole === 'KASIE_KEPESANTRENAN') {
      const sorted = sortSantriByPoints(santriList);
      const subtitle = selectedKasieUnitFilter === 'ALL'
        ? 'Santri dengan poin tertinggi dari seluruh unit.'
        : `Santri dengan poin tertinggi di unit ${selectedKasieUnitFilter}.`;
      return {
        santri: sorted.slice(0, 8),
        subtitle,
        isOwnBinaan: false
      };
    }

    // KOORDINATOR
    if (normalizedRole === 'KOORDINATOR') {
      // Santri scoped to coordinator's unit
      const unitSantri = allSantriList.filter((s) => s.unit === user.unit);
      const sorted = sortSantriByPoints(unitSantri);
      return {
        santri: sorted.slice(0, 8),
        subtitle: 'Santri dengan poin tertinggi di unit Anda.',
        isOwnBinaan: false
      };
    }

    // MUSYRIF
    const userUnit = user.unit as UnitPesantren;
    const sameUnitSantri = allSantriList.filter((s) => s.unit === userUnit);

    // Cari anak binaan yang terhubung dengan akun Musyrif
    const cleanUserName = user.nama.toLowerCase().trim();
    const ownBinaan = sameUnitSantri.filter((s) => {
      if (s.musyrifId && s.musyrifId === user.id) return true;
      if (s.musyrifNama && s.musyrifNama.toLowerCase().trim() === cleanUserName) return true;
      if (s.musyrif && s.musyrif.toLowerCase().trim() === cleanUserName) return true;
      return false;
    });

    if (ownBinaan.length > 0) {
      const sortedOwn = sortSantriByPoints(ownBinaan);
      return {
        santri: sortedOwn,
        subtitle: `Daftar anak binaan Anda di Unit ${userUnit}.`,
        isOwnBinaan: true
      };
    }

    // Fallback B: Jika belum memiliki anak binaan atau relasi kosong
    const sortedFallback = sortSantriByPoints(sameUnitSantri);
    return {
      santri: sortedFallback.slice(0, 8),
      subtitle: 'Santri dengan poin tertinggi di unit Anda — anak binaan belum terhubung.',
      isOwnBinaan: false
    };
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        user,
        isAuthenticated,
        usersList,
        selectedKasieUnitFilter,
        setSelectedKasieUnitFilter,
        santriList,
        allSantriList,
        pelanggaranList,
        masterPembinaanList,
        riwayatList,
        allRiwayatList,
        pembinaanList,
        allPembinaanList,
        selectedSantriForDetail,
        setSelectedSantriForDetail,
        login,
        logout,
        refreshData,
        isLoadingData,
        deleteRiwayatPelanggaran,
        updateRiwayatPelanggaran,
        addPelanggaran,
        updatePelanggaran,
        deletePelanggaran,
        deleteAllMasterPelanggaran,
        checkMasterPelanggaranUsage,
        importPelanggaranBatch,
        addUser,
        editUser,
        resetUserPassword,
        importUsersBatch,
        deleteUser,
        toggleUserActive,
        addSantri,
        updateSantri,
        deleteSantri,
        importSantriBatch,
        addPembinaan,
        updatePembinaanStatus,
        deletePembinaan,
        toasts,
        showToast,
        removeToast,
        getPembinaanBySinglePoin,
        catatPelanggaranBaru,
        toggleStatusPelanggaran,
        updateUserPassword,
        stats,
        getMonthlyData,
        getDonutData,
        getTop5Santri,
        getAllSortedSantriByPoints,
        getDashboardSantriBinaan,
        getTopPelanggaran,
        getRecentPembinaan,
        getRecentActivities,
        hiddenActivityIds,
        activitiesError,
        hideActivity,
        markPembinaanSelesai,
        updatePelanggaranStatus,
        canUserManageItem,
        isDatabaseModalOpen,
        setIsDatabaseModalOpen,
        openDatabaseModal,
        closeDatabaseModal,
        isOfflineMode,
        isSupabaseOnline
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
