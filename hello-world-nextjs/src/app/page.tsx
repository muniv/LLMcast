'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      setCurrentTime(timeString)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  const showMessage = () => {
    alert('안녕하세요! Vercel 배포가 성공적으로 완료되었습니다! 🎊')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
      <div className="text-center bg-white bg-opacity-10 p-12 rounded-3xl backdrop-blur-lg shadow-2xl border border-white border-opacity-20 max-w-lg w-full">
        <div className="text-6xl mb-6 animate-bounce">🚀</div>
        
        <h1 className="text-5xl font-bold text-white mb-6 animate-fade-in-up">
          Hello World!
        </h1>
        
        <p className="text-xl text-white text-opacity-90 mb-8 animate-fade-in-up-delay">
          Vercel 배포 테스트 성공! 🎉
        </p>
        
        <button
          onClick={showMessage}
          className="bg-white bg-opacity-20 border-2 border-white border-opacity-30 text-white px-8 py-3 rounded-full text-lg transition-all duration-300 hover:bg-opacity-30 hover:transform hover:-translate-y-1 hover:shadow-lg animate-fade-in-up-delay-2"
        >
          클릭해보세요!
        </button>
        
        <div className="mt-8 text-white text-opacity-70 animate-fade-in-up-delay-3">
          현재 시간: {currentTime}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out;
        }

        .animate-fade-in-up-delay {
          animation: fadeInUp 1s ease-out 0.3s both;
        }

        .animate-fade-in-up-delay-2 {
          animation: fadeInUp 1s ease-out 0.6s both;
        }

        .animate-fade-in-up-delay-3 {
          animation: fadeInUp 1s ease-out 0.9s both;
        }
      `}</style>
    </div>
  )
}
