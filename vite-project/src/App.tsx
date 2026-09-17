import { useEffect, useRef, useState, type TouchEvent } from 'react';
import './App.css';
import settings from './assets/settings.png';
import MemoCard from './components/MemoCard';
import { TAGS, TAG_KEY, type Tag } from './tags';

function App() {
  const [memos, setMemos] = useState<{ id: string; textData: string; date: string; tags: Tag[] }[]>([
    { id: 'initial-1', textData: 'サトシ・ナカモト', date: '1970/01/01 00:00:00', tags: ['だれ'] },
    { id: 'initial-2', textData: 'ンジャメナ', date: '1973/09/07 00:00:00', tags: ['どこ'] },
    { id: 'initial-3', textData: '１０まんボルト', date: '1996/02/27 00:00:00', tags: ['方法'] },
    { id: 'initial-4', textData: '男はウミガメのスープを飲み、その後死んでしまった', date: '2026/06/16 00:00:00', tags: ['なぜ'] },
    { id: 'initial-5', textData: 'ビールと発泡酒', date: '2026/08/07 00:00:00', tags: ['ちがい'] },
    { id: 'initial-6', textData: 'ナビエ=ストークス方程式', date: '2026/09/15 15:36:00', tags: ['とは'] },
  ]);
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const editorRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLDialogElement>(null);
  const [editingMemo, setEditingMemo] = useState<{ id: string; text: string; tag: Tag | null } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const editorText = editingMemo ? editingMemo.text : text;
  const editorTag = editingMemo ? editingMemo.tag : selectedTag;

  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }, [memos]);

  const resizeInput = () => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  };

  useEffect(resizeInput, [editorText]);

  const openEditor = () => {
    setIsEditorOpen(true);
  };

  useEffect(() => {
    if (isEditorOpen) {
      resizeInput();
      inputRef.current?.focus();
    }
  }, [isEditorOpen, editingMemo?.id]);

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
    if (editingMemo) {
      setEditingMemo({ ...editingMemo, tag: editingMemo.tag === tag ? null : tag });
    } else {
      setSelectedTag(current => current === tag ? null : tag);
    }
    inputRef.current?.focus();
  };

  const saveMemo = () => {
    if (!editorText.trim()) return;
    if (editingMemo) {
      setMemos(current => current.map(memo => memo.id === editingMemo.id
        ? { ...memo, textData: editingMemo.text.trim(), tags: editingMemo.tag ? [editingMemo.tag] : [] }
        : memo));
      setEditingMemo(null);
      setIsEditorOpen(false);
      return;
    }
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const date = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setMemos(current => [
      ...current,
      { id: crypto.randomUUID(), textData: text.trim(), date, tags: selectedTag ? [selectedTag] : [] },
    ]);
    setText('');
    setSelectedTag(null);
    setIsEditorOpen(false);
  };

  const editMemo = (memo: typeof memos[number]) => {
    setEditingMemo({ id: memo.id, text: memo.textData, tag: memo.tags[0] ?? null });
    setIsEditorOpen(true);
  };

  const cancelEdit = () => {
    setEditingMemo(null);
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
          <MemoCard key={memo.id} textData={memo.textData} date={memo.date} tags={memo.tags} onEdit={() => editMemo(memo)} onDelete={() => {
            setMemos(current => current.filter(item => item.id !== memo.id));
            if (editingMemo?.id === memo.id) cancelEdit();
          }} />
        ))}
      </div>

      <section
        ref={editorRef}
        className={`memo-editor${isEditorOpen ? ' is-open' : ''}`}
        aria-label={editingMemo ? 'メモを編集' : 'メモを記入'}
        onKeyDown={event => {
          if (event.key === 'Escape' && editingMemo) {
            event.stopPropagation();
            cancelEdit();
          }
        }}
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
              value={editorText}
              onChange={event => {
                if (editingMemo) {
                  setEditingMemo({ ...editingMemo, text: event.target.value });
                } else {
                  setText(event.target.value);
                }
              }}
              rows={1}
            />
            <button className="memo-save-button" type="submit" disabled={!editorText.trim()}>保存</button>
          </div>
          {editingMemo && (
            <div className="memo-edit-status">
              <span>メモを編集中</span>
              <button className="settings-close-button" type="button" onClick={cancelEdit}>キャンセル</button>
            </div>
          )}
          <fieldset className="question-tags">
            <legend>疑問タグ（1つだけ選択できます）</legend>
            <div className="question-tag-options">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className="memotag question-tag-button"
                  data-tag={TAG_KEY[tag]}
                  aria-pressed={editorTag === tag}
                  onPointerDown={event => event.preventDefault()}
                  onClick={() => toggleTag(tag)}
                >#{tag}</button>
              ))}
            </div>
          </fieldset>
        </form>
      </section>
    </>
  );
}

export default App
