import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

interface HologramReceptionistProps {
  onCheckin?: () => void
}

const HologramReceptionist: React.FC<HologramReceptionistProps> = ({
  onCheckin,
}) => {
  const [isClicked, setIsClicked] = useState(false)
  const [actionPhase, setActionPhase] = useState<'idle' | 'arming' | 'locked'>(
    'idle',
  )
  const ARMING_DURATION_MS = 700
  const SEQUENCE_DURATION_MS = 1600

  // Precompute visual effects once to keep animation stable.
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 3,
        duration: 7 + Math.random() * 8,
      })),
    [],
  )

  const rainColumns = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        left: (i / 22) * 100,
        delay: (i * 0.27) % 4,
        duration: 4 + (i % 5) * 0.8,
      })),
    [],
  )

  const sideTicks = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        top: 8 + i * 6,
        width: 28 + (i % 4) * 12,
        delay: (i * 0.13) % 2,
      })),
    [],
  )

  const handleCheckin = () => {
    if (actionPhase !== 'idle') {
      return
    }

    setActionPhase('arming')
    setIsClicked(true)

    setTimeout(() => {
      setActionPhase('locked')
    }, ARMING_DURATION_MS)

    setTimeout(() => {
      setIsClicked(false)
      setActionPhase('idle')
      onCheckin?.()
    }, SEQUENCE_DURATION_MS)
  }

  return (
    <motion.div
      className="relative w-screen min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#0a1f33_0%,#030c16_45%,#02060a_100%)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* Core background layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(0,220,255,0.14),transparent_36%),radial-gradient(circle_at_78%_26%,rgba(97,220,255,0.12),transparent_34%),radial-gradient(circle_at_45%_82%,rgba(0,155,255,0.11),transparent_44%)]" />

        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(80,220,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(80,220,255,0.08) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage:
              'radial-gradient(circle at 50% 42%, black 25%, rgba(0,0,0,0.65) 55%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(circle at 50% 42%, black 25%, rgba(0,0,0,0.65) 55%, transparent 85%)',
          }}
          animate={{ backgroundPositionY: ['0%', '100%'] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        />

        {/* Tech rain lines */}
        {rainColumns.map((column) => (
          <motion.div
            key={`rain-${column.id}`}
            className="absolute top-[-20%] w-px bg-gradient-to-b from-cyan-300/0 via-cyan-300/55 to-cyan-300/0"
            style={{ left: `${column.left}%`, height: '38vh' }}
            animate={{ y: ['0vh', '130vh'], opacity: [0, 0.7, 0] }}
            transition={{
              duration: column.duration,
              delay: column.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

        {/* Moving scanlines */}
        <motion.div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(100, 250, 255, 0.045) 0px, rgba(100, 250, 255, 0.045) 1px, transparent 1px, transparent 5px)',
          }}
          animate={{ y: ['-6px', '6px', '-6px'] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Sweep beam */}
        <motion.div
          className="absolute left-1/2 top-[-20%] h-[140%] w-[34%] -translate-x-1/2"
          style={{
            background:
              'conic-gradient(from 205deg at 50% 40%, transparent 0deg, rgba(95,235,255,0.24) 18deg, transparent 58deg)',
            filter: 'blur(12px)',
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        />

        {/* Noise pulse */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at center, rgba(8, 40, 60, 0.26), rgba(0, 0, 0, 0.75))',
          }}
          animate={{ opacity: [0.58, 0.76, 0.58] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Original grid SVG overlay */}
        <svg
          className="absolute inset-0 h-full w-full opacity-20"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="gridGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(0, 200, 255, 0.2)" />
              <stop offset="50%" stopColor="rgba(0, 150, 200, 0.05)" />
              <stop offset="100%" stopColor="rgba(100, 200, 255, 0)" />
            </linearGradient>
          </defs>
          <g stroke="url(#gridGradient)" strokeWidth="0.5" fill="none">
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={`horizontal-line-${i * 8.33}`}
                x1="0"
                y1={`${(i + 1) * 8.33}%`}
                x2="100%"
                y2={`${(i + 1) * 8.33}%`}
              />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={`vertical-line-${i * 8.33}`}
                x1={`${(i + 1) * 8.33}%`}
                y1="0"
                x2={`${(i + 1) * 8.33}%`}
                y2="100%"
              />
            ))}
          </g>
        </svg>

        {/* Animated particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-cyan-300"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              opacity: [0.15, 0.7, 0.15],
              y: [-20, 18, -20],
              x: [-8, 10, -8],
              boxShadow: [
                '0 0 4px rgba(0, 200, 255, 0.2)',
                '0 0 12px rgba(0, 200, 255, 0.6)',
                '0 0 4px rgba(0, 200, 255, 0.2)',
              ],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Side data ticks */}
        <div className="absolute inset-y-0 left-4 hidden w-16 md:block">
          {sideTicks.map((tick) => (
            <motion.div
              key={`left-tick-${tick.id}`}
              className="absolute h-px bg-cyan-300/60"
              style={{ top: `${tick.top}%`, width: tick.width }}
              animate={{ opacity: [0.2, 1, 0.2], x: [0, 8, 0] }}
              transition={{
                duration: 2.8,
                delay: tick.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-y-0 right-4 hidden w-16 md:block">
          {sideTicks.map((tick) => (
            <motion.div
              key={`right-tick-${tick.id}`}
              className="absolute right-0 h-px bg-cyan-300/60"
              style={{ top: `${tick.top + 1.8}%`, width: tick.width }}
              animate={{ opacity: [0.15, 0.9, 0.15], x: [0, -8, 0] }}
              transition={{
                duration: 3.1,
                delay: tick.delay + 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        {/* Radial glow pulses */}
        <motion.div
          className="absolute left-1/3 top-1/4 h-96 w-96 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(0, 200, 255, 0.15), transparent)',
            filter: 'blur(60px)',
          }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(100, 150, 255, 0.1), transparent)',
            filter: 'blur(50px)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            delay: 2,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Corner brackets using positioned divs for reliable rendering */}
      <div className="pointer-events-none absolute left-7 top-7 z-20 h-10 w-10 border-l border-t border-cyan-300/80" />
      <div className="pointer-events-none absolute right-7 top-7 z-20 h-10 w-10 border-r border-t border-cyan-300/80" />
      <div className="pointer-events-none absolute bottom-7 left-7 z-20 h-10 w-10 border-b border-l border-cyan-300/80" />
      <div className="pointer-events-none absolute bottom-7 right-7 z-20 h-10 w-10 border-b border-r border-cyan-300/80" />

      {/* Header - Electronic Receptionist */}
      <motion.div
        className="relative z-20 pt-14 pb-8 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1 }}
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <motion.div
            className="h-2 w-2 rounded-full bg-cyan-400"
            animate={{
              boxShadow: [
                '0 0 8px rgba(0, 200, 255, 0.8)',
                '0 0 16px rgba(0, 200, 255, 0.4)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs uppercase tracking-widest text-cyan-300/80 font-medium">
            System Ready
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-200 via-cyan-300 to-blue-400 bg-clip-text text-transparent mb-2">
          Electronic
        </h1>
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-200 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
          Receptionist
        </h1>
        <motion.p
          className="mt-2 text-[11px] uppercase tracking-[0.4em] text-cyan-300/65"
          animate={{ opacity: [0.45, 0.9, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          Neural Identity Gateway
        </motion.p>
      </motion.div>

      {/* Main content area */}
      <motion.div
        className="relative z-20 flex max-w-2xl flex-1 flex-col items-center justify-center space-y-10 px-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        {/* Scanning animation */}
        <div className="relative h-44 w-44 md:h-56 md:w-56">
          <motion.div
            className="absolute inset-[-20%] rounded-full border border-cyan-300/20"
            animate={{ scale: [0.88, 1.06, 0.88], opacity: [0.18, 0.5, 0.18] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-400/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />

          {/* Middle ring */}
          <motion.div
            className="absolute inset-4 rounded-full border border-cyan-400/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner pulsing circle */}
          <motion.div
            className="absolute inset-10 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/40 to-blue-500/20"
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.svg
              viewBox="0 0 100 100"
              className="h-24 w-24 md:h-32 md:w-32"
              animate={{ rotate: [0, -360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-cyan-300 opacity-40"
              />
              <path
                d="M 25 50 Q 50 32 75 50 Q 50 68 25 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-cyan-200 opacity-60"
              />
              <circle
                cx="50"
                cy="25"
                r="2.5"
                fill="currentColor"
                className="text-cyan-300"
              />
              <circle
                cx="75"
                cy="50"
                r="2.5"
                fill="currentColor"
                className="text-cyan-300"
              />
              <circle
                cx="50"
                cy="75"
                r="2.5"
                fill="currentColor"
                className="text-cyan-300"
              />
              <circle
                cx="25"
                cy="50"
                r="2.5"
                fill="currentColor"
                className="text-cyan-300"
              />
            </motion.svg>
          </motion.div>

          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-300/30"
            animate={{ rotate: [0, 360], opacity: [0.5, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-200/85 to-transparent"
            animate={{ x: ['-32%', '32%', '-32%'], opacity: [0.2, 0.95, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Status text */}
        <motion.div className="space-y-2 text-center">
          <p className="text-cyan-200 font-semibold text-lg">
            Ready for Check-in
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-cyan-400"
              animate={{ scale: [1, 0.6, 1] }}
              transition={{ duration: 1.2, delay: 0, repeat: Infinity }}
            />
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-cyan-400"
              animate={{ scale: [1, 0.6, 1] }}
              transition={{ duration: 1.2, delay: 0.2, repeat: Infinity }}
            />
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-cyan-400"
              animate={{ scale: [1, 0.6, 1] }}
              transition={{ duration: 1.2, delay: 0.4, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Feature list */}
        <motion.div
          className="grid grid-cols-2 gap-4 w-full text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <motion.div
            className="p-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 backdrop-blur-sm"
            whileHover={{ scale: 1.05, borderColor: 'rgb(34, 211, 238)' }}
          >
            <div className="text-xs uppercase tracking-wider text-cyan-300/80 font-medium">
              NFC Card
            </div>
            <div className="text-[10px] text-cyan-400/60 mt-1">Read CCCD</div>
          </motion.div>
          <motion.div
            className="p-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 backdrop-blur-sm"
            whileHover={{ scale: 1.05, borderColor: 'rgb(34, 211, 238)' }}
          >
            <div className="text-xs uppercase tracking-wider text-cyan-300/80 font-medium">
              Face
            </div>
            <div className="text-[10px] text-cyan-400/60 mt-1">
              Verification
            </div>
          </motion.div>
        </motion.div>

        <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.26em] text-cyan-200/70">
          <motion.span
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Bio-metric
          </motion.span>
          <span className="h-[1px] w-14 bg-cyan-300/40" />
          <motion.span
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
          >
            Live Sync
          </motion.span>
        </div>
      </motion.div>

      {/* Check-in button */}
      <motion.div
        className="relative z-20 w-full px-8 pb-10 md:pb-14"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-3 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.34em] text-cyan-200/65">
            <span className="h-px w-10 bg-cyan-300/40" />
            <span>
              {actionPhase === 'idle' ? 'Access Node' : 'Threat Protocol'}
            </span>
            <span className="h-px w-10 bg-cyan-300/40" />
          </div>

          <div
            className={`relative rounded-2xl border p-2 shadow-[0_0_30px_rgba(0,220,255,0.16)] backdrop-blur-md ${
              actionPhase === 'idle'
                ? 'border-cyan-300/35 bg-cyan-300/[0.04]'
                : 'border-red-300/65 bg-red-400/[0.08]'
            }`}
          >
            <motion.div
              className={`pointer-events-none absolute inset-0 rounded-2xl border ${
                actionPhase === 'idle'
                  ? 'border-cyan-300/30'
                  : 'border-red-300/70'
              }`}
              animate={{
                opacity: [0.3, 0.9, 0.3],
                boxShadow:
                  actionPhase === 'idle'
                    ? [
                        '0 0 8px rgba(34, 211, 238, 0.2)',
                        '0 0 24px rgba(34, 211, 238, 0.55)',
                        '0 0 8px rgba(34, 211, 238, 0.2)',
                      ]
                    : [
                        '0 0 8px rgba(248, 113, 113, 0.35)',
                        '0 0 36px rgba(248, 113, 113, 0.95)',
                        '0 0 8px rgba(248, 113, 113, 0.35)',
                      ],
              }}
              transition={{
                duration: actionPhase === 'idle' ? 2.6 : 0.7,
                repeat: Infinity,
              }}
            />

            <motion.div
              className="pointer-events-none absolute left-3 right-3 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent"
              animate={{ opacity: [0.2, 0.95, 0.2] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />

            <motion.button
              onClick={handleCheckin}
              disabled={actionPhase !== 'idle'}
              className="group relative w-full overflow-hidden rounded-xl px-8 py-4 text-base font-bold uppercase tracking-[0.16em] md:py-5 md:text-lg"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 z-0 opacity-90 transition-opacity group-hover:opacity-100 ${
                  actionPhase === 'idle'
                    ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-400'
                    : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500'
                }`}
              />

              <div className="absolute inset-[1px] z-0 rounded-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.05)_20%,rgba(0,0,0,0.08)_100%)]" />

              {/* Circuit texture */}
              <div
                className="absolute inset-0 z-0 opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 8%, transparent 16%), linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.35) 8%, transparent 14%)',
                  backgroundSize: '130px 130px',
                }}
              />

              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-120%', '120%'] }}
                transition={{
                  duration: actionPhase === 'idle' ? 2.4 : 0.8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {actionPhase !== 'idle' && (
                <>
                  <motion.div
                    className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.0)_0px,rgba(255,255,255,0.0)_10px,rgba(255,255,255,0.15)_10px,rgba(255,255,255,0.15)_20px)]"
                    animate={{ backgroundPosition: ['0px 0px', '40px 0px'] }}
                    transition={{
                      duration: 0.55,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <motion.div
                    className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-white/90 to-transparent"
                    animate={{ x: ['-50%', '50%', '-50%'] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </>
              )}

              {/* Click ripple effect */}
              {isClicked && (
                <motion.div
                  className={`absolute inset-0 rounded-xl ${
                    actionPhase === 'idle' ? 'bg-white/30' : 'bg-red-100/40'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 2 }}
                  transition={{ duration: 0.6 }}
                />
              )}

              {/* Text */}
              <motion.span
                className="relative z-10 flex items-center justify-center gap-2 font-extrabold text-white"
                initial={{ opacity: 1 }}
                animate={isClicked ? { opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 0.8 }}
              >
                {isClicked ? (
                  <>
                    <motion.svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        opacity="0.2"
                      />
                      <path
                        d="M12 2a10 10 0 0 1 0 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </motion.svg>
                    {actionPhase === 'arming'
                      ? 'Arming Sequence...'
                      : 'Target Locked...'}
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                    START CHECK-IN
                  </>
                )}
              </motion.span>

              {actionPhase !== 'idle' && (
                <>
                  <motion.div
                    className="absolute bottom-0 left-0 z-20 h-[3px] bg-gradient-to-r from-red-300 via-amber-200 to-red-300"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: SEQUENCE_DURATION_MS / 1000,
                      ease: 'linear',
                    }}
                  />
                  <motion.div
                    className="pointer-events-none absolute left-3 top-1/2 z-20 -translate-y-1/2 text-[11px] font-semibold tracking-[0.28em] text-red-100/90"
                    animate={{ opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  >
                    {'///'}
                  </motion.div>
                  <motion.div
                    className="pointer-events-none absolute right-3 top-1/2 z-20 -translate-y-1/2 text-[11px] font-semibold tracking-[0.28em] text-red-100/90"
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  >
                    {'///'}
                  </motion.div>
                </>
              )}
            </motion.button>

            <div className="pointer-events-none absolute -left-[1px] -top-[1px] h-4 w-4 border-l border-t border-cyan-200/80" />
            <div className="pointer-events-none absolute -right-[1px] -top-[1px] h-4 w-4 border-r border-t border-cyan-200/80" />
            <div className="pointer-events-none absolute -bottom-[1px] -left-[1px] h-4 w-4 border-b border-l border-cyan-200/80" />
            <div className="pointer-events-none absolute -bottom-[1px] -right-[1px] h-4 w-4 border-b border-r border-cyan-200/80" />
          </div>
        </div>

        {/* Helper text */}
        <motion.p
          className="text-center text-xs md:text-sm text-cyan-300/60 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          {actionPhase === 'idle'
            ? 'Please have your CCCD ready'
            : 'Threat scan engaged'}
        </motion.p>
      </motion.div>

      {actionPhase !== 'idle' && (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,55,55,0.14),rgba(0,0,0,0.82)_62%)]"
            animate={{ opacity: [0.28, 0.6, 0.28] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />

          <motion.div
            className="absolute inset-x-0 top-[10%] mx-auto w-fit rounded-full border border-red-200/70 bg-red-500/15 px-6 py-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-red-100"
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 0.55, repeat: Infinity }}
          >
            Threat Level Elevated
          </motion.div>

          <motion.div
            className="absolute left-1/2 top-1/2 h-[64vh] w-[64vh] max-h-[84vw] max-w-[84vw] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-red-300/75"
            animate={{ rotate: [0, 360], opacity: [0.2, 0.85, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[48vh] w-[48vh] max-h-[64vw] max-w-[64vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/75"
            animate={{ rotate: [360, 0], opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[2px] w-[78vw] max-w-[980px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-100 to-transparent"
            animate={{ opacity: [0.2, 1, 0.2], scaleX: [0.86, 1, 0.86] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[68vh] w-[2px] max-h-[80vw] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-red-100 to-transparent"
            animate={{ opacity: [0.2, 1, 0.2], scaleY: [0.86, 1, 0.86] }}
            transition={{
              duration: 0.45,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.1,
            }}
          />

          <motion.div
            className="absolute left-1/2 top-[18%] -translate-x-1/2 text-[13px] font-bold uppercase tracking-[0.45em] text-red-100"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.45, repeat: Infinity }}
          >
            Warning
          </motion.div>

          <motion.div
            className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.38em] text-amber-100/90"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            Biometric Lock
          </motion.div>
        </div>
      )}

      {/* Scanline effects */}
      <div className="absolute inset-x-0 top-0 z-30 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40" />
      <div className="absolute inset-x-0 bottom-0 z-30 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40" />

      <motion.div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent"
        animate={{ opacity: [0.25, 0.95, 0.25], scaleX: [0.85, 1, 0.85] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

export default HologramReceptionist
