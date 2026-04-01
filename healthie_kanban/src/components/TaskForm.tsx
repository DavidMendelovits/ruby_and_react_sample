import { useState, useRef, useCallback, useEffect } from "react";
import type { Character } from "../types";
import { useCharacters } from "../hooks/useCharacters";
import styles from "./TaskForm.module.css";

interface TaskFormProps {
  onAdd: (title: string, character: Character) => void;
  onClose: () => void;
}

export function TaskForm({ onAdd, onClose }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { characters, loading, loadingMore, error, search, setSearch, loadMore, hasMore } = useCharacters();
  const listRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      loadMore();
    }
  }, [loadMore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedCharacter) return;
    onAdd(title.trim(), selectedCharacter);
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Task</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Assignee</label>
            <div ref={pickerRef} className={styles.characterPicker}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                className={styles.pickerButton}
              >
                {selectedCharacter ? (
                  <span className={styles.selectedChar}>
                    <img src={selectedCharacter.image} alt="" className={styles.miniAvatar} />
                    {selectedCharacter.name}
                  </span>
                ) : (
                  "Select character..."
                )}
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search characters..."
                    className={styles.searchInput}
                    autoFocus
                  />
                  <div ref={listRef} onScroll={handleScroll} role="listbox" className={styles.characterList}>
                    {loading && <div className={styles.searchingOverlay}>Searching...</div>}
                    {error && <div className={styles.errorOverlay}>{error}</div>}
                    {!loading && !error && characters.length === 0 && (
                      <p className={styles.loadingText}>No characters found</p>
                    )}
                    {characters.map((char) => (
                      <button
                        key={char.id}
                        type="button"
                        role="option"
                        onClick={() => {
                          setSelectedCharacter(char);
                          setDropdownOpen(false);
                          setSearch("");
                        }}
                        className={`${styles.characterOption} ${loading ? styles.stale : ""}`}
                      >
                        <img src={char.image} alt="" className={styles.miniAvatar} />
                        <span>{char.name}</span>
                        <span className={styles.status}>{char.status}</span>
                      </button>
                    ))}
                    {loadingMore && <p className={styles.loadingText}>Loading more...</p>}
                    {hasMore && !loading && !loadingMore && characters.length > 0 && (
                      <button type="button" onClick={loadMore} className={styles.loadMoreBtn}>
                        Load more
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !selectedCharacter}
              className={styles.submitButton}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
