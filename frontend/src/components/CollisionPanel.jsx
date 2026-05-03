import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, Radio, AlertTriangle, Wifi, Activity,
  Car, Ambulance, TrafficCone, ArrowRightLeft, Zap
} from 'lucide-react';

// ── helpers ────────────────────────────────────────────────────────────────
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const TYPE_ICON = {
  'V2V-PLATOON': { icon: ArrowRightLeft, color: '#3b82f6', label: 'V2V Platoon' },
  'V2V-WARN':    { icon: ShieldCheck,   color: '#ef4444', label: 'V2V Warning' },
  'V2I-LIGHT':   { icon: Activity,      color: '#f59e0b', label: 'V2I Traffic' },
  'V2I-HAZARD':  { icon: Zap,           color: '#f97316', label: 'V2I Hazard'  },
  'V2X-EMERG':   { icon: Ambulance,     color: '#a78bfa', label: 'V2X Emergency'},
  'INFO':        { icon: Wifi,          color: '#10b981', label: 'Network'     },
};

let _msgId = 0;
function makeMsg(type, text, vehicleId = null) {
  return { id: _msgId++, type, text, vehicleId, ts: Date.now() };
}

// ── component ──────────────────────────────────────────────────────────────
export default function CollisionPanel({ vehicles = [], trafficLights = [], hazards = [] }) {
  const [log, setLog]             = useState([]);
  const [avoided, setAvoided]     = useState(0);
  const [v2vCount, setV2vCount]   = useState(0);
  const [v2iCount, setV2iCount]   = useState(0);
  const prevStateRef              = useRef({});
  const logRef                    = useRef(null);

  // ── derive events every time state changes ───────────────────────────────
  useEffect(() => {
    const newMsgs = [];
    const prev    = prevStateRef.current;

    vehicles.forEach((v) => {
      const pv = prev[v.id] || {};

      // ── V2X Emergency broadcast ─────────────────────────────────────────
      if (v.type === 'emergency' && pv.type !== 'emergency') {
        newMsgs.push(makeMsg('V2X-EMERG',
          `🚨 Emergency vehicle ${v.id.slice(-4)} broadcasting priority corridor`, v.id));
      }

      // ── Collision warning ───────────────────────────────────────────────
      if (v.status === 'collision_warning' && pv.status !== 'collision_warning') {
        newMsgs.push(makeMsg('V2V-WARN',
          `⚠ Collision risk detected — ${v.id.slice(-4)} broadcasting BSM alert`, v.id));
      }

      // ── Hazard slow ──────────────────────────────────────────────────────
      if (v.status === 'slowing_hazard' && pv.status !== 'slowing_hazard') {
        newMsgs.push(makeMsg('V2I-HAZARD',
          `🛑 ${v.id.slice(-4)} received RSU hazard warning — decelerating`, v.id));
      }

      // ── Traffic-light stop ───────────────────────────────────────────────
      if (v.status === 'stopped' && pv.status !== 'stopped') {
        // find nearest red light
        const nearLight = trafficLights.find(tl => dist(v, tl) < 80);
        const tln = nearLight ? nearLight.id : 'TL';
        newMsgs.push(makeMsg('V2I-LIGHT',
          `🚦 ${v.id.slice(-4)} obeyed SPAT from ${tln} — stopped at red`, v.id));
      }

      // ── Platooning (same direction, close following) ─────────────────────
      vehicles.forEach((other) => {
        if (other.id === v.id) return;
        const d = dist(v, other);
        if (
          v.direction === other.direction &&
          d > 20 && d < 60 &&
          v.type !== 'emergency' &&
          pv.platoonTarget !== other.id  // only fire once per pair change
        ) {
          newMsgs.push(makeMsg('V2V-PLATOON',
            `🔗 ${v.id.slice(-4)} joined platoon behind ${other.id.slice(-4)} — speed sync`, v.id));
          pv.platoonTarget = other.id; // memoize
        }
      });

      prevStateRef.current[v.id] = { ...pv, status: v.status, type: v.type };
    });

    if (newMsgs.length === 0) return;

    setLog(prev => {
      const next = [...newMsgs.reverse(), ...prev].slice(0, 40);
      return next;
    });

    // ── update counters ──────────────────────────────────────────────────
    const warns  = newMsgs.filter(m => m.type === 'V2V-WARN').length;
    const v2v    = newMsgs.filter(m => m.type.startsWith('V2V')).length;
    const v2i    = newMsgs.filter(m => m.type.startsWith('V2I')).length;

    if (warns)  setAvoided(p => p + warns);
    if (v2v)    setV2vCount(p => p + v2v);
    if (v2i)    setV2iCount(p => p + v2i);
  }, [vehicles, trafficLights, hazards]);

  // auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [log]);

  // ── vehicle status breakdown ─────────────────────────────────────────────
  const moving   = vehicles.filter(v => v.status === 'moving').length;
  const stopped  = vehicles.filter(v => v.status === 'stopped').length;
  const warning  = vehicles.filter(v => v.status === 'collision_warning').length;
  const slowing  = vehicles.filter(v => v.status === 'slowing_hazard').length;
  const emerg    = vehicles.filter(v => v.type === 'emergency').length;

  return (
    <div className="collision-panel panel">
      {/* ── Header ── */}
      <div className="cp-header">
        <div className="cp-title-row">
          <ShieldCheck size={16} color="#10b981" />
          <span className="cp-title">Collision Avoidance & V2X Comms</span>
          <span className="cp-live-dot" />
          <span className="cp-live-label">LIVE</span>
        </div>
      </div>

      {/* ── Avoidance stats strip ── */}
      <div className="cp-stats">
        <div className="cp-stat avoided">
          <div className="cp-stat-val">{avoided}</div>
          <div className="cp-stat-lbl">Collisions<br/>Avoided</div>
        </div>
        <div className="cp-stat v2v">
          <div className="cp-stat-val">{v2vCount}</div>
          <div className="cp-stat-lbl">V2V<br/>Messages</div>
        </div>
        <div className="cp-stat v2i">
          <div className="cp-stat-val">{v2iCount}</div>
          <div className="cp-stat-lbl">V2I<br/>Messages</div>
        </div>
        <div className="cp-stat warn">
          <div className="cp-stat-val">{warning}</div>
          <div className="cp-stat-lbl">In Warning<br/>Zone</div>
        </div>
      </div>

      {/* ── Fleet status pills ── */}
      <div className="cp-fleet">
        <Pill color="#10b981" label="Moving"   val={moving}  />
        <Pill color="#ef4444" label="Warning"  val={warning} />
        <Pill color="#f59e0b" label="Stopped"  val={stopped} />
        <Pill color="#f97316" label="Hazard"   val={slowing} />
        <Pill color="#a78bfa" label="Emerg"    val={emerg}   />
      </div>

      {/* ── How Collision is Avoided legend ── */}
      <div className="cp-legend">
        <span className="cp-legend-title">How collisions are avoided</span>
        <div className="cp-legend-items">
          <LegendItem color="#3b82f6"  text="V2V Platooning — speed sync with leader" />
          <LegendItem color="#ef4444"  text="V2V BSM Alert — braking on proximity" />
          <LegendItem color="#f59e0b"  text="V2I SPAT — traffic-light obedience" />
          <LegendItem color="#f97316"  text="V2I RSU Hazard — full deceleration" />
          <LegendItem color="#a78bfa"  text="V2X Priority — emergency corridor clear" />
        </div>
      </div>

      {/* ── Communication Log ── */}
      <div className="cp-log-header">
        <Radio size={12} color="#3b82f6" />
        <span>V2X Communication Log</span>
      </div>
      <div className="cp-log" ref={logRef}>
        {log.length === 0 && (
          <div className="cp-log-empty">
            <Wifi size={20} color="#334155" />
            <span>Waiting for V2X events…</span>
          </div>
        )}
        {log.map(msg => <LogEntry key={msg.id} msg={msg} />)}
      </div>
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────
function Pill({ color, label, val }) {
  return (
    <div className="cp-pill" style={{ '--pill-color': color }}>
      <span className="cp-pill-dot" />
      <span className="cp-pill-val">{val}</span>
      <span className="cp-pill-lbl">{label}</span>
    </div>
  );
}

function LegendItem({ color, text }) {
  return (
    <div className="cp-legend-item">
      <span className="cp-legend-dot" style={{ background: color }} />
      <span>{text}</span>
    </div>
  );
}

function LogEntry({ msg }) {
  const meta = TYPE_ICON[msg.type] || TYPE_ICON['INFO'];
  const Icon = meta.icon;
  const age  = Math.round((Date.now() - msg.ts) / 1000);

  return (
    <div className="cp-log-entry" style={{ '--entry-color': meta.color }}>
      <span className="cp-entry-icon"><Icon size={12} /></span>
      <div className="cp-entry-body">
        <span className="cp-entry-tag">{meta.label}</span>
        <span className="cp-entry-text">{msg.text}</span>
      </div>
      <span className="cp-entry-age">{age}s ago</span>
    </div>
  );
}
