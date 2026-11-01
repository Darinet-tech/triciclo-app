import React, { useState, useEffect } from 'react';
import { 
  Calculator, DollarSign, Wrench, Calendar, UserCheck, 
  TrendingUp, Shield, Plus, Trash2, RefreshCw, Send, CheckCircle2 
} from 'lucide-react';

// === CONFIGURACIÓN DE SUPABASE ===
// Reemplaza estos dos valores con los que obtuviste en Project Settings > API en tu Supabase
const SUPABASE_URL = "https://mqmfnlwfmsnnzykbedpx.supabase.co/rest/v1/"; 
const SUPABASE_ANON_KEY = "sb_publishable_1e1lSFJxCAskn3BWzSpQFA_iKZ0B7NU";

const DENOMINACIONES = [2000, 1000, 500, 200, 100, 50, 20, 10, 5];

export default function App() {
  const [rol, setRol] = useState('chofer'); // chofer, propietario1, propietario2, admin
  const [vista, setVista] = useState('recaudacion'); // recaudacion, gastos, resumen
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  // Estado Billetes
  const [billetes, setBilletes] = useState(
    DENOMINACIONES.reduce((acc, den) => ({ ...acc, [den]: 0 }), {})
  );
  const [porcentajeChofer, setPorcentajeChofer] = useState(50);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Estado Gastos
  const [gastos, setGastos] = useState([]);
  const [nuevoGasto, setNuevoGasto] = useState({ concepto: '', monto: '', categoria: 'Mantenimiento' });

  // Historial de Jornadas
  const [jornadas, setJornadas] = useState([]);

  // Cálculos automáticos
  const totalRecaudado = Object.entries(billetes).reduce(
    (sum, [den, cant]) => sum + (Number(den) * (Number(cant) || 0)), 0
  );
  const pagoChofer = (totalRecaudado * porcentajeChofer) / 100;
  const pagoPropietarios = totalRecaudado - pagoChofer;

  // Manejador de billetes
  const handleCantidadChange = (den, cant) => {
    const valor = Math.max(0, parseInt(cant) || 0);
    setBilletes(prev => ({ ...prev, [den]: valor }));
  };

  // Guardar Jornada en Supabase o Local
  const guardarJornada = async () => {
    if (totalRecaudado === 0) {
      alert("Por favor ingresa al menos un billete.");
      return;
    }

    setGuardando(true);
    const datosJornada = {
      fecha,
      total_recaudado: totalRecaudado,
      porcentaje_chofer: porcentajeChofer,
      pago_chofer: pagoChofer,
      pago_propietarios: pagoPropietarios,
      desglose_billetes: JSON.stringify(billetes),
      creado_en: new Date().toISOString()
    };

    try {
      if (SUPABASE_URL !== "TU_SUPABASE_URL_AQUI") {
        await fetch(`${SUPABASE_URL}/rest/v1/jornadas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(datosJornada)
        });
      }
      setJornadas(prev => [datosJornada, ...prev]);
      setMensajeExito('¡Jornada registrada con éxito!');
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (e) {
      console.error(e);
      alert("Guardado localmente. Error al conectar con Supabase.");
    } finally {
      setGuardando(false);
    }
  };

  // Registrar Gasto
  const agregarGasto = async (e) => {
    e.preventDefault();
    if (!nuevoGasto.concepto || !nuevoGasto.monto) return;

    const gastoObj = {
      fecha,
      concepto: nuevoGasto.concepto,
      monto: Number(nuevoGasto.monto),
      categoria: nuevoGasto.categoria,
      registrado_por: rol,
      creado_en: new Date().toISOString()
    };

    try {
      if (SUPABASE_URL !== "TU_SUPABASE_URL_AQUI") {
        await fetch(`${SUPABASE_URL}/rest/v1/gastos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(gastoObj)
        });
      }
      setGastos(prev => [gastoObj, ...prev]);
      setNuevoGasto({ concepto: '', monto: '', categoria: 'Mantenimiento' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12 font-sans">
      {/* BARRA SUPERIOR */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-[#f59e0b] gap-2">
            <Calculator className="w-6 h-6 text-amber-500" />
            <h1 className="font-bold text-lg tracking-wide text-white">Triciclo Control</h1>
          </div>

          {/* Selector de Rol */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
            <UserCheck className="w-4 h-4 text-amber-400 ml-1" />
            <select 
              value={rol} 
              onChange={(e) => setRol(e.target.value)}
              className="bg-transparent text-xs text-amber-400 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="chofer" className="bg-slate-900 text-slate-200">Chofer</option>
              <option value="propietario1" className="bg-slate-900 text-slate-200">Propietario 1</option>
              <option value="propietario2" className="bg-slate-900 text-slate-200">Propietario 2</option>
              <option value="admin" className="bg-slate-900 text-slate-200">Admin</option>
            </select>
          </div>
        </div>
      </header>

      {/* NAVEGACIÓN PRINCIPAL */}
      <nav className="max-w-md mx-auto p-4 grid grid-cols-3 gap-2">
        <button 
          onClick={() => setVista('recaudacion')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            vista === 'recaudacion' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Recaudación
        </button>
        <button 
          onClick={() => setVista('gastos')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            vista === 'gastos' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
          }`}
        >
          <Wrench className="w-4 h-4" /> Gastos
        </button>
        <button 
          onClick={() => setVista('resumen')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            vista === 'resumen' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Resumen
        </button>
      </nav>

      <main className="max-w-md mx-auto px-4">
        {/* MENSAJE DE ÉXITO */}
        {mensajeExito && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2 text-sm font-semibold animate-pulse">
            <CheckCircle2 className="w-5 h-5" /> {mensajeExito}
          </div>
        )}

        {/* VISTA 1: RECAUDACIÓN Y ARQUEO */}
        {vista === 'recaudacion' && (
          <div className="space-y-4">
            {/* Fecha */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> Fecha de Jornada:</span>
              <input 
                type="date" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none"
              />
            </div>

            {/* Arqueo de Billetes */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h2 className="text-sm font-bold text-amber-400 mb-3 uppercase tracking-wider">Conteo de Billetes</h2>
              <div className="grid grid-cols-1 gap-2">
                {DENOMINACIONES.map(den => (
                  <div key={den} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-850">
                    <span className="font-bold text-slate-300 text-sm w-16">${den}</span>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      value={billetes[den] || ''}
                      onChange={(e) => handleCantidadChange(den, e.target.value)}
                      className="w-24 bg-slate-800 border border-slate-700 text-center font-bold text-amber-400 rounded-md py-1 text-sm focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 w-20 text-right font-mono">
                      ${(den * (billetes[den] || 0)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* División de Ganancias */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">División de Recaudación</h2>
              
              <div className="flex gap-2">
                {[30, 40, 50, 60].map(porc => (
                  <button
                    key={porc}
                    onClick={() => setPorcentajeChofer(porc)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      porcentajeChofer === porc 
                        ? 'bg-amber-500 border-amber-400 text-slate-950' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {porc}% Chofer
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Pago Chofer ({porcentajeChofer}%):</span>
                  <span className="text-lg font-black text-emerald-400">${pagoChofer.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Propietarios ({100 - porcentajeChofer}%):</span>
                  <span className="text-lg font-black text-amber-400">${pagoPropietarios.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 flex justify-between items-center">
                <span className="font-bold text-slate-300">Total Recaudado:</span>
                <span className="text-2xl font-black text-amber-400 font-mono">${totalRecaudado.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={guardarJornada}
              disabled={guardando}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Registrar Jornada'}
            </button>
          </div>
        )}

        {/* VISTA 2: GASTOS */}
        {vista === 'gastos' && (
          <div className="space-y-4">
            {(rol.includes('propietario') || rol === 'admin') ? (
              <form onSubmit={agregarGasto} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Registrar Gasto del Triciclo</h2>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Concepto / Reparación:</label>
                  <input 
                    type="text"
                    placeholder="Ej. Cambio de caucho, aceite..."
                    value={nuevoGasto.concepto}
                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Monto ($):</label>
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={nuevoGasto.monto}
                      onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Categoría:</label>
                    <select
                      value={nuevoGasto.categoria}
                      onChange={(e) => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm focus:outline-none"
                    >
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Reparación">Reparación</option>
                      <option value="Combustible">Combustible</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-sm flex justify-center items-center gap-1">
                  <Plus className="w-4 h-4" /> Agregar Gasto
                </button>
              </form>
            ) : (
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                🔒 Solo los Propietarios o el Admin pueden registrar nuevos gastos.
              </div>
            )}

            {/* Lista de Gastos */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h2 className="text-sm font-bold text-amber-400 mb-3 uppercase tracking-wider">Historial de Gastos</h2>
              {gastos.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No hay gastos registrados.</p>
              ) : (
                <div className="space-y-2">
                  {gastos.map((g, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-slate-200">{g.concepto}</p>
                        <p className="text-xs text-slate-500">{g.fecha} • {g.categoria}</p>
                      </div>
                      <span className="font-black text-rose-400 text-sm">-${Number(g.monto).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA 3: RESUMEN */}
        {vista === 'resumen' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h2 className="text-sm font-bold text-amber-400 mb-3 uppercase tracking-wider">Resumen Consolidado</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-slate-950 rounded">
                  <span className="text-slate-400">Total Recaudaciones:</span>
                  <span className="font-bold text-white">${jornadas.reduce((a, b) => a + Number(b.total_recaudado), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded">
                  <span className="text-slate-400">Total Pagado a Chofer:</span>
                  <span className="font-bold text-emerald-400">${jornadas.reduce((a, b) => a + Number(b.pago_chofer), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded">
                  <span className="text-slate-400">Total Gastos Operativos:</span>
                  <span className="font-bold text-rose-400">${gastos.reduce((a, b) => a + Number(b.monto), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm mt-3">
                  <span className="font-bold text-amber-400">Ganancia Neta Propietarios:</span>
                  <span className="font-black text-amber-400">
                    ${(jornadas.reduce((a, b) => a + Number(b.pago_propietarios), 0) - gastos.reduce((a, b) => a + Number(b.monto), 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
