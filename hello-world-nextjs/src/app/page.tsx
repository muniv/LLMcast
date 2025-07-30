'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [currentTime, setCurrentTime] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showDataModal, setShowDataModal] = useState(false)
  const [csvData, setCsvData] = useState<{
    success: boolean;
    headers: string[];
    data: Record<string, string>[];
    totalRows: number;
    previewRows: number;
    message: string;
  } | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [showForecastModal, setShowForecastModal] = useState(false)
  const [forecastData, setForecastData] = useState<{
    success: boolean;
    forecast: {
      forecasts: Array<{
        day: number;
        date: string;
        predicted_value: number;
        confidence_lower: number;
        confidence_upper: number;
        confidence_level: number;
      }>;
      statistics: {
        historical_mean: number;
        historical_std: number;
        recent_average: number;
        trend_per_day: number;
        data_points: number;
        window_size: number;
      };
    };
    metadata: {
      targetColumn: string;
      featureColumns: string[];
      forecastDays: number;
      dataRows: number;
      algorithm: string;
    };
  } | null>(null)
  const [isLoadingForecast, setIsLoadingForecast] = useState(false)
  const [targetColumn, setTargetColumn] = useState('')
  const [featureColumns, setFeatureColumns] = useState<string[]>([])
  const [forecastDays, setForecastDays] = useState(7)

  useEffect(() => {
    setMounted(true)
    
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleString('ko-KR', {
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
      alert('예측 타겟 컬럼을 선택해주세요.')
      return
    }
    if (featureColumns.length === 0) {
      alert('피쳐 컬럼을 최소 1개 이상 선택해주세요.')
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
            </div>

            {/* 수요예측 설정 카드 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🔮 수요예측 설정</h2>
              
              {/* 타겟 컬럼 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">예측 타겟 컬럼</label>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">타겟 컬럼 선택</option>
                  <option value="Units Sold">Units Sold (판매량)</option>
                  <option value="Units Ordered">Units Ordered (주문량)</option>
                  <option value="Demand Forecast">Demand Forecast (수요예측)</option>
                  <option value="Inventory Level">Inventory Level (재고량)</option>
                </select>
              </div>

              {/* 피쳐 컬럼 다중 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">피쳐 컬럼 (다중 선택)</label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                  <div className="grid grid-cols-1 gap-2">
                    {['Date', 'Store ID', 'Product ID', 'Category', 'Region', 'Price', 'Discount', 'Weather Condition', 'Holiday/Promotion', 'Competitor Pricing', 'Seasonality'].map((column) => (
                      <label key={column} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={featureColumns.includes(column)}
                          onChange={(e) => handleFeatureColumnChange(column, e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">{column}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 예측 기간 입력 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">예측 기간 (일)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={forecastDays}
                  onChange={(e) => setForecastDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 7일"
                />
              </div>

              {/* 예측 실행 버튼 */}
              <button
                onClick={runForecast}
                disabled={isLoadingForecast}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isLoadingForecast 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLoadingForecast ? '예측 실행 중...' : '🔮 수요예측 실행'}
              </button>
            </div>
          </div>

          {/* 우측 패널: 결과 표시 영역 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-96">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 예측 결과</h2>
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p>수요예측을 실행하면 결과가 여기에 표시됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 데이터 미리보기 모달 */}
      {showDataModal && csvData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">📊 소매점 재고 데이터 미리보기</h2>
                <button
                  onClick={() => setShowDataModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">{csvData.message}</p>
            </div>
            
            <div className="overflow-auto max-h-[70vh] p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {csvData.headers.map((header: string, index: number) => (
                        <th key={index} className="px-3 py-2 text-left border border-gray-200 font-medium text-gray-900">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.data.map((row: Record<string, string>, rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {csvData.headers.map((header: string, colIndex: number) => (
                          <td key={colIndex} className="px-3 py-2 border border-gray-200 text-gray-700">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 {csvData.totalRows}개 행 중 {csvData.previewRows}개 행 표시</span>
                <button
                  onClick={() => setShowDataModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">🔮 수요예측 결과</h2>
                <button
                  onClick={() => setShowForecastModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">예측 설정</h3>
                  <p className="text-sm text-blue-700">타겟: {forecastData.metadata.targetColumn}</p>
                  <p className="text-sm text-blue-700">기간: {forecastData.metadata.forecastDays}일</p>
                  <p className="text-sm text-blue-700">피쳐: {forecastData.metadata.featureColumns.length}개</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-900 mb-2">데이터 통계</h3>
                  <p className="text-sm text-green-700">평균: {forecastData.forecast.statistics.historical_mean}</p>
                  <p className="text-sm text-green-700">최근 평균: {forecastData.forecast.statistics.recent_average}</p>
                  <p className="text-sm text-green-700">트렌드: {forecastData.forecast.statistics.trend_per_day > 0 ? '+' : ''}{forecastData.forecast.statistics.trend_per_day}/일</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-auto max-h-[60vh] p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left border border-gray-200 font-medium">일자</th>
                      <th className="px-3 py-2 text-left border border-gray-200 font-medium">예측값</th>
                      <th className="px-3 py-2 text-left border border-gray-200 font-medium">신뢰구간 (하한)</th>
                      <th className="px-3 py-2 text-left border border-gray-200 font-medium">신뢰구간 (상한)</th>
                      <th className="px-3 py-2 text-left border border-gray-200 font-medium">신뢰도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.forecast.forecasts.map((forecast: {
                      day: number;
                      date: string;
                      predicted_value: number;
                      confidence_lower: number;
                      confidence_upper: number;
                      confidence_level: number;
                    }, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 border border-gray-200">{forecast.date}</td>
                        <td className="px-3 py-2 border border-gray-200 font-semibold text-blue-600">{forecast.predicted_value}</td>
                        <td className="px-3 py-2 border border-gray-200 text-gray-600">{forecast.confidence_lower}</td>
                        <td className="px-3 py-2 border border-gray-200 text-gray-600">{forecast.confidence_upper}</td>
                        <td className="px-3 py-2 border border-gray-200">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            forecast.confidence_level > 0.8 ? 'bg-green-100 text-green-800' :
                            forecast.confidence_level > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
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
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">알고리즘: {forecastData.metadata.algorithm}</span>
                <button
                  onClick={() => setShowForecastModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
