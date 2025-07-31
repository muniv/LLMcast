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
  const [aggregationLevel, setAggregationLevel] = useState('total')
  const [availableColumns, setAvailableColumns] = useState<string[]>([
    'Date', 'Store ID', 'Product ID', 'Category', 'Region', 'Inventory Level',
    'Units Sold', 'Units Ordered', 'Demand Forecast', 'Price', 'Discount',
    'Weather Condition', 'Holiday/Promotion', 'Competitor Pricing', 'Seasonality'
  ])

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
      
      // 실제 데이터에서 컬럼 추출하여 업데이트
      if (data && data.length > 0) {
        const actualColumns = Object.keys(data[0])
        setAvailableColumns(actualColumns)
      }
      
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
          aggregationLevel,
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
            
            {/* 데이터 확인하기 카드 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 데이터 확인하기</h2>
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
                {isLoadingData ? '로딩 중...' : '데이터 확인하기'}
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
                  <option value="Inventory Level">Inventory Level</option>
                </select>
              </div>

              {/* 피쳐 컬럼 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  피쳐 컬럼 선택 (다중 선택 가능)
                </label>
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (featureColumns.length === availableColumns.length) {
                        setFeatureColumns([])
                      } else {
                        setFeatureColumns([...availableColumns])
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {featureColumns.length === availableColumns.length ? '모두 해제' : '모두 선택'}
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {availableColumns.map((header: string) => (
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

              {/* 집계 레벨 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">📊 집계 레벨</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="aggregationLevel"
                      value="total"
                      checked={aggregationLevel === 'total'}
                      onChange={(e) => setAggregationLevel(e.target.value)}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium text-sm">전체</div>
                      <div className="text-xs text-gray-500">통합 예측</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="aggregationLevel"
                      value="by-store"
                      checked={aggregationLevel === 'by-store'}
                      onChange={(e) => setAggregationLevel(e.target.value)}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium text-sm">점포별</div>
                      <div className="text-xs text-gray-500">Store ID별 집계</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="aggregationLevel"
                      value="by-product"
                      checked={aggregationLevel === 'by-product'}
                      onChange={(e) => setAggregationLevel(e.target.value)}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium text-sm">카테고리별</div>
                      <div className="text-xs text-gray-500">Category별 집계</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="aggregationLevel"
                      value="by-store-product"
                      checked={aggregationLevel === 'by-store-product'}
                      onChange={(e) => setAggregationLevel(e.target.value)}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium text-sm">점포+카테고리별</div>
                      <div className="text-xs text-gray-500">각 조합별 개별 예측</div>
                    </div>
                  </label>
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
                  <option value="time-llm">Time-LLM</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedModel === 'arima' && '트렌드와 자기상관성을 고려한 기본 시계열 모델'}
                  {selectedModel === 'sarima' && '계절성 패턴을 포함한 고급 시계열 모델'}
                  {selectedModel === 'holt-winters' && '트렌드와 계절성을 동시에 고려하는 지수평활 모델'}
                  {selectedModel === 'time-llm' && '시계열 데이터를 토큰화 → 프롬프트로 변환 → LLM 추론 → 예측결과 토큰 해석 → 시계열 값 도출'}
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
                    {/* 정확도 검증 결과 - 그룹별 또는 전체 */}
                    {forecastData.forecast.test_forecasts && forecastData.forecast.test_forecasts.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">
                          🧪 정확도 검증 결과 
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(forecastData.forecast.statistics as any)?.group_count && (
                            <span className="text-sm font-normal text-gray-600">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              ({(forecastData.forecast.statistics as any).group_count}개 그룹, 마지막 2주)
                            </span>
                          )}
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {!(forecastData.forecast.statistics as any)?.group_count && (
                            <span className="text-sm font-normal text-gray-600">(마지막 2주)</span>
                          )}
                        </h4>
                        
                        {/* 그룹별 결과 표시 */}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(forecastData.forecast as any).groups ? (
                          <div className="space-y-6">
                            {/* 평균 그룹 정확도 표시 */}
                            {(aggregationLevel === 'by-store' || aggregationLevel === 'by-product' || aggregationLevel === 'by-store-product') && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-blue-800">
                                    📊 평균 그룹 정확도
                                  </span>
                                  <span className="text-lg font-bold text-blue-900">
                                    {(() => {
                                      /* eslint-disable @typescript-eslint/no-explicit-any */
                                      const groups = Object.values((forecastData.forecast as any).groups)
                                      const validAccuracies = groups
                                        .map((g: any) => g.accuracy?.accuracy_percentage)
                                        .filter((acc: any) => acc != null && !isNaN(acc))
                                      /* eslint-enable @typescript-eslint/no-explicit-any */
                                      const avgAccuracy = validAccuracies.length > 0 
                                        ? validAccuracies.reduce((sum: number, acc: number) => sum + acc, 0) / validAccuracies.length
                                        : 0
                                      return avgAccuracy.toFixed(1)
                                    })()}%
                                  </span>
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  {Object.keys((forecastData.forecast as any).groups).length}개 그룹의 평균 정확도
                                </div>
                              </div>
                            )}
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {Object.entries((forecastData.forecast as any).groups).map(([groupName, groupData]: [string, any]) => (
                              <div key={groupName} className="border rounded-lg p-4">
                                <h5 className="font-medium text-gray-800 mb-3">
                                  {aggregationLevel === 'by-store' && `🏢 점포: ${groupName}`}
                                  {aggregationLevel === 'by-product' && `📋 카테고리: ${groupName}`}
                                  {aggregationLevel === 'by-store-product' && `🏢📋 ${groupName.replace(',', ' - ')}`}
                                  <span className="ml-2 text-sm text-gray-500">
                                    (정확도: {groupData.accuracy?.accuracy_percentage?.toFixed(1) || 'N/A'}%)
                                  </span>
                                </h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm border border-gray-200 rounded">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-2 py-1 text-left font-medium text-gray-700 border-b">날짜</th>
                                        <th className="px-2 py-1 text-right font-medium text-gray-700 border-b">실제</th>
                                        <th className="px-2 py-1 text-right font-medium text-gray-700 border-b">예측</th>
                                        <th className="px-2 py-1 text-right font-medium text-gray-700 border-b">오차</th>
                                        <th className="px-2 py-1 text-right font-medium text-gray-700 border-b">오차율</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                      {groupData.test_forecasts?.map((item: any, index: number) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                          <td className="px-2 py-1 border-b text-gray-900 text-xs">{item.date}</td>
                                          <td className="px-2 py-1 border-b text-right font-medium text-xs">
                                            {item.actual_value?.toFixed(1) || 'N/A'}
                                          </td>
                                          <td className="px-2 py-1 border-b text-right text-xs">
                                            {item.predicted_value.toFixed(1)}
                                          </td>
                                          <td className="px-2 py-1 border-b text-right text-xs">
                                            <span className={`${
                                              (item.error || 0) > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                              {item.error ? (item.error > 0 ? '+' : '') + item.error.toFixed(1) : 'N/A'}
                                            </span>
                                          </td>
                                          <td className="px-2 py-1 border-b text-right text-xs">
                                            <span className={`${
                                              (item.error_percentage || 0) > 10 ? 'text-red-600' : 
                                              (item.error_percentage || 0) > 5 ? 'text-orange-600' : 'text-green-600'
                                            }`}>
                                              {item.error_percentage ? item.error_percentage.toFixed(1) + '%' : 'N/A'}
                                            </span>
                                          </td>
                                        </tr>
                                      )) || []}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* 전체 집계 결과 (기존 테이블) */
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
                        )}
                      </div>
                    )}
                    
                    {/* 미래 예측 결과 - 그룹별 또는 전체 */}
                    {forecastData.forecast.future_forecasts && forecastData.forecast.future_forecasts.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">
                          🔮 미래 예측 결과 (실제 예측)
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(forecastData.forecast.statistics as any)?.group_count && (
                            <span className="text-sm font-normal text-gray-600">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              ({(forecastData.forecast.statistics as any).group_count}개 그룹)
                            </span>
                          )}
                        </h4>
                        
                        {/* 그룹별 미래 예측 결과 */}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(forecastData.forecast as any).groups ? (
                          <div className="space-y-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {Object.entries((forecastData.forecast as any).groups).map(([groupName, groupData]: [string, any]) => (
                              <div key={groupName} className="border rounded-lg p-3">
                                <h5 className="font-medium text-gray-800 mb-2">
                                  {aggregationLevel === 'by-store' && `🏢 점포: ${groupName}`}
                                  {aggregationLevel === 'by-product' && `📋 카테고리: ${groupName}`}
                                  {aggregationLevel === 'by-store-product' && `🏢📋 ${groupName.replace(',', ' - ')}`}
                                </h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-green-50">
                                        <th className="px-2 py-1 text-left border border-gray-200 font-medium text-xs">일자</th>
                                        <th className="px-2 py-1 text-left border border-gray-200 font-medium text-xs">예측값</th>
                                        <th className="px-2 py-1 text-left border border-gray-200 font-medium text-xs">신뢰구간</th>
                                        <th className="px-2 py-1 text-left border border-gray-200 font-medium text-xs">신뢰도</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                      {groupData.future_forecasts?.map((forecast: any, index: number) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-green-25'}>
                                          <td className="px-2 py-1 border border-gray-200 text-xs">{forecast.date}</td>
                                          <td className="px-2 py-1 border border-gray-200 font-semibold text-green-600 text-xs">
                                            {forecast.predicted_value.toFixed(1)}
                                          </td>
                                          <td className="px-2 py-1 border border-gray-200 text-gray-600 text-xs">
                                            {forecast.confidence_lower.toFixed(1)} ~ {forecast.confidence_upper.toFixed(1)}
                                          </td>
                                          <td className="px-2 py-1 border border-gray-200 text-xs">
                                            <span className="px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              {forecast.confidence_level}%
                                            </span>
                                          </td>
                                        </tr>
                                      )) || []}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* 전체 집계 미래 예측 결과 (기존 테이블) */
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
                        )}
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
                <h2 className="text-xl font-semibold text-gray-900">📊 소매점 재고 데이터 확인하기</h2>
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
