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
import { getDegreeColor } from '@/lib/theory/colorMap';
import { FretCoordinate, NoteName } from '@/types/theory';

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
    stringOrientation,
    handedness,
    fretRange,
    highlightedOctaveNote,
    activePlayingPin,
    playFretAudio,
    setInspectedFret,
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
  // TAB view: String 1 (High E) is on top, String 6 (Low E) on bottom
  // Player view: String 6 (Low E) on top, String 1 (High E) on bottom
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
    6: { width: 3.8, color: '#94a3b8', dashArray: '2, 1', shadowWidth: 4.2 }, // Low E wound
    5: { width: 3.0, color: '#94a3b8', dashArray: '2, 1', shadowWidth: 3.5 }, // A wound
    4: { width: 2.3, color: '#a1a1aa', dashArray: '2, 1', shadowWidth: 2.8 }, // D wound
    3: { width: 1.8, color: '#cbd5e1', shadowWidth: 2.2 },                   // G plain steel
    2: { width: 1.4, color: '#e2e8f0', shadowWidth: 1.8 },                   // B plain steel
    1: { width: 1.0, color: '#f8fafc', shadowWidth: 1.4 },                   // High E plain steel
  };

  // Generate complete 6 x 25 matrix
  const matrix = useMemo(() => {
    return generateFretboardMatrix(tuning, currentKey, accidentalMode);
  }, [tuning, currentKey, accidentalMode]);

  // Harmonic profile mapping pitch class (0..11) to degree, role, chord tone, preferred name
  const harmonicProfile = useMemo(() => {
    return getHarmonicProfile(currentKey, activeScale, activeChord, accidentalMode);
  }, [currentKey, activeScale, activeChord, accidentalMode]);

  // Dynamic SVG viewBox computation based on fretRange
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
      // Focus on active 5-fret span (frets 4 to 10)
      const minFret = 4;
      const maxFret = 10;
      const minX = Math.max(0, fretXPositions[minFret - 1] - 30);
      const width = fretXPositions[maxFret] - minX + 30;
      return `${minX} 0 ${width} ${totalSvgHeight}`;
    }
    // Full 24-fret view
    return `0 0 ${totalSvgWidth} ${totalSvgHeight}`;
  }, [fretRange, fretXPositions, totalSvgWidth, totalSvgHeight]);

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

              {/* Bone Nut (Tusq/Bone with slight bevel) */}
              <linearGradient id="boneNutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#faf7f2" />
                <stop offset="40%" stopColor="#eee8d5" />
                <stop offset="80%" stopColor="#ded5be" />
                <stop offset="100%" stopColor="#c5baa0" />
              </linearGradient>

              {/* Mother of Pearl Inlays with Subtle Iridescent Rim */}
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

            {/* 3. Top Neck Binding Strip (with Luthier Ivory Finish) */}
            <rect
              x={NUT_X}
              y={NECK_Y - BINDING_HEIGHT}
              width={fretXPositions[24] - NUT_X}
              height={BINDING_HEIGHT}
              fill="url(#neckBindingGrad)"
              stroke="#c5baa0"
              strokeWidth="0.5"
            />

            {/* 4. Side Dots along the Top Binding (Authentic Player View) */}
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

            {/* 5. Center Mother-of-Pearl Inlays (Position Dots) */}
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

            {/* 6. Crowned Nickel-Silver Fret Wires (Frets 1 to 24) */}
            {fretXPositions.slice(1).map((x, idx) => {
              const fretNum = idx + 1;
              const isOctaveFret = fretNum === 12 || fretNum === 24;
              const wireWidth = isOctaveFret ? 3.2 : 2.2;

              return (
                <g key={`fretwire-${fretNum}`}>
                  {/* Fret wire left shadow */}
                  <line
                    x1={x - wireWidth / 2}
                    y1={NECK_Y}
                    x2={x - wireWidth / 2}
                    y2={NECK_Y + NECK_HEIGHT}
                    stroke="#000000"
                    strokeWidth="0.8"
                    opacity={0.45}
                  />
                  {/* Fret wire crowned highlight */}
                  <line
                    x1={x}
                    y1={NECK_Y}
                    x2={x}
                    y2={NECK_Y + NECK_HEIGHT}
                    stroke="url(#fretWireCrown)"
                    strokeWidth={wireWidth}
                  />
                  {/* Fret wire right soft shadow */}
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

            {/* 7. Bone Nut (Fret 0) with Notches */}
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
            {/* String notches through the bone nut */}
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

            {/* 8. Full-Cell Interactive Hitboxes & Hover Highlights */}
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

            {/* 9. Strings with Gauges, Shadows & Textures */}
            {[1, 2, 3, 4, 5, 6].map((strNum) => {
              const y = stringYPositions[strNum];
              const style = stringStyles[strNum];

              return (
                <g key={`guitar-string-${strNum}`}>
                  {/* Dynamic String Drop-Shadow */}
                  <line
                    x1={0}
                    y1={y + 1.8}
                    x2={fretXPositions[24] + 20}
                    y2={y + 1.8}
                    stroke="#000000"
                    strokeWidth={style.shadowWidth}
                    opacity={0.42}
                  />
                  {/* Wound / Plain Steel String Body */}
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
                  {/* Specular Sheen Stripe on Plain Strings */}
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

            {/* 10. Headstock Open-String Badges (Fret 0) */}
            {[1, 2, 3, 4, 5, 6].map((strNum) => {
              const y = stringYPositions[strNum];
              const openPitch = tuningObj.strings[strNum - 1] || 'E2';
              const openNote = openPitch.slice(0, -1) as NoteName;
              const pc = noteToPitchClass(openNote);
              const harmonicInfo = harmonicProfile.get(pc);

              const isInScale = !!harmonicInfo;
              const isRoot = harmonicInfo?.isRoot || openNote === currentKey;
              const degreeConfig = getDegreeColor(harmonicInfo?.degree);

              return (
                <g
                  key={`headstock-badge-${strNum}`}
                  className="cursor-pointer group"
                  onClick={() => {
                    const coord = matrix[strNum - 1]?.[0];
                    if (coord) handleCellClick(coord);
                  }}
                >
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

            {/* 11. Dynamic Harmonic Note Pins across Strings and Frets 1 to 24 */}
            {matrix.map((stringFrets, strIdx) => {
              const strNum = strIdx + 1;
              const y = stringYPositions[strNum];

              return stringFrets.map((coord) => {
                if (coord.fretNumber === 0) return null; // Fret 0 handled by open badge
                const x = fretCenterPositions[coord.fretNumber];

                const pc = noteToPitchClass(coord.note);
                const harmonicInfo = harmonicProfile.get(pc);
                const isInScale = !!harmonicInfo;

                // Handle density modes
                if (!isInScale && densityMode === 'isolated') {
                  return null; // Clean uncluttered view
                }

                const isRoot = harmonicInfo?.isRoot || coord.note === currentKey;
                const isChordTone = harmonicInfo?.isChordTone || false;
                const isPlaying =
                  activePlayingPin?.stringNumber === strNum &&
                  activePlayingPin?.fretNumber === coord.fretNumber;

                const isOctaveHighlighted =
                  highlightedOctaveNote && coord.note === highlightedOctaveNote;

                // If ghost mode and not in scale:
                if (!isInScale && densityMode === 'ghost') {
                  return (
                    <g
                      key={`pin-${strNum}-${coord.fretNumber}`}
                      onClick={() => handleCellClick(coord)}
                      className="cursor-pointer group"
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

                // If all notes mode and not in scale:
                if (!isInScale && densityMode === 'all') {
                  return (
                    <g
                      key={`pin-${strNum}-${coord.fretNumber}`}
                      onClick={() => handleCellClick(coord)}
                      className="cursor-pointer group"
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

                // Note IS in scale / chord!
                const degreeConfig = getDegreeColor(harmonicInfo?.degree);

                // Soloing Target Mode: dim passing tones if highlightChordTones is on
                const isDimmedPassingTone = highlightChordTones && !isChordTone;

                return (
                  <g
                    key={`pin-${strNum}-${coord.fretNumber}`}
                    onClick={() => handleCellClick(coord)}
                    className="cursor-pointer group"
                  >
                    {/* Animated Pulse for Playback or Octave GPS */}
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

                    {/* Blue Note Special Pulse Ring */}
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

                    {/* Note Pin Circle */}
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

                    {/* Note Name or Degree Label */}
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

            {/* 12. Fret Numbers (Bottom Labeling) */}
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
