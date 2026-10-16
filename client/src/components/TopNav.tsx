import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "@/components/ui/icons";
import { Logo } from "./Logo";
import { SearchDropdown } from "./SearchDropdown";
import { UserMenu } from "./UserMenu";
import { MobileSearchModal } from "./MobileSearchModal";
import { MobileUserDrawer } from "./MobileUserDrawer";
import { useNoteStore } from "../store/useNoteStore";
import { useUIStore } from "../store/uiStore";
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

  const requestNavigation = useUIStore((state) => state.requestNavigation);

  // Desktop search handlers: Only commit search on Enter or clicking 'All results'
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmed = inputValue.trim();
      if (trimmed) {
        requestNavigation(`/search?q=${encodeURIComponent(trimmed)}`, (target) => {
          const updated = saveRecentSearch(trimmed);
          setRecentSearches(updated);
          setIsSearchFocused(false);
          inputRef.current?.blur();
          setSearchQuery(trimmed);
          navigate(target);
        });
      }
    } else if (e.key === "Escape") {
      setIsSearchFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectRecent = useCallback(
    (term: string) => {
      requestNavigation(`/search?q=${encodeURIComponent(term)}`, (target) => {
        const updated = saveRecentSearch(term);
        setRecentSearches(updated);
        setInputValue(term);
        setSearchQuery(term);
        setIsSearchFocused(false);
        inputRef.current?.blur();
        navigate(target);
      });
    },
    [navigate, setSearchQuery, requestNavigation],
  );

  const handleRemoveRecent = useCallback((search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentSearch(search);
    setRecentSearches(updated);
  }, []);

  const handleSelectFolder = useCallback(
    (folderId: string) => {
      requestNavigation(`/folders/${folderId}`, (target) => {
        setIsSearchFocused(false);
        inputRef.current?.blur();
        setCurrentFolder(folderId);
        navigate(target);
      });
    },
    [navigate, setCurrentFolder, requestNavigation],
  );

  const handleSelectItem = useCallback(
    (item: Item) => {
      requestNavigation(`/notes/${item.id}`, (target) => {
        if (item.title?.trim()) {
          const updated = saveRecentSearch(item.title);
          setRecentSearches(updated);
        }
        setIsSearchFocused(false);
        inputRef.current?.blur();
        navigate(target);
      });
    },
    [navigate, requestNavigation],
  );

  const handleViewAllResults = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      requestNavigation(`/search?q=${encodeURIComponent(trimmed)}`, (target) => {
        const updated = saveRecentSearch(trimmed);
        setRecentSearches(updated);
        setIsSearchFocused(false);
        inputRef.current?.blur();
        setSearchQuery(trimmed);
        navigate(target);
      });
    }
  }, [navigate, inputValue, setSearchQuery, requestNavigation]);

  const handleClearQuery = () => {
    setInputValue("");
    setSearchQuery("");
    if (location.pathname === "/search") {
      requestNavigation("/", (target) => navigate(target));
    }
    inputRef.current?.focus();
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-[#F8FAFD] dark:bg-[#0B0F17] border-b border-transparent dark:border-slate-800/60 select-none transition-colors duration-200 ${className}`}
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
                className={`w-full h-11 px-4 rounded-full bg-[#EDF2FC] dark:bg-slate-800/90 border border-transparent dark:border-slate-700/80 focus-within:border-slate-300 dark:focus-within:border-slate-600 focus-within:bg-white dark:focus-within:bg-slate-900 flex items-center gap-3 transition-colors duration-200 shadow-sm relative ${
                  isSearchFocused ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-md" : ""
                }`}
              >
                <Search className="w-[18px] h-[18px] text-slate-500 dark:text-slate-400 shrink-0 select-none" />

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
                  className="w-full bg-transparent border-0 outline-none text-sm text-[#1F1F1F] dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 font-normal"
                  aria-label="Search notes, checklists, and folders"
                />

                {inputValue && (
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition-colors cursor-pointer shrink-0"
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
              className="flex md:hidden w-9 h-9 rounded-full bg-[#EDF2FC] dark:bg-slate-800 hover:bg-[#E2E8F4] dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs active:scale-95 transition-transform cursor-pointer shrink-0"
              aria-label="Open search popup"
              title="Search in Noteeye"
            >
              <Search className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
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
