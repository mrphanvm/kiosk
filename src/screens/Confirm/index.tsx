import React from 'react'

interface ConfirmProps {
  cccdInfo: {
    name: string
    id: string
    dob: string
    address: string
    // ...other fields as needed
  }
  images: string[]
  onRegister: () => void
  loading?: boolean
  errorMsg?: string
}

const Confirm: React.FC<ConfirmProps> = ({
  cccdInfo,
  images,
  onRegister,
  loading,
  errorMsg,
}) => {
  // Lấy avatar từ ảnh đầu tiên nếu có
  const avatar = images[0] || ''
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a1830] to-[#1a2a40] text-white font-sans relative overflow-hidden">
      {/* Hiệu ứng glow nền */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl left-[-10%] top-[-10%] animate-pulse" />
        <div className="absolute w-80 h-80 bg-blue-600/20 rounded-full blur-2xl right-[-8%] bottom-[-8%] animate-pulse" />
      </div>
      <div className="z-10 w-full max-w-3xl flex flex-col items-center">
        <div className="text-4xl font-extrabold mb-4 tracking-widest text-cyan-300 drop-shadow-xl uppercase animate-fade-in">
          Xác nhận thông tin
        </div>
        <div className="flex flex-row gap-8 w-full mb-8 animate-fade-in-up">
          {/* Avatar */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-cyan-400 shadow-2xl bg-[#16243a]">
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-200">
                  No Image
                </div>
              )}
            </div>
            <div className="mt-3 text-lg text-cyan-200 font-semibold tracking-wide">
              Ảnh đại diện
            </div>
          </div>
          {/* Thông tin CCCD */}
          <div className="flex-1 bg-[#101c2c] rounded-2xl shadow-2xl p-8 border border-cyan-700/40 flex flex-col justify-center">
            <div className="mb-2 text-xl font-bold text-cyan-400 tracking-wide">
              Thông tin cá nhân
            </div>
            <div className="space-y-2 text-lg">
              <div>
                <span className="text-cyan-300 font-semibold">Họ tên:</span>{' '}
                <span className="ml-2 text-white/90">{cccdInfo.name}</span>
              </div>
              <div>
                <span className="text-cyan-300 font-semibold">Số CCCD:</span>{' '}
                <span className="ml-2 text-white/90">{cccdInfo.id}</span>
              </div>
              <div>
                <span className="text-cyan-300 font-semibold">Ngày sinh:</span>{' '}
                <span className="ml-2 text-white/90">{cccdInfo.dob}</span>
              </div>
              <div>
                <span className="text-cyan-300 font-semibold">Địa chỉ:</span>{' '}
                <span className="ml-2 text-white/90">{cccdInfo.address}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Ảnh khuôn mặt các góc */}
        <div className="w-full max-w-3xl mb-10 animate-fade-in-up">
          <div className="text-cyan-300 mb-3 font-semibold text-lg tracking-wide">
            Ảnh khuôn mặt các góc
          </div>
          <div className="flex overflow-x-auto gap-4 p-3 bg-[#0e223a] rounded-xl border border-cyan-700/30 shadow-lg">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-32 h-40 rounded-xl overflow-hidden border-2 border-cyan-400/60 shadow-md bg-[#16243a] relative group hover:scale-105 transition-transform"
              >
                <img
                  src={img}
                  alt={`Góc ${idx + 1}`}
                  className="object-cover w-full h-full group-hover:brightness-110"
                />
                <div className="absolute bottom-1 left-1 bg-cyan-700/70 text-xs px-2 py-0.5 rounded text-white font-semibold tracking-wider">
                  Góc {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
        {errorMsg && (
          <div className="mb-4 text-red-400 text-lg font-bold animate-fade-in">
            {errorMsg}
          </div>
        )}
        <button
          className={`px-12 py-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-2xl font-extrabold shadow-2xl hover:scale-105 hover:from-cyan-300 hover:to-blue-500 transition-all border-2 border-cyan-500/60 tracking-widest uppercase animate-fade-in ${
            loading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          onClick={onRegister}
          disabled={loading}
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký thông tin'}
        </button>
      </div>
    </div>
  )
}

export default Confirm
