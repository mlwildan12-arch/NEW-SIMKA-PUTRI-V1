import { UserRole, UnitPesantren, UserAccount, PageRoute } from '../types';

const SALT = 'simka_secure_salt_v2_2026';

/**
 * Computes a standard SHA-256 hash with salt for secure password hashing.
 * Works seamlessly in all modern browsers and Node environments.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Synchronous hash helper for deterministic offline storage
 */
export function hashPasswordSync(password: string): string {
  let hash = 0;
  const str = password + SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'sh256_' + Math.abs(hash).toString(16) + '_simka';
}

/**
 * Robust multi-format password verification:
 * - SHA-256 with project salt
 * - SHA-256 raw hex (unsalted)
 * - Deterministic sync hash
 * - Plaintext fallback for legacy/testing DB
 */
export async function verifyPassword(inputPassword: string, storedHashOrPlain: string): Promise<boolean> {
  if (!inputPassword || !storedHashOrPlain) return false;

  // 1. Direct match (plain text fallback if stored unhashed)
  if (storedHashOrPlain === inputPassword) return true;

  // 2. Standard SHA-256 with project salt
  try {
    const saltedHash = await hashPassword(inputPassword);
    if (storedHashOrPlain.toLowerCase() === saltedHash.toLowerCase()) return true;
  } catch (e) {
    // continue
  }

  // 3. Deterministic sync hash
  const syncHash = hashPasswordSync(inputPassword);
  if (storedHashOrPlain === syncHash) return true;

  // 4. Raw SHA-256 (no salt)
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(inputPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const rawHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (storedHashOrPlain.toLowerCase() === rawHex.toLowerCase()) return true;
  } catch (e) {
    // continue
  }

  return false;
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'MUSYRIF':
      return 'Musyrif';
    case 'KOORDINATOR':
      return 'Koordinator';
    case 'KASIE_KEPESANTRENAN':
      return 'Kasie Kepesantrenan / Kabid';
    default:
      return role;
  }
}

export function getUnitDisplayName(unit: 'ALL' | UnitPesantren): string {
  switch (unit) {
    case 'SMP':
      return 'Unit SMP';
    case 'MA':
      return 'Unit MA';
    case 'SMA':
      return 'Unit SMA';
    case 'ALL':
      return 'Semua Unit (Global)';
    default:
      return unit;
  }
}

export type AppPermission =
  | 'view_dashboard'
  | 'view_students'
  | 'create_student'
  | 'edit_student'
  | 'delete_student'
  | 'import_students'
  | 'export_students'
  | 'view_violations_rekap'
  | 'export_violations_rekap'
  | 'delete_violation_record'
  | 'create_violation'
  | 'view_violation_master'
  | 'manage_violation_master'
  | 'export_violation_master'
  | 'manage_users'
  | 'database_sync'
  | 'manage_pembinaan';

/**
 * Centralized Permission Guard checking fine-grained role privileges.
 */
export function can(user: UserAccount | null | undefined, permission: AppPermission): boolean {
  if (!user) return false;

  switch (permission) {
    case 'view_dashboard':
      // Dashboard is accessible to all roles: Musyrif, Koordinator, Kasie/Kabid (read-only for all).
      return true;

    case 'view_students':
      return true;

    case 'create_student':
    case 'edit_student':
    case 'delete_student':
    case 'import_students':
    case 'export_students':
      // STRICT: Kasie/Kabid & Superadmin ONLY. Koordinator and Musyrif are strictly forbidden from editing/deleting/importing/exporting student master data.
      return user.role === 'KASIE_KEPESANTRENAN';

    case 'view_violations_rekap':
      return true;

    case 'export_violations_rekap':
      // Kasie/Kabid and Koordinator are allowed to export PDF. Musyrif is NOT.
      return user.role === 'KASIE_KEPESANTRENAN' || user.role === 'KOORDINATOR';

    case 'delete_violation_record':
      // Kasie/Kabid ONLY
      return user.role === 'KASIE_KEPESANTRENAN';

    case 'create_violation':
      // All roles can record violations
      return true;

    case 'view_violation_master':
      // All roles can view the master dictionary
      return true;

    case 'manage_violation_master':
    case 'export_violation_master':
      // Kasie/Kabid ONLY (no add/edit/delete/import/reset/export for Musyrif/Koordinator)
      return user.role === 'KASIE_KEPESANTRENAN';

    case 'manage_users':
      // Kasie/Kabid ONLY
      return user.role === 'KASIE_KEPESANTRENAN';

    case 'database_sync':
      // Kasie/Kabid ONLY
      return user.role === 'KASIE_KEPESANTRENAN';

    case 'manage_pembinaan':
      return user.role === 'KASIE_KEPESANTRENAN' || user.role === 'KOORDINATOR';

    default:
      return false;
  }
}

/**
 * Checks whether user can access a specific target unit.
 */
