'use client';

import React, { useMemo, useState } from 'react';
import { useTheoryStore } from '@/store/useTheoryStore';
import {
  calculateFretDistance,
  generateFretboardMatrix,
  getHarmonicProfile,
  noteToPitchClass,
  TUNINGS,
} from '@/lib/theory/pitchMath';
import {
  getCagedOverlays,
  getDiagonalHighway,
  getBbKingBox,
  getAlbertKingBox,
  getThreeNpsShape,
  getMovableTriadInversions,
  CAGED_COLORS,
} from '@/lib/theory/overlayMath';
import { getDegreeColor } from '@/lib/theory/colorMap';
import { FretCoordinate, NoteName, CagedShape } from '@/types/theory';

// Inlay dot fret numbers
const SINGLE_DOT_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_DOT_FRETS = [12, 24];

export const Fretboard: React.FC = () => {
  const {
    currentKey,
    tuning,
    activeScale,
    activeChord,
    displayMode,
    densityMode,
    highlightChordTones,
    accidentalMode,
    activeOverlay,
    cagedShape,
    cagedShowAll,
    threeNpsShape,
    triadStringSet,
    stringOrientation,
    handedness,
    fretRange,
    highlightedOctaveNote,
    activePlayingPin,
    playFretAudio,
    setInspectedFret,
    studioMode,
    progressionAnalysis,
    currentChordIndex,
    showGuideToneHalos,
    showCommonToneBadges,
    showVoiceLeadingVectors,
    staticPositionFret,
    targetDrillActive,
    evaluateDrillClick,
    highlightedCoachTarget,
  } = useTheoryStore();

  const [hoveredCell, setHoveredCell] = useState<{ stringNumber: number; fretNumber: number } | null>(null);

  // Geometry dimensions (SVG user units)
  const HEADSTOCK_WIDTH = 90;
  const NUT_X = HEADSTOCK_WIDTH;
  const NUT_WIDTH = 9;
  const TOTAL_SCALE_LENGTH = 2200; // Calibrated so fret 24 width >= 32px
  const NECK_Y = 24;
  const BINDING_HEIGHT = 9;
  const NECK_HEIGHT = 190;
  const STRING_SPACING = NECK_HEIGHT / 7; // Equal spacing for parallel neck
  const OPEN_STRING_X = HEADSTOCK_WIDTH / 2;

  // Calculate cumulative X position of each fret wire 0..24
  const fretXPositions = useMemo(() => {
    const positions: number[] = [NUT_X];
    for (let fret = 1; fret <= 24; fret++) {
      const dist = calculateFretDistance(fret, TOTAL_SCALE_LENGTH);
      positions.push(NUT_X + dist);
    }
    return positions;
  }, [NUT_X]);

  const totalSvgWidth = fretXPositions[24] + 45;
  const totalSvgHeight = NECK_Y + NECK_HEIGHT + 38;

  // Center X coordinate of each fret cell
  const fretCenterPositions = useMemo(() => {
    const centers: number[] = [OPEN_STRING_X];
    for (let fret = 1; fret <= 24; fret++) {
      const prevX = fretXPositions[fret - 1];
      const curX = fretXPositions[fret];
      centers.push((prevX + curX) / 2);
    }
    return centers;
  }, [fretXPositions, OPEN_STRING_X]);

  // Y coordinate of each string 1..6
  const stringYPositions = useMemo(() => {
    const yMap: Record<number, number> = {};
    for (let str = 1; str <= 6; str++) {
      if (stringOrientation === 'tab') {
        yMap[str] = NECK_Y + str * STRING_SPACING;
      } else {
        yMap[str] = NECK_Y + (7 - str) * STRING_SPACING;
      }
    }
    return yMap;
  }, [stringOrientation, NECK_Y, STRING_SPACING]);

  // Proportional string gauges and wound texture definitions
  const stringStyles: Record<
    number,
    { width: number; color: string; dashArray?: string; shadowWidth: number }
  > = {
    6: { width: 3.8, color: '#94a3b8', dashArray: '2, 1', shadowWidth: 4.2 },
    5: { width: 3.0, color: '#94a3b8', dashArray: '2, 1', shadowWidth: 3.5 },
    4: { width: 2.3, color: '#a1a1aa', dashArray: '2, 1', shadowWidth: 2.8 },
    3: { width: 1.8, color: '#cbd5e1', shadowWidth: 2.2 },
    2: { width: 1.4, color: '#e2e8f0', shadowWidth: 1.8 },
    1: { width: 1.0, color: '#f8fafc', shadowWidth: 1.4 },
  };

  // Generate complete 6 x 25 matrix
  const matrix = useMemo(() => {
    return generateFretboardMatrix(tuning, currentKey, accidentalMode);
  }, [tuning, currentKey, accidentalMode]);

  // Harmonic profile mapping pitch class (0..11) to degree, role, chord tone, preferred name
  const harmonicProfile = useMemo(() => {
    return getHarmonicProfile(currentKey, activeScale, activeChord, accidentalMode);
  }, [currentKey, activeScale, activeChord, accidentalMode]);

  // Precompute Overlay Data
  const cagedData = useMemo(() => getCagedOverlays(currentKey), [currentKey]);
  const highwayData = useMemo(() => getDiagonalHighway(currentKey), [currentKey]);
  const bbData = useMemo(() => getBbKingBox(currentKey), [currentKey]);
  const albertData = useMemo(() => getAlbertKingBox(currentKey), [currentKey]);
  const threeNpsData = useMemo(() => getThreeNpsShape(currentKey, threeNpsShape), [currentKey, threeNpsShape]);
  const triadData = useMemo(() => getMovableTriadInversions(currentKey, triadStringSet), [currentKey, triadStringSet]);

  // Phase 3 Progression Voice-Leading & Harmonic Targets
  const isProgressionMode = studioMode === 'progression' && !!progressionAnalysis;
  const currentChordAnalysis = useMemo(() => {
    if (!isProgressionMode || !progressionAnalysis) return null;
    return progressionAnalysis.chords[currentChordIndex] || null;
  }, [isProgressionMode, progressionAnalysis, currentChordIndex]);

  const chordRootPc = useMemo(() => {
    if (!currentChordAnalysis) return -1;
    return noteToPitchClass(currentChordAnalysis.root);
  }, [currentChordAnalysis]);

  const guideTonePcs = useMemo(() => {
    if (!currentChordAnalysis || !showGuideToneHalos) return new Set<number>();
    return new Set(currentChordAnalysis.guide_tones.map((t) => noteToPitchClass(t)));
  }, [currentChordAnalysis, showGuideToneHalos]);

  const commonTonePcs = useMemo(() => {
    if (!currentChordAnalysis || !showCommonToneBadges) return new Set<number>();
    return new Set(currentChordAnalysis.common_tones_with_next.map((t) => noteToPitchClass(t)));
  }, [currentChordAnalysis, showCommonToneBadges]);

  interface VoiceLeadingVectorArc {
    stringNumber: number;
    fromFret: number;
    toFret: number;
    fromX: number;
    toX: number;
    y: number;
    label: string;
    diff: number;
    isGuideTone: boolean;
  }

  const voiceLeadingVectors = useMemo(() => {
    if (!isProgressionMode || !currentChordAnalysis || !showVoiceLeadingVectors) return [];

    const vectors: VoiceLeadingVectorArc[] = [];
    const steps = currentChordAnalysis.voice_leading_to_next;
    if (!steps || steps.length === 0) return [];

    const minFret = staticPositionFret !== null ? staticPositionFret : 1;
    const maxFret = staticPositionFret !== null ? Math.min(24, staticPositionFret + 4) : 24;

    for (const step of steps) {
      const fromPc = noteToPitchClass(step.from_note);
      const toPc = noteToPitchClass(step.to_note);

      let diff = (toPc - fromPc + 12) % 12;
      if (diff > 6) diff -= 12;

      // Focus on half-step (-1, +1) and whole-step (-2, +2) scalar/voice shifts
      if (diff === 0 || Math.abs(diff) > 2) continue;

      for (let strIdx = 0; strIdx < 6; strIdx++) {
        const strNum = strIdx + 1;
        const stringFrets = matrix[strIdx];
        if (!stringFrets) continue;

        for (const coord of stringFrets) {
          if (coord.fretNumber < minFret || coord.fretNumber > maxFret) continue;

          if (noteToPitchClass(coord.note) === fromPc) {
            const targetFret = coord.fretNumber + diff;
            if (targetFret >= 1 && targetFret <= 24) {
              const fromX = fretCenterPositions[coord.fretNumber];
              const toX = fretCenterPositions[targetFret];
              const y = stringYPositions[strNum];
              const label =
                diff === 1
                  ? '½ step ↑'
                  : diff === -1
                  ? '½ step ↓'
                  : diff === 2
                  ? '1 step ↑'
                  : '1 step ↓';

              vectors.push({
                stringNumber: strNum,
                fromFret: coord.fretNumber,
                toFret: targetFret,
                fromX,
                toX,
                y,
                label,
                diff,
                isGuideTone: step.is_guide_tone_resolution,
              });
            }
          }
        }
      }
    }

    return vectors;
  }, [
    isProgressionMode,
    currentChordAnalysis,
    showVoiceLeadingVectors,
    staticPositionFret,
    matrix,
    fretCenterPositions,
    stringYPositions,
  ]);

  // Dynamic SVG viewBox computation based on fretRange and active overlay
  const viewBoxString = useMemo(() => {
    if (fretRange === 'open_to_12') {
      const width = fretXPositions[12] + 40;
      return `0 0 ${width} ${totalSvgHeight}`;
    }
    if (fretRange === 'upper_12_24') {
      const minX = fretXPositions[11] - 20;
      const width = totalSvgWidth - minX;
      return `${minX} 0 ${width} ${totalSvgHeight}`;
    }
    if (fretRange === 'box_focus') {
      let span: [number, number] = [4, 10];
      if (highlightedCoachTarget && highlightedCoachTarget.fret > 0) {
        span = [
          Math.max(1, highlightedCoachTarget.fret - 2),
          Math.min(24, highlightedCoachTarget.fret + 2),
        ];
      } else if (staticPositionFret !== null) {
        span = [staticPositionFret, Math.min(24, staticPositionFret + 4)];
      } else if (activeOverlay === 'caged' && cagedData[cagedShape]) {
        span = cagedData[cagedShape].fretSpan;
      } else if (activeOverlay === 'three_nps') {
        span = threeNpsData.fretSpan;
      } else if (activeOverlay === 'bb_king_box') {
        span = bbData.fretSpan;
      } else if (activeOverlay === 'albert_king_box') {
        span = albertData.fretSpan;
      } else if (activeOverlay === 'diagonal_highway') {
        span = highwayData.fretSpan;
      } else if (activeOverlay === 'triads' && triadData[0]) {
        span = triadData[0].fretSpan;
      }

      const minFret = Math.max(1, span[0]);
      const maxFret = Math.min(24, span[1]);
      const minX = Math.max(0, fretXPositions[minFret - 1] - 30);
      const width = Math.min(totalSvgWidth - minX, fretXPositions[maxFret] - minX + 40);
      return `${minX} 0 ${Math.max(350, width)} ${totalSvgHeight}`;
    }
    // Full 24-fret view
    return `0 0 ${totalSvgWidth} ${totalSvgHeight}`;
  }, [
    fretRange,
    fretXPositions,
    totalSvgWidth,
    totalSvgHeight,
    activeOverlay,
    cagedData,
    cagedShape,
    threeNpsData,
    bbData,
    albertData,
    highwayData,
    triadData,
    staticPositionFret,
  ]);

  const handleCellClick = (coord: FretCoordinate) => {
    const pc = noteToPitchClass(coord.note);
    const harmonicInfo = harmonicProfile.get(pc);

    playFretAudio(coord.pitchWithOctave);
    setInspectedFret({
      coordinate: {
        ...coord,
        note: harmonicInfo ? harmonicInfo.preferredNote : coord.note,
        degree: harmonicInfo?.degree,
        isRoot: harmonicInfo?.isRoot,
      },
      degreeName: harmonicInfo?.degree,
      roleInChordOrScale: harmonicInfo
        ? harmonicInfo.isRoot
          ? 'Root / Tonic (Home Base)'
          : harmonicInfo.isChordTone
          ? `Chord Tone (${harmonicInfo.degree})`
          : `Passing Tone (${harmonicInfo.degree})`
        : 'Chromatic Passing Fret',
    });

    if (targetDrillActive) {
      evaluateDrillClick(coord);
    }
  };

  const tuningObj = TUNINGS[tuning];

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Scrollable Container with Fretboard Canvas */}
      <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950">
        <div
          className={`min-w-[1150px] transition-transform duration-300 ${
            handedness === 'left' ? 'scale-x-[-1]' : ''
          }`}
        >
          <svg
            viewBox={viewBoxString}
            className="w-full h-auto select-none"
            style={{ filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.75))' }}
          >
            <defs>
              {/* Rich Dark Macassar Ebony / Indian Rosewood Grain Gradient */}
              <linearGradient id="fretboardWoodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e1512" />
                <stop offset="25%" stopColor="#18110e" />
                <stop offset="50%" stopColor="#140e0c" />
                <stop offset="75%" stopColor="#110b0a" />
                <stop offset="100%" stopColor="#0d0908" />
              </linearGradient>

              {/* Headstock Dark Wood Gradient */}
              <linearGradient id="headstockGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d0908" />
                <stop offset="100%" stopColor="#1a1210" />
              </linearGradient>

              {/* Top Neck Binding Strip */}
              <linearGradient id="neckBindingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fdfbf7" />
                <stop offset="50%" stopColor="#f3efe0" />
                <stop offset="100%" stopColor="#e2dccb" />
              </linearGradient>

              {/* Crowned Nickel-Silver Fret Wire Specular Gradient */}
              <linearGradient id="fretWireCrown" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="35%" stopColor="#cbd5e1" />
                <stop offset="55%" stopColor="#ffffff" />
                <stop offset="75%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Bone Nut */}
              <linearGradient id="boneNutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#faf7f2" />
                <stop offset="40%" stopColor="#eee8d5" />
                <stop offset="80%" stopColor="#ded5be" />
                <stop offset="100%" stopColor="#c5baa0" />
              </linearGradient>

              {/* Mother of Pearl Inlays */}
              <radialGradient id="pearlInlayGrad" cx="45%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#f1f5f9" />
                <stop offset="85%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </radialGradient>

              {/* Ambient Hover Fret Glow */}
              <linearGradient id="cellHoverGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
              </linearGradient>

              {/* Arrow Marker for Diagonal Highway & Bends */}
              <marker
                id="slideArrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker
                id="bendArrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
              </marker>

              {/* Arrow Markers for Voice-Leading Progression Vectors */}
              <marker
                id="vlArrowDown"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
              </marker>
              <marker
                id="vlArrowUp"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
            </defs>

            {/* 1. Headstock / Open String Zone Background */}
            <rect
              x={0}
              y={NECK_Y}
              width={HEADSTOCK_WIDTH}
              height={NECK_HEIGHT}
              fill="url(#headstockGrad)"
              stroke="#271c18"
              strokeWidth="1"
            />

            {/* 2. Main Fretboard Wooden Plank */}
            <rect
              x={NUT_X}
              y={NECK_Y}
              width={fretXPositions[24] - NUT_X}
              height={NECK_HEIGHT}
              fill="url(#fretboardWoodGrad)"
              stroke="#271c18"
              strokeWidth="1"
            />

            {/* 3. Top Neck Binding Strip */}
            <rect
              x={NUT_X}
              y={NECK_Y - BINDING_HEIGHT}
              width={fretXPositions[24] - NUT_X}
              height={BINDING_HEIGHT}
              fill="url(#neckBindingGrad)"
              stroke="#c5baa0"
              strokeWidth="0.5"
            />

            {/* 4. Side Dots along the Top Binding */}
            {SINGLE_DOT_FRETS.map((fret) => {
              const cx = fretCenterPositions[fret];
              const cy = NECK_Y - BINDING_HEIGHT / 2;
              return (
                <circle
                  key={`side-dot-${fret}`}
                  cx={cx}
                  cy={cy}
                  r={2.2}
                  fill="#18181b"
                  opacity={0.9}
                />
              );
            })}
            {DOUBLE_DOT_FRETS.map((fret) => {
              const cx = fretCenterPositions[fret];
              const cy = NECK_Y - BINDING_HEIGHT / 2;
              return (
                <g key={`side-double-dot-${fret}`}>
                  <circle cx={cx - 3.5} cy={cy} r={1.9} fill="#18181b" opacity={0.9} />
                  <circle cx={cx + 3.5} cy={cy} r={1.9} fill="#18181b" opacity={0.9} />
                </g>
              );
            })}

            {/* 5. Center Mother-of-Pearl Inlays */}
            {SINGLE_DOT_FRETS.map((fret) => {
              const cx = fretCenterPositions[fret];
              const cy = NECK_Y + NECK_HEIGHT / 2;
              return (
                <circle
                  key={`inlay-${fret}`}
                  cx={cx}
                  cy={cy}
                  r={5.5}
                  fill="url(#pearlInlayGrad)"
                  stroke="#64748b"
                  strokeWidth="0.5"
                  opacity={0.88}
                />
              );
            })}

            {/* 12th & 24th Octave Double Pearl Inlays */}
            {DOUBLE_DOT_FRETS.map((fret) => {
              const cx = fretCenterPositions[fret];
              const cy1 = NECK_Y + NECK_HEIGHT * 0.35;
              const cy2 = NECK_Y + NECK_HEIGHT * 0.65;
              return (
                <g key={`double-inlay-${fret}`}>
                  <circle
                    cx={cx}
                    cy={cy1}
                    r={5}
                    fill="url(#pearlInlayGrad)"
                    stroke="#64748b"
                    strokeWidth="0.5"
                    opacity={0.92}
                  />
                  <circle
                    cx={cx}
                    cy={cy2}
                    r={5}
                    fill="url(#pearlInlayGrad)"
                    stroke="#64748b"
                    strokeWidth="0.5"
                    opacity={0.92}
                  />
                </g>
              );
            })}

            {/* 6. Crowned Nickel-Silver Fret Wires */}
            {fretXPositions.slice(1).map((x, idx) => {
              const fretNum = idx + 1;
              const isOctaveFret = fretNum === 12 || fretNum === 24;
              const wireWidth = isOctaveFret ? 3.2 : 2.2;

              return (
                <g key={`fretwire-${fretNum}`}>
                  <line
                    x1={x - wireWidth / 2}
                    y1={NECK_Y}
                    x2={x - wireWidth / 2}
                    y2={NECK_Y + NECK_HEIGHT}
                    stroke="#000000"
                    strokeWidth="0.8"
                    opacity={0.45}
                  />
                  <line
                    x1={x}
                    y1={NECK_Y}
                    x2={x}
                    y2={NECK_Y + NECK_HEIGHT}
                    stroke="url(#fretWireCrown)"
                    strokeWidth={wireWidth}
                  />
                  <line
                    x1={x + wireWidth / 2 + 0.5}
                    y1={NECK_Y}
                    x2={x + wireWidth / 2 + 0.5}
                    y2={NECK_Y + NECK_HEIGHT}
                    stroke="#000000"
                    strokeWidth="0.8"
                    opacity={0.3}
                  />
                </g>
              );
            })}

            {/* 7. Bone Nut with Notches */}
            <rect
              x={NUT_X - NUT_WIDTH}
              y={NECK_Y - 2}
              width={NUT_WIDTH}
              height={NECK_HEIGHT + 4}
              rx={2}
              fill="url(#boneNutGrad)"
              stroke="#b5a990"
              strokeWidth="0.8"
            />
            {[1, 2, 3, 4, 5, 6].map((strNum) => {
              const y = stringYPositions[strNum];
              return (
                <line
                  key={`notch-${strNum}`}
                  x1={NUT_X - NUT_WIDTH}
                  y1={y}
                  x2={NUT_X}
                  y2={y}
                  stroke="#786c55"
                  strokeWidth="1.2"
                />
              );
            })}

            {/* ========================================================================= */}
            {/* 8. VISUAL SOLOING OVERLAYS (TASK-2.4)                                     */}
            {/* ========================================================================= */}

            {/* 8A. CAGED OVERLAYS */}
            {activeOverlay === 'caged' && (
              <g className="caged-overlays">
                {(cagedShowAll
                  ? (['C', 'A', 'G', 'E', 'D'] as CagedShape[])
                  : [cagedShape]
                ).map((s) => {
                  const data = cagedData[s];
                  if (!data) return null;
                  const [minF, maxF] = data.fretSpan;
                  const x1 = minF === 0 ? NUT_X : fretXPositions[minF - 1];
                  const x2 = fretXPositions[Math.min(24, maxF)];
                  const width = x2 - x1;
                  const cfg = CAGED_COLORS[s];

                  return (
                    <g key={`caged-zone-${s}`}>
                      {/* Translucent Bounding Hull */}
                      <rect
                        x={x1}
                        y={NECK_Y + 2}
                        width={width}
                        height={NECK_HEIGHT - 4}
                        rx={8}
                        fill={cfg.fill}
                        stroke={cfg.stroke}
                        strokeWidth={cagedShowAll ? 1.5 : 2.5}
                        strokeDasharray={cagedShowAll ? '4, 2' : undefined}
                        className="transition-all"
                      />
                      {/* Shape Header Badge */}
                      <rect
                        x={x1 + 6}
                        y={NECK_Y + 6}
                        width={52}
                        height={18}
                        rx={4}
                        fill="#09090b"
                        stroke={cfg.stroke}
                        strokeWidth={1}
                        opacity={0.9}
                      />
                      <text
                        x={x1 + 32}
                        y={NECK_Y + 19}
                        textAnchor="middle"
                        className="text-[9.5px] font-black fill-white pointer-events-none"
                      >
                        Shape {s}
                      </text>

                      {/* Connectors between Root Anchors */}
                      {data.rootCoordinates.length > 1 && (
                        <line
                          x1={fretCenterPositions[data.rootCoordinates[0].fretNumber]}
                          y1={stringYPositions[data.rootCoordinates[0].stringNumber]}
                          x2={fretCenterPositions[data.rootCoordinates[1].fretNumber]}
                          y2={stringYPositions[data.rootCoordinates[1].stringNumber]}
                          stroke={cfg.stroke}
                          strokeWidth={2}
                          strokeDasharray="4, 3"
                          opacity={0.85}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* 8B. 3-NOTES-PER-STRING MODAL OVERLAY */}
            {activeOverlay === 'three_nps' && (
              <g className="3nps-overlay">
                {(() => {
                  const [minF, maxF] = threeNpsData.fretSpan;
                  const x1 = minF === 0 ? NUT_X : fretXPositions[minF - 1];
                  const x2 = fretXPositions[Math.min(24, maxF)];
                  const width = x2 - x1;

                  return (
                    <g>
                      <rect
                        x={x1}
                        y={NECK_Y + 2}
                        width={width}
                        height={NECK_HEIGHT - 4}
                        rx={8}
                        fill="rgba(168, 85, 247, 0.12)"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                      />
                      <rect
                        x={x1 + 6}
                        y={NECK_Y + 6}
                        width={130}
                        height={18}
                        rx={4}
                        fill="#09090b"
                        stroke="#a855f7"
                        strokeWidth={1}
                        opacity={0.95}
                      />
                      <text
                        x={x1 + 71}
                        y={NECK_Y + 19}
                        textAnchor="middle"
                        className="text-[9.5px] font-black fill-purple-300 pointer-events-none"
                      >
                        {threeNpsData.modeName} (3NPS)
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* 8C. THE DIAGONAL PENTATONIC HIGHWAY */}
            {activeOverlay === 'diagonal_highway' && (
              <g className="highway-overlay">
                {/* Connecting Polyline through all Highway notes */}
                <polyline
                  points={highwayData.notes
                    .map((n) => `${fretCenterPositions[n.fretNumber]},${stringYPositions[n.stringNumber]}`)
                    .join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4, 2"
                  opacity={0.65}
                />

                {/* Directional Slide Vectors on Strings 5, 3, 1 */}
                {highwayData.slides.map((s, idx) => {
                  const xFrom = fretCenterPositions[s.fromFret];
                  const xTo = fretCenterPositions[s.toFret];
                  const y = stringYPositions[s.stringNumber] - 7;

                  return (
                    <g key={`slide-vector-${idx}`}>
                      <line
                        x1={xFrom + 8}
                        y1={y}
                        x2={xTo - 8}
                        y2={y}
                        stroke="#10b981"
                        strokeWidth={2.5}
                        markerEnd="url(#slideArrow)"
                      />
                      <text
                        x={(xFrom + xTo) / 2}
                        y={y - 4}
                        textAnchor="middle"
                        className="text-[8.5px] font-black fill-emerald-300 pointer-events-none"
                      >
                        SLIDE
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* 8D. B.B. KING BOX */}
            {activeOverlay === 'bb_king_box' && (
              <g className="bb-box-overlay">
                {(() => {
                  const [minF, maxF] = bbData.fretSpan;
                  const x1 = fretXPositions[Math.max(0, minF - 1)];
                  const x2 = fretXPositions[Math.min(24, maxF)];
                  const y1 = stringYPositions[1] - STRING_SPACING * 0.4;
                  const height = stringYPositions[3] - y1 + STRING_SPACING * 0.4;

                  return (
                    <g>
                      <rect
                        x={x1}
                        y={y1}
                        width={x2 - x1}
                        height={height}
                        rx={8}
                        fill="rgba(239, 68, 68, 0.12)"
                        stroke="#ef4444"
                        strokeWidth={2}
                      />
                      {/* B.B. King Box Badge */}
                      <rect
                        x={x1 + 6}
                        y={y1 + 4}
                        width={85}
                        height={16}
                        rx={3}
                        fill="#09090b"
                        stroke="#ef4444"
                        strokeWidth={1}
                      />
                      <text
                        x={x1 + 48}
                        y={y1 + 16}
                        textAnchor="middle"
                        className="text-[9px] font-black fill-red-300 pointer-events-none"
                      >
                        B.B. King Box
                      </text>

                      {/* Signature Major 6th Bend Indicator */}
                      {bbData.bendNotes.map((bn, i) => {
                        const bx = fretCenterPositions[bn.fretNumber];
                        const by = stringYPositions[bn.stringNumber];
                        return (
                          <g key={`bb-bend-${i}`}>
                            <path
                              d={`M ${bx} ${by - 12} Q ${bx + 8} ${by - 24} ${bx + 18} ${by - 20}`}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              markerEnd="url(#bendArrow)"
                            />
                            <text
                              x={bx + 20}
                              y={by - 24}
                              className="text-[8px] font-black fill-amber-300 pointer-events-none"
                            >
                              FULL BEND
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </g>
            )}

            {/* 8E. ALBERT KING BOX */}
            {activeOverlay === 'albert_king_box' && (
              <g className="albert-box-overlay">
                {(() => {
                  const [minF, maxF] = albertData.fretSpan;
                  const x1 = fretXPositions[Math.max(0, minF - 1)];
                  const x2 = fretXPositions[Math.min(24, maxF)];
                  const y1 = stringYPositions[1] - STRING_SPACING * 0.4;
                  const height = stringYPositions[3] - y1 + STRING_SPACING * 0.4;

                  const cx = fretCenterPositions[albertData.cryBendNote.fretNumber];
                  const cy = stringYPositions[albertData.cryBendNote.stringNumber];

                  return (
                    <g>
                      <rect
                        x={x1}
                        y={y1}
                        width={x2 - x1}
                        height={height}
                        rx={8}
                        fill="rgba(249, 115, 22, 0.12)"
                        stroke="#f97316"
                        strokeWidth={2}
                      />
                      <rect
                        x={x1 + 6}
                        y={y1 + 4}
                        width={95}
                        height={16}
                        rx={3}
                        fill="#09090b"
                        stroke="#f97316"
                        strokeWidth={1}
                      />
                      <text
                        x={x1 + 53}
                        y={y1 + 16}
                        textAnchor="middle"
                        className="text-[9px] font-black fill-orange-300 pointer-events-none"
                      >
                        Albert King Box
                      </text>

                      {/* 1.5-Step Cry Bend Indicator */}
                      <path
                        d={`M ${cx} ${cy - 12} Q ${cx + 10} ${cy - 28} ${cx + 22} ${cy - 24}`}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth={2.5}
                        markerEnd="url(#bendArrow)"
                      />
                      <text
                        x={cx + 24}
                        y={cy - 28}
                        className="text-[8.5px] font-black fill-orange-300 pointer-events-none"
                      >
                        1.5-STEP CRY BEND
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* 8F. MOVABLE TRIADS */}
            {activeOverlay === 'triads' && (
              <g className="triad-overlays">
                {triadData.map((t, idx) => {
                  const [minF, maxF] = t.fretSpan;
                  const x1 = fretXPositions[Math.max(0, minF - 1)];
                  const x2 = fretXPositions[Math.min(24, maxF)];
                  const strings = t.notes.map((n) => n.stringNumber);
                  const minStr = Math.min(...strings);
                  const maxStr = Math.max(...strings);
                  const y1 = stringYPositions[minStr] - STRING_SPACING * 0.4;
                  const height = stringYPositions[maxStr] - y1 + STRING_SPACING * 0.4;

                  return (
                    <g key={`triad-shape-${idx}`}>
                      <rect
                        x={x1}
                        y={y1}
                        width={x2 - x1}
                        height={height}
                        rx={6}
                        fill="rgba(245, 158, 11, 0.12)"
                        stroke="#f59e0b"
                        strokeWidth={1.8}
                        strokeDasharray="3, 2"
                      />
                      <text
                        x={x1 + 6}
                        y={y1 + 12}
                        className="text-[8px] font-black fill-amber-300 pointer-events-none"
                      >
                        {t.inversion}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* 8G. PROGRESSION STATIC HAND POSITION LOCK */}
            {staticPositionFret !== null && (
              <g className="static-hand-lock">
                {(() => {
                  const startFret = staticPositionFret;
                  const endFret = Math.min(24, staticPositionFret + 4);
                  const x1 = fretXPositions[startFret - 1];
                  const x2 = fretXPositions[endFret];
                  const width = x2 - x1;

                  return (
                    <g>
                      {/* Luminous Neon Position Bounding Frame */}
                      <rect
                        x={x1}
                        y={NECK_Y - 2}
                        width={width}
                        height={NECK_HEIGHT + 4}
                        rx={8}
                        fill="rgba(6, 182, 212, 0.08)"
                        stroke="#06b6d4"
                        strokeWidth={2.4}
                        strokeDasharray="6, 3"
                      />
                      {/* Top Hand Position Banner Tag */}
                      <rect
                        x={x1 + 6}
                        y={NECK_Y - 19}
                        width={132}
                        height={16}
                        rx={4}
                        fill="#083344"
                        stroke="#06b6d4"
                        strokeWidth={1}
                      />
                      <text
                        x={x1 + 72}
                        y={NECK_Y - 8}
                        textAnchor="middle"
                        className={`text-[8px] font-black fill-cyan-300 tracking-wider pointer-events-none uppercase ${
                          handedness === 'left' ? 'scale-x-[-1]' : ''
                        }`}
                      >
                        🎯 Hand Lock: Frets {startFret}–{endFret}
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* 8H. PROGRESSION VOICE-LEADING VECTOR ARCS */}
            {voiceLeadingVectors.length > 0 && (
              <g className="voice-leading-vectors">
                {voiceLeadingVectors.map((vec, idx) => {
                  const isAscending = vec.diff > 0;
                  const strokeColor = isAscending ? '#10b981' : '#06b6d4';
                  const markerId = isAscending ? 'url(#vlArrowUp)' : 'url(#vlArrowDown)';
                  const midX = (vec.fromX + vec.toX) / 2;
                  const arcHeight = Math.abs(vec.diff) === 1 ? 14 : 20;
                  const controlY = vec.y - arcHeight;

                  return (
                    <g key={`vl-vector-${idx}`} className="transition-all">
                      <path
                        d={`M ${vec.fromX} ${vec.y - 7} Q ${midX} ${controlY} ${vec.toX} ${vec.y - 7}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={vec.isGuideTone ? 2.5 : 1.8}
                        strokeDasharray={vec.isGuideTone ? undefined : '3, 2'}
                        markerEnd={markerId}
                      />
                      <rect
                        x={midX - 16}
                        y={controlY - 9}
                        width={32}
                        height={11}
                        rx={3}
                        fill="#09090b"
                        stroke={strokeColor}
                        strokeWidth={0.8}
                        opacity={0.95}
                      />
                      <text
                        x={midX}
                        y={controlY - 1}
                        textAnchor="middle"
                        className={`text-[6.5px] font-black ${
                          isAscending ? 'fill-emerald-300' : 'fill-cyan-300'
                        } pointer-events-none ${handedness === 'left' ? 'scale-x-[-1]' : ''}`}
                      >
                        {vec.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* 9. Full-Cell Interactive Hitboxes & Hover Highlights */}
            {matrix.map((stringFrets, strIdx) => {
              const strNum = strIdx + 1;
              const y = stringYPositions[strNum];

              return stringFrets.map((coord) => {
                const isHovered =
                  hoveredCell?.stringNumber === strNum &&
                  hoveredCell?.fretNumber === coord.fretNumber;

                const leftX = coord.fretNumber === 0 ? 0 : fretXPositions[coord.fretNumber - 1];
                const rightX = coord.fretNumber === 0 ? NUT_X - NUT_WIDTH : fretXPositions[coord.fretNumber];
                const cellWidth = rightX - leftX;

                return (
                  <rect
                    key={`hitbox-${strNum}-${coord.fretNumber}`}
                    x={leftX}
                    y={y - STRING_SPACING / 2}
                    width={cellWidth}
                    height={STRING_SPACING}
                    fill={isHovered ? 'url(#cellHoverGlow)' : 'transparent'}
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() =>
                      setHoveredCell({ stringNumber: strNum, fretNumber: coord.fretNumber })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => handleCellClick(coord)}
                  />
                );
              });
            })}

            {/* 10. Strings with Gauges, Shadows & Textures */}
            {[1, 2, 3, 4, 5, 6].map((strNum) => {
              const y = stringYPositions[strNum];
              const style = stringStyles[strNum];

              return (
                <g key={`guitar-string-${strNum}`}>
                  <line
                    x1={0}
                    y1={y + 1.8}
                    x2={fretXPositions[24] + 20}
                    y2={y + 1.8}
                    stroke="#000000"
                    strokeWidth={style.shadowWidth}
                    opacity={0.42}
                  />
                  <line
                    x1={0}
                    y1={y}
                    x2={fretXPositions[24] + 20}
                    y2={y}
                    stroke={style.color}
                    strokeWidth={style.width}
                    strokeDasharray={style.dashArray}
                    strokeLinecap="round"
                  />
                  {!style.dashArray && (
                    <line
                      x1={0}
                      y1={y - 0.3}
                      x2={fretXPositions[24] + 20}
                      y2={y - 0.3}
                      stroke="#ffffff"
                      strokeWidth={style.width * 0.4}
                      opacity={0.65}
                    />
                  )}
                </g>
              );
            })}

            {/* 11. Headstock Open-String Badges (Fret 0) */}
            {[1, 2, 3, 4, 5, 6].map((strNum) => {
              const y = stringYPositions[strNum];
              const openPitch = tuningObj.strings[strNum - 1] || 'E2';
              const openNote = openPitch.slice(0, -1) as NoteName;
              const pc = noteToPitchClass(openNote);
              const harmonicInfo = harmonicProfile.get(pc);

              const isInScale = !!harmonicInfo;
              const isRoot = harmonicInfo?.isRoot || openNote === currentKey;
              const degreeConfig = getDegreeColor(harmonicInfo?.degree);

              const isGuideTone = isProgressionMode && showGuideToneHalos && guideTonePcs.has(pc);
              let guideToneLabel: '3rd' | '7th' | null = null;
              if (isGuideTone && chordRootPc !== -1) {
                const diffFromRoot = (pc - chordRootPc + 12) % 12;
                if (diffFromRoot === 3 || diffFromRoot === 4) guideToneLabel = '3rd';
                else if (diffFromRoot === 10 || diffFromRoot === 11) guideToneLabel = '7th';
              }
              const isCommonTone = isProgressionMode && showCommonToneBadges && commonTonePcs.has(pc);
              const openStringDimmed = staticPositionFret !== null && staticPositionFret > 1;

              return (
                <g
                  key={`headstock-badge-${strNum}`}
                  className="cursor-pointer group"
                  opacity={openStringDimmed ? 0.25 : 1}
                  onClick={() => {
                    const coord = matrix[strNum - 1]?.[0];
                    if (coord) handleCellClick(coord);
                  }}
                >
                  {isGuideTone && guideToneLabel && (
                    <g>
                      <circle
                        cx={OPEN_STRING_X}
                        cy={y}
                        r={16.5}
                        fill="none"
                        stroke={guideToneLabel === '3rd' ? '#f59e0b' : '#a855f7'}
                        strokeWidth={2}
                        strokeDasharray="3, 2"
                        className="animate-spin-slow"
                        opacity={0.9}
                      />
                      <rect
                        x={OPEN_STRING_X + 5}
                        y={y - 15}
                        width={18}
                        height={9.5}
                        rx={2.5}
                        fill={guideToneLabel === '3rd' ? '#f59e0b' : '#a855f7'}
                      />
                      <text
                        x={OPEN_STRING_X + 14}
                        y={y - 7.5}
                        textAnchor="middle"
                        className={`text-[7px] font-black fill-zinc-950 pointer-events-none ${
                          handedness === 'left' ? 'scale-x-[-1]' : ''
                        }`}
                      >
                        {guideToneLabel}
                      </text>
                    </g>
                  )}

                  {isCommonTone && (
                    <g>
                      <circle
                        cx={OPEN_STRING_X - 9}
                        cy={y - 9}
                        r={5.5}
                        fill="#10b981"
                        stroke="#064e3b"
                        strokeWidth={1}
                      />
                      <text
                        x={OPEN_STRING_X - 9}
                        y={y - 6.5}
                        textAnchor="middle"
                        className={`text-[7px] font-black fill-white pointer-events-none ${
                          handedness === 'left' ? 'scale-x-[-1]' : ''
                        }`}
                      >
                        💎
                      </text>
                    </g>
                  )}

                  <circle
                    cx={OPEN_STRING_X}
                    cy={y}
                    r={11.5}
                    fill={isInScale ? degreeConfig.dotFill : '#1c1917'}
                    stroke={
                      isRoot
                        ? '#ffffff'
                        : isInScale
                        ? degreeConfig.dotStroke
                        : '#44403c'
                    }
                    strokeWidth={isRoot ? 2.5 : isInScale ? 1.5 : 1}
                    className="group-hover:scale-110 transition-transform shadow-md"
                  />
                  <text
                    x={OPEN_STRING_X}
                    y={y + 3.5}
                    textAnchor="middle"
                    className={`font-mono text-[9px] font-extrabold pointer-events-none ${
                      handedness === 'left' ? 'scale-x-[-1]' : ''
                    } ${isInScale ? 'fill-white' : 'fill-zinc-400'}`}
                  >
                    {displayMode === 'intervals' && harmonicInfo
                      ? harmonicInfo.degree
                      : openPitch}
                  </text>
                </g>
              );
            })}

            {/* 12. Dynamic Harmonic Note Pins across Strings and Frets 1 to 24 */}
            {matrix.map((stringFrets, strIdx) => {
              const strNum = strIdx + 1;
              const y = stringYPositions[strNum];

              return stringFrets.map((coord) => {
                if (coord.fretNumber === 0) return null;
                const x = fretCenterPositions[coord.fretNumber];

                const pc = noteToPitchClass(coord.note);
                const harmonicInfo = harmonicProfile.get(pc);
                const isInScale = !!harmonicInfo;

                // Static Hand Position Locking Dimmer
                const isInStaticPosition =
                  staticPositionFret === null ||
                  (coord.fretNumber >= staticPositionFret &&
                    coord.fretNumber <= staticPositionFret + 4);
                const pinOpacity = isInStaticPosition ? 1 : 0.2;

                if (!isInScale && densityMode === 'isolated') {
                  return null;
                }

                const isRoot = harmonicInfo?.isRoot || coord.note === currentKey;
                const isChordTone = harmonicInfo?.isChordTone || false;
                const isPlaying =
                  activePlayingPin?.stringNumber === strNum &&
                  activePlayingPin?.fretNumber === coord.fretNumber;

                const isOctaveHighlighted =
                  highlightedOctaveNote && coord.note === highlightedOctaveNote;

                // Guide Tone and Common Tone checks for progression flight path
                const isGuideTone =
                  isProgressionMode && showGuideToneHalos && guideTonePcs.has(pc);
                let guideToneLabel: '3rd' | '7th' | null = null;
                if (isGuideTone && chordRootPc !== -1) {
                  const diffFromRoot = (pc - chordRootPc + 12) % 12;
                  if (diffFromRoot === 3 || diffFromRoot === 4) guideToneLabel = '3rd';
                  else if (diffFromRoot === 10 || diffFromRoot === 11) guideToneLabel = '7th';
                }

                const isCommonTone =
                  isProgressionMode && showCommonToneBadges && commonTonePcs.has(pc);

                if (!isInScale && densityMode === 'ghost') {
                  return (
                    <g
                      key={`pin-${strNum}-${coord.fretNumber}`}
                      onClick={() => handleCellClick(coord)}
                      className="cursor-pointer group"
                      opacity={pinOpacity}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={8.5}
                        fill="#18181b"
                        stroke="#27272a"
                        strokeWidth={0.8}
                        opacity={0.5}
                        className="group-hover:opacity-100 group-hover:stroke-zinc-500 transition-all"
                      />
                      <text
                        x={x}
                        y={y + 3}
                        textAnchor="middle"
                        className={`text-[8px] font-medium fill-zinc-600 group-hover:fill-zinc-300 pointer-events-none ${
                          handedness === 'left' ? 'scale-x-[-1]' : ''
                        }`}
                      >
                        {coord.note}
                      </text>
                    </g>
                  );
                }

                if (!isInScale && densityMode === 'all') {
                  return (
                    <g
                      key={`pin-${strNum}-${coord.fretNumber}`}
                      onClick={() => handleCellClick(coord)}
                      className="cursor-pointer group"
                      opacity={pinOpacity}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={9.5}
                        fill="#18181b"
                        stroke="#3f3f46"
                        strokeWidth={1}
                        className="group-hover:stroke-zinc-400 transition-all"
                      />
                      <text
                        x={x}
                        y={y + 3.2}
                        textAnchor="middle"
                        className={`text-[8.5px] font-semibold fill-zinc-400 group-hover:fill-white pointer-events-none ${
                          handedness === 'left' ? 'scale-x-[-1]' : ''
                        }`}
                      >
                        {coord.note}
                      </text>
                    </g>
                  );
                }

                const degreeConfig = getDegreeColor(harmonicInfo?.degree);
                const isDimmedPassingTone = highlightChordTones && !isChordTone;

                return (
                  <g
                    key={`pin-${strNum}-${coord.fretNumber}`}
                    onClick={() => handleCellClick(coord)}
                    className="cursor-pointer group"
                    opacity={pinOpacity}
                  >
                    {(isPlaying || isOctaveHighlighted) && (
                      <circle
                        cx={x}
                        cy={y}
                        r={18}
                        fill={isOctaveHighlighted ? '#a855f7' : '#ef4444'}
                        opacity={0.38}
                        className="animate-ping"
                      />
                    )}

                    {harmonicInfo?.degree === 'b5' && (
                      <circle
                        cx={x}
                        cy={y}
                        r={14}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth={1.5}
                        strokeDasharray="3, 2"
                        opacity={0.7}
                        className="animate-spin-slow"
                      />
                    )}

                    {/* Guide Tone Target Halo & Badge (3rd or 7th) */}
                    {isGuideTone && guideToneLabel && (
                      <g>
                        <circle
                          cx={x}
                          cy={y}
                          r={16.5}
                          fill="none"
                          stroke={guideToneLabel === '3rd' ? '#f59e0b' : '#a855f7'}
                          strokeWidth={2}
                          strokeDasharray="3, 2"
                          className="animate-spin-slow"
                          opacity={0.9}
                        />
                        <rect
                          x={x + 5}
                          y={y - 15}
                          width={18}
                          height={9.5}
                          rx={2.5}
                          fill={guideToneLabel === '3rd' ? '#f59e0b' : '#a855f7'}
                          className="shadow-sm"
                        />
                        <text
                          x={x + 14}
                          y={y - 7.5}
                          textAnchor="middle"
                          className={`text-[7px] font-black fill-zinc-950 pointer-events-none ${
                            handedness === 'left' ? 'scale-x-[-1]' : ''
                          }`}
                        >
                          {guideToneLabel}
                        </text>
                      </g>
                    )}

                    {/* Coach Target Spotlight Pulsing Halo & Badge */}
                    {highlightedCoachTarget &&
                      highlightedCoachTarget.string === strNum &&
                      highlightedCoachTarget.fret === coord.fretNumber && (
                        <g className="coach-target-spotlight">
                          <circle
                            cx={x}
                            cy={y}
                            r={22}
                            fill="rgba(56, 189, 248, 0.28)"
                            stroke="#38bdf8"
                            strokeWidth={2.4}
                            strokeDasharray="4, 3"
                            className="animate-spin-slow"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r={26}
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth={1}
                            className="animate-ping opacity-75"
                          />
                          <rect
                            x={x - 26}
                            y={y - 25}
                            width={52}
                            height={13}
                            rx={3}
                            fill="#082f49"
                            stroke="#38bdf8"
                            strokeWidth={1}
                            className="shadow-lg"
                          />
                          <text
                            x={x}
                            y={y - 15.5}
                            textAnchor="middle"
                            className={`text-[6.5px] font-black fill-sky-200 pointer-events-none uppercase tracking-wider ${
                              handedness === 'left' ? 'scale-x-[-1]' : ''
                            }`}
                          >
                            🎯 Coach Target
                          </text>
                        </g>
                      )}

                    {/* Common Tone Pivot Badge */}
                    {isCommonTone && (
                      <g>
                        <circle
                          cx={x - 9}
                          cy={y - 9}
                          r={5.5}
                          fill="#10b981"
                          stroke="#064e3b"
                          strokeWidth={1}
                          className="shadow-sm"
                        />
                        <text
                          x={x - 9}
                          y={y - 6.5}
                          textAnchor="middle"
                          className={`text-[7px] font-black fill-white pointer-events-none ${
                            handedness === 'left' ? 'scale-x-[-1]' : ''
                          }`}
                        >
                          💎
                        </text>
                      </g>
                    )}

                    <circle
                      cx={x}
                      cy={y}
                      r={isRoot ? 11.5 : 10.5}
                      fill={isDimmedPassingTone ? '#18181b' : degreeConfig.dotFill}
                      stroke={
                        isRoot
                          ? '#ffffff'
                          : isDimmedPassingTone
                          ? degreeConfig.dotFill
                          : degreeConfig.dotStroke
                      }
                      strokeWidth={isRoot ? 2.5 : isDimmedPassingTone ? 1.5 : 1}
                      opacity={isDimmedPassingTone ? 0.65 : 1}
                      className="transition-all duration-150 group-hover:r-[13px] group-hover:stroke-white shadow-lg"
                    />

                    <text
                      x={x}
                      y={y + 3.5}
                      textAnchor="middle"
                      className={`text-[9.5px] font-extrabold pointer-events-none ${
                        handedness === 'left' ? 'scale-x-[-1]' : ''
                      } ${
                        isDimmedPassingTone
                          ? 'fill-zinc-400 group-hover:fill-white'
                          : 'fill-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'
                      }`}
                    >
                      {displayMode === 'notes'
                        ? harmonicInfo?.preferredNote || coord.note
                        : harmonicInfo?.degree || coord.note}
                    </text>
                  </g>
                );
              });
            })}

            {/* 13. Fret Numbers */}
            {fretXPositions.map((_, fretNum) => {
              if (fretNum === 0) return null;
              const isMarked =
                SINGLE_DOT_FRETS.includes(fretNum) || DOUBLE_DOT_FRETS.includes(fretNum);
              const isOctaveFret = fretNum === 12 || fretNum === 24;

              return (
                <text
                  key={`fret-label-${fretNum}`}
                  x={fretCenterPositions[fretNum]}
                  y={NECK_Y + NECK_HEIGHT + 22}
                  textAnchor="middle"
                  className={`font-mono text-[11px] font-bold ${
                    handedness === 'left' ? 'scale-x-[-1]' : ''
                  } ${
                    isOctaveFret
                      ? 'fill-amber-400 font-extrabold text-[12px]'
                      : isMarked
                      ? 'fill-zinc-200'
                      : 'fill-zinc-600'
                  }`}
                >
                  {fretNum}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
