import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import Home from './pages/Home'
import DataTable from './pages/DataTable'
import CheckStatus from './pages/CheckStatus'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="data-table" element={<DataTable />} />
        <Route path="check-status" element={<CheckStatus />} />
      </Route>
    </Routes>
  )
}
