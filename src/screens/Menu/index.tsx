/* eslint-disable react-hooks/purity */
// src/screens/Menu/index.tsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface MenuProps {
  onCheckin: () => void;
}

const Menu: React.FC<MenuProps> = ({ onCheckin }) => {
  // Generate particles ONE TIME only → no strict-mode violation
  const particles = useMemo(() => {
    return Array.from({ length: 28 }).map(() => ({
      size: Math.random() * 4 + 2,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: Math.random() * 12 + 10,
    }));
  }, []);

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-[#05070A] text-white flex items-center justify-center">
      {/* BACKGROUND GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09141f] via-[#051018] to-[#03070b]" />

      {/* MOVING GRID */}
      <motion.div
        className="absolute inset-0 opacity-[0.045] bg-[url('/grid.svg')]"
        animate={{ backgroundPositionY: ["0%", "100%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />

      {/* SOFT CENTER LIGHT */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,200,255,0.16),transparent_70%)]" />

      {/* FLOATING PARTICLES */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cyan-300"
          style={{
            width: p.size,
            height: p.size,
            top: `${p.top}%`,
            left: `${p.left}%`,
            filter: "blur(2px)",
            opacity: 0.28,
          }}
          animate={{
            y: ["0px", "-40px", "0px"],
            x: ["0px", "30px", "0px"],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* CONTENT */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        {/* LOGO SPOT (optional) */}
        <motion.div
          className="mb-6 text-3xl font-extrabold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          e-KYC KIOSK SYSTEM
        </motion.div>

        <motion.h1
          className="text-4xl font-bold mb-4 tracking-wide"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Chào mừng bạn 👋
        </motion.h1>

        <motion.p
          className="text-gray-300 max-w-lg leading-relaxed mb-10 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Hệ thống xác thực danh tính tự động sử dụng{" "}
          <span className="text-cyan-300">
            AI • Face Recognition • CCCD Chip
          </span>
          .
          <br />
          Mang đến trải nghiệm nhanh chóng và an toàn tuyệt đối.
        </motion.p>

        {/* MAIN BUTTON */}
        <motion.button
          onClick={onCheckin}
          className="px-12 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl 
          text-xl font-semibold shadow-[0_0_25px_#00d0ff55] 
          hover:shadow-[0_0_35px_#00e0ffaa] transition-all"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
        >
          Bắt đầu Check-in
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Menu;
