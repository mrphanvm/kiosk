/* eslint-disable react-hooks/purity */
import React, { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ScanIcon from '@/assets/svg/ScanIcon'
import { ChipReadResult } from '@/interfaces/chip.interface'
import { useSse } from '@/hooks/useSse'
import { SSE_HOST } from '@/config/constant'

interface Props {
  onNext: (data: any) => void
  onBack?: () => void
}

type ConfirmPhase = 'idle' | 'arming' | 'locked'

const ReadCCCD: React.FC<Props> = ({ onNext, onBack }) => {
  const [loading, setLoading] = useState(true)
  const [cccd, setCccd] = useState<any>(null)
  const [confirmPhase, setConfirmPhase] = useState<ConfirmPhase>('idle')

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        moveX: Math.random() * 52 - 26,
        moveY: Math.random() * 52 - 26,
        size: Math.random() * 3 + 1,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 2,
      })),
    [],
  )

  const dataRays = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: (i / 20) * 100,
        duration: 4 + (i % 4),
        delay: (i * 0.2) % 3,
      })),
    [],
  )

  const handleSseMessage = useCallback((chipData: ChipReadResult) => {
    const data = chipData?.data
    if (!data?.cardData?.Dg13File) return

    setCccd({
      name: data.cardData.Dg13File.FullName,
      id: data.cardData.Dg13File.IdNumber,
      dob: data.cardData.Dg13File.DateOfBirth,
      gender: data.cardData.Dg13File.Sex,
      address: data.cardData.Dg13File.Address,
      avatar: data.faceImage?.base64,
    })
    setLoading(false)
  }, [])

  useSse({
    url: SSE_HOST,
    onMessage: handleSseMessage,
  })

  const startConfirmSequence = () => {
    if (!cccd || confirmPhase !== 'idle') return

    setConfirmPhase('arming')
    setTimeout(() => setConfirmPhase('locked'), 550)
    setTimeout(() => {
      setConfirmPhase('idle')
      onNext(cccd)
    }, 1400)
  }

  if (loading) {
    return (
      <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#0b2133_0%,#041019_52%,#02060a_100%)] text-white">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute left-6 top-6 z-50 flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-black/45 px-3 py-2 text-cyan-200 transition hover:border-cyan-100/60 hover:text-white"
          >
            <span className="text-lg">←</span>
            <span className="text-sm uppercase tracking-wider">Quay lại</span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[url('/grid.svg')]" />

        <motion.div
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(120,245,255,0.035) 0px, rgba(120,245,255,0.035) 1px, transparent 1px, transparent 4px)',
          }}
          animate={{ y: ['-6px', '6px', '-6px'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {dataRays.map((ray) => (
          <motion.div
            key={`ray-${ray.id}`}
            className="pointer-events-none absolute top-[-20%] w-px bg-gradient-to-b from-transparent via-cyan-300/55 to-transparent"
            style={{ left: `${ray.left}%`, height: '42vh' }}
            animate={{ y: ['0vh', '130vh'], opacity: [0, 0.75, 0] }}
            transition={{
              duration: ray.duration,
              delay: ray.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

        {particles.map((p) => (
          <motion.div
            key={`particle-${p.id}`}
            className="absolute rounded-full bg-cyan-300/45"
            style={{
              width: p.size,
              height: p.size,
              top: `${p.top}%`,
              left: `${p.left}%`,
            }}
            animate={{
              x: [0, p.moveX, 0],
              y: [0, p.moveY, 0],
              opacity: [0.1, 0.75, 0.1],
              boxShadow: [
                '0 0 4px rgba(34, 211, 238, 0.18)',
                '0 0 12px rgba(34, 211, 238, 0.75)',
                '0 0 4px rgba(34, 211, 238, 0.18)',
              ],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        <motion.div
          className="relative z-10 w-[min(90vw,620px)] rounded-3xl border border-cyan-300/35 bg-[#08121c]/70 p-8 shadow-[0_0_40px_rgba(34,211,238,0.25)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-5 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.34em] text-cyan-200/80">
            <span className="h-px w-12 bg-cyan-300/50" />
            <span>Chip Threat Scanner</span>
            <span className="h-px w-12 bg-cyan-300/50" />
          </div>

          <div className="relative mx-auto mb-8 h-64 w-64 rounded-2xl border border-cyan-300/30 bg-black/35">
            <motion.div
              className="absolute inset-[-18%] rounded-full"
              style={{
                background:
                  'conic-gradient(from 190deg at 50% 50%, transparent 0deg, rgba(65,220,255,0.32) 24deg, transparent 90deg)',
                filter: 'blur(8px)',
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: 'linear' }}
            />

            <motion.div
              className="absolute inset-0 rounded-2xl border border-cyan-300/30"
              animate={{ opacity: [0.2, 0.85, 0.2] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />

            <motion.div
              className="absolute inset-x-4 h-[3px] rounded-full bg-gradient-to-r from-cyan-400 via-white to-cyan-400"
              animate={{ y: [22, 232, 22], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
              className="absolute inset-0 rounded-2xl bg-[linear-gradient(to_bottom,rgba(34,211,238,0.06),rgba(34,211,238,0)_35%,rgba(34,211,238,0.08))]"
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <ScanIcon />
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-semibold tracking-wide text-cyan-100">
              Đang đọc thông tin CCCD
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.32em] text-cyan-300/75">
              Keep card stable in scanner zone
            </p>
          </div>
        </motion.div>

        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-20 overflow-hidden">
          <motion.div
            className="whitespace-nowrap text-center text-[11px] uppercase tracking-[0.35em] text-red-200/80"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            {
              'WARNING • CHIP SECURITY SCAN ACTIVE • DO NOT REMOVE CARD • WARNING • CHIP SECURITY SCAN ACTIVE • DO NOT REMOVE CARD • '
            }
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_18%,#0a2437_0%,#06131d_48%,#02070b_100%)] text-white">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-6 top-6 z-50 flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-black/45 px-3 py-2 text-cyan-200 transition hover:border-cyan-100/60 hover:text-white"
        >
          <span className="text-lg">←</span>
          <span className="text-sm uppercase tracking-wider">Quay lại</span>
        </button>
      )}

      <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[url('/grid.svg')]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,85,85,0.08),transparent_55%)]" />

      <motion.div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(120,245,255,0.03) 0px, rgba(120,245,255,0.03) 1px, transparent 1px, transparent 4px)',
        }}
        animate={{ y: ['-7px', '7px', '-7px'] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-[-20%] h-[140%] w-[32%] -translate-x-1/2"
        style={{
          background:
            'conic-gradient(from 205deg at 50% 40%, transparent 0deg, rgba(95,235,255,0.2) 18deg, transparent 58deg)',
          filter: 'blur(12px)',
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />

      {particles.map((p) => (
        <motion.div
          key={`r-particle-${p.id}`}
          className="absolute rounded-full bg-cyan-300/50"
          style={{
            width: p.size,
            height: p.size,
            top: `${p.top}%`,
            left: `${p.left}%`,
          }}
          animate={{
            x: [0, p.moveX, 0],
            y: [0, p.moveY, 0],
            opacity: [0.1, 0.7, 0.1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <motion.div
        className="relative z-20 grid w-[min(94vw,1080px)] grid-cols-1 gap-6 rounded-3xl border border-cyan-300/30 bg-[#08121b]/70 p-5 shadow-[0_0_40px_rgba(34,211,238,0.2)] backdrop-blur-xl md:grid-cols-[1.25fr_0.9fr] md:p-7"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="pointer-events-none absolute left-3 top-3 z-30 h-7 w-7 border-l border-t border-cyan-200/80" />
        <div className="pointer-events-none absolute right-3 top-3 z-30 h-7 w-7 border-r border-t border-cyan-200/80" />
        <div className="pointer-events-none absolute bottom-3 left-3 z-30 h-7 w-7 border-b border-l border-cyan-200/80" />
        <div className="pointer-events-none absolute bottom-3 right-3 z-30 h-7 w-7 border-b border-r border-cyan-200/80" />

        <section className="rounded-2xl border border-cyan-300/20 bg-black/30 p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-2xl font-bold uppercase tracking-[0.16em] text-cyan-200">
              CCCD Intel
            </h1>
            <span className="rounded-full border border-emerald-300/50 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-emerald-200">
              Verified Read
            </span>
          </div>

          <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:items-start">
            {cccd?.avatar && (
              <motion.img
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={
                  cccd.avatar.startsWith('data:image')
                    ? cccd.avatar
                    : `data:image/jpeg;base64,${cccd.avatar}`
                }
                alt="avatar"
                className="h-44 w-36 rounded-xl border border-cyan-300/40 object-cover shadow-[0_0_18px_rgba(34,211,238,0.35)]"
              />
            )}

            <div className="w-full">
              <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
                <div className="grid gap-3">
                  <InfoRow label="Họ tên" value={cccd?.name ?? '-'} />
                  <InfoRow label="Số CCCD" value={cccd?.id ?? '-'} />
                  <InfoRow label="Ngày sinh" value={cccd?.dob ?? '-'} />
                  <InfoRow label="Giới tính" value={cccd?.gender ?? '-'} />
                  <InfoRow label="Địa chỉ" value={cccd?.address ?? '-'} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">
            <span className="h-px w-10 bg-cyan-300/40" />
            <span>Command data synchronized</span>
            <span className="h-px w-10 bg-cyan-300/40" />
          </div>
        </section>

        <aside className="relative rounded-2xl border border-red-300/35 bg-[#180b10]/65 p-5">
          <motion.div
            className="absolute inset-0 rounded-2xl border border-red-200/30"
            animate={{ opacity: [0.25, 0.9, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />

          <div className="relative z-10">
            <h2 className="text-center text-sm font-semibold uppercase tracking-[0.34em] text-red-100/90">
              Threat Gate
            </h2>

            <div className="mt-5 rounded-xl border border-red-200/30 bg-black/35 p-4">
              <p className="text-sm text-red-100/85">
                Face verification will begin only after security lock sequence.
              </p>
              <div className="mt-4 space-y-2 text-[11px] uppercase tracking-[0.22em] text-red-100/75">
                <div className="flex items-center justify-between">
                  <span>Biometric channel</span>
                  <span>Armed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Anti spoofing</span>
                  <span>Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Threat mode</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            <motion.button
              onClick={startConfirmSequence}
              disabled={confirmPhase !== 'idle'}
              className="group relative mt-5 w-full overflow-hidden rounded-xl border border-red-200/35 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em]"
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
            >
              <div
                className={`absolute inset-0 ${
                  confirmPhase === 'idle'
                    ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-400'
                    : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-400'
                }`}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-120%', '120%'] }}
                transition={{
                  duration: confirmPhase === 'idle' ? 2.4 : 0.8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {confirmPhase !== 'idle' && (
                <motion.div
                  className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-red-200 via-amber-100 to-red-200"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.4, ease: 'linear' }}
                />
              )}

              <span className="relative z-10 text-white">
                {confirmPhase === 'idle' && 'Xác thực khuôn mặt'}
                {confirmPhase === 'arming' && 'Arming Protocol...'}
                {confirmPhase === 'locked' && 'Target Locked...'}
              </span>
            </motion.button>

            <p className="mt-4 text-center text-[11px] uppercase tracking-[0.28em] text-red-100/80">
              {confirmPhase === 'idle'
                ? 'Ready to proceed'
                : 'Security sequence running'}
            </p>
          </div>
        </aside>
      </motion.div>

      {confirmPhase !== 'idle' && (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,70,70,0.16),rgba(0,0,0,0.78)_60%)]"
            animate={{ opacity: [0.3, 0.75, 0.3] }}
            transition={{ duration: 0.65, repeat: Infinity }}
          />

          <motion.div
            className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,120,120,0.0)_0px,rgba(255,120,120,0.0)_16px,rgba(255,120,120,0.08)_16px,rgba(255,120,120,0.08)_32px)]"
            animate={{ backgroundPosition: ['0px 0px', '80px 0px'] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] max-h-[84vw] max-w-[84vw] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-red-200/80"
            animate={{ rotate: [0, 360], opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[44vh] w-[44vh] max-h-[66vw] max-w-[66vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-100/80"
            animate={{ rotate: [360, 0], opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-red-100 to-transparent"
            animate={{ opacity: [0.25, 1, 0.25], scaleX: [0.85, 1, 0.85] }}
            transition={{ duration: 0.45, repeat: Infinity }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[66vh] w-[2px] max-h-[84vw] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-red-100 to-transparent"
            animate={{ opacity: [0.25, 1, 0.25], scaleY: [0.85, 1, 0.85] }}
            transition={{ duration: 0.45, repeat: Infinity, delay: 0.1 }}
          />
          <motion.div
            className="absolute left-1/2 top-[18%] -translate-x-1/2 text-[12px] font-semibold uppercase tracking-[0.42em] text-red-100"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 0.45, repeat: Infinity }}
          >
            Warning
          </motion.div>

          <div className="absolute left-0 right-0 top-[8%] overflow-hidden">
            <motion.div
              className="whitespace-nowrap text-center text-[11px] font-semibold uppercase tracking-[0.36em] text-red-100/85"
              animate={{ x: ['0%', '-55%'] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
            >
              {
                'THREAT DETECTED • IDENTITY LOCKDOWN • THREAT DETECTED • IDENTITY LOCKDOWN • THREAT DETECTED • IDENTITY LOCKDOWN • '
              }
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReadCCCD

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-[110px_1fr] items-start gap-3 border-b border-white/10 pb-2"
    >
      <span className="text-sm uppercase tracking-wider text-cyan-300/75">
        {label}
      </span>
      <span className="break-words text-sm font-medium text-white">
        {value}
      </span>
    </motion.div>
  )
}
