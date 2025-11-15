'use client';

import { useEffect, useState } from 'react';
import {
  Gift,
  Users,
  TrendingUp,
  Award,
  Plus,
  Edit2,
  Trash2,
  Star,
  Zap,
  Target,
} from 'lucide-react';

interface LoyaltyProgram {
  id: string;
  name: string;
  programType: string;
  pointMultiplier: number;
  isActive: boolean;
  createdAt: string;
}

interface KPIStats {
  totalPrograms: number;
  activeMembers: number;
  pointsIssued: number;
  rewardsClaimed: number;
}

export default function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState<'programs' | 'tiers' | 'rewards' | 'analytics'>('programs');
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramType, setNewProgramType] = useState('points');
  const [pointMultiplier, setPointMultiplier] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      window.location.href = '/login';
      return;
    }
    setUserId(storedUserId);
    fetchPrograms(storedUserId);
  }, []);

  const fetchPrograms = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/loyalty/programs?userId=${userId}`);
      const data = await response.json();
      setPrograms(data.data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!userId || !newProgramName.trim()) return;

    try {
      const response = await fetch('/api/loyalty/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: newProgramName,
          programType: newProgramType,
          pointMultiplier,
          minPurchaseForPoints: 0,
        }),
      });

      if (response.ok) {
        setNewProgramName('');
        setPointMultiplier(1);
        setIsCreating(false);
        fetchPrograms(userId);
      }
    } catch (error) {
      console.error('Error creating program:', error);
    }
  };

  const stats: KPIStats = {
    totalPrograms: programs.length,
    activeMembers: 0,
    pointsIssued: 0,
    rewardsClaimed: 0,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading loyalty programs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-purple-500" />
            <h1 className="text-4xl font-bold dark:text-white">Loyalty & Rewards</h1>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
          >
            <Plus className="h-5 w-5" />
            New Program
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Programs</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalPrograms}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.activeMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Points Issued</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.pointsIssued}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rewards Claimed</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.rewardsClaimed}</p>
              </div>
              <Award className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('programs')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'programs'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Programs ({stats.totalPrograms})
              </button>
              <button
                onClick={() => setActiveTab('tiers')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'tiers'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Tiers
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'rewards'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Rewards
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'programs' && (
              <div className="space-y-4">
                {programs.length > 0 ? (
                  programs.map((program) => (
                    <div
                      key={program.id}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold dark:text-white">
                            {program.name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Type: {program.programType} • Multiplier: {program.pointMultiplier}x
                          </p>
                          <div className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            {program.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 dark:bg-blue-900">
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200 dark:bg-red-900">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    No loyalty programs yet. Create one to get started!
                  </p>
                )}
              </div>
            )}

            {activeTab === 'tiers' && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a program above to manage tiers
                </p>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a program above to manage rewards
                </p>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loyalty program analytics and insights
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Program Modal */}
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold dark:text-white">
                Create New Loyalty Program
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">
                    Program Name
                  </label>
                  <input
                    type="text"
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                    placeholder="e.g., VIP Rewards"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">
                    Program Type
                  </label>
                  <select
                    value={newProgramType}
                    onChange={(e) => setNewProgramType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="points">Points-Based</option>
                    <option value="tier">Tier-Based</option>
                    <option value="referral">Referral</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">
                    Point Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={pointMultiplier}
                    onChange={(e) => setPointMultiplier(parseFloat(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateProgram}
                    className="flex-1 rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
