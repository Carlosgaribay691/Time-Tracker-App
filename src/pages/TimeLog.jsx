import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import "./Timelog.css";
import {
  collection, addDoc, query, where, orderBy, getDocs, serverTimestamp,
  deleteDoc, doc, updateDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, isWithinInterval
} from "date-fns";
import { FaSignInAlt, FaUtensils, FaClock, FaSignOutAlt, FaCalendarAlt, FaEdit } from "react-icons/fa";

export default function TimeLog() {
  const [user, setUser] = useState(null);
  const [manualInputs, setManualInputs] = useState({ date: "", entrada: "", salidaLunch: "", regresoLunch: "", salidaFinal: "" });
  const [totalHorasManual, setTotalHorasManual] = useState([]);
  const [filtro, setFiltro] = useState("todo");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [editingId, setEditingId] = useState(null); // registro que se está editando

  const handleInputChange = (e) => setManualInputs({ ...manualInputs, [e.target.name]: e.target.value });

  const calcularTotalHoras = () => {
    const { entrada, salidaLunch, regresoLunch, salidaFinal } = manualInputs;
    const parse = (h) => h ? h.split(":").map(Number).reduce((acc,v,i)=> acc + (i===0? v*60 : v),0) : 0;
    const totalMin = (parse(salidaFinal)-parse(entrada))-(parse(regresoLunch)-parse(salidaLunch));
    return Math.max(totalMin/60,0).toFixed(2);
  };

  const guardarManual = async () => {
    if (!user) return;
    if (!manualInputs.date) return alert("Selecciona la fecha");
    const totalHoras = calcularTotalHoras();
    try {
      await addDoc(collection(db, "manualTimeLogs"), {
        userId: user.uid,
        userEmail: user.email,
        ...manualInputs,
        totalHoras,
        createdAt: serverTimestamp(),
      });
      alert("Registro guardado ✅");
      fetchManualLogs(user);
      setManualInputs({ date:"", entrada:"", salidaLunch:"", regresoLunch:"", salidaFinal:"" });
    } catch(error){ alert("Error: "+error.message); }
  };

  const actualizarRegistro = async () => {
    if (!editingId) return;
    try {
      const ref = doc(db, "manualTimeLogs", editingId);
      const totalHoras = calcularTotalHoras();
      await updateDoc(ref, {
        ...manualInputs,
        totalHoras,
      });
      alert("Registro actualizado ✅");
      setManualInputs({ date:"", entrada:"", salidaLunch:"", regresoLunch:"", salidaFinal:"" });
      setEditingId(null);
      fetchManualLogs(user);
    } catch(error){ alert("Error al actualizar: "+error.message); }
  };

  const fetchManualLogs = async (firebaseUser) => {
    const q = query(collection(db,"manualTimeLogs"), where("userId","==",firebaseUser.uid), orderBy("date","desc"));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(d=>({ id:d.id, ...d.data() }));
    setTotalHorasManual(docs);
  };

  const eliminarLog = async (id) => {
    if (!window.confirm("¿Eliminar este registro?")) return;
    await deleteDoc(doc(db,"manualTimeLogs",id));
    fetchManualLogs(user);
  };

  const eliminarTodosLosLogs = async () => {
    if (!user || !window.confirm("¿Eliminar todos los registros?")) return;
    const q = query(collection(db,"manualTimeLogs"), where("userId","==",user.uid));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(d=>deleteDoc(doc(db,"manualTimeLogs",d.id))));
    fetchManualLogs(user);
  };

  useEffect(()=>{
    const unsubscribe = onAuthStateChanged(auth, u=>{
      if(u){ setUser(u); fetchManualLogs(u); }
    });
    return ()=>unsubscribe();
  },[]);

  const filtrarLogs = () => {
    if(!totalHorasManual) return [];
    const hoy = new Date();
    let intervalo = null;
    if(filtro==="hoy") intervalo={ start:startOfDay(hoy), end:endOfDay(hoy) };
    else if(filtro==="semana") intervalo={ start:startOfWeek(hoy), end:endOfWeek(hoy) };
    else if(filtro==="mes") intervalo={ start:startOfMonth(hoy), end:endOfMonth(hoy) };
    else if(filtro==="personalizado" && fechaInicio && fechaFin) intervalo={ start:startOfDay(parseISO(fechaInicio)), end:endOfDay(parseISO(fechaFin)) };
    return totalHorasManual.filter(log=>{
      if(!intervalo) return true;
      if(!log.date) return false;
      const logDate = parseISO(log.date);
      return isWithinInterval(logDate, intervalo);
    });
  };

  const logsFiltrados = filtrarLogs();
  const totalHorasTrabajadas = logsFiltrados.reduce((t,l)=>t+(parseFloat(l.totalHoras)||0),0).toFixed(2);

  const iconos = [<FaCalendarAlt/>, <FaSignInAlt/>, <FaUtensils/>, <FaUtensils/>, <FaSignOutAlt/>];

  return (
    <div style={{
      minHeight:"100vh",
      backgroundImage:"url('/Pinkfloyd.png')",
      backgroundSize:"cover",
      backgroundRepeat:"no-repeat",
      backgroundAttachment:"fixed",
      backgroundPosition:"center",
      padding:"20px",
      color:"#fff"
    }}>
      <h2 style={{ textAlign:"center", marginBottom:"20px" }}>Registro manual de horas</h2>

      {/* Filtros */}
      <div style={{ marginBottom:"20px", textAlign:"center" }}>
        <select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{ padding:"8px", borderRadius:"5px" }}>
          <option value="todo">Todo</option>
          <option value="hoy">Hoy</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mes</option>
          <option value="personalizado">Personalizado</option>
        </select>

        {filtro==="personalizado" && (
          <div style={{ marginTop:"10px" }}>
            <label>Desde: </label>
            <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} />
            <label style={{ marginLeft:"10px" }}>Hasta: </label>
            <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} />
          </div>
        )}
      </div>

      {/* Formulario con iconos */}
      <div style={{ display:"flex", flexDirection:"column", gap:"12px", maxWidth:"400px", margin:"0 auto" }}>
        {["date","entrada","salidaLunch","regresoLunch","salidaFinal"].map((field,index)=>{
          const labels = ["Fecha","Entrada","Salida a Lunch","Regreso Lunch","Salida Final"];
          const type = field==="date"?"date":"time";
          return (
            <div key={field} style={{ display:"flex", alignItems:"center", background:"#111827", borderRadius:"10px", padding:"10px", gap:"10px" }}>
              <span style={{ fontSize:"1.3rem", color:"#3b82f6" }}>{iconos[index]}</span>
              <div style={{ flex:"1", display:"flex", flexDirection:"column" }}>
                <label style={{ fontWeight:"bold", marginBottom:"4px", color:"#f9fafb" }}>{labels[index]}</label>
                <input
                  type={type}
                  name={field}
                  value={manualInputs[field]}
                  onChange={handleInputChange}
                  style={{ padding:"8px", borderRadius:"5px", border:"1px solid #aaa", width:"100%" }}
                />
              </div>
            </div>
          )
        })}
        <button
          onClick={editingId ? actualizarRegistro : guardarManual}
          style={{ padding:"12px", borderRadius:"8px", border:"none", backgroundColor:"#3b82f6", color:"#fff", fontWeight:"bold", cursor:"pointer" }}
        >
          {editingId ? "Actualizar Registro" : "Guardar Registro"}
        </button>
      </div>

      {/* Historial */}
      <h3 style={{ marginTop:"30px", textAlign:"center" }}>Historial de horas ingresadas</h3>
      <button onClick={eliminarTodosLosLogs} style={{ margin:"10px 0", background:"#ef4444", color:"#fff", padding:"10px", borderRadius:"8px", border:"none", cursor:"pointer" }}>
        Borrar todos los registros
      </button>

      <div style={{ marginTop:"20px", display:"flex", flexDirection:"column", gap:"10px" }}>
        {logsFiltrados.map((log,index)=>{
          const bgColors=["rgba(0,0,0,0.6)","rgba(30,30,30,0.6)"];
          return (
            <div key={log.id} style={{ display:"flex", flexDirection:"column", background:bgColors[index%2], padding:"12px", borderRadius:"10px", color:"#f9fafb" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px", flexWrap:"wrap" }}>
                <span><FaCalendarAlt/> {log.date}</span>
                <span><strong>Total:</strong> {log.totalHoras} hrs</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" }}>
                <span><FaSignInAlt/> {log.entrada}</span>
                <span><FaUtensils/> {log.salidaLunch}</span>
                <span><FaUtensils/> {log.regresoLunch}</span>
                <span><FaSignOutAlt/> {log.salidaFinal}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:"6px", marginTop:"8px" }}>
                <span
                  onClick={()=>{
                    setManualInputs({
                      date: log.date,
                      entrada: log.entrada,
                      salidaLunch: log.salidaLunch,
                      regresoLunch: log.regresoLunch,
                      salidaFinal: log.salidaFinal
                    });
                    setEditingId(log.id);
                  }}
                  style={{ cursor:"pointer", color:"#3b82f6", fontSize:"1.2rem" }}
                >
                  <FaEdit />
                </span>
                <button
                  onClick={()=>eliminarLog(log.id)}
                  style={{ padding:"6px 12px", borderRadius:"5px", border:"none", background:"#ef4444", color:"#fff", cursor:"pointer" }}
                >
                  Borrar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <h3 style={{ marginTop:"20px", padding:"10px", backgroundColor:"#3b82f6", color:"#fff", borderRadius:"8px", textAlign:"center" }}>
        Total horas trabajadas: {totalHorasTrabajadas} hrs
      </h3>
    </div>
  )
}
