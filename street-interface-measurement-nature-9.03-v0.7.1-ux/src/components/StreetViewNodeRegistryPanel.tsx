import React, { useMemo, useState } from 'react';

import {
  Compass,
  FileUp,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react';

import {
  autoMatchStreetViewNode,
  deriveTeacherOrthogonalCandidate,
  parseStreetViewNodesCsv,
  type StreetViewNodeRecord,
  type StreetViewNodesRepoAudit,
} from '../research/streetViewNodesRegistry';

interface Props {
  activeFilename: string;
  activeImageId: string;
  audit: StreetViewNodesRepoAudit | null;
}

function heading(v: number): string {
  return `${(((v % 360) + 360) % 360).toFixed(1)}°`;
}

export const StreetViewNodeRegistryPanel: React.FC<Props> = ({
  activeFilename,
  activeImageId,
  audit,
}) => {
  const [rows, setRows] = useState<StreetViewNodeRecord[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('');

  const autoMatch = useMemo(
    () => autoMatchStreetViewNode(rows, activeFilename, activeImageId),
    [rows, activeFilename, activeImageId]
  );

  const selected = useMemo(() => {
    if (selectedId) return rows.find((r) => r.nodeId === selectedId) || null;
    return autoMatch;
  }, [rows, selectedId, autoMatch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = q
      ? rows.filter((r) =>
          r.nodeId.toLowerCase().includes(q) ||
          r.streetName.toLowerCase().includes(q)
        )
      : rows;
    return source.slice(0, 80);
  }, [rows, query]);

  const orthogonal = selected
    ? deriveTeacherOrthogonalCandidate(selected.headingFwdDeg)
    : [];

  const onFile: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseStreetViewNodesCsv(text);
      setRows(parsed.rows);
      setWarnings(parsed.warnings);
      setError(null);
      setSourceName(file.name);
      setSelectedId('');
      setQuery('');
    } catch (e: any) {
      setRows([]);
      setWarnings([]);
      setSelectedId('');
      setSourceName(file.name);
      setError(e?.message || 'Street-view node CSV could not be parsed.');
    }
  };

  return (
    <section className="rounded-lg border border-cyan-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-cyan-100 bg-cyan-50/60 flex items-start gap-2.5">
        <Compass className="w-4 h-4 text-cyan-700 mt-0.5" />
        <div>
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-900">
            Street-View Sampling Node Geometry
          </div>
          <div className="text-[10px] text-stone-600 mt-0.5">
            Optional upstream acquisition provenance from ex032895-crypto/street-view-nodes. No paper variable is overwritten.
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <label className="rounded border border-dashed border-cyan-300 bg-cyan-50/40 px-3 py-3 cursor-pointer hover:bg-cyan-50 transition-colors">
            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-cyan-900">
              <FileUp className="w-3.5 h-3.5" />
              LOAD &lt;area&gt;_nodes.csv
            </div>
            <div className="text-[8px] text-stone-600 mt-1">
              Required contract: node_id, street_name, lat/lng, forward/reverse heading, sequence, tunnel/bridge flags.
            </div>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>

          <div className="text-[8px] font-mono text-stone-500 md:text-right">
            {audit ? `${audit.source_commit.slice(0, 10)} · ${audit.sampling_defaults.spacing_m} m default spacing` : 'repository audit loading…'}
          </div>
        </div>

        {error && (
          <div className="rounded border border-rose-200 bg-rose-50 p-2.5 text-[8px] text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div className="rounded border border-emerald-200 bg-emerald-50 p-2.5 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-[8px] text-emerald-900">
                Loaded <strong>{rows.length}</strong> node rows from <span className="font-mono">{sourceName}</span>.
                {autoMatch && !selectedId ? ` Auto-matched ${autoMatch.nodeId} from the active case identity.` : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search node_id or street name"
                    className="w-full rounded border border-stone-300 bg-white pl-8 pr-2 py-2 text-[9px] font-mono"
                  />
                </div>
                <select
                  value={selected?.nodeId || ''}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full mt-2 rounded border border-stone-300 bg-white px-2 py-2 text-[9px] font-mono"
                >
                  <option value="">Select node…</option>
                  {filtered.map((r) => (
                    <option key={r.nodeId} value={r.nodeId}>
                      {r.nodeId} · {r.streetName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-[8px] text-amber-900 leading-relaxed">
                <strong>Namespace rule:</strong> street-view-nodes uses <span className="font-mono">street_slug_sequence</span> IDs. It does not provide a committed crosswalk to the Murray Hill <span className="font-mono">n#####</span> namespace, so no automatic cross-dataset equivalence is asserted.
              </div>
            </div>
          </>
        )}

        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Metric label="Node" value={selected.nodeId} />
              <Metric label="Street" value={selected.streetName || '—'} />
              <Metric label="Lat" value={selected.lat.toFixed(6)} icon={<MapPin className="w-3 h-3" />} />
              <Metric label="Lng" value={selected.lng.toFixed(6)} />
              <Metric label="Fwd / Rev" value={`${heading(selected.headingFwdDeg)} / ${heading(selected.headingRevDeg)}`} />
            </div>

            <div className="rounded border border-cyan-200 bg-cyan-50/40 p-3">
              <div className="text-[9px] font-mono font-bold text-cyan-900">
                APP-DERIVED TEACHER ORTHOGONAL CANDIDATE
              </div>
              <div className="text-[8px] text-cyan-800 mt-1 leading-relaxed">
                Derived deterministically from the repo's local forward street tangent. These are candidate camera-center headings only; the repository itself does not output four orthogonal images.
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {orthogonal.map((o) => (
                  <Metric key={o.key} label={`${o.key} · +${o.offsetDeg}°`} value={heading(o.headingDeg)} />
                ))}
              </div>
            </div>

            <div className="rounded border border-rose-200 bg-rose-50 p-2.5 text-[8px] text-rose-900 leading-relaxed">
              <strong>Orientation gate remains active:</strong> this geometry can define a local street axis for future capture, but it does not make the existing team walk-relative L/R Qwen images equivalent to the teacher 0/90/180/270 protocol.
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Metric label="seq_fwd" value={`${selected.seqFwd}`} />
              <Metric label="seq_rev" value={`${selected.seqRev}`} />
              <Metric label="Tunnel" value={selected.isTunnel ? 'YES' : 'NO'} />
              <Metric label="Bridge" value={selected.isBridge ? 'YES' : 'NO'} />
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <details className="rounded border border-amber-200 bg-amber-50 p-2.5">
            <summary className="text-[8px] font-mono font-bold text-amber-900 cursor-pointer">
              CSV QA WARNINGS · {warnings.length}
            </summary>
            <div className="mt-2 space-y-1 text-[8px] text-amber-800">
              {warnings.slice(0, 20).map((w, i) => <div key={`${i}-${w}`}>• {w}</div>)}
            </div>
          </details>
        )}
      </div>
    </section>
  );
};

const Metric: React.FC<{label: string; value: string; icon?: React.ReactNode}> = ({ label, value, icon }) => (
  <div className="rounded border border-stone-200 bg-stone-50 px-2.5 py-2 min-w-0">
    <div className="flex items-center gap-1 text-[7px] font-mono uppercase text-stone-500">
      {icon}{label}
    </div>
    <div className="text-[9px] font-mono font-bold text-stone-900 mt-0.5 break-words">
      {value}
    </div>
  </div>
);
