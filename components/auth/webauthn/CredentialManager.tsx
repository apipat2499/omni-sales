'use client';

/**
 * Credential Manager Component
 * Manages WebAuthn credentials (list, add, rename, remove)
 */

import { useState, useEffect } from 'react';
import WebAuthnRegisterButton from './WebAuthnRegisterButton';

interface Credential {
  id: string;
  credential_id: string;
  device_type: 'platform' | 'cross-platform';
  name?: string;
  created_at: string;
  last_used_at?: string;
  transports?: string[];
}

export default function CredentialManager() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('supabase.auth.token');

      const response = await fetch('/api/auth/webauthn/credentials', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load credentials');
      }

      const data = await response.json();
      setCredentials(data.credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (id: string) => {
    try {
      const token = localStorage.getItem('supabase.auth.token');

      const response = await fetch(`/api/auth/webauthn/credentials/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingName }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename credential');
      }

      await loadCredentials();
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename credential');
    }
  };

  const handleRemove = async (id: string, name?: string) => {
    if (!confirm(`Are you sure you want to remove "${name || 'this credential'}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('supabase.auth.token');

      const response = await fetch(`/api/auth/webauthn/credentials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove credential');
      }

      await loadCredentials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove credential');
    }
  };

  const handleAddSuccess = async () => {
    await loadCredentials();
    setShowAddForm(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'platform') {
      return (
        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
        </svg>
      );
    }
    return (
      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Your Passkeys</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Passkey
        </button>
      </div>

      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Passkey</h4>
          <div className="space-y-4">
            <div className="flex gap-4">
              <WebAuthnRegisterButton
                deviceType="platform"
                onSuccess={handleAddSuccess}
                onError={setError}
                className="flex-1"
              />
              <WebAuthnRegisterButton
                deviceType="cross-platform"
                credentialName="Security Key"
                onSuccess={handleAddSuccess}
                onError={setError}
                className="flex-1 bg-green-600 hover:bg-green-700"
              />
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {credentials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No passkeys</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a biometric or security key.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200">
            {credentials.map((credential) => (
              <li key={credential.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getDeviceIcon(credential.device_type)}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      {editingId === credential.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(credential.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {credential.name || 'Unnamed Device'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Added {formatDate(credential.created_at)}
                            {credential.last_used_at && (
                              <> • Last used {formatDate(credential.last_used_at)}</>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {editingId !== credential.id && (
                    <div className="ml-4 flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(credential.id);
                          setEditingName(credential.name || '');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleRemove(credential.id, credential.name)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
