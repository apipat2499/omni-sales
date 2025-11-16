'use client';

/**
 * File Browser Component
 * Displays files in grid or list view with actions
 */

import React, { useState, useEffect } from 'react';
import {
  File,
  Folder,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  Grid,
  List,
  Search,
  Filter,
  Image as ImageIcon,
  Video,
  FileText,
  Archive,
} from 'lucide-react';
import { format } from 'date-fns';

interface FileItem {
  id: string;
  name: string;
  size_bytes: number;
  mime_type: string;
  folder_path: string;
  is_public: boolean;
  is_folder: boolean;
  created_at: string;
  updated_at: string;
  tags?: string[];
  public_url?: string;
  thumbnail_url?: string;
}

interface FileBrowserProps {
  userId: string;
  tenantId?: string;
  currentPath?: string;
  onFileSelect?: (file: FileItem) => void;
  onFileDelete?: (fileId: string) => void;
  onFileShare?: (fileId: string) => void;
  onPathChange?: (path: string) => void;
}

export default function FileBrowser({
  userId,
  tenantId,
  currentPath = '/',
  onFileSelect,
  onFileDelete,
  onFileShare,
  onPathChange,
}: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showContextMenu, setShowContextMenu] = useState<{
    fileId: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    loadFiles();
  }, [currentPath, userId, tenantId, searchQuery, filterType]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId,
        path: currentPath,
      });

      if (tenantId) {
        params.append('tenantId', tenantId);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (filterType !== 'all') {
        params.append('mimeType', filterType);
      }

      const response = await fetch(`/api/files?${params}`);
      if (!response.ok) throw new Error('Failed to load files');

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.is_folder) {
      onPathChange?.(file.folder_path + file.name + '/');
    } else {
      onFileSelect?.(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setShowContextMenu({
      fileId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.is_folder) {
      return <Folder className="h-8 w-8 text-yellow-500" />;
    }

    if (file.mime_type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }

    if (file.mime_type.startsWith('video/')) {
      return <Video className="h-8 w-8 text-purple-500" />;
    }

    if (
      file.mime_type === 'application/pdf' ||
      file.mime_type.includes('document')
    ) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }

    if (
      file.mime_type.includes('zip') ||
      file.mime_type.includes('compressed')
    ) {
      return <Archive className="h-8 w-8 text-orange-500" />;
    }

    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="application/pdf">PDFs</option>
            <option value="application">Documents</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12">
          <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No files found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => handleFileClick(file)}
              onContextMenu={(e) => handleContextMenu(e, file.id)}
              className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg cursor-pointer transition-all"
            >
              {/* Thumbnail or Icon */}
              <div className="aspect-square flex items-center justify-center mb-3 bg-gray-50 rounded-lg">
                {file.thumbnail_url ? (
                  <img
                    src={file.thumbnail_url}
                    alt={file.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  getFileIcon(file)
                )}
              </div>

              {/* File Info */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatBytes(file.size_bytes)}
                </p>
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, file.id);
                  }}
                  className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                >
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modified
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <tr
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getFileIcon(file)}
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBytes(file.size_bytes)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(file.updated_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileShare?.(file.id);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileDelete?.(file.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
