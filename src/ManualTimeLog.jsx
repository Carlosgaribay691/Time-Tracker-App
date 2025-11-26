import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export default function ManualTimeLog() {
  const user = auth.currentUser;
  const [date, setDate] = useState("");
  const [entrada, setEntrada] = useState("");
  const [salidaLunch, setSalidaLunch] = useState("");
  const [regresoLunch, setRegresoLunch] = useState("");
  const [salidaFinal, setSalidaFinal] = useState("");
  const [logs, setLogs] = useState([]);
  const [totalHoras, setTotalHoras] = useState([]);

  const guardarRegistro = async () => {
    if (!user) return alert("No estás logueado");
    if (!date) return alert("Selecciona la fecha");

    try {
      await addDoc(collection(db, "manualTimeLogs"), {
        userId: user.uid,
        userEmail: user.email,
        date,
        entrada,
        salidaLunch,
        regresoLunch,
        salidaFinal,
        createdAt: serverTimestamp(),
      });
      alert("Registro guardado");
      cargarLogs();
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  const cargarLogs = async () => {
    if (!user) return;
    const q = query(
      collection(db, "manualTimeLogs"),
      where("userId", "==", user.uid)
    );
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setLogs(docs);
    calcularTotal(docs);
  };

  const calcularTotal = (registros) => {
    const resultados = registros.map((log) => {
      const toMinutes = (time) => {
        if (!time) return 0;
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      };

      const entradaMin = toMinutes(log.entrada);
      const salidaLunchMin = toMinutes(log.salidaLunch);
      const regresoLunchMin = toMinutes(log.regresoLunch);
      const salidaFinalMin = toMinutes(log.salidaFinal);

      const totalMin =
        (salidaFinalMin - entradaMin) - (regresoLunchMin - salidaLunchMin);

      return {
        ...log,
        totalHoras: totalMin > 0 ? (totalMin / 60).toFixed(2) : "0.00",
      };
    });
    setTotalHoras(resultados);
  };

  useEffect(() => {
    cargarLogs();
  }, [user]);

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
        Registro Manual de Horas
      </h2>

      {/* Fecha */}
      <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
        <label style={{ fontWeight: "bold", marginBottom: "4px" }}>Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: "6px", borderRadius: "5px", border: "1px solid #aaa" }}
        />
      </div>

      {/* Inputs de horas con labels arriba */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "bold", marginBottom: "4px" }}>Entrada</label>
          <input
            type="time"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            style={{ padding: "6px", borderRadius: "5px", border: "1px solid #aaa" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "bold", marginBottom: "4px" }}>Salida a Lunch</label>
          <input
            type="time"
            value={salidaLunch}
            onChange={(e) => setSalidaLunch(e.target.value)}
            style={{ padding: "6px", borderRadius: "5px", border: "1px solid #aaa" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "bold", marginBottom: "4px" }}>Regreso Lunch</label>
          <input
            type="time"
            value={regresoLunch}
            onChange={(e) => setRegresoLunch(e.target.value)}
            style={{ padding: "6px", borderRadius: "5px", border: "1px solid #aaa" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "bold", marginBottom: "4px" }}>Salida Final</label>
          <input
            type="time"
            value={salidaFinal}
            onChange={(e) => setSalidaFinal(e.target.value)}
            style={{ padding: "6px", borderRadius: "5px", border: "1px solid #aaa" }}
          />
        </div>
      </div>

      {/* Botón */}
      <button
        onClick={guardarRegistro}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "20px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Guardar Registro
      </button>

      {/* Historial */}
      <h3 style={{ marginTop: "25px" }}>Historial</h3>
      <ul>
        {totalHoras.map((log) => (
          <li key={log.id}>
            {log.date} - Horas trabajadas: {log.totalHoras} hrs
          </li>
        ))}
      </ul>
    </div>
  );
}
