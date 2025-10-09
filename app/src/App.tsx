import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ActionOne } from './features/action1/ActionOne'
import { ActionTwo } from './features/action2/ActionTwo'
import { ActionThree } from './features/action3/ActionThree'
import { History } from './features/history/History'
import { ActionFour } from './features/action4/ActionFour'
import { Chat } from './features/chat/Chat'
import { ChatWithContext } from './features/chat/ChatWithContext'
import { SWPrompt } from './components/SWPrompt'

function App() {
  return (
    <BrowserRouter>
      <SWPrompt />
      <Layout>
        <Routes>
          <Route path="/" element={<ActionOne />} />
          <Route path="/action-1" element={<ActionOne />} />
          <Route path="/action-2" element={<ActionTwo />} />
          <Route path="/action-3" element={<ActionThree />} />
          <Route path="/history" element={<History />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/context" element={<ChatWithContext />} />
          <Route path="/action-4" element={<ActionFour />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">페이지를 찾을 수 없어요</h1>
      <p className="mt-2">
        <Link className="text-blue-600 underline" to="/">홈으로 돌아가기</Link>
      </p>
    </div>
  )
}

export default App
