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
  const [forecastData, setForecastData] = useState<{
    success: boolean;
    forecast: {
      test_forecasts: Array<{
        day: number;
        date: string;
        predicted_value: number;
        actual_value?: number;
        confidence_lower: number;
        confidence_upper: number;
        confidence_level: number;
        error?: number;
        error_percentage?: number;
      }>;
      future_forecasts: Array<{
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
        train_size?: number;
        test_size?: number;
      };
      accuracy?: {
        mae: number;
        mse: number;
        rmse: number;
        mape: number;
        r2: number;
        accuracy_percentage: number;
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
  const [selectedModel, setSelectedModel] = useState('arima')

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
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
      setCsvData(data)
      setShowDataModal(true)
    } catch (error) {
      console.error('Data loading error:', error)
      alert('데이터 로딩 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingData(false)
    }
  }

  const runForecast = async () => {
    if (!targetColumn || featureColumns.length === 0 || forecastDays < 1) {
      alert('대상 컬럼, 피쳐 컬럼, 예측 기간을 모두 설정해주세요.')
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
          forecastDays,
          modelType: selectedModel,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setForecastData(result)
      } else {
        alert('예측 실행 중 오류가 발생했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('Forecast error:', error)
      alert('예측 실행 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingForecast(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">수요예측 대시보드</h1>
            <div className="text-sm text-gray-600">
              {currentTime}
            </div>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 데이터 불러오기</h2>
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
                {isLoadingData ? '로딩 중...' : '데이터 불러오기'}
              </button>
            </div>

            {/* 수요예측 설정 카드 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">수요예측</h3>
              
              {/* 타겟 컬럼 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">예측 타겟 컬럼</label>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">타겟 컬럼 선택</option>
                  <option value="Units Sold">Units Sold</option>
                  <option value="Units Ordered">Units Ordered</option>
                  <option value="Price">Price</option>
                </select>
              </div>

              {/* 피쳐 컬럼 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  피쳐 컬럼 선택 (다중 선택 가능)
                </label>
                {csvData && (
                  <div className="mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (featureColumns.length === csvData.headers.length) {
                          setFeatureColumns([])
                        } else {
                          setFeatureColumns([...csvData.headers])
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {featureColumns.length === csvData.headers.length ? '모두 해제' : '모두 선택'}
                    </button>
                  </div>
                )}
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {csvData && csvData.headers.map((header: string) => (
                    <div key={header} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={header}
                        checked={featureColumns.includes(header)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFeatureColumns([...featureColumns, header])
                          } else {
                            setFeatureColumns(featureColumns.filter(col => col !== header))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{header}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 예측 모델 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">예측 모델</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="arima">ARIMA (자기회귀통합이동평균)</option>
                  <option value="sarima">SARIMA (계절성 ARIMA)</option>
                  <option value="holt-winters">Holt-Winters (지수평활법)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedModel === 'arima' && '트렌드와 자기상관성을 고려한 기본 시계열 모델'}
                  {selectedModel === 'sarima' && '계절성 패턴을 포함한 고급 시계열 모델'}
                  {selectedModel === 'holt-winters' && '트렌드와 계절성을 동시에 고려하는 지수평활 모델'}
                </p>
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
                disabled={!targetColumn || featureColumns.length === 0 || forecastDays < 1 || isLoadingForecast}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {isLoadingForecast ? '예측 중...' : '수요예측 실행'}
              </button>
            </div>
          </div>

          {/* 우측 패널: 결과 표시 영역 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 예측 결과</h2>
              
              {forecastData ? (
                <div className="space-y-6">
                  {/* 예측 설정, 통계 및 정확도 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">예측 설정</h3>
                      <p className="text-sm text-blue-700">타겟: {forecastData.metadata.targetColumn}</p>
                      <p className="text-sm text-blue-700">예측 기간: {forecastData.metadata.forecastDays}일</p>
                      <p className="text-sm text-blue-700">피쳐: {forecastData.metadata.featureColumns.length}개</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-900 mb-2">데이터 분할</h3>
                      <p className="text-sm text-green-700">학습 데이터: {forecastData.forecast.statistics.train_size || 0}개</p>
                      <p className="text-sm text-green-700">테스트 데이터: {forecastData.forecast.statistics.test_size || 0}개</p>
                      <p className="text-sm text-green-700">트렌드: {forecastData.forecast.statistics.trend_per_day > 0 ? '+' : ''}{forecastData.forecast.statistics.trend_per_day}/일</p>
                    </div>
                    {forecastData.forecast.accuracy && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-purple-900 mb-2">예측 정확도</h3>
                        <p className="text-sm text-purple-700">정확도: {forecastData.forecast.accuracy.accuracy_percentage}%</p>
                        <p className="text-sm text-purple-700">MAPE: {forecastData.forecast.accuracy.mape}%</p>
                        <p className="text-sm text-purple-700">R²: {forecastData.forecast.accuracy.r2}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* 예측 결과: 테스트 및 미래 예측 */}
                  <div className="space-y-6">
                    {/* 정확도 검증 결과 테이블 */}
                    {forecastData.forecast.test_forecasts && forecastData.forecast.test_forecasts.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">🧪 정확도 검증 결과 (마지막 2주)</h4>
                        
                        {/* 정확도 요약 */}
                        {forecastData.forecast.accuracy && (
                          <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-xl font-bold text-blue-600">
                                  {forecastData.forecast.accuracy.accuracy_percentage.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">전체 정확도</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-green-600">
                                  {forecastData.forecast.accuracy.mape.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">MAPE (오차율)</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-purple-600">
                                  {forecastData.forecast.accuracy.r2.toFixed(3)}
                                </div>
                                <div className="text-sm text-gray-600">R² (설명력)</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-orange-600">
                                  {forecastData.forecast.accuracy.mae.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-600">MAE (평균절대오차)</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-red-600">
                                {forecastData.forecast.accuracy.rmse.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-600">RMSE (평균제곱근오차)</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-600">
                                {forecastData.forecast.statistics.test_size}개
                              </div>
                              <div className="text-sm text-gray-600">검증 데이터</div>
                            </div>
                          </div>
                        </div>
                        )}
                        
                        {/* 테스트 데이터 상세 결과 테이블 */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">날짜</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">실제값</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">예측값</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">오차</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700 border-b">오차율</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-700 border-b">신뢰구간</th>
                              </tr>
                            </thead>
                            <tbody>
                              {forecastData.forecast.test_forecasts.map((item, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-3 py-2 border-b text-gray-900">{item.date}</td>
                                  <td className="px-3 py-2 border-b text-right font-medium">
                                    {item.actual_value?.toFixed(1) || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 border-b text-right">
                                    {item.predicted_value.toFixed(1)}
                                  </td>
                                  <td className="px-3 py-2 border-b text-right">
                                    <span className={`${
                                      (item.error || 0) > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {item.error ? (item.error > 0 ? '+' : '') + item.error.toFixed(1) : 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 border-b text-right">
                                    <span className={`${
                                      (item.error_percentage || 0) > 10 ? 'text-red-600' : 
                                      (item.error_percentage || 0) > 5 ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                      {item.error_percentage ? item.error_percentage.toFixed(1) + '%' : 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 border-b text-center text-xs text-gray-500">
                                    [{item.confidence_lower.toFixed(1)}, {item.confidence_upper.toFixed(1)}]
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* 미래 예측 결과 */}
                    {forecastData.forecast.future_forecasts && forecastData.forecast.future_forecasts.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">🔮 미래 예측 결과 (실제 예측)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-green-50">
                                <th className="px-3 py-2 text-left border border-gray-200 font-medium">일자</th>
                                <th className="px-3 py-2 text-left border border-gray-200 font-medium">예측값</th>
                                <th className="px-3 py-2 text-left border border-gray-200 font-medium">신뢰구간</th>
                                <th className="px-3 py-2 text-left border border-gray-200 font-medium">신뢰도</th>
                              </tr>
                            </thead>
                            <tbody>
                              {forecastData.forecast.future_forecasts.map((forecast, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-green-25'}>
                                  <td className="px-3 py-2 border border-gray-200">{forecast.date}</td>
                                  <td className="px-3 py-2 border border-gray-200 font-semibold text-green-600">{forecast.predicted_value}</td>
                                  <td className="px-3 py-2 border border-gray-200 text-gray-600">
                                    {forecast.confidence_lower} ~ {forecast.confidence_upper}
                                  </td>
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
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    알고리즘: {forecastData.metadata.algorithm}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p>수요예측을 실행하면 결과가 여기에 표시됩니다.</p>
                  </div>
                </div>
              )}
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
              <div className="mt-2 text-sm text-gray-600">
                전체 {csvData.totalRows}행 중 {csvData.previewRows}행 미리보기
              </div>
            </div>
            
            <div className="overflow-auto max-h-[70vh] p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {csvData.headers.map((header: string, index: number) => (
                        <th key={index} className="px-3 py-2 text-left border border-gray-200 font-medium">
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
              <div className="flex justify-end">
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
    </div>
  )
}
