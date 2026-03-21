// App.tsx
import React, { useState } from 'react'
import Menu from './screens/Menu'
import ReadCCCD from './screens/ReadCCCD'
import Camera from './screens/Camera'
import Confirm from './screens/Confirm'
import { useFullscreenToggle } from './hooks/useFullscreenToggle'
import {
  useCheckinMutation,
  useFaceVerifyMutation,
} from './store/api/customerApi'
import { base64ToBlob } from './utils/common.util'

export type Screen = 'menu' | 'readCCCD' | 'camera' | 'confirm' | 'result'

const App = () => {
  useFullscreenToggle()
  const [screen, setScreen] = useState<Screen>('menu')
  const [faceVerify] = useFaceVerifyMutation()
  const [checkin] = useCheckinMutation()
  // Data toàn bộ flow
  const [flowData, setFlowData] = useState({
    cccd: null as any,
    faceImage: null as string | null,
    faceImages: [] as string[],
  })

  // ================================
  // điều khiển FLOW CONTROLLER
  // ================================
  const goTo = (scr: Screen) => setScreen(scr)

  const next = (data?: any) => {
    console.log('next called, screen:', screen, 'data:', data)
    if (screen === 'menu') return goTo('readCCCD')

    if (screen === 'readCCCD') {
      setFlowData((prev) => ({ ...prev, cccd: data }))
      return goTo('camera')
    }

    if (screen === 'camera') {
      const images = Array.isArray(data) ? data : []
      setFlowData((prev) => ({
        ...prev,
        faceImage: images[0] ?? null,
        faceImages: images,
      }))
      // KHÔNG gọi goTo('confirm') ở đây nữa
    }
  }

  // Theo dõi flowData.faceImages, nếu đủ 5 ảnh thì chuyển sang màn hình confirm

  React.useEffect(() => {
    console.log('flowData.faceImages, screen:', flowData.faceImages, screen)
    if (screen === 'camera' && flowData.faceImages.length === 5) {
      goTo('confirm')
    }
  }, [flowData.faceImages, screen])

  const back = () => {
    if (screen === 'camera') return goTo('readCCCD')
    if (screen === 'readCCCD') return goTo('menu')
  }
  const verifyFace = (img1: string, img2: string) => {
    if (!img1 || !img2) return
    const body = new FormData()
    const img1Blob = base64ToBlob(img1)
    body.append('img1', img1Blob, 'img1.jpg')
    const img2Blob = base64ToBlob(img2)
    body.append('img2', img2Blob, 'img2.jpg')
    faceVerify(body)
  }
  // ================================
  // RENDER SCREEN
  // ================================
  return (
    <>
      {screen === 'menu' && <Menu onCheckin={() => next()} />}

      {screen === 'readCCCD' && (
        <ReadCCCD onNext={(data) => next(data)} onBack={back} />
      )}

      {screen === 'camera' && (
        <Camera
          onCaptured={(imgs) => {
            if (imgs[0]) verifyFace(imgs[0], flowData.cccd?.avatar)
            next(imgs)
          }}
          onBack={back}
        />
      )}

      {screen === 'confirm' && (
        <Confirm
          cccdInfo={{
            name: flowData.cccd?.name || '',
            id: flowData.cccd?.id || '',
            dob: flowData.cccd?.dob || '',
            address: flowData.cccd?.address || '',
          }}
          images={flowData.faceImages}
          onRegister={async () => {
            // Chuẩn bị formData
            const formData = new FormData()
            formData.append('fullName', flowData.cccd?.name || '')
            formData.append('pid', flowData.cccd?.id || '')
            formData.append('gender', flowData.cccd?.gender || '')
            formData.append('hometown', '') // Nếu có trường này trong CCCD thì truyền vào
            formData.append('permanent', flowData.cccd?.address || '')
            formData.append('dateOfBirth', flowData.cccd?.dob || '')
            formData.append('nationality', 'Vietnam')
            formData.append('issueDate', '2024-01-15') // Nếu có trường này thì lấy từ CCCD
            formData.append('type', 'CLIENT')
            formData.append('isActive', 'true')
            formData.append('primaryFaceSampleIndex', '0')
            // Ảnh CCCD
            if (flowData.cccd?.avatar) {
              const identityBlob = base64ToBlob(flowData.cccd.avatar)
              formData.append('identityImage', identityBlob, 'cccd.jpg')
            }
            // 5 ảnh khuôn mặt
            flowData.faceImages.forEach((img, idx) => {
              const blob = base64ToBlob(img)
              formData.append('faceSamples', blob, `face-${idx + 1}.jpg`)
            })
            try {
              await checkin(formData)
            } catch (e) {
              console.error('Checkin error', e)
            }
            goTo('result')
          }}
        />
      )}

      {screen === 'result' && (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a1830] to-[#1a2a40] text-white">
          <h1 className="text-3xl font-bold mb-8 text-cyan-400 drop-shadow-lg">
            Đăng ký thành công!
          </h1>
          <button
            onClick={() => goTo('menu')}
            className="px-10 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-xl font-bold shadow-xl hover:scale-105 hover:from-cyan-300 hover:to-blue-500 transition-all border-2 border-cyan-500/60 tracking-widest mt-8"
          >
            Quay lại màn hình chính
          </button>
        </div>
      )}
    </>
  )
}

export default App
