'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [currentTime, setCurrentTime] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showDataModal, setShowDataModal] = useState(false)
  const [csvData, setCsvData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [showForecastModal, setShowForecastModal] = useState(false)
  const [forecastData, setForecastData] = useState<any>(null)
  const [isLoadingForecast, setIsLoadingForecast] = useState(false)
  const [targetColumn, setTargetColumn] = useState('')
  const [featureColumns, setFeatureColumns] = useState<string[]>([])
  const [forecastDays, setForecastDays] = useState(7)

  useEffect(() => {
    // 컴포넌트가 마운트되었음을 표시
    setMounted(true)
    
    // 클라이언트에서만 시간 업데이트
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

    // 초기 렌더링 후에만 시간 설정
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
    } catch {
      setMessage('API 호출 실패')
    }
  }

  const loadDataPreview = async () => {
    setIsLoadingData(true)
    
    try {
      const response = await fetch('/api/data')
      const data = await response.json()
      
      if (data.success) {
        setCsvData(data)
        setShowDataModal(true)
      } else {
        alert(`데이터 로드 오류: ${data.error}`)
      }
    } catch {
      alert('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingData(false)
    }
  }

  const runForecast = async () => {
    if (!targetColumn) {
      alert('예측 타겟 컴럼을 선택해주세요.')
      return
    }
    if (featureColumns.length === 0) {
      alert('피쳐 컴럼을 최소 1개 이상 선택해주세요.')
      return
    }
    if (forecastDays < 1 || forecastDays > 30) {
      alert('예측 기간은 1일에서 30일 사이로 입력해주세요.')
      return
    }

    setIsLoadingForecast(true)
    
    try {
      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetColumn,
          featureColumns,
          forecastDays
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setForecastData(data)
        setShowForecastModal(true)
      } else {
        alert(`예측 오류: ${data.error}`)
      }
    } catch {
      alert('수요예측 실행 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingForecast(false)
    }
  }

  const handleFeatureColumnChange = (column: string, checked: boolean) => {
    if (checked) {
      setFeatureColumns([...featureColumns, column])
    } else {
      setFeatureColumns(featureColumns.filter(col => col !== column))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">수요예측 대시보드</h1>
            {mounted && (
              <div className="text-sm text-gray-500">
                현재 시간: {currentTime}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 좌측 패널: 설정 및 컨트롤 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 데이터 미리보기 카드 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 데이터 미리보기</h2>
              <p className="text-sm text-gray-600 mb-4">소매점 재고 데이터를 확인하세요.</p>
              <button
                onClick={loadDataPreview}
                disabled={isLoadingData}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isLoadingData 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoadingData ? '데이터 로딩 중...' : '데이터 미리보기'}
              </button>
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
        
        {/* 데이터 미리보기 섹션 */}
        <div className="space-y-4 mb-8 p-4 bg-green-500 bg-opacity-20 rounded-lg border border-green-400 border-opacity-30">
          <h3 className="text-xl font-bold text-white mb-4">📊 데이터 미리보기</h3>
          <div className="space-y-4 mb-6">
            <button
              onClick={loadDataPreview}
              disabled={isLoadingData}
              className={`w-full px-8 py-3 rounded-full text-lg transition-all duration-300 ${
                isLoadingData 
                  ? 'bg-gray-500 bg-opacity-50 cursor-not-allowed' 
                  : 'bg-green-500 bg-opacity-30 border-2 border-green-400 border-opacity-50 hover:bg-opacity-40 hover:transform hover:-translate-y-1 hover:shadow-lg'
              } text-white`}
            >
              {isLoadingData ? '데이터 로딩 중...' : '📊 데이터 미리보기'}
            </button>
          </div>
        </div>

        {/* 수요예측 섹션 */}
        <div className="space-y-4 mb-8 p-4 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-400 border-opacity-30">
          <h3 className="text-xl font-bold text-white mb-4">🔮 수요예측</h3>
          
          {/* 타겟 컴럼 선택 */}
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">예측 타겟 컴럼</label>
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 bg-opacity-80 border border-blue-400 border-opacity-50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">타겟 컴럼 선택</option>
              <option value="Units Sold">Units Sold (판매량)</option>
              <option value="Units Ordered">주문량 (Units Ordered)</option>
              <option value="Demand Forecast">수요예측 (Demand Forecast)</option>
              <option value="Inventory Level">재고량 (Inventory Level)</option>
            </select>
          </div>

          {/* 피쳐 컴럼 다중 선택 */}
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">피쳐 컴럼 (다중 선택 가능)</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-gray-800 bg-opacity-50 p-3 rounded-lg">
              {['Date', 'Store ID', 'Product ID', 'Category', 'Region', 'Price', 'Discount', 'Weather Condition', 'Holiday/Promotion', 'Competitor Pricing', 'Seasonality'].map((column) => (
                <label key={column} className="flex items-center text-white text-sm">
                  <input
                    type="checkbox"
                    checked={featureColumns.includes(column)}
                    onChange={(e) => handleFeatureColumnChange(column, e.target.checked)}
                    className="mr-2 accent-blue-400"
                  />
                  {column}
                </label>
              ))}
            </div>
          </div>

          {/* 예측 기간 입력 */}
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">예측 기간 (일)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={forecastDays}
              onChange={(e) => setForecastDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 bg-opacity-80 border border-blue-400 border-opacity-50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="예: 7일"
            />
          </div>

          {/* 예측 실행 버튼 */}
          <button
            onClick={runForecast}
            disabled={isLoadingForecast}
            className={`w-full px-8 py-3 rounded-full text-lg transition-all duration-300 ${
              isLoadingForecast 
                ? 'bg-gray-500 bg-opacity-50 cursor-not-allowed' 
                : 'bg-blue-500 bg-opacity-30 border-2 border-blue-400 border-opacity-50 hover:bg-opacity-40 hover:transform hover:-translate-y-1 hover:shadow-lg'
            } text-white`}
          >
            {isLoadingForecast ? '예측 실행 중...' : '🔮 수요예측 실행'}
          </button>
        </div>
        
        {message && (
          <div className="mb-4 p-3 bg-green-500 bg-opacity-20 rounded-lg text-white">
            {message}
          </div>
        )}
        

        
        {mounted && (
          <div className="text-white text-opacity-70 animate-fade-in-up-delay-3">
            현재 시간: {currentTime}
          </div>
        )}
      </div>

      {/* 데이터 미리보기 모달 */}
      {showDataModal && csvData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📊 소매점 재고 데이터 미리보기</h2>
                <button
                  onClick={() => setShowDataModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-300 mt-2">{csvData.message}</p>
            </div>
            
            <div className="overflow-auto max-h-[70vh] p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-white">
                  <thead>
                    <tr className="bg-gray-800">
                      {csvData.headers.map((header: string, index: number) => (
                        <th key={index} className="px-3 py-2 text-left border border-gray-600 font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.data.map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800 bg-opacity-50' : 'bg-gray-700 bg-opacity-30'}>
                        {csvData.headers.map((header: string, colIndex: number) => (
                          <td key={colIndex} className="px-3 py-2 border border-gray-600 text-gray-200">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700 bg-gray-800">
              <div className="flex justify-between items-center text-gray-300">
                <span>총 {csvData.totalRows}개 행 중 {csvData.previewRows}개 행 표시</span>
                <button
                  onClick={() => setShowDataModal(false)}
                  className="px-4 py-2 bg-blue-500 bg-opacity-30 border border-blue-400 border-opacity-50 rounded-lg text-white hover:bg-opacity-40 transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수요예측 결과 모달 */}
      {showForecastModal && forecastData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">🔮 수요예측 결과</h2>
                <button
                  onClick={() => setShowForecastModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-500 bg-opacity-20 p-3 rounded-lg">
                  <p className="text-blue-300 font-semibold">예측 설정</p>
                  <p className="text-white">타겟: {forecastData.metadata.targetColumn}</p>
                  <p className="text-white">기간: {forecastData.metadata.forecastDays}일</p>
                  <p className="text-white">피쳐: {forecastData.metadata.featureColumns.length}개</p>
                </div>
                <div className="bg-green-500 bg-opacity-20 p-3 rounded-lg">
                  <p className="text-green-300 font-semibold">데이터 통계</p>
                  <p className="text-white">평균: {forecastData.forecast.statistics.historical_mean}</p>
                  <p className="text-white">최근 평균: {forecastData.forecast.statistics.recent_average}</p>
                  <p className="text-white">트렌드: {forecastData.forecast.statistics.trend_per_day > 0 ? '+' : ''}{forecastData.forecast.statistics.trend_per_day}/일</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-auto max-h-[60vh] p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-white">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="px-3 py-2 text-left border border-gray-600 font-semibold">일자</th>
                      <th className="px-3 py-2 text-left border border-gray-600 font-semibold">예측값</th>
                      <th className="px-3 py-2 text-left border border-gray-600 font-semibold">신뢰구간 (하한)</th>
                      <th className="px-3 py-2 text-left border border-gray-600 font-semibold">신뢰구간 (상한)</th>
                      <th className="px-3 py-2 text-left border border-gray-600 font-semibold">신뢰도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.forecast.forecasts.map((forecast: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-800 bg-opacity-50' : 'bg-gray-700 bg-opacity-30'}>
                        <td className="px-3 py-2 border border-gray-600 text-gray-200">{forecast.date}</td>
                        <td className="px-3 py-2 border border-gray-600 text-blue-300 font-semibold">{forecast.predicted_value}</td>
                        <td className="px-3 py-2 border border-gray-600 text-gray-300">{forecast.confidence_lower}</td>
                        <td className="px-3 py-2 border border-gray-600 text-gray-300">{forecast.confidence_upper}</td>
                        <td className="px-3 py-2 border border-gray-600">
                          <span className={`px-2 py-1 rounded text-xs ${
                            forecast.confidence_level > 0.8 ? 'bg-green-500 bg-opacity-30 text-green-300' :
                            forecast.confidence_level > 0.6 ? 'bg-yellow-500 bg-opacity-30 text-yellow-300' :
                            'bg-red-500 bg-opacity-30 text-red-300'
                          }`}>
                            {Math.round(forecast.confidence_level * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700 bg-gray-800">
              <div className="flex justify-between items-center text-gray-300">
                <span>알고리즘: {forecastData.metadata.algorithm}</span>
                <button
                  onClick={() => setShowForecastModal(false)}
                  className="px-4 py-2 bg-blue-500 bg-opacity-30 border border-blue-400 border-opacity-50 rounded-lg text-white hover:bg-opacity-40 transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
