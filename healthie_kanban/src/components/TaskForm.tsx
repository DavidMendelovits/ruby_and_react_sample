import { useState, useRef, useCallback } from "react";
import type { Character } from "../types";
import { useCharacters } from "../hooks/useCharacters";
import styles from "./TaskForm.module.css";

interface TaskFormProps {
  onAdd: (title: string, character: Character) => void;
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { characters, loading, loadingMore, error, search, setSearch, loadMore, hasMore } = useCharacters();
  const listRef = useRef<HTMLDivElement>(null);

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
    setTitle("");
    setSelectedCharacter(null);
  };

  const selectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setDropdownOpen(false);
    setSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className={styles.input}
      />

      <div className={styles.characterPicker}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
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
            <div ref={listRef} onScroll={handleScroll} className={styles.characterList}>
              {loading && <div className={styles.searchingOverlay}>Searching...</div>}
              {error && <div className={styles.errorOverlay}>{error}</div>}
              {!loading && !error && characters.length === 0 && (
                <p className={styles.loadingText}>No characters found</p>
              )}
              {characters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => selectCharacter(char)}
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

      <button
        type="submit"
        disabled={!title.trim() || !selectedCharacter}
        className={styles.submitButton}
      >
        Add Task
      </button>
    </form>
  );
}
