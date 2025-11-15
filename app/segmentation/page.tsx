"use client";

import { useEffect, useState } from "react";
import { Users, BarChart3, Zap, TrendingUp, Plus, Edit2, Trash2 } from "lucide-react";

interface Segment {
  id: string;
  name: string;
  segmentType: string;
  memberCount: number;
  isActive: boolean;
  description?: string;
}

export default function SegmentationPage() {
  const [activeTab, setActiveTab] = useState("segments");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: "",
    segmentType: "behavioral",
    description: "",
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      window.location.href = "/login";
      return;
    }
    setUserId(storedUserId);
    fetchData(storedUserId);
  }, []);

  const fetchData = async (userId) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/segmentation/segments?userId=" + userId);
      const data = await res.json();
      setSegments(data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSegment = async () => {
    if (!userId || !newSegment.name.trim()) return;

    try {
      const response = await fetch("/api/segmentation/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...newSegment }),
      });

      if (response.ok) {
        setNewSegment({ name: "", segmentType: "behavioral", description: "" });
        setIsCreatingSegment(false);
        fetchData(userId);
      }
    } catch (error) {
      console.error("Error creating segment:", error);
    }
  };

  const stats = {
    totalSegments: segments.length,
    totalMembers: segments.reduce((sum, s) => sum + (s.memberCount || 0), 0),
    activeSegments: segments.filter((s) => s.isActive).length,
    avgSize: segments.length > 0 ? Math.round(segments.reduce((sum, s) => sum + (s.memberCount || 0), 0) / segments.length) : 0,
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div>Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold dark:text-white">Customer Segmentation</h1>
          </div>
          <button
            onClick={() => setIsCreatingSegment(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white"
          >
            <Plus className="h-5 w-5" />
            New Segment
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Segments</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalSegments}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalMembers.toLocaleString()}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Segments</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.activeSegments}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Size</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.avgSize.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white dark:bg-gray-800">
          <div className="border-b border-gray-200 p-6">
            <div className="space-y-4">
              {segments.length > 0 ? (
                segments.map((segment) => (
                  <div key={segment.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{segment.name}</h3>
                        <p className="text-sm text-gray-600">Type: {segment.segmentType} | Members: {segment.memberCount}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded bg-blue-100 p-2 text-blue-600">
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button className="rounded bg-red-100 p-2 text-red-600">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600">No segments yet</p>
              )}
            </div>
          </div>
        </div>

        {isCreatingSegment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold">Create Segment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={newSegment.name}
                    onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                    placeholder="Segment name"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Type</label>
                  <select
                    value={newSegment.segmentType}
                    onChange={(e) => setNewSegment({ ...newSegment, segmentType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                  >
                    <option value="behavioral">Behavioral</option>
                    <option value="rfm">RFM</option>
                    <option value="demographic">Demographic</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateSegment}
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreatingSegment(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
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
