/* eslint-disable react-hooks/purity */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ScanIcon from '@/assets/svg/ScanIcon'
import { ChipReadResult } from '@/interfaces/chip.interface'
import { useSse } from '@/hooks/useSse'
import { SSE_HOST } from '@/config/constant'

interface Props {
  onNext: (data: any) => void
  onBack?: () => void
}

const ReadCCCD: React.FC<Props> = ({ onNext, onBack }) => {
  const [loading, setLoading] = useState(true)
  const [cccd, setCccd] = useState<any>(null)
  const handleSseMessage = useCallback((chipData: ChipReadResult) => {
    console.log('chipData', chipData)
    const data = chipData?.data
    console.log('data', data)
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
  const particles = useMemo(() => {
    return Array.from({ length: 28 }).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      moveX: Math.random() * 40 - 20,
      moveY: Math.random() * 40 - 20,
      size: Math.random() * 4 + 2,
      duration: 4 + Math.random() * 4,
    }))
  }, [])

  if (loading) {
    return (
      <div className="w-screen h-screen relative overflow-hidden bg-[#04070B] flex flex-col items-center justify-center text-white">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1 rounded-lg 
             bg-black/40 backdrop-blur-sm text-cyan-300 hover:text-white 
             border border-cyan-300/20 hover:border-cyan-200/40 transition z-50"
          >
            <span className="text-lg">←</span>
            <span className="text-sm">Quay lại</span>
          </button>
        )}
        <div className="absolute inset-0 opacity-[0.05] bg-[url('/grid.svg')]" />
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-300/40 shadow-[0_0_8px_#00FFF0]"
            style={{
              width: p.size,
              height: p.size,
              top: `${p.top}%`,
              left: `${p.left}%`,
            }}
            animate={{
              x: [0, p.moveX],
              y: [0, p.moveY],
              opacity: [0.15, 0.8, 0.15],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Loading box */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center"
        >
          <ScanIcon />

          {/* LASER */}
          <motion.div
            className="w-56 h-[3px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_#00dfff] rounded-full"
            animate={{ y: [0, -160, 0] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <div className="text-xl mt-10 font-semibold tracking-wide">
            Đang đọc thông tin CCCD...
          </div>
          <div className="text-cyan-300 mt-2 opacity-90">
            Vui lòng giữ yên thẻ
          </div>
        </motion.div>
      </div>
    )
  }

  // ---------------------------------------------------------
  // RESULT SCREEN — CENTERED
  // ---------------------------------------------------------
  return (
    <div className="w-screen h-screen relative bg-[#05070A] text-white overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#07202a] via-[#04141c] to-[#02070c] opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,200,0.10),transparent_70%)]" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.06] bg-[url('/grid.svg')]" />

      {/* Particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cyan-400/50 shadow-[0_0_8px_#00FFF0]"
          style={{
            width: p.size,
            height: p.size,
            top: `${p.top}%`,
            left: `${p.left}%`,
          }}
          animate={{
            x: [0, p.moveX],
            y: [0, p.moveY],
            opacity: [0.15, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}

      {/* --- CENTERED BOX --- */}
      <div className="relative z-10 w-full max-w-md bg-[#0c1a22]/60 backdrop-blur-xl p-6 mx-4 rounded-2xl border border-cyan-400/20 shadow-[0_0_25px_#00fff2]">
        <h1 className="text-2xl font-bold text-center mb-6 text-cyan-300">
          THÔNG TIN CCCD
        </h1>

        {/* Avatar */}
        {cccd.avatar && (
          <motion.img
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            src={
              cccd.avatar.startsWith('data:image')
                ? cccd.avatar
                : `data:image/jpeg;base64,${cccd.avatar}`
            }
            alt="avatar"
            className="w-32 h-40 object-cover rounded-xl mx-auto mb-4 shadow-[0_0_15px_#00FFF0]"
          />
        )}

        {/* Rows */}
        <div className="space-y-3 text-base">
          <InfoRow label="Họ tên" value={cccd.name} />
          <InfoRow label="Số CCCD" value={cccd.id} />
          <InfoRow label="Ngày sinh" value={cccd.dob} />
          <InfoRow label="Giới tính" value={cccd.gender} />
          <InfoRow label="Địa chỉ" value={cccd.address} />
        </div>

        {/* Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => onNext(cccd)}
          className="w-full mt-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition shadow-[0_0_12px_#00FFF0]"
        >
          Xác thực khuôn mặt
        </motion.button>
      </div>
    </div>
  )
}

export default ReadCCCD

// ---------------------------------------------------------
// REUSABLE INFO ROW
// ---------------------------------------------------------
const InfoRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex justify-between border-b border-white/10 pb-2"
    >
      <span className="text-gray-300">{label}:</span>
      <span className="font-medium text-white">{value}</span>
    </motion.div>
  )
}
