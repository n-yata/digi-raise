import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initSound } from './utils/sound'

// ブラウザの autoplay 制限対策: 初回ユーザージェスチャで AudioContext を解放する
initSound()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
