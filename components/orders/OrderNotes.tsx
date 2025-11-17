'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface OrderNotesProps {
  orderId: number;
}

interface Note {
  id: number;
  note: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchOrderNotes(orderId: number): Promise<Note[]> {
  const response = await fetch(`/api/orders/${orderId}/notes`);
  if (!response.ok) {
    throw new Error('Failed to fetch order notes');
  }
  const data = await response.json();
  return data.data || [];
}

export default function OrderNotes({ orderId }: OrderNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const queryClient = useQueryClient();

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['order-notes', orderId],
    queryFn: () => fetchOrderNotes(orderId),
    staleTime: 30 * 1000,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: { note: string; is_internal: boolean }) => {
      const response = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to add note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-notes', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-activities', orderId] });
      setNewNote('');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`/api/orders/${orderId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-notes', orderId] });
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate({ note: newNote.trim(), is_internal: isInternal });
  };

  if (isLoading) {
    return <SkeletonLoader type="list" count={2} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">เกิดข้อผิดพลาดในการโหลดหมายเหตุ</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        หมายเหตุคำสั่งซื้อ
      </h3>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="mb-6">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="เพิ่มหมายเหตุ..."
          rows={3}
          className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            หมายเหตุภายใน (ลูกค้าไม่เห็น)
          </label>
          <button
            type="submit"
            disabled={!newNote.trim() || addNoteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            เพิ่มหมายเหตุ
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 relative group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    {note.is_internal && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                        ภายใน
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(note.created_at).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {note.note}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('ต้องการลบหมายเหตุนี้หรือไม่?')) {
                      deleteNoteMutation.mutate(note.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="ลบ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            ยังไม่มีหมายเหตุ
          </div>
        )}
      </div>
    </div>
  );
}
