import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import TimeLog from './pages/TimeLog';

function App() {
  return (
    <div
      style={{
        height: '100vh',               // altura pantalla completa
       width: '100vw',                // ancho pantalla completa
       backgroundImage: "url('/Pinkfloyd.png')",
       backgroundSize: 'cover',
       backgroundPosition: 'center',
       backgroundRepeat: 'no-repeat'
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/timelog" element={<TimeLog />} />
      </Routes>
    </div>
  );
}

export default App;
