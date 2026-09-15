import './App.css'
import MemoCard from './components/MemoCard'

function App() {

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
          textData={"天文学的苦痛のリスク"}
          date={"2026/09/15 15:36:00"}
          tags={["とは"]}
        ></MemoCard>
        <MemoCard
          textData={"ナビエ=ストークス方程式"}
          date={"2026/09/15 15:36:00"}
          tags={["とは"]}
        ></MemoCard>
        <MemoCard
          textData={"帯分数"}
          date={"2026/09/15 15:36:00"}
          tags={["とは"]}
        ></MemoCard>
        <MemoCard
          textData={"Self-Attention"}
          date={"2026/09/15 15:36:00"}
          tags={["とは"]}
        ></MemoCard>
      </div>
    </>
  );
}

export default App
