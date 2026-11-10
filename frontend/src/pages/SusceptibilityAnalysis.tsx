import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Layers,
  Sliders,
  RotateCcw,
  Download,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const SusceptibilityAnalysis: React.FC = () => {
  const [weights, setWeights] = useState({
    slope: 0.25,
    elevation: 0.20,
    flow_accumulation: 0.25,
    twi: 0.15,
    impervious: 0.15
  });

  const [calculating, setCalculating] = useState<boolean>(false);
  const [modelResult, setModelResult] = useState<any>({
    mean_susceptibility: 0.442,
    max_susceptibility: 0.941,
    class_distribution: {
      low_susceptibility_pct: 22.4,
      moderate_susceptibility_pct: 46.1,
      high_susceptibility_pct: 23.8,
      very_high_susceptibility_pct: 7.7
    }
  });

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSliderChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      const res = await api.calculateCustomSusceptibility(weights);
      setModelResult(res);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleResetDefaults = () => {
    setWeights({
      slope: 0.25,
      elevation: 0.20,
      flow_accumulation: 0.25,
      twi: 0.15,
      impervious: 0.15
    });
  };

  const exportResultsCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Factor,Applied_Weight,Normalization_Method\n"
      + `Slope,${weights.slope},Exponential Inverse Horn Gradient e^(-slope/4)\n`
      + `Elevation,${weights.elevation},Normalized Inverse Elevation (Z_max - Z)/(Z_max - Z_min)\n`
      + `Flow_Accumulation,${weights.flow_accumulation},Log1p Upslope Catchment Cell Matrix\n`
      + `Topographic_Wetness_Index,${weights.twi},ln(a / tan beta) Clamped Gradient\n`
      + `Impervious_Surface,${weights.impervious},Urban Agglomeration Spatial Density (Bhuvan/Sentinel-2)\n\n`
      + `Susceptibility_Class,Taluk_Area_Percentage\n`
      + `Low_Susceptibility,${modelResult.class_distribution.low_susceptibility_pct}%\n`
      + `Moderate_Susceptibility,${modelResult.class_distribution.moderate_susceptibility_pct}%\n`
      + `High_Susceptibility,${modelResult.class_distribution.high_susceptibility_pct}%\n`
      + `Very_High_Susceptibility,${modelResult.class_distribution.very_high_susceptibility_pct}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KGF_Flood_Susceptibility_Weights_Evaluation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950 text-slate-100">
      {/* 1. Header & Scientific Distinction Banner */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              Explainable Multi-Factor Flood Susceptibility Model (MCE)
            </h2>
          </div>
          <div className="mt-2 md:mt-0 flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Confidence Index: 0.74 (Validated Demands)
            </span>
            <button
              onClick={exportResultsCSV}
              className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs font-mono text-cyan-300 border border-cyan-500/30 flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Evaluation CSV</span>
            </button>
          </div>
        </div>

        {/* Mandatory Scientific Distinction Notice */}
        <div className="p-2.5 rounded-lg bg-navy-950 border border-amber-500/30 text-xs text-slate-300 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <b className="text-amber-300">Mandatory Hydrological Distinction:</b> Flood susceptibility represents the
            <b> relative static geographical tendency</b> of terrain and soil conditions to accumulate runoff. It does
            <b> not</b> represent real-time flood probability or hydrodynamic predictive forecast, which requires calibrated
            rainfall-runoff hydrographs and hydrodynamic 2D shallow water equation solvers.
          </div>
        </div>
      </div>

      {/* 2. Interactive Factor Sliders & Weights Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Factor Sliders */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-navy-800">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Factor Weight Adjustments (Sum = 1.0)
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono font-bold ${Math.abs(totalWeight - 1.0) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                Sum: {totalWeight.toFixed(2)}
              </span>
              <button
                onClick={handleResetDefaults}
                className="p-1 text-slate-400 hover:text-white"
                title="Reset to Baseline Weights"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Factor 1: Slope */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <span>1. Terrain Slope Gradient (Degrees)</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Horn's finite diff)</span>
                </span>
                <span className="font-mono font-bold text-cyan-400">{(weights.slope * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.05"
                value={weights.slope}
                onChange={(e) => handleSliderChange('slope', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">
                Normalization: Exponential inverse response e^(-slope/4). Flatter terrain (&lt; 2°) yields maximum score.
              </div>
            </div>

            {/* Factor 2: Elevation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <span>2. Low-Lying Elevation (AMSL)</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Copernicus DSM 30m)</span>
                </span>
                <span className="font-mono font-bold text-cyan-400">{(weights.elevation * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.05"
                value={weights.elevation}
                onChange={(e) => handleSliderChange('elevation', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">
                Normalization: Inverse linear (Z_max - Z) / (Z_max - Z_min). Valleys below 790m receive highest priority.
              </div>
            </div>

            {/* Factor 3: Flow Accumulation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <span>3. D8 Flow Accumulation</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Contributing Upslope Area)</span>
                </span>
                <span className="font-mono font-bold text-cyan-400">{(weights.flow_accumulation * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.05"
                value={weights.flow_accumulation}
                onChange={(e) => handleSliderChange('flow_accumulation', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">
                Normalization: Logarithmic transformation ln(1 + A) / ln(1 + A_max) to capture primary drainage corridors.
              </div>
            </div>

            {/* Factor 4: TWI */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <span>4. Topographic Wetness Index (TWI)</span>
                  <span className="text-[10px] text-slate-400 font-mono">(ln(a / tan beta))</span>
                </span>
                <span className="font-mono font-bold text-cyan-400">{(weights.twi * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.4"
                step="0.05"
                value={weights.twi}
                onChange={(e) => handleSliderChange('twi', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">
                Normalization: Clamped minimum slope 0.5° prevents divergence in flat depressions.
              </div>
            </div>

            {/* Factor 5: Impervious Land-Cover */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <span>5. Impervious Built-Up Surfaces</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Bhuvan / Sentinel-2 Core)</span>
                </span>
                <span className="font-mono font-bold text-cyan-400">{(weights.impervious * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.4"
                step="0.05"
                value={weights.impervious}
                onChange={(e) => handleSliderChange('impervious', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">
                Runoff coefficient factor: Dense asphalt and concrete settlements generate 80-90% overland runoff.
              </div>
            </div>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={calculating}
            className="w-full py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-glow border border-cyan-500/50 glow-cyan font-mono font-semibold text-xs tracking-wider uppercase transition flex items-center justify-center space-x-2"
          >
            {calculating ? (
              <span>Recalculating Multi-Factor Raster Matrix...</span>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Recompute KGF Susceptibility Overlay</span>
              </>
            )}
          </button>
        </div>

        {/* Right Col: Output Classification Breakdown */}
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-2 border-b border-navy-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Model Output Classification
              </h3>
              <p className="text-[11px] text-slate-400">KGF Taluk Geographic Land Area Distribution</p>
            </div>

            <div className="space-y-3 mt-4">
              {/* Class 1: Very High */}
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-red-400">Very High Susceptibility</span>
                  <span className="text-white">{modelResult.class_distribution?.very_high_susceptibility_pct}%</span>
                </div>
                <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${modelResult.class_distribution?.very_high_susceptibility_pct}%` }} />
                </div>
                <div className="text-[10px] text-slate-400">Score &ge; 0.75 &bull; Severe depression & drainage convergence</div>
              </div>

              {/* Class 2: High */}
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-amber-400">High Susceptibility</span>
                  <span className="text-white">{modelResult.class_distribution?.high_susceptibility_pct}%</span>
                </div>
                <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${modelResult.class_distribution?.high_susceptibility_pct}%` }} />
                </div>
                <div className="text-[10px] text-slate-400">Score 0.50 - 0.74 &bull; Urban runoff & low slopes</div>
              </div>

              {/* Class 3: Moderate */}
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30 space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-blue-400">Moderate Susceptibility</span>
                  <span className="text-white">{modelResult.class_distribution?.moderate_susceptibility_pct}%</span>
                </div>
                <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${modelResult.class_distribution?.moderate_susceptibility_pct}%` }} />
                </div>
                <div className="text-[10px] text-slate-400">Score 0.25 - 0.49 &bull; Undulating plateau swales</div>
              </div>

              {/* Class 4: Low */}
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-emerald-400">Low Susceptibility</span>
                  <span className="text-white">{modelResult.class_distribution?.low_susceptibility_pct}%</span>
                </div>
                <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${modelResult.class_distribution?.low_susceptibility_pct}%` }} />
                </div>
                <div className="text-[10px] text-slate-400">Score &lt; 0.25 &bull; Elevated ridgelines & quartz outcrops</div>
              </div>
            </div>
          </div>

          {/* Model Provenance Note */}
          <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800 text-[10px] text-slate-400 space-y-1">
            <div className="font-mono text-cyan-400 font-bold">Scientific Mathematical Formulation:</div>
            <div>S = Sum(w_i * f_i),  where Sum(w_i) = 1.0</div>
            <div>Normalized over 68,750 raster cells across KGF taluk extent.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
