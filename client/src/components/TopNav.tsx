import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X, Lightbulb } from "@/components/ui/icons";
import { Logo } from "./Logo";
import { SearchDropdown } from "./SearchDropdown";
import { UserMenu } from "./UserMenu";
import { MobileSearchModal } from "./MobileSearchModal";
import { MobileUserDrawer } from "./MobileUserDrawer";
import { useNoteStore } from "../store/useNoteStore";
import type { Item } from "../types";
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
} from "../utils/recentSearches";

export interface TopNavProps {
  className?: string;
}

/**
 * TopNav Component — Seamless Google Drive Material 3 Navigation Bar
 * Features:
 * - Desktop: Center-left pill search bar with auto-height morphing dropdown
 * - Mobile: Compact pill search button that morphs into full-screen search modal
 * - Mobile User Drawer: Triggered when tapping the user avatar on mobile
 * - User Profile avatar pill with layout morphing action card
 */
export const TopNav: React.FC<TopNavProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchQuery = useNoteStore((state) => state.searchQuery);
  const setSearchQuery = useNoteStore((state) => state.setSearchQuery);
  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);
  const openNoteModal = useNoteStore((state) => state.openNoteModal);

  // Local draft query while typing so workspace is NOT filtered until "All results" or Enter
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileUserDrawerOpen, setIsMobileUserDrawerOpen] = useState(false);

  // Keep input value in sync with committed store searchQuery and route transitions
  useEffect(() => {
    if (location.pathname !== "/search" && !searchQuery) {
      setInputValue("");
    } else {
      setInputValue(searchQuery);
    }
  }, [location.pathname, searchQuery]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Listen for global shortcut event to open mobile search if on small screen
  useEffect(() => {
    const handleOpenMobileSearch = () => {
      if (window.innerWidth < 768) {
        setIsMobileSearchOpen(true);
      }
    };
    window.addEventListener("noteeye:open-mobile-search", handleOpenMobileSearch);
    return () => window.removeEventListener("noteeye:open-mobile-search", handleOpenMobileSearch);
  }, []);

  // Handle outside click to blur desktop search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Desktop search handlers: Only commit search on Enter or clicking 'All results'
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmed = inputValue.trim();
      if (trimmed) {
        const updated = saveRecentSearch(trimmed);
        setRecentSearches(updated);
        setIsSearchFocused(false);
        inputRef.current?.blur();
        setSearchQuery(trimmed);
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    } else if (e.key === "Escape") {
      setIsSearchFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectRecent = useCallback(
    (term: string) => {
      const updated = saveRecentSearch(term);
      setRecentSearches(updated);
      setInputValue(term);
      setSearchQuery(term);
      setIsSearchFocused(false);
      inputRef.current?.blur();
      navigate(`/search?q=${encodeURIComponent(term)}`);
    },
    [navigate, setSearchQuery],
  );

  const handleRemoveRecent = useCallback((search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentSearch(search);
    setRecentSearches(updated);
  }, []);

  const handleSelectFolder = useCallback(
    (folderId: string) => {
      setIsSearchFocused(false);
      inputRef.current?.blur();
      setCurrentFolder(folderId);
      navigate(`/folders/${folderId}`);
    },
    [navigate, setCurrentFolder],
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
    [navigate],
  );

  const handleViewAllResults = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      const updated = saveRecentSearch(trimmed);
      setRecentSearches(updated);
      setIsSearchFocused(false);
      inputRef.current?.blur();
      setSearchQuery(trimmed);
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }, [navigate, inputValue, setSearchQuery]);

  const handleClearQuery = () => {
    setInputValue("");
    setSearchQuery("");
    if (location.pathname === "/search") {
      navigate("/");
    }
    inputRef.current?.focus();
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-[#F8FAFD] select-none ${className}`}
      >
        <div className="h-16 px-4 md:px-6 flex items-center justify-between w-full select-none bg-transparent gap-3 md:gap-4">
          {/* 1. Left Section: Noteeye Brand Logo Component */}
          <div className="w-auto md:w-56 shrink-0 flex items-center">
            <Logo />
          </div>

          {/* 2. Center: Desktop Search Bar (md and above) */}
          <div className="hidden md:flex flex-1 items-center justify-start min-w-0">
            <div
              ref={searchContainerRef}
              className="w-full max-w-[560px] lg:max-w-[620px] relative"
            >
              {/* Pill Input Container */}
              <div
                className={`w-full h-11 px-4 rounded-full bg-[#EDF2FC] border border-transparent focus-within:border-slate-300 focus-within:bg-white flex items-center gap-3 transition-colors duration-200 shadow-sm relative ${
                  isSearchFocused ? "bg-white border-slate-300 shadow-md" : ""
                }`}
              >
                <Search className="w-[18px] h-[18px] text-slate-500 shrink-0 select-none" />

                <input
                  id="noteeye-main-search-input"
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => {
                    setRecentSearches(getRecentSearches());
                    setIsSearchFocused(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search in Noteeye (Ctrl+K)"
                  className="w-full bg-transparent border-0 outline-none text-sm text-[#1F1F1F] placeholder-slate-500 font-normal"
                  aria-label="Search notes, checklists, and folders"
                />

                {inputValue && (
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
                query={inputValue}
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

          {/* 3. Right Section: Mobile Search Icon (< md) + User Menu */}
          <div className="flex items-center justify-end shrink-0 gap-2">
            {/* Mobile Search Icon: Same size as avatar pill (w-9 h-9 rounded-full), immediately to its left */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="flex md:hidden w-9 h-9 rounded-full bg-[#EDF2FC] hover:bg-[#E2E8F4] border border-slate-200/80 items-center justify-center text-slate-600 shadow-2xs active:scale-95 transition-transform cursor-pointer shrink-0"
              aria-label="Open search popup"
              title="Search in Noteeye"
            >
              <Search className="w-4 h-4 text-slate-600 shrink-0" />
            </button>

            {/* Desktop + New Idea Quick Action Button */}
            <button
              type="button"
              onClick={() => openNoteModal('idea')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200/80 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Create new Idea Kanban Board"
              aria-label="Create new Idea"
            >
              <Lightbulb className="w-3.5 h-3.5 text-purple-600 fill-purple-200/50" />
              <span>New Idea</span>
            </button>

            <UserMenu onMobileAvatarClick={() => setIsMobileUserDrawerOpen(true)} />
          </div>
        </div>
      </header>

      {/* Mobile Morphing Search Modal Overlay */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />

      {/* Mobile Slide-Over User Profile Drawer */}
      <MobileUserDrawer
        isOpen={isMobileUserDrawerOpen}
        onClose={() => setIsMobileUserDrawerOpen(false)}
      />
    </>
  );
};

export default TopNav;
