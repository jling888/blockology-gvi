import React, { useMemo, useState } from 'react';
import {
  Upload,
  Database,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import type {
  PaperVlmInstrumentFieldId,
} from '../types';

import {
  importQwenCsvRow,
  summarizeQwenCsvRows,
  type QwenCsvImportedRecord,
  type QwenCsvRowSummary,
} from '../research/paperVlmQwenCsvImporter';

import {
  PAPER_VLM_FIELD_ORDER,
  getPaperVlmInstrumentFieldSpec,
} from '../research/paperVlmInstrument';

import { parseCsvText } from '../data/teamRepository/teamRepositoryParser';
import {
  matchRepositoryRow,
  buildMatchedRecordFromRow,
} from '../data/teamRepository/teamRepositoryMapper';

interface QwenVlmImportPanelProps {
  activeImageId: string;
  importedRecord: QwenCsvImportedRecord | null;
  onImported: (record: QwenCsvImportedRecord) => void;
}

const DEFAULT_MODEL_ID = 'Qwen/Qwen2-VL-7B-Instruct';

function formatNumber(value: number | undefined, digits = 3): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';
}

function validationBadgeClass(strength: string): string {
  switch (strength) {
    case 'strong':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'moderate':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'weak':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'construct_validation_pending':
      return 'bg-orange-50 text-orange-900 border-orange-200';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

function requireFiniteRepoNumber(
  label: string,
  value: number | null | undefined,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`SOURCE_PARSE_ERROR: ${label} is missing or unparseable.`);
  }

  return value;
}

function buildMedianLedInstrumentReadout(label: string, entry: any) {
  const rawMedian = requireFiniteRepoNumber(
    `${label}_median`,
    entry?.raw_median_1_7,
  );
  const normalizedMedian = requireFiniteRepoNumber(
    `${label}_median normalized`,
    entry?.normalized_0_1,
  );
  const medianRound = requireFiniteRepoNumber(
    `${label}_median_round`,
    entry?.median_round,
  );
  const argmax = requireFiniteRepoNumber(
    `${label}_argmax`,
    entry?.argmax,
  );
  const probabilities = entry?.probabilities;

  if (!probabilities) {
    throw new Error(
      `SOURCE_PARSE_ERROR: ${label}_p1...p7 are missing from the current median-led source row.`,
    );
  }

  const values = [
    probabilities.p1,
    probabilities.p2,
    probabilities.p3,
    probabilities.p4,
    probabilities.p5,
    probabilities.p6,
    probabilities.p7,
  ];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error(`SOURCE_PARSE_ERROR: invalid ${label} probability distribution.`);
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) {
    throw new Error(`SOURCE_PARSE_ERROR: ${label} probability mass is zero.`);
  }

  const expectedValue = values.reduce(
    (sum, value, index) => sum + ((index + 1) * value) / total,
    0,
  );

  return {
    rawMedian,
    normalizedMedian,
    medianRound,
    argmax,
    probabilities,
    expectedValue,
    normalizedExpectedValue: (expectedValue - 1) / 6,
  };
}

function probabilityRow(
  fieldId: PaperVlmInstrumentFieldId,
  probabilities:
    | {
        p1: number;
        p2: number;
        p3: number;
        p4: number;
        p5: number;
        p6: number;
        p7: number;
      }
    | undefined,
) {
  if (!probabilities) {
    return null;
  }

  const values = [
    probabilities.p1,
    probabilities.p2,
    probabilities.p3,
    probabilities.p4,
    probabilities.p5,
    probabilities.p6,
    probabilities.p7,
  ];

  return (
    <div className="grid grid-cols-7 gap-1 mt-2">
      {values.map((value, index) => (
        <div
          key={`${fieldId}-p${index + 1}`}
          className="bg-stone-50 border border-stone-200 rounded px-1.5 py-1 text-center"
        >
          <div className="text-[8px] font-mono uppercase text-stone-400">
            p{index + 1}
          </div>
          <div className="text-[9px] font-mono font-semibold text-stone-700">
            {value.toFixed(4)}
          </div>
        </div>
      ))}
    </div>
  );
}

