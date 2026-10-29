// src/components/MainPage.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import Icon from "./Icon";
import "./MainPage.css";

const NOTE_COLORS = [
  { name: "Butter", value: "#fff3b0" },
  { name: "Mint", value: "#c8f0dc" },
  { name: "Sky", value: "#cde6ff" },
  { name: "Blush", value: "#ffd5df" },
  { name: "Lavender", value: "#e1d8ff" },
  { name: "Peach", value: "#ffdfc0" },
];
const NOTE_TEXT = "#1f2937";

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Older notes were saved without a colour, so give each one a stable pastel from its id.
const fallbackColor = (id = "") => {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return NOTE_COLORS[sum % NOTE_COLORS.length].value;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function MainPage({ logout }) {
  const username = localStorage.getItem("username") || "there";

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("newest");
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState(NOTE_COLORS[0].value);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  const composerRef = useRef(null);
  const editRef = useRef(null);
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  // ---- data -------------------------------------------------------------
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await axios.get(`${API_URL}/api/notes`, authConfig());
      setNotes(response.data);
    } catch (error) {
      // Token expired (they last 1 hour) -> back to the login page.
      if (error.response?.status === 401) {
        logoutRef.current();
        return;
      }
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleError = useCallback((error, message) => {
    if (error.response?.status === 401) {
      logoutRef.current();
      return;
    }
    setNotice(message);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (composerOpen && composerRef.current) composerRef.current.focus();
  }, [composerOpen]);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  // ---- actions ----------------------------------------------------------
  const openComposer = () => {
    setComposerOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelComposer = () => {
    setComposerOpen(false);
    setDraft("");
  };

  const handleHome = () => {
    setSearchTerm("");
    setComposerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addNote = async () => {
    const text = draft.trim();
    if (!text) return;
    try {
      const response = await axios.post(
        `${API_URL}/api/notes`,
        { text, color: { background: draftColor, text: NOTE_TEXT } },
        authConfig()
      );
      setNotes((prev) => [response.data, ...prev]);
      setDraft("");
      setComposerOpen(false);
    } catch (error) {
      handleError(error, "Couldn't save the note. Please try again.");
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setEditText(note.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (id) => {
    const text = editText.trim();
    if (!text) return;
    const original = notes.find((n) => n._id === id);
    if (original && original.text === text) {
      cancelEdit();
      return;
    }
    try {
      const response = await axios.put(
        `${API_URL}/api/notes/${id}`,
        { text },
        authConfig()
      );
      setNotes((prev) => prev.map((n) => (n._id === id ? response.data : n)));
      cancelEdit();
    } catch (error) {
      handleError(error, "Couldn't update the note. Please try again.");
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    try {
      await axios.delete(`${API_URL}/api/notes/${id}`, authConfig());
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      handleError(error, "Couldn't delete the note. Please try again.");
    }
  };

  // ---- derived ----------------------------------------------------------
  const visibleNotes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return notes
      .filter((note) => note.text.toLowerCase().includes(query))
      .sort((a, b) =>
        sort === "newest"
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date)
      );
  }, [notes, searchTerm, sort]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  let subtitle;
  if (loading) subtitle = "Loading your notes…";
  else if (notes.length === 0) subtitle = "A fresh start — write your first note.";
  else if (searchTerm.trim())
    subtitle = `${visibleNotes.length} of ${notes.length} notes`;
  else subtitle = `You have ${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

  const showEmpty = !loading && !loadError && notes.length === 0 && !composerOpen;
  const showNoMatches =
    !loading && notes.length > 0 && visibleNotes.length === 0;

  // ---- render -----------------------------------------------------------
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark" title="NOTE.me">
          <Icon name="pencil" size={22} />
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          <button
            className="nav-btn is-active"
            title="All notes"
            aria-label="All notes"
            onClick={handleHome}
          >
            <Icon name="notes" />
          </button>
          <button
            className="nav-btn"
            title="New note"
            aria-label="New note"
            onClick={openComposer}
          >
            <Icon name="plus" />
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-btn"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <button
            className="nav-btn"
            title="Log out"
            aria-label="Log out"
            onClick={logout}
          >
            <Icon name="logout" />
          </button>
          <div className="avatar" title={username}>
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="page-header">
          <div>
            <h1>
              {greeting}, <span className="name">{username}</span> 👋
            </h1>
            <p className="subtitle">{subtitle}</p>
          </div>
          <button className="btn btn-primary btn-new" onClick={openComposer}>
            <Icon name="plus" size={18} /> New note
          </button>
        </header>

        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder="Search your notes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search notes"
            />
          </label>
          <div className="segmented" role="group" aria-label="Sort notes">
            <button
              className={sort === "newest" ? "is-active" : ""}
              onClick={() => setSort("newest")}
            >
              Newest
            </button>
            <button
              className={sort === "oldest" ? "is-active" : ""}
              onClick={() => setSort("oldest")}
            >
              Oldest
            </button>
          </div>
        </div>

        {notice && (
          <div className="notice" role="alert">
            <span>{notice}</span>
            <button aria-label="Dismiss" onClick={() => setNotice("")}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        <section className="notes-grid">
          {composerOpen && (
            <article
              className="note note-composer"
              style={{ background: draftColor, color: NOTE_TEXT }}
            >
              <textarea
                ref={composerRef}
                placeholder="Write something…"
                value={draft}
                rows={5}
                maxLength={2000}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addNote();
                  }
                  if (e.key === "Escape") cancelComposer();
                }}
              />
              <div className="swatches" role="group" aria-label="Note colour">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    className={`swatch${draftColor === c.value ? " is-selected" : ""}`}
                    style={{ background: c.value }}
                    onClick={() => setDraftColor(c.value)}
                  />
                ))}
              </div>
              <div className="note-footer">
                <span className="hint">Enter to save · Shift+Enter for a new line</span>
                <div className="composer-actions">
                  <button className="btn btn-ghost btn-sm" onClick={cancelComposer}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-dark btn-sm"
                    onClick={addNote}
                    disabled={!draft.trim()}
                  >
                    Add note
                  </button>
                </div>
              </div>
            </article>
          )}

          {loading &&
            [0, 1, 2].map((i) => (
              <div key={i} className="note skeleton" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            ))}

          {!loading &&
            visibleNotes.map((note) => {
              const isEditing = editingId === note._id;
              const background = note.color?.background || fallbackColor(note._id);
              const foreground = note.color?.text || NOTE_TEXT;
              return (
                <article
                  key={note._id}
                  className={`note${isEditing ? " is-editing" : ""}`}
                  style={{ background, color: foreground }}
                >
                  {isEditing ? (
                    <textarea
                      value={editText}
                      rows={Math.max(4, editText.split("\n").length + 1)}
                      maxLength={2000}
                      ref={editRef}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelEdit();
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveEdit(note._id);
                      }}
                    />
                  ) : (
                    <p
                      className="note-text"
                      onClick={() => startEdit(note)}
                      title="Click to edit"
                    >
                      {note.text}
                    </p>
                  )}

                  <footer className="note-footer">
                    <span className="note-date">{formatDate(note.date)}</span>
                    <div className="note-actions">
                      {isEditing ? (
                        <>
                          <button
                            className="icon-btn"
                            title="Cancel (Esc)"
                            aria-label="Cancel editing"
                            onClick={cancelEdit}
                          >
                            <Icon name="x" size={16} />
                          </button>
                          <button
                            className="icon-btn"
                            title="Save (Ctrl+Enter)"
                            aria-label="Save note"
                            onClick={() => saveEdit(note._id)}
                          >
                            <Icon name="check" size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="icon-btn"
                            title="Edit"
                            aria-label="Edit note"
                            onClick={() => startEdit(note)}
                          >
                            <Icon name="pencil" size={16} />
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Delete"
                            aria-label="Delete note"
                            onClick={() => deleteNote(note._id)}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })}
        </section>

        {loadError && (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="x" size={28} />
            </div>
            <h2>Couldn't load your notes</h2>
            <p>The server may be waking up (free hosting sleeps when idle). Try again in a few seconds.</p>
            <button className="btn btn-primary" onClick={fetchNotes}>
              Try again
            </button>
          </div>
        )}

        {showEmpty && (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="pencil" size={28} />
            </div>
            <h2>No notes yet</h2>
            <p>Capture an idea, a to-do or anything you don't want to forget.</p>
            <button className="btn btn-primary" onClick={openComposer}>
              <Icon name="plus" size={18} /> Create your first note
            </button>
          </div>
        )}

        {showNoMatches && (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="search" size={28} />
            </div>
            <h2>No matching notes</h2>
            <p>Nothing matches “{searchTerm.trim()}”. Try a different word.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default MainPage;
