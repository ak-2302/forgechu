import { useRef, useState } from 'react';
import './App.css';
import MemoCard from './components/MemoCard';

const questionTags = ['とは', 'なぜ', '方法' ,'だれ', 'どこ' ,'いつ'];

function App() {
  const [memos, setMemos] = useState([
    { id: 'initial-1', textData: '天文学的苦痛のリスク', date: '2026/09/15 15:36:00', tags: ['とは'] },
    { id: 'initial-2', textData: 'ナビエ=ストークス方程式', date: '2026/09/15 15:36:00', tags: ['とは'] },
  ]);
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const editorRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const openEditor = () => {
    editorRef.current?.showModal();
    inputRef.current?.focus();
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
        <img
          width="50"
          height="50"
          src="https://img.icons8.com/ios/50/settings--v1.png"
          alt="settings--v1"
        />
      </div>
      <div id="memo-list">
        {memos.map(memo => (
          <MemoCard key={memo.id} textData={memo.textData} date={memo.date} tags={memo.tags} />
        ))}
      </div>

      <button id="add-memo-button" type="button" onClick={openEditor}>+新しいメモを作成</button>

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
              rows={4}
            />
            <button className="memo-save-button" type="submit" disabled={!text.trim()}>保存</button>
          </div>
          <fieldset className="question-tags">
            <legend>疑問タグ（1つだけ選択できます）</legend>
            <div className="question-tag-options">
              {questionTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className="question-tag-button"
                  data-question-tag={tag}
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
