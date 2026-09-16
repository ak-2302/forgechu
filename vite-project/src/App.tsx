import './App.css'
import MemoCard from './components/MemoCard'


interface MemoData {
  textData: string;
  date: string;
  tags: string[];
}
function App() {
  const memoData: MemoData[] = [
    {
      "textData": "天文学的苦痛のリスク",
      "date": "2026/09/15 15:36:00",
      "tags": ["とは"]
    },
    {
      "textData": "ナビエ=ストークス方程式",
      "date": "2026/09/15 15:36:00",
      "tags": ["とは"]
    },
    {
      "textData": "帯分数",
      "date": "2026/09/15 15:36:00",
      "tags": ["とは"]
    },
    {
      "textData": "Self-Attention",
      "date": "2026/09/15 15:36:00",
      "tags": ["とは"]
    },
    {
      "textData": "二重飛び",
      "date": "2026/09/15 15:36:00",
      "tags": ["方法"]
    },
    {
      "textData": "人類の誕生",
      "date": "2026/09/15 15:36:00",
      "tags": ["なぜ"]
    }
  ]
  return (
    <>
      <div id="header">
        <h1>とりあえずメモ</h1>
        <img
          width="50"
          height="50"
          src="https://img.icons8.com/ios/50/settings--v1.png"
          alt="settings--v1"
        />
      </div>
      <div id="memo-list">
        <MemoCard
          textData={"+新しいメモを追加……"}
          date={""}
          tags={[]}
          isNewMemo={true}
        ></MemoCard>
        {memoData.map((memo) => (
          <MemoCard
            textData={memo.textData}
            date={memo.date}
            tags={memo.tags}
          ></MemoCard>
        ))}
      </div>

      <button id="add-memo-button" type="button">
        メモ追加
      </button>
    </>
  );
}

export default App
