import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div id="header">
        <h1>とりあえずメモ</h1>
        <img width="50" height="50" src="https://img.icons8.com/ios/50/settings--v1.png" alt="settings--v1" />
      </div>
    </>
  )
}

export default App
