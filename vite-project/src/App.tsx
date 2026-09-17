import { useEffect, useRef, useState, type TouchEvent } from 'react';
import './App.css';
import MemoCard from './components/MemoCard';
import settings from './assets/settings.png';
import { TAGS, TAG_KEY, type Tag } from './tags';

function App() {
  const [memos, setMemos] = useState<{ id: string; textData: string; date: string; tags: Tag[] }[]>([
    { id: 'initial-1', textData: '天文学的苦痛のリスク', date: '2026/09/15 15:36:00', tags: ['とは'] },
    { id: 'initial-2', textData: 'ナビエ=ストークス方程式', date: '2026/09/15 15:36:00', tags: ['とは'] },
  ]);
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const editorRef = useRef<HTMLDialogElement>(null);
  const settingsRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(resizeInput, [text]);

  const openEditor = () => {
    if (editorRef.current?.open) return;
    editorRef.current?.showModal();
    resizeInput();
    inputRef.current?.focus();
  };

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

  const saveMemo = () => {
    if (!text.trim()) return;
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const date = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setMemos(current => [
      ...current,
      { id: crypto.randomUUID(), textData: text.trim(), date, tags: selectedTag ? [selectedTag] : [] },
    ]);
    setText('');
    setSelectedTag(null);
    editorRef.current?.close();
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
          <MemoCard key={memo.id} textData={memo.textData} date={memo.date} tags={memo.tags} onDelete={() => setMemos(current => current.filter(item => item.id !== memo.id))} />
        ))}
      </div>

      <button
        id="add-memo-button"
        type="button"
        onClick={openEditor}
        onTouchStart={startSwipe}
        onTouchMove={trackSwipe}
      >+新しいメモを作成</button>

      <dialog ref={editorRef} className="memo-editor" aria-label="メモを記入">
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
            <button className="memo-save-button" type="submit" disabled={!text.trim()}>保存</button>
          </div>
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
                  onClick={() => setSelectedTag(tag)}
                >#{tag}</button>
              ))}
            </div>
          </fieldset>
          <button className="memo-close-button" type="button" onClick={() => editorRef.current?.close()}>閉じる</button>
        </form>
      </dialog>
    </>
  );
}

export default App
