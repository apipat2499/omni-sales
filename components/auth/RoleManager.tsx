'use client';

/**
 * RoleManager Component
 *
 * Admin interface for managing user roles with:
 * - List all users with their roles
 * - Edit user roles
 * - Create and delete roles
 * - Permission assignment
 * - Search and filter users
 * - Bulk role assignment
 */

import React, { useState, useMemo } from 'react';
import { User, Role, Permission, UserRole, PermissionAction } from '@/types';
import { useRBAC } from '@/lib/hooks/useRBAC';
import { useI18n } from '@/lib/hooks/useI18n';
import { getAllUsers } from '@/lib/utils/auth';
import {
  getAllRoles,
  getRoleColor,
  formatRoleName,
  formatPermissionName,
  getPermissionsByCategory,
} from '@/lib/utils/rbac';

interface RoleManagerProps {
  className?: string;
}

export function RoleManager({ className = '' }: RoleManagerProps) {
  const { t } = useI18n();
  const {
    user: currentUser,
    assignableRoles,
    canAssignRole,
    assignRole,
    removeRole,
  } = useRBAC();

  // State
  const [users, setUsers] = useState<User[]>(() => getAllUsers());
  const [roles] = useState<Role[]>(() => getAllRoles());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());

  /**
   * Filter users based on search and role
   */
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.roles.some((r) => r.name.toLowerCase().includes(query))
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.roles.some((r) => r.name === roleFilter));
    }

    return filtered;
  }, [users, searchQuery, roleFilter]);

  /**
   * Handle assign role to user
   */
  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await assignRole(userId, roleId);

      // Refresh users list
      setUsers(getAllUsers());
      setShowRoleModal(false);
    } catch (err) {
      console.error('Failed to assign role:', err);
    }
  };

  /**
   * Handle remove role from user
   */
  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await removeRole(userId, roleId);

      // Refresh users list
      setUsers(getAllUsers());
    } catch (err) {
      console.error('Failed to remove role:', err);
    }
  };

  /**
   * Toggle bulk selection
   */
  const toggleBulkSelection = (userId: string) => {
    const newSelection = new Set(bulkSelection);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setBulkSelection(newSelection);
  };

  /**
   * Select all filtered users
   */
  const selectAll = () => {
    const allIds = new Set(filteredUsers.map((u) => u.id));
    setBulkSelection(allIds);
  };

  /**
   * Deselect all
   */
  const deselectAll = () => {
    setBulkSelection(new Set());
  };

  /**
   * Bulk assign role
   */
  const handleBulkAssignRole = async (roleId: string) => {
    try {
      const promises = Array.from(bulkSelection).map((userId) =>
        assignRole(userId, roleId)
      );
      await Promise.all(promises);

      // Refresh users list
      setUsers(getAllUsers());
      setBulkSelection(new Set());
    } catch (err) {
      console.error('Bulk assign failed:', err);
    }
  };

  return (
    <div className={`${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('rbac.roleManagement')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('rbac.manageUserRoles')}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {bulkSelection.size > 0 && (
                <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {bulkSelection.size} {t('rbac.usersSelected')}
                  </span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {t('common.clear')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('rbac.searchUsers')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Role Filter */}
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('rbac.allRoles')}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {bulkSelection.size > 0 && (
              <div className="sm:w-48">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkAssignRole(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('rbac.bulkAssignRole')}</option>
                  {assignableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={bulkSelection.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('rbac.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('rbac.email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('rbac.roles')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('rbac.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('rbac.noUsersFound')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={bulkSelection.has(user.id)}
                        onChange={() => toggleBulkSelection(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <span
                            key={role.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${getRoleColor(role.name)}20`,
                              color: getRoleColor(role.name),
                            }}
                          >
                            {role.displayName}
                            {currentUser && user.id !== currentUser.id && (
                              <button
                                onClick={() => handleRemoveRole(user.id, role.id)}
                                className="ml-1 hover:opacity-75"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {user.isActive ? t('rbac.active') : t('rbac.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRoleModal(true);
                        }}
                        disabled={user.id === currentUser?.id}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('rbac.editRoles')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t('rbac.showing')} {filteredUsers.length} {t('rbac.users')}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Roles Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('rbac.editUserRoles')}
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('rbac.user')}: <span className="font-medium">{selectedUser.name}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('rbac.email')}: <span className="font-medium">{selectedUser.email}</span>
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('rbac.availableRoles')}
                </label>
                {assignableRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: getRoleColor(role.name) }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {role.displayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignRole(selectedUser.id, role.id)}
                      disabled={selectedUser.roles.some((r) => r.id === role.id)}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedUser.roles.some((r) => r.id === role.id)
                        ? t('rbac.assigned')
                        : t('rbac.assign')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Details Modal */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedRole.displayName} {t('rbac.permissions')}
                </h3>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 capitalize">
                      {t(`rbac.category.${category}`)}
                    </h4>
                    <div className="space-y-2">
                      {permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPermissionName(permission.name)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {permission.description}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedRole.permissions.some(
                              (p) => p.id === permission.id
                            )}
                            disabled
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles Overview */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {t('rbac.rolesOverview')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedRole(role);
                setShowPermissionModal(true);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${getRoleColor(role.name)}20`,
                    color: getRoleColor(role.name),
                  }}
                >
                  {role.displayName}
                </span>
                {role.isSystem && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('rbac.system')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {role.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {role.permissions.length} {t('rbac.permissions')}
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  {t('rbac.viewDetails')} →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoleManager;
