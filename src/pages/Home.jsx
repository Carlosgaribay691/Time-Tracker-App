import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style= {{color: 'white'}}>
      <h2>Bienvenido a la app de control de horas</h2>
      <p>Ya estás autenticado.</p>
      <Link to="/timelog" style={{ color: 'orange' }}>
  Ir a registro de horas
</Link>

    </div>
    
  );
}
