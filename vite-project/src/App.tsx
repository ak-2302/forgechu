import { useEffect, useRef, useState, type TouchEvent } from 'react';
import './App.css';
import settings from './assets/settings.png';
import MemoCard from './components/MemoCard';
import SearchModeToggle, { type SearchMode } from './components/SearchModeToggle';
import { answerFor } from './search/answer';
import { summarize } from './search/summarize';
import type { MemoSearch, SelectedArticle, WikipediaArticle } from './search/types';
import { fetchArticle, searchWikipedia } from './search/wikipedia';
import { TAGS, TAG_KEY, type Tag } from './tags';

function App() {
  const [memos, setMemos] = useState<{ id: string; textData: string; date: string; tags: Tag[]; searchMode?: SearchMode; search?: MemoSearch }[]>([
    { id: 'initial-1', textData: 'サトシ・ナカモト', date: '1970/01/01 00:00:00', tags: ['だれ'] },
    { id: 'initial-2', textData: 'ンジャメナ', date: '1973/09/07 00:00:00', tags: ['どこ'] },
    { id: 'initial-3', textData: '１０まんボルト', date: '1996/02/27 00:00:00', tags: ['方法'] },
    { id: 'initial-4', textData: '男はウミガメのスープを飲み、その後死んでしまった', date: '2026/06/16 00:00:00', tags: ['なぜ'] },
    { id: 'initial-5', textData: 'ビールと発泡酒', date: '2026/08/07 00:00:00', tags: ['ちがい'] },
    { id: 'initial-6', textData: 'ナビエ=ストークス方程式', date: '2026/09/15 15:36:00', tags: ['とは'] },
  ]);
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('now');
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const editorRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }, [memos.length]);

  const resizeInput = () => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  };

  useEffect(resizeInput, [text]);

  const openEditor = () => {
    setIsEditorOpen(true);
  };

  useEffect(() => {
    if (isEditorOpen) {
      resizeInput();
      inputRef.current?.focus();
    }
  }, [isEditorOpen]);

  useEffect(() => {
    if (!isEditorOpen) return;

    const closeEditorOnOutsideTap = (event: PointerEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setIsEditorOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeEditorOnOutsideTap);
    return () => document.removeEventListener('pointerdown', closeEditorOnOutsideTap);
  }, [isEditorOpen]);

  const openSettings = () => {
    if (settingsRef.current?.open) return;
    settingsRef.current?.showModal();
  };

  const startSwipe = (event: TouchEvent) => {
    startYRef.current = event.touches[0].clientY;
  };

  const trackSwipe = (event: TouchEvent) => {
    if (startYRef.current === null) return;
    if (startYRef.current - event.touches[0].clientY > 30) {
      startYRef.current = null;
      openEditor();
    }
  };

  const toggleTag = (tag: Tag) => {
    setSelectedTag(current => current === tag ? null : tag);
    inputRef.current?.focus();
  };

  const changeSearchMode = (mode: SearchMode) => {
    if (!isEditorOpen) return;
    setSearchMode(mode);
    inputRef.current?.focus();
  };

  const updateSearch = (id: string, search: MemoSearch) => {
    setMemos(current => current.map(memo => memo.id === id ? { ...memo, search } : memo));
  };

  const runSearch = async (id: string, query: string, tag: Tag | null) => {
    try {
      const result = await searchWikipedia(query, tag);
      const answer = await answerFor(result, tag);
      const summary = await summarize(result, tag, answer);
      updateSearch(id, { status: 'done', result, answer, summary });
    } catch {
      updateSearch(id, { status: 'error' });
    }
  };

  const updateSelected = (id: string, selected: SelectedArticle | undefined, pending?: WikipediaArticle) => {
    setMemos(current => current.map(memo => {
      if (memo.id !== id || memo.search?.status !== 'done') return memo;
      if (pending && (memo.search.selected?.status !== 'loading' || memo.search.selected.candidate.url !== pending.url)) return memo;
      return { ...memo, search: { ...memo.search, selected } };
    }));
  };

  const selectCandidate = async (id: string, candidate: WikipediaArticle, tag: Tag | null) => {
    updateSelected(id, { status: 'loading', candidate });
    try {
      const result = await fetchArticle(candidate.title);
      if (result.status !== 'found') {
        updateSelected(id, { status: 'error', candidate }, candidate);
        return;
      }
      const answer = await answerFor(result, tag);
      const summary = await summarize(result, tag, answer);
      updateSelected(id, { status: 'done', candidate, result, answer, summary }, candidate);
    } catch {
      updateSelected(id, { status: 'error', candidate }, candidate);
    }
  };

  const saveMemo = () => {
    if (!text.trim()) return;
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const date = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const id = crypto.randomUUID();
    const memo = { id, textData: text.trim(), date, tags: selectedTag ? [selectedTag] : [], searchMode };
    setMemos(current => [...current, searchMode === 'now' ? { ...memo, search: { status: 'loading' } } : memo]);
    if (searchMode === 'now') runSearch(id, text.trim(), selectedTag);
    setText('');
    setSelectedTag(null);
    setIsEditorOpen(false);
  };

  return (
    <>
      <div id="header">
        <h1>ぎもんNOTE</h1>
        <button id="settings-button" type="button" aria-label="設定を開く" onClick={openSettings}>
          <img width="28" height="28" src={settings} alt="" />
        </button>
      </div>
      <dialog
        ref={settingsRef}
        className="settings-modal"
        aria-labelledby="settings-modal-title"
        onClick={event => {
          if (event.target === event.currentTarget) settingsRef.current?.close();
        }}
      >
        <div className="settings-modal-content">
          <h2 id="settings-modal-title">設定</h2>
          <button className="settings-close-button" type="button" onClick={() => settingsRef.current?.close()}>閉じる</button>
        </div>
      </dialog>
      <div id="memo-list">
        {memos.map(memo => (
          <MemoCard key={memo.id} textData={memo.textData} date={memo.date} tags={memo.tags} search={memo.search} onSelectCandidate={candidate => selectCandidate(memo.id, candidate, memo.tags[0] ?? null)} onBackToCandidates={() => updateSelected(memo.id, undefined)} onDelete={() => setMemos(current => current.filter(item => item.id !== memo.id))} />
        ))}
      </div>

      <section
        ref={editorRef}
        className={`memo-editor${isEditorOpen ? ' is-open' : ''}`}
        aria-label="メモを記入"
        onClick={isEditorOpen ? undefined : openEditor}
        onTouchStart={startSwipe}
        onTouchMove={trackSwipe}
      >
        <form onSubmit={event => { event.preventDefault(); saveMemo(); }}>
          <div className="memo-editor-top">
            <textarea
              ref={inputRef}
              className="memo-editor-input"
              aria-label="メモ本文"
              placeholder="疑問をメモ…"
              value={text}
              onChange={event => setText(event.target.value)}
              rows={1}
            />
            <SearchModeToggle value={searchMode} onChange={changeSearchMode} />
          </div>
          <div className="memo-editor-bottom">
            <fieldset className="question-tags">
              <legend>疑問タグ（1つだけ選択できます）</legend>
              <div className="question-tag-options">
                {TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className="memotag question-tag-button"
                    data-tag={TAG_KEY[tag]}
                    aria-pressed={selectedTag === tag}
                    onPointerDown={event => event.preventDefault()}
                    onClick={() => toggleTag(tag)}
                  >#{tag}</button>
                ))}
              </div>
            </fieldset>
            <button className="memo-save-button" type="submit" disabled={!text.trim()}>保存</button>
          </div>
        </form>
      </section>
    </>
  );
}

export default App
