import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Bell, Info } from 'lucide-react';
import { Logo } from './Logo';
import { SearchDropdown } from './SearchDropdown';
import { UserMenu } from './UserMenu';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { cn } from '../utils/cn';
import type { Item } from '../types';
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
} from '../utils/recentSearches';

export interface TopNavProps {
  className?: string;
}

/**
 * TopNav Component — Seamless Google Drive Material 3 Navigation Bar
 * Features:
 * - Direct integration into outer #F8FAFD canvas (no dividing bottom border)
 * - Brand logo component with home reset
 * - Dynamic morphing search bar with auto-height quick results & recent search suggestions
 * - User Profile avatar pill with layout morphing action card
 */
export const TopNav: React.FC<TopNavProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchQuery = useNoteStore((state) => state.searchQuery);
  const setSearchQuery = useNoteStore((state) => state.setSearchQuery);
  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);

  const isDetailsPanelOpen = useUIStore((state) => state.isDetailsPanelOpen);
  const toggleDetailsPanel = useUIStore((state) => state.toggleDetailsPanel);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Collapse dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key handler to clear focus and close dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchFocused(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (trimmed) {
        const updated = saveRecentSearch(trimmed);
        setRecentSearches(updated);
        setIsSearchFocused(false);
        inputRef.current?.blur();
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    }
  };

  const handleSelectRecent = useCallback(
    (search: string) => {
      setSearchQuery(search);
      const updated = saveRecentSearch(search);
      setRecentSearches(updated);
      setIsSearchFocused(false);
      inputRef.current?.blur();
      navigate(`/search?q=${encodeURIComponent(search)}`);
    },
    [navigate, setSearchQuery]
  );

  const handleRemoveRecent = useCallback(
    (search: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = removeRecentSearch(search);
      setRecentSearches(updated);
    },
    []
  );

  const handleSelectFolder = useCallback(
    (folderId: string, folderName: string) => {
      if (searchQuery.trim()) {
        const updated = saveRecentSearch(folderName);
        setRecentSearches(updated);
      }
      setCurrentFolder(folderId);
      setIsSearchFocused(false);
      inputRef.current?.blur();
      navigate('/');
    },
    [navigate, searchQuery, setCurrentFolder]
  );

  const handleSelectItem = useCallback(
    (item: Item) => {
      if (item.title?.trim()) {
        const updated = saveRecentSearch(item.title);
        setRecentSearches(updated);
      }
      setIsSearchFocused(false);
      inputRef.current?.blur();
      navigate(`/notes/${item.id}`);
    },
    [navigate]
  );

  const handleViewAllResults = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      const updated = saveRecentSearch(trimmed);
      setRecentSearches(updated);
      setIsSearchFocused(false);
      inputRef.current?.blur();
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }, [navigate, searchQuery]);

  const handleClearQuery = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 bg-[#F8FAFD] select-none ${className}`}>
      <div className="h-16 px-6 flex items-center justify-between w-full select-none bg-transparent gap-4">
        {/* 1. Left Section: Noteeye Brand Logo Component */}
        <div className="w-auto md:w-56 shrink-0 flex items-center">
          <Logo />
        </div>

        {/* 2. Center-Left: Pill Search Bar (Positioned directly between the two red lines) */}
        <div className="flex-1 flex items-center justify-start min-w-0">
          <div
            ref={searchContainerRef}
            className="w-full max-w-[560px] lg:max-w-[620px] relative"
          >
            {/* Pill Input Container */}
            <div
              className={`w-full h-11 px-4 rounded-full bg-[#EDF2FC] border border-transparent focus-within:border-slate-300 focus-within:bg-white flex items-center gap-3 transition-colors duration-200 shadow-sm relative ${
                isSearchFocused ? 'bg-white border-slate-300 shadow-md' : ''
              }`}
            >
              <Search className="w-[18px] h-[18px] text-slate-500 shrink-0 select-none" />

              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setRecentSearches(getRecentSearches());
                  setIsSearchFocused(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search in Noteeye"
                className="w-full bg-transparent border-0 outline-none text-sm text-[#1F1F1F] placeholder-slate-500 font-normal"
                aria-label="Search notes, checklists, and folders"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer shrink-0"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dynamic Auto-Height Morphing Search Dropdown */}
            <SearchDropdown
              isOpen={isSearchFocused}
              query={searchQuery}
              recentSearches={recentSearches}
              folders={folders}
              items={items}
              onSelectRecent={handleSelectRecent}
              onRemoveRecent={handleRemoveRecent}
              onSelectFolder={handleSelectFolder}
              onSelectItem={handleSelectItem}
              onViewAllResults={handleViewAllResults}
            />
          </div>
        </div>

        {/* 3. Right Section: Subtle Notifications Trigger & Morphing User Menu */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleDetailsPanel}
            className={cn(
              'p-2 rounded-full transition-colors cursor-pointer',
              isDetailsPanelOpen
                ? 'bg-[#D3E3FD] text-[#041E49]'
                : 'text-[#444746] hover:text-[#1F1F1F] hover:bg-[#E8EDF4]'
            )}
            title="Toggle item details"
            aria-label="Toggle details panel"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="p-2 text-[#444746] hover:text-[#1F1F1F] hover:bg-[#E8EDF4] rounded-full transition-colors cursor-pointer relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#0B57D0] rounded-full" />
          </button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
};