export function canAccessUnit(
  user: UserAccount | null | undefined,
  targetUnit: string | UnitPesantren | 'ALL'
): boolean {
  if (!user) return false;
  if (user.role === 'KASIE_KEPESANTRENAN') {
    return true; // Kasie/Kabid can access ALL, SMP, MA, SMA
  }
  // Koordinator and Musyrif are strictly restricted to their assigned unit
  return user.unit === targetUnit;
}

/**
 * Robust database column mapping for 'jabatan' to UserRole enum.
 */
export function mapJabatanToRole(jabatan?: string | null): UserRole {
  if (!jabatan) return 'MUSYRIF';
  const clean = jabatan.toUpperCase().trim();
  if (
    clean.includes('KASIE') ||
    clean.includes('KABID') ||
    clean.includes('SUPERADMIN') ||
    clean.includes('ADMIN') ||
    clean === 'KASIE_KEPESANTRENAN'
  ) {
    return 'KASIE_KEPESANTRENAN';
  }
  if (clean.includes('KOORDINATOR')) {
    return 'KOORDINATOR';
  }
  if (clean.includes('MUSYRIF')) {
    return 'MUSYRIF';
  }
  return 'MUSYRIF';
}

/**
 * Normalizes unit string to standard 'ALL' | UnitPesantren.
 * CRITICAL: Checks 'SMA' before 'MA' because 'SMA' contains the substring 'MA'.
 */
export function mapUnit(unit?: string | null, role?: UserRole): 'ALL' | UnitPesantren {
  if (role === 'KASIE_KEPESANTRENAN') {
    return 'ALL';
  }
  if (!unit) return 'SMP';
  const clean = unit.toUpperCase().trim();
  if (clean === 'ALL' || clean.includes('SEMUA') || clean.includes('GLOBAL')) return 'ALL';
  if (clean === 'SMA' || clean.includes('SMA')) return 'SMA';
  if (clean === 'MA' || clean.includes('MA')) return 'MA';
  if (clean === 'SMP' || clean.includes('SMP')) return 'SMP';
  return 'SMP';
}

/**
 * Normalizes raw UI or input value to standard database unit string: SMP | MA | SMA | ALL
 */
export function normalizeUnitForDB(unit?: string | null): 'SMP' | 'MA' | 'SMA' | 'ALL' {
  if (!unit) return 'SMP';
  const clean = unit.toUpperCase().trim();
  if (clean === 'ALL' || clean.includes('SEMUA') || clean.includes('GLOBAL')) return 'ALL';
  if (clean === 'SMA' || clean.includes('SMA')) return 'SMA';
  if (clean === 'MA' || clean.includes('MA')) return 'MA';
  if (clean === 'SMP' || clean.includes('SMP')) return 'SMP';
  return 'SMP';
}

/**
 * Normalizes raw UI or input value to standard database jabatan string: MUSYRIF | KOORDINATOR | KASIE_KEPESANTRENAN
 */
export function normalizeJabatanForDB(roleOrJabatan?: string | null): 'MUSYRIF' | 'KOORDINATOR' | 'KASIE_KEPESANTRENAN' {
  return mapJabatanToRole(roleOrJabatan);
}

/**
 * Verifies if a given user role has permission to access a specific page route.
 */
export function canRoleAccessRoute(role: UserRole, route: PageRoute): boolean {
  if (route === 'login' || route === 'akun') {
    return true;
  }

  const normalizedRole: UserRole = mapJabatanToRole(role);

  switch (normalizedRole) {
    case 'MUSYRIF':
      // Musyrif has: Dashboard (read-only), Rekap Pelanggaran, Data Santri, Catat Pelanggaran, Data Pelanggaran (Master), Input Mutaba'ah, Data Pembinaan, Riwayat Pembinaan, Akun Saya.
      return (
        route === 'dashboard' ||
        route === 'rekap-pelanggaran' ||
        route === 'data-santri' ||
        route === 'catat-pelanggaran' ||
        route === 'data-pelanggaran' ||
        route === 'kamus-pelanggaran' ||
        route === 'input-mutabaah' ||
        route === 'data-pembinaan' ||
        route === 'riwayat-pembinaan'
      );

    case 'KOORDINATOR':
      // Koordinator has: Dashboard (locked to unit), Rekap, Data Santri, Catat, Master Pelanggaran, Input Mutaba'ah, Pembinaan, Akun Saya
      return (
        route === 'dashboard' ||
        route === 'rekap-pelanggaran' ||
        route === 'data-santri' ||
        route === 'catat-pelanggaran' ||
        route === 'data-pelanggaran' ||
        route === 'kamus-pelanggaran' ||
        route === 'input-mutabaah' ||
        route === 'data-pembinaan' ||
        route === 'riwayat-pembinaan' ||
        route === 'laporan-pembinaan'
      );

    case 'KASIE_KEPESANTRENAN':
      // Kasie / Superadmin can access all routes
      return true;

    default:
      return false;
  }
}

/**
 * Returns default landing page for a role after successful login.
 * All roles start on Dashboard.
 */
export function getDefaultRouteForRole(role: UserRole | string): PageRoute {
  // All roles (Musyrif, Koordinator, Kasie Kepesantrenan / Superadmin) start on Dashboard
  return 'dashboard';
}