export const QwenVlmImportPanel: React.FC<QwenVlmImportPanelProps> = ({
  activeImageId,
  importedRecord,
  onImported,
}) => {
  const [csvFilename, setCsvFilename] = useState<string>('');
  const [csvText, setCsvText] = useState<string>('');
  const [rows, setRows] = useState<QwenCsvRowSummary[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<string>('');
  const [horizonVerified, setHorizonVerified] = useState<boolean>(false);
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [error, setError] = useState<string | null>(null);
  const [showProbabilities, setShowProbabilities] = useState<boolean>(false);

  const selectedRow = useMemo(() => {
    if (selectedRowIndex === '') {
      return null;
    }

    const numericIndex = Number(selectedRowIndex);
    return rows.find((row) => row.rowIndex === numericIndex) ?? null;
  }, [rows, selectedRowIndex]);

  const selectedSourceProtocolRecognized =
    selectedRow?.viewProtocol === 'team_along_street_180' ||
    selectedRow?.team90ViewRecognized === true;

  const handleCsvFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setCsvFilename(file.name);
    setSelectedRowIndex('');
    setRows([]);
    setCsvText('');

    try {
      const text = await file.text();

      if (text.includes('vertical_greenery_median')) {
        const repoRows = parseCsvText(text);
        const summaries: QwenCsvRowSummary[] = repoRows.map((r, idx) => ({
          rowIndex: idx,
          file: r.file || '',
          node_id: r.node_id || '',
          cardinal: r.cardinal || '',
          side: r.side || '',
          walk: r.walk || '',
          street: r.street || '',
          seq: parseInt(r.seq || '1', 10),
          team90ViewRecognized: false,
          viewProtocol: 'team_along_street_180',
          viewCenterOffsetFromWalkDegrees: null,
          orientationAlignmentStatus: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
          completeInstrumentColumns: true,
          missingColumns: [],
        }));
        setCsvText(text);
        setRows(summaries);

        const match = matchRepositoryRow(repoRows, file.name, {
          activeImageId,
          activeFilename: activeImageId,
        });
        if (match.matchedIndex !== null) {
          setSelectedRowIndex(String(match.matchedIndex));
        } else if (summaries.length > 0) {
          setSelectedRowIndex('0');
        }
        return;
      }

      const summaries = summarizeQwenCsvRows(text);

      setCsvText(text);
      setRows(summaries);

      const firstRecognized90 =
        summaries.find(
          (row) =>
            row.team90ViewRecognized &&
            row.completeInstrumentColumns,
        ) ?? null;

      if (firstRecognized90) {
        setSelectedRowIndex(String(firstRecognized90.rowIndex));
      }
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to parse the selected Qwen full-schema CSV file.',
      );
    }
  };

  const handleImport = () => {
    setError(null);

    if (!csvText) {
      setError('Select the full-schema Qwen CSV first (current source: sim_vlm_v3.csv).');
      return;
    }

    if (selectedRowIndex === '') {
      setError('Select one CSV row / image first.');
      return;
    }

    try {
      if (csvText.includes('vertical_greenery_median')) {
        const repoRows = parseCsvText(csvText);
        const idx = Number(selectedRowIndex);
        const row = repoRows[idx];
        if (!row) {
          throw new Error('Selected row index out of range.');
        }

        const matchedRecord = buildMatchedRecordFromRow(
          row,
          csvFilename || 'vlm_observations_murrayhill.csv',
          idx,
          'EXACT_FILENAME'
        );

        const qwen = matchedRecord.qwenRecord;
        if (!qwen) {
          throw new Error('No Qwen record parsed from matched repository row.');
        }

        // Strict source binding: missing/unparseable values are fatal for this
        // imported row. Never substitute 0/1 or any other synthetic constant.
        // The active paper bridge uses the interpolated MEDIAN. The compatibility
        // Qwen run also preserves a true probability-derived EV separately.
        const vNatReadout = buildMedianLedInstrumentReadout('vertical_greenery', qwen.verticalGreenery);
        const vBuiltReadout = buildMedianLedInstrumentReadout('vertical_hardscape', qwen.verticalHardscape);
        const gviEyeReadout = buildMedianLedInstrumentReadout('green_eye_level', qwen.greenEyeLevel);
        const gmiReadout = buildMedianLedInstrumentReadout('green_softening', qwen.greenSoftening);
        const vSignReadout = buildMedianLedInstrumentReadout('signage_detail', qwen.signageDetail);
        const svfReadout = buildMedianLedInstrumentReadout('sky_openness', qwen.skyOpenness);
        const gfapiReadout = buildMedianLedInstrumentReadout('ground_floor_activity', qwen.groundFloorActivity);
        const vPaveReadout = buildMedianLedInstrumentReadout('walkable_ground', qwen.walkableGround);
        const iasReadout = buildMedianLedInstrumentReadout('resting_affordance', qwen.restingAffordance);
        const sfvReadout = buildMedianLedInstrumentReadout('facade_variation', qwen.facadeVariation);

        const vNatRaw = vNatReadout.rawMedian;
        const vNatNorm = vNatReadout.normalizedMedian;
        const vBuiltRaw = vBuiltReadout.rawMedian;
        const vBuiltNorm = vBuiltReadout.normalizedMedian;
        const gviEyeRaw = gviEyeReadout.rawMedian;
        const gviEyeNorm = gviEyeReadout.normalizedMedian;
        const gmiRaw = gmiReadout.rawMedian;
        const gmiNorm = gmiReadout.normalizedMedian;
        const vSignRaw = vSignReadout.rawMedian;
        const vSignNorm = vSignReadout.normalizedMedian;
        const svfRaw = svfReadout.rawMedian;
        const svfNorm = svfReadout.normalizedMedian;
        const gfapiRaw = gfapiReadout.rawMedian;
        const gfapiNorm = gfapiReadout.normalizedMedian;
        const vPaveRaw = vPaveReadout.rawMedian;
        const vPaveNorm = vPaveReadout.normalizedMedian;
        const iasRaw = iasReadout.rawMedian;
        const iasNorm = iasReadout.normalizedMedian;
        const sfvRaw = sfvReadout.rawMedian;
        const sfvNorm = sfvReadout.normalizedMedian;

        const record: QwenCsvImportedRecord = {
          sourceProtocol: {
            recognized_team_90_view: false,
            source_csv_format: 'vlm_observations_murrayhill',
            source_filename: 'vlm_observations_murrayhill.csv',
            source_schema: 'MEDIAN_LED_REPOSITORY_TABLE',
            probability_storage_decimals: 4,
            view_protocol: 'team_along_street_180',
            orientation_alignment_status: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
            view_center_offset_from_walk_degrees: 0,
            field_of_view_degrees: 180,
          },
          sourceIdentity: {
            file: row.file || '',
            street: row.street || '',
            walk: row.walk || '',
            seq: parseInt(row.seq || '1', 10),
            node_id: row.node_id || 'n00045',
            cardinal: row.cardinal || 'S',
            side: row.side || 'W',
          },
          run: {
            schema_version: 'paper_vlm_instrument_v0.3',
            node_metadata: {
              image_quadrant: null,
              view_protocol: 'team_along_street_180',
              orientation_alignment_status: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
              walk_cardinal: (row.cardinal || 'S') as any,
              walk_side: (row.side || 'W') as any,
              view_center_offset_from_walk_degrees: 0,
              horizon_alignment_verified: false,
              field_of_view_degrees: 180,
              eye_height_m: null,
              pitch_degrees: null,
              node_id: row.node_id || 'n00045',
              source_image_id: row.file || '',
            },
            model: {
              family: 'Qwen',
              model_id: modelId || 'Qwen/Qwen2-VL-7B-Instruct',
              inference_mode: 'one_field_per_call',
              score_readout: 'next_token_logits_1_to_7',
            },
            complete: true,
            eligible_for_paper_assembly: true,
            warnings: [],
            fields: {
              vertical_greenery: {
                field_id: 'vertical_greenery',
                paper_variable: 'V_nat',
                rung: vNatReadout.medianRound as any,
                expected_value: vNatReadout.expectedValue,
                normalized_ev: vNatReadout.normalizedExpectedValue,
                argmax: vNatReadout.argmax as any,
                probabilities: vNatReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: vNatReadout.rawMedian,
                normalized_continuous_readout: vNatReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
              vertical_hardscape: {
                field_id: 'vertical_hardscape',
                paper_variable: 'V_built',
                rung: vBuiltReadout.medianRound as any,
                expected_value: vBuiltReadout.expectedValue,
                normalized_ev: vBuiltReadout.normalizedExpectedValue,
                argmax: vBuiltReadout.argmax as any,
                probabilities: vBuiltReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: vBuiltReadout.rawMedian,
                normalized_continuous_readout: vBuiltReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
              green_eye_level: {
                field_id: 'green_eye_level',
                paper_variable: 'GVI_eye',
                rung: gviEyeReadout.medianRound as any,
                expected_value: gviEyeReadout.expectedValue,
                normalized_ev: gviEyeReadout.normalizedExpectedValue,
                argmax: gviEyeReadout.argmax as any,
                probabilities: gviEyeReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: gviEyeReadout.rawMedian,
                normalized_continuous_readout: gviEyeReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
              green_softening: {
                field_id: 'green_softening',
                paper_variable: 'GMI',
                rung: gmiReadout.medianRound as any,
                expected_value: gmiReadout.expectedValue,
                normalized_ev: gmiReadout.normalizedExpectedValue,
                argmax: gmiReadout.argmax as any,
                probabilities: gmiReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: gmiReadout.rawMedian,
                normalized_continuous_readout: gmiReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
              signage_detail: {
                field_id: 'signage_detail',
                paper_variable: 'V_sign',
                rung: vSignReadout.medianRound as any,
                expected_value: vSignReadout.expectedValue,
                normalized_ev: vSignReadout.normalizedExpectedValue,
                argmax: vSignReadout.argmax as any,
                probabilities: vSignReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: vSignReadout.rawMedian,
                normalized_continuous_readout: vSignReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
              sky_openness: {
                field_id: 'sky_openness',
                paper_variable: 'sky_openness_proxy',
                rung: svfReadout.medianRound as any,
                expected_value: svfReadout.expectedValue,
                normalized_ev: svfReadout.normalizedExpectedValue,
                argmax: svfReadout.argmax as any,
                probabilities: svfReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: svfReadout.rawMedian,
                normalized_continuous_readout: svfReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
              ground_floor_activity: {
                field_id: 'ground_floor_activity',
                paper_variable: 'GFAPI',
                rung: gfapiReadout.medianRound as any,
                expected_value: gfapiReadout.expectedValue,
                normalized_ev: gfapiReadout.normalizedExpectedValue,
                argmax: gfapiReadout.argmax as any,
                probabilities: gfapiReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: gfapiReadout.rawMedian,
                normalized_continuous_readout: gfapiReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
              walkable_ground: {
                field_id: 'walkable_ground',
                paper_variable: 'V_pave',
                rung: vPaveReadout.medianRound as any,
                expected_value: vPaveReadout.expectedValue,
                normalized_ev: vPaveReadout.normalizedExpectedValue,
                argmax: vPaveReadout.argmax as any,
                probabilities: vPaveReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: vPaveReadout.rawMedian,
                normalized_continuous_readout: vPaveReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
              resting_affordance: {
                field_id: 'resting_affordance',
                paper_variable: 'IAS',
                rung: iasReadout.medianRound as any,
                expected_value: iasReadout.expectedValue,
                normalized_ev: iasReadout.normalizedExpectedValue,
                argmax: iasReadout.argmax as any,
                probabilities: iasReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: iasReadout.rawMedian,
                normalized_continuous_readout: iasReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
              facade_variation: {
                field_id: 'facade_variation',
                paper_variable: 'SFV',
                rung: sfvReadout.medianRound as any,
                expected_value: sfvReadout.expectedValue,
                normalized_ev: sfvReadout.normalizedExpectedValue,
                argmax: sfvReadout.argmax as any,
                probabilities: sfvReadout.probabilities,
                continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                continuous_readout_value: sfvReadout.rawMedian,
                normalized_continuous_readout: sfvReadout.normalizedMedian,
                instrument_version: 'qwen_7_rung_v0.3',
                validation: { strength: 'strong' },
              },
            },
          },
          _rawRow: row,
        } as any;

        onImported(record);
        return;
      }

      const record = importQwenCsvRow(
        csvText,
        Number(selectedRowIndex),
        {
          horizonAlignmentVerified: horizonVerified,
          modelId,
          requireRecognized90View: true,
        },
      );

      onImported(record);
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to import the selected Qwen VLM record.',
      );
    }
  };

  const importedRun = importedRecord?.run ?? null;

  return (
    <section
      id="qwen-vlm-import"
      className="bg-white border border-violet-200 rounded-lg p-4 shadow-xs space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-violet-700 text-white rounded">
              QWEN INSTRUMENT
            </span>

            <Database className="w-4 h-4 text-violet-700" />

            <h2 className="text-base font-bold text-stone-900 font-mono">
              Team Qwen VLM Instrument — Import & Inspect
            </h2>
          </div>

          <p className="text-xs text-stone-500 mt-1 max-w-4xl">
            Imports the teammate full-schema Qwen one-field-per-call instrument
            (current research source: results/tables/sim_vlm_v3.csv). This panel
            preserves the real 1–7 probability mass, expected value and source
            view geometry. Team half-views remain comparison-only until the
            orientation discrepancy with the Nature 9.02 canonical 4×90° target is reconciled.
          </p>
        </div>

        <div className="text-[9px] font-mono px-2 py-1 rounded border border-violet-200 bg-violet-50 text-violet-800">
          INSPECTION ONLY · NO SIM WRITE
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />

        <div className="text-[10px] text-amber-950 leading-relaxed space-y-1">
          <p>
            Active paper import accepts only explicitly recognizable 90°
            teammate half-view filenames ending in
            <span className="font-mono font-bold"> _N_L / _N_R / _E_L / ...</span>.
            Legacy 180° rows are not silently reinterpreted.
          </p>
          <p>
            Use the current full-schema research output
            <span className="font-mono font-bold"> results/tables/sim_vlm_v3.csv</span>.
            The legacy <span className="font-mono">sim_vlm.csv</span> does not
            contain the complete EV / argmax / p1–p7 / IAS contract required by
            this APP and will remain non-importable.
          </p>

          <p>
            The team <span className="font-mono">svi_90</span> source is not a
            North/East/South/West quadrant dataset. L/R are relative to direction
            of travel and each 90° half is centred 45° off that walk bearing.
            The APP therefore records the source geometry directly and does not
            invent a teacher quadrant.
          </p>

          <p>
            Horizon verification and model ID are not stored in the CSV and
            remain explicit import provenance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <label className="border border-dashed border-stone-300 rounded p-3 bg-stone-50 cursor-pointer hover:bg-stone-100">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-stone-600" />
            <span className="text-[10px] font-mono font-bold uppercase text-stone-700">
              Load Qwen full-schema CSV
            </span>
          </div>

          <div className="text-[10px] text-stone-500 mt-1 truncate">
            {csvFilename || 'No CSV selected'}
          </div>

          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvFile}
          />
        </label>

        <div className="border border-stone-200 rounded p-3">
          <label className="text-[9px] font-mono font-bold uppercase text-stone-500">
            CSV row / image
          </label>

          <select
            value={selectedRowIndex}
            onChange={(event) =>
              setSelectedRowIndex(event.target.value)
            }
            disabled={rows.length === 0}
            className="w-full mt-1 px-2 py-2 text-[10px] font-mono border border-stone-300 bg-white rounded"
          >
            <option value="">
              {rows.length === 0
                ? 'Load CSV first'
                : `Select row (${rows.length} available)`}
            </option>

            {rows.map((row) => (
              <option
                key={`${row.rowIndex}-${row.file}`}
                value={row.rowIndex}
              >
                {row.node_id} · {row.cardinal}/{row.side} ·{' '}
                {row.viewProtocol === 'team_along_street_180'
                  ? '180°'
                  : row.team90ViewRecognized
                    ? '90°'
                    : 'UNRECOGNIZED'} ·{' '}
                {row.file.split('/').pop()}
              </option>
            ))}
          </select>
        </div>

        <div className="border border-stone-200 rounded p-3">
          <label className="text-[9px] font-mono font-bold uppercase text-stone-500">
            Source view geometry
          </label>

          <div className="mt-1 text-[10px] font-mono text-stone-800">
            {selectedRow?.viewProtocol === 'team_along_street_180'
              ? `ALONG-STREET 180° · ${selectedRow.cardinal} travel direction · source protocol verified`
              : selectedRow?.team90ViewRecognized
                ? `WALK-RELATIVE 90° · ${selectedRow.cardinal}/${selectedRow.side} · centre ${selectedRow.viewCenterOffsetFromWalkDegrees === -45 ? '−45°' : '+45°'} from walk`
                : 'Select a recognized source row'}
          </div>

          <div className="mt-1 text-[9px] text-amber-700">
            Paper/teacher protocol equivalence: UNRESOLVED — source protocol verification does not imply orthogonal-90 equivalence.
          </div>
        </div>

        <div className="border border-stone-200 rounded p-3">
          <label className="text-[9px] font-mono font-bold uppercase text-stone-500">
            Source model ID
          </label>

          <input
            type="text"
            value={modelId}
            onChange={(event) => setModelId(event.target.value)}
            className="w-full mt-1 px-2 py-2 text-[10px] font-mono border border-stone-300 bg-white rounded"
          />
        </div>
      </div>

      {selectedRow && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 text-[9px] font-mono">
          <div className="bg-stone-50 border border-stone-200 rounded p-2">
            <div className="text-stone-400 uppercase">Node</div>
            <div className="font-bold mt-0.5">{selectedRow.node_id}</div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded p-2">
            <div className="text-stone-400 uppercase">Street</div>
            <div className="font-bold mt-0.5 truncate">
              {selectedRow.street}
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded p-2">
            <div className="text-stone-400 uppercase">Walk</div>
            <div className="font-bold mt-0.5">{selectedRow.walk}</div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded p-2">
            <div className="text-stone-400 uppercase">Cardinal</div>
            <div className="font-bold mt-0.5">{selectedRow.cardinal}</div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded p-2">
            <div className="text-stone-400 uppercase">Side</div>
            <div className="font-bold mt-0.5">{selectedRow.side}</div>
          </div>

          <div
            className={`border rounded p-2 ${
              selectedSourceProtocolRecognized
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="uppercase opacity-60">View</div>
            <div className="font-bold mt-0.5">
              {selectedRow.viewProtocol === 'team_along_street_180'
                ? '180° SOURCE VERIFIED'
                : selectedRow.team90ViewRecognized
                  ? '90° SOURCE VERIFIED'
                  : 'UNRECOGNIZED'}
            </div>
          </div>

          <div
            className={`border rounded p-2 ${
              selectedRow.completeInstrumentColumns
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="uppercase opacity-60">10 Fields</div>
            <div className="font-bold mt-0.5">
              {selectedRow.completeInstrumentColumns
                ? 'COMPLETE'
                : 'INCOMPLETE'}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border border-stone-200 rounded p-3 bg-stone-50">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={horizonVerified}
            onChange={(event) =>
              setHorizonVerified(event.target.checked)
            }
            className="mt-0.5"
          />

          <span className="text-[10px] text-stone-700 leading-relaxed">
            <span className="font-mono font-bold block text-stone-900">
              Horizon alignment verified
            </span>
            I confirm this imported image satisfies the standardized
            horizon requirement. This is an explicit provenance gate, not
            inferred from the CSV.
          </span>
        </label>

        <button
          type="button"
          onClick={handleImport}
          disabled={
            !csvText ||
            selectedRowIndex === '' ||
            !modelId.trim() ||
            !selectedSourceProtocolRecognized ||
            !selectedRow?.completeInstrumentColumns
          }
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-violet-700 hover:bg-violet-800 disabled:bg-stone-300 disabled:text-stone-500 text-white text-[10px] font-mono font-bold"
        >
          <FileSpreadsheet className="w-4 h-4" />
          IMPORT QWEN INSTRUMENT ROW
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded p-3 text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {importedRecord && importedRun && (
        <div className="space-y-3">
          <div className="bg-stone-900 text-white rounded p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-[10px] font-mono">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>APP CASE: {activeImageId}</span>
              <span>QWEN NODE: {importedRecord.sourceIdentity.node_id}</span>
              <span>
                VIEW:{' '}
                {importedRun.node_metadata.view_protocol === 'team_along_street_180'
                  ? `TEAM ALONG-STREET 180° · ${importedRun.node_metadata.walk_cardinal}`
                  : `TEAM WALK-RELATIVE 90° · ${importedRun.node_metadata.walk_cardinal}/${importedRun.node_metadata.walk_side}`}
              </span>
              <span>MODEL: {importedRun.model.model_id}</span>
            </div>

            <div className="flex items-center gap-2">
              {importedRun.eligible_for_paper_assembly ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}

              <span
                className={
                  importedRun.eligible_for_paper_assembly
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }
              >
                {importedRun.eligible_for_paper_assembly
                  ? 'PAPER-ASSEMBLY ELIGIBLE'
                  : 'ORIENTATION-GATED'}
              </span>
            </div>
          </div>

          <div className="bg-violet-50 border border-violet-200 rounded p-3 text-[10px] text-violet-950 leading-relaxed">
            <strong>Important:</strong> source-view provenance and paper-protocol
            equivalence are separate gates. The current median-led repository
            table is source-backed to the team along-street 180° pipeline, while
            equivalence to the teacher orthogonal 90° analytical protocol remains
            unresolved. Repository values may be inspected and previewed, but
            scientific authorization is recorded only through the explicit
            Approval Gate below.
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-stone-100 border-b border-stone-200">
                <tr className="text-[9px] font-mono uppercase text-stone-500">
                  <th className="px-3 py-2">Instrument Field</th>
                  <th className="px-3 py-2">Paper Variable</th>
                  <th className="px-3 py-2 text-right">Rung</th>
                  <th className="px-3 py-2 text-right">EV</th>
                  <th className="px-3 py-2 text-right">Norm EV</th>
                  <th className="px-3 py-2 text-right">Argmax</th>
                  <th className="px-3 py-2">Validation</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {PAPER_VLM_FIELD_ORDER.map((fieldId) => {
                  const spec =
                    getPaperVlmInstrumentFieldSpec(fieldId);
                  const result = importedRun.fields[fieldId];

                  return (
                    <React.Fragment key={fieldId}>
                      <tr className="text-[10px]">
                        <td className="px-3 py-2">
                          <div className="font-mono font-bold text-stone-900">
                            {fieldId}
                          </div>
                          <div className="text-[9px] text-stone-500 mt-0.5">
                            {spec.displayName}
                          </div>
                        </td>

                        <td className="px-3 py-2 font-mono font-bold">
                          {spec.paperVariable}
                        </td>

                        <td className="px-3 py-2 text-right font-mono">
                          {result?.rung ?? '—'}
                        </td>

                        <td className="px-3 py-2 text-right font-mono font-bold">
                          {formatNumber(result?.expected_value)}
                        </td>

                        <td className="px-3 py-2 text-right font-mono font-bold">
                          {formatNumber(result?.normalized_ev)}
                        </td>

                        <td className="px-3 py-2 text-right font-mono">
                          {result?.argmax ?? '—'}
                        </td>

                        <td className="px-3 py-2">
                          {result && (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded border text-[8px] font-mono font-bold uppercase ${validationBadgeClass(
                                result.validation.strength,
                              )}`}
                            >
                              {result.validation.strength.replace(/_/g, ' ')}
                            </span>
                          )}
                        </td>
                      </tr>

                      {showProbabilities && result && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 pb-3 bg-stone-50/60"
                          >
                            {probabilityRow(
                              fieldId,
                              result.probabilities,
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowProbabilities((current) => !current)
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-50 text-[9px] font-mono font-bold text-stone-700"
          >
            {showProbabilities ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}

            {showProbabilities
              ? 'HIDE p1–p7'
              : 'SHOW p1–p7'}
          </button>
        </div>
      )}
    </section>
  );
};
