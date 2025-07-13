import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import "./Timelog.css";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import {
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";

export default function TimeLog() {
  const [user, setUser] = useState(null);
  const [manualInputs, setManualInputs] = useState({
    date: "",
    entrada: "",
    salidaLunch: "",
    regresoLunch: "",
    salidaFinal: "",
  });
  const [totalHorasManual, setTotalHorasManual] = useState([]);
  const [filtro, setFiltro] = useState("todo");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const handleInputChange = (e) => {
    setManualInputs({ ...manualInputs, [e.target.name]: e.target.value });
  };

  const calcularTotalHoras = () => {
    const { entrada, salidaLunch, regresoLunch, salidaFinal } = manualInputs;
    const parse = (h) => {
      const [hh, mm] = h.split(":").map(Number);
      return hh * 60 + mm;
    };

    const entradaMin = parse(entrada);
    const salidaLunchMin = parse(salidaLunch);
    const regresoLunchMin = parse(regresoLunch);
    const salidaFinalMin = parse(salidaFinal);

    const antesDeLunch = salidaLunchMin - entradaMin;
    const despuesDeLunch = salidaFinalMin - regresoLunchMin;
    const totalMin = antesDeLunch + despuesDeLunch;

    return Math.max(totalMin / 60, 0).toFixed(2);
  };

  const guardarManual = async () => {
    if (!user) return;

    const totalHoras = calcularTotalHoras();

    try {
      await addDoc(collection(db, "manualTimeLogs"), {
        userId: user.uid,
        userEmail: user.email,
        ...manualInputs,
        totalHoras,
        createdAt: serverTimestamp(),
      });

      alert("Registro manual guardado ✅");
      fetchManualLogs(user);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  const fetchManualLogs = async (firebaseUser) => {
    const q = query(
      collection(db, "manualTimeLogs"),
      where("userId", "==", firebaseUser.uid),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTotalHorasManual(docs);
  };

  const eliminarLog = async (id) => {
    const confirmar = window.confirm("¿Eliminar este registro?");
    if (!confirmar) return;
    try {
      await deleteDoc(doc(db, "manualTimeLogs", id));
      fetchManualLogs(user);
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  const eliminarTodosLosLogs = async () => {
    if (!user) return;
    const confirmar = window.confirm("¿Estás seguro de que quieres borrar TODOS los registros?");
    if (!confirmar) return;

    try {
      const q = query(
        collection(db, "manualTimeLogs"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const batchDeletes = querySnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "manualTimeLogs", docSnap.id))
      );
      await Promise.all(batchDeletes);
      alert("Todos los registros fueron eliminados ❌");
      fetchManualLogs(user);
    } catch (error) {
      alert("Error al eliminar todos: " + error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        fetchManualLogs(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const filtrarLogs = () => {
    if (!totalHorasManual) return [];

    const hoy = new Date();
    let intervalo = null;

    if (filtro === "hoy") {
      intervalo = { start: startOfDay(hoy), end: endOfDay(hoy) };
    } else if (filtro === "semana") {
      intervalo = { start: startOfWeek(hoy), end: endOfWeek(hoy) };
    } else if (filtro === "mes") {
      intervalo = { start: startOfMonth(hoy), end: endOfMonth(hoy) };
    } else if (filtro === "personalizado" && fechaInicio && fechaFin) {
      intervalo = {
        start: startOfDay(parseISO(fechaInicio)),
        end: endOfDay(parseISO(fechaFin)),
      };
    }

    return totalHorasManual.filter((log) => {
      if (!intervalo) return true;
      if (!log.date) return false;
      const logDate = parseISO(log.date);
      return isWithinInterval(logDate, intervalo);
    });
  };

  const logsFiltrados = filtrarLogs();

  const totalHorasTrabajadas = logsFiltrados
    .reduce((total, log) => total + (parseFloat(log.totalHoras) || 0), 0)
    .toFixed(2);

  return (
    <div className="container">
      <h2>Registro manual de horas</h2>

      {/* Filtros */}
      <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
        <option value="todo">Todo</option>
        <option value="hoy">Hoy</option>
        <option value="semana">Esta semana</option>
        <option value="mes">Este mes</option>
        <option value="personalizado">Personalizado</option>
      </select>

      {filtro === "personalizado" && (
        <div style={{ marginTop: "0.5rem" }}>
          <label>Desde: </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <label style={{ marginLeft: "1rem" }}>Hasta: </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
      )}

      {/* Formulario */}
      <div style={{ marginTop: "1rem" }}>
        <input type="date" name="date" value={manualInputs.date} onChange={handleInputChange} />
        <input type="time" name="entrada" value={manualInputs.entrada} onChange={handleInputChange} />
        <input type="time" name="salidaLunch" value={manualInputs.salidaLunch} onChange={handleInputChange} />
        <input type="time" name="regresoLunch" value={manualInputs.regresoLunch} onChange={handleInputChange} />
        <input type="time" name="salidaFinal" value={manualInputs.salidaFinal} onChange={handleInputChange} />
        <button onClick={guardarManual}>Guardar</button>
      </div>

      {/* Historial */}
      <h3>Historial de horas ingresadas</h3>
      <button onClick={eliminarTodosLosLogs} style={{ margin: "1rem 0", background: "#f44336", color: "#fff" }}>
        Borrar todos los registros
      </button>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Entrada</th>
            <th>Salida Lunch</th>
            <th>Regreso Lunch</th>
            <th>Salida Final</th>
            <th>Total Horas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {logsFiltrados.map((log) => (
            <tr key={log.id}>
              <td>{log.date}</td>
              <td>{log.entrada}</td>
              <td>{log.salidaLunch}</td>
              <td>{log.regresoLunch}</td>
              <td>{log.salidaFinal}</td>
              <td>{log.totalHoras}</td>
              <td>
                <button onClick={() => eliminarLog(log.id)}>Borrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total de horas */}
      <h3 style={{ marginTop: "1rem", color: "#333" }}>
        Total de horas trabajadas: {totalHorasTrabajadas} horas
      </h3>
    </div>
  );
}
