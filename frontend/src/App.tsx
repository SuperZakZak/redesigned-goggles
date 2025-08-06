import { Routes, Route, Navigate } from 'react-router-dom';
import { RegistrationFlow } from './components/RegistrationFlow';
import ModernAdminPanel from './components/admin/ModernAdminPanel';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/register" element={<RegistrationFlow />} />
        <Route path="/admin" element={<ModernAdminPanel />} />
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </div>
  )
}

export default App
