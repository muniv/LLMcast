'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [currentTime, setCurrentTime] = useState('')
  const [message, setMessage] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
    alert('안녕하세요! Next.js + Vercel 배포가 성공적으로 완료되었습니다! 🎊')
  }

  const testAPI = async () => {
    try {
      const response = await fetch('/api/hello')
      const data = await response.json()
      setMessage(data.message)
    } catch (error) {
      setMessage('API 호출 실패')
    }
  }

  const testChatGPT = async () => {
    if (!chatInput.trim()) {
      setChatResponse('메시지를 입력해주세요!')
      return
    }

    setIsLoading(true)
    setChatResponse('ChatGPT가 생각 중입니다...')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: chatInput }),
      })

      const data = await response.json()

      if (data.success) {
        setChatResponse(data.message)
      } else {
        setChatResponse(`오류: ${data.error} - ${data.message}`)
      }
    } catch (error) {
      setChatResponse('ChatGPT API 호출 실패')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
      <div className="text-center bg-white bg-opacity-10 p-12 rounded-3xl backdrop-blur-lg shadow-2xl border border-white border-opacity-20 max-w-lg w-full">
        <div className="text-6xl mb-6 animate-bounce">🚀</div>
        
        <h1 className="text-5xl font-bold text-white mb-6 animate-fade-in-up">
          Hello World!
        </h1>
        
        <p className="text-xl text-white text-opacity-90 mb-8 animate-fade-in-up-delay">
          Next.js + Vercel 배포 성공! 🎉
        </p>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={showMessage}
            className="bg-white bg-opacity-20 border-2 border-white border-opacity-30 text-white px-8 py-3 rounded-full text-lg transition-all duration-300 hover:bg-opacity-30 hover:transform hover:-translate-y-1 hover:shadow-lg animate-fade-in-up-delay-2 block w-full"
          >
            클릭해보세요!
          </button>
          
          <button
            onClick={testAPI}
            className="bg-green-500 bg-opacity-20 border-2 border-green-400 border-opacity-50 text-white px-8 py-3 rounded-full text-lg transition-all duration-300 hover:bg-opacity-30 hover:transform hover:-translate-y-1 hover:shadow-lg block w-full"
          >
            API 테스트
          </button>
        </div>
        
        {/* ChatGPT 테스트 섹션 */}
        <div className="space-y-4 mb-8 p-4 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-400 border-opacity-30">
          <h3 className="text-xl font-bold text-white mb-4">🤖 ChatGPT 테스트</h3>
          
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="ChatGPT에게 질문해보세요..."
            className="w-full px-4 py-3 rounded-lg bg-gray-800 bg-opacity-80 border border-blue-400 border-opacity-50 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300"
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && testChatGPT()}
          />
          
          <button
            onClick={testChatGPT}
            disabled={isLoading}
            className={`w-full px-8 py-3 rounded-full text-lg transition-all duration-300 ${
              isLoading 
                ? 'bg-gray-500 bg-opacity-50 cursor-not-allowed' 
                : 'bg-blue-500 bg-opacity-30 border-2 border-blue-400 border-opacity-50 hover:bg-opacity-40 hover:transform hover:-translate-y-1 hover:shadow-lg'
            } text-white`}
          >
            {isLoading ? '생각 중...' : 'ChatGPT에게 질문하기'}
          </button>
        </div>
        
        {message && (
          <div className="mb-4 p-3 bg-green-500 bg-opacity-20 rounded-lg text-white">
            {message}
          </div>
        )}
        
        {chatResponse && (
          <div className="mb-4 p-4 bg-purple-500 bg-opacity-20 rounded-lg text-white border border-purple-400 border-opacity-30">
            <h4 className="font-bold mb-2">🤖 ChatGPT 응답:</h4>
            <p className="whitespace-pre-wrap">{chatResponse}</p>
          </div>
        )}
        
        <div className="text-white text-opacity-70 animate-fade-in-up-delay-3">
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
