import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ModelFactory, TrainingData, ForecastModel } from './models'

interface ForecastRequest {
  targetColumn: string
  featureColumns: string[]
  forecastDays: number
  modelType?: string // 새로 추가: 모델 선택
  aggregationLevel?: string // 새로 추가: 집계 레벨 선택
}

type DataRow = Record<string, string | number>

// 집계 함수들
function aggregateTotal(data: DataRow[], targetColumn: string): DataRow[] {
  // 날짜별로 그룹핑하여 전체 합계 계산
  const groupedByDate = data.reduce((acc, row) => {
    const date = String(row.Date || '')
    if (!acc[date]) {
      acc[date] = { Date: date, [targetColumn]: 0 }
    }
    acc[date][targetColumn] = (Number(acc[date][targetColumn]) || 0) + (Number(row[targetColumn]) || 0)
    return acc
  }, {} as Record<string, DataRow>)
  
  return Object.values(groupedByDate).sort((a, b) => 
    String(a.Date).localeCompare(String(b.Date))
  )
}

function aggregateByStore(data: DataRow[], targetColumn: string): DataRow[] {
  // Store ID별로 그룹핑하여 날짜별 합계 계산
  const groupedByStoreDate = data.reduce((acc, row) => {
    const storeId = String(row['Store ID'] || '')
    const date = String(row.Date || '')
    const key = `${storeId}_${date}`
    
    if (!acc[key]) {
      acc[key] = { 
        Date: date, 
        'Store ID': storeId,
        [targetColumn]: 0 
      }
    }
    acc[key][targetColumn] = (Number(acc[key][targetColumn]) || 0) + (Number(row[targetColumn]) || 0)
    return acc
  }, {} as Record<string, DataRow>)
  
  return Object.values(groupedByStoreDate).sort((a, b) => {
    const dateCompare = String(a.Date).localeCompare(String(b.Date))
    if (dateCompare !== 0) return dateCompare
    return String(a['Store ID']).localeCompare(String(b['Store ID']))
  })
}

function aggregateByProduct(data: DataRow[], targetColumn: string): DataRow[] {
  // Product별로 그룹핑하여 날짜별 합계 계산
  const groupedByProductDate = data.reduce((acc, row) => {
    const product = String(row.Product || '')
    const date = String(row.Date || '')
    const key = `${product}_${date}`
    
    if (!acc[key]) {
      acc[key] = { 
        Date: date, 
        Product: product,
        [targetColumn]: 0 
      }
    }
    acc[key][targetColumn] = (Number(acc[key][targetColumn]) || 0) + (Number(row[targetColumn]) || 0)
    return acc
  }, {} as Record<string, DataRow>)
  
  return Object.values(groupedByProductDate).sort((a, b) => {
    const dateCompare = String(a.Date).localeCompare(String(b.Date))
    if (dateCompare !== 0) return dateCompare
    return String(a.Product).localeCompare(String(b.Product))
  })
}

function aggregateByStoreProduct(data: DataRow[], targetColumn: string): DataRow[] {
  // Store ID + Product 조합별로 개별 데이터 유지 (집계 없음)
  return data.sort((a, b) => {
    const dateCompare = String(a.Date).localeCompare(String(b.Date))
    if (dateCompare !== 0) return dateCompare
    const storeCompare = String(a['Store ID']).localeCompare(String(b['Store ID']))
    if (storeCompare !== 0) return storeCompare
    return String(a.Product).localeCompare(String(b.Product))
  })
}

export async function POST(request: NextRequest) {
  try {
    const body: ForecastRequest = await request.json()
    const { targetColumn, featureColumns, forecastDays, modelType, aggregationLevel } = body

    // 입력 검증
    if (!targetColumn || !featureColumns || featureColumns.length === 0 || !forecastDays) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // CSV 파일 읽기
    const csvPath = path.join(process.cwd(), 'data', 'retail_store_inventory.csv')
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'CSV 파일을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    // 데이터 파싱
    const data: DataRow[] = lines.slice(1).map(line => {
      const values = line.split(',')
      const row: DataRow = {}
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || ''
        // 숫자로 변환 가능한 값은 숫자로 저장
        row[header] = isNaN(Number(value)) ? value : Number(value)
      })
      return row
    })

    // 타겟 컬럼과 피쳐 컬럼 검증
    if (!headers.includes(targetColumn)) {
      return NextResponse.json(
        { error: `타겟 컬럼 '${targetColumn}'을 찾을 수 없습니다.` },
        { status: 400 }
      )
    }

    const missingFeatures = featureColumns.filter(col => !headers.includes(col))
    if (missingFeatures.length > 0) {
      return NextResponse.json(
        { error: `피쳐 컬럼을 찾을 수 없습니다: ${missingFeatures.join(', ')}` },
        { status: 400 }
      )
    }

    // 선택된 모델로 수요예측 수행
    const selectedModel = modelType || 'arima';
    const forecastResult = await performModularForecast(data, targetColumn, featureColumns, forecastDays, selectedModel, aggregationLevel || 'total')

    // 모델 이름 매핑
    const modelNames: { [key: string]: string } = {
      'arima': 'ARIMA 모델',
      'sarima': 'SARIMA 모델',
      'holt-winters': 'Holt-Winters 모델',
      'time-llm': 'Time-LLM'
    };

    return NextResponse.json({
      success: true,
      forecast: forecastResult,
      metadata: {
        targetColumn,
        featureColumns,
        forecastDays,
        dataRows: data.length,
        algorithm: modelNames[selectedModel] || selectedModel
      }
    })

  } catch (error) {
    console.error('수요예측 오류:', error)
    return NextResponse.json(
      { 
        error: '수요예측 처리 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

async function performModularForecast(
  data: DataRow[], 
  targetColumn: string, 
  featureColumns: string[], 
  forecastDays: number,
  modelType: string = 'arima',
  aggregationLevel: string = 'total'
) {
  // 집계 레벨에 따른 그룹별 예측 처리
  if (aggregationLevel === 'total') {
    // 기존 로직: 전체 합계로 단일 예측
    const processedData = aggregateTotal(data, targetColumn)
    const targetData = processedData.map((row, index) => ({
      value: Number(row[targetColumn]) || 0,
      index,
      date: String(row.Date || '')
    })).filter(item => !isNaN(item.value) && item.value >= 0)
    
    return await performSingleForecast(targetData, forecastDays, modelType)
  } else {
    // 그룹별 예측: 각 그룹마다 개별 예측 수행
    return await performGroupedForecast(data, targetColumn, aggregationLevel, forecastDays, modelType)
  }
}

// 단일 예측 (기존 로직)
async function performSingleForecast(
  targetData: Array<{value: number, index: number, date: string}>,
  forecastDays: number,
  modelType: string
) {
  
  if (targetData.length < 10) {
    throw new Error('예측을 위한 충분한 데이터가 없습니다. (최소 10개 필요)')
  }
  
  // Train/Test 분할 (마지막 2주를 테스트 데이터로)
  const testDays = Math.min(14, Math.floor(targetData.length * 0.3)) // 최대 14일, 전체의 30% 이하
  const splitIndex = targetData.length - testDays
  const trainData = targetData.slice(0, splitIndex)
  const testData = targetData.slice(splitIndex)
  
  const trainValues = trainData.map(item => item.value)
  const testValues = testData.map(item => item.value)
  const actualForecastDays = Math.min(forecastDays, testData.length)
  
  // 모델 선택 및 생성
  const model: ForecastModel = ModelFactory.createModel(modelType, {
    seasonalPeriod: 7 // 주간 계절성
  })
  
  // 모델 학습
  const trainingData: TrainingData = {
    values: trainValues,
    dates: trainData.map(item => item.date)
  }
  
  await model.fit(trainingData)
  
  // 1단계: 테스트 데이터로 정확도 검증
  const testPredictions = await model.predict(actualForecastDays)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testForecasts = testPredictions.forecasts.map((forecast: any, index: number) => ({
    ...forecast,
    date: testData[index]?.date || getDateAfterDays(index + 1),
    actual_value: testValues[index] || 0,
    error: Math.abs(forecast.predicted_value - (testValues[index] || 0)),
    error_percentage: testValues[index] > 0 ? 
      Math.abs((forecast.predicted_value - testValues[index]) / testValues[index]) * 100 : 0
  }))
  
  // 2단계: 실제 미래 예측
  const futurePredictions = await model.predict(forecastDays)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const futureForecasts = futurePredictions.forecasts.map((forecast: any, index: number) => ({
    ...forecast,
    date: getDateAfterDays(index + 1) // 실제 오늘 날짜 기준 미래
  }))
  
  // 정확도 메트릭 계산
  const accuracy = await model.validateFit(testValues.slice(0, actualForecastDays))
  
  // 기본 통계 계산
  const mean = trainValues.reduce((sum, val) => sum + val, 0) / trainValues.length
  const variance = trainValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / trainValues.length
  const stdDev = Math.sqrt(variance)

  return {
    test_forecasts: testForecasts,
    future_forecasts: futureForecasts,
    statistics: {
      ...testPredictions.statistics,
      historical_mean: Math.round(mean * 100) / 100,
      historical_std: Math.round(stdDev * 100) / 100,
      data_points: trainData.length,
      train_size: trainData.length,
      test_size: testData.length,
      algorithm: `${model.name} 모델`
    },
    accuracy: {
      mae: Math.round(accuracy.mae * 100) / 100,
      mse: Math.round(accuracy.mse * 100) / 100,
      rmse: Math.round(accuracy.rmse * 100) / 100,
      mape: Math.round(accuracy.mape * 100) / 100,
      r2: Math.round(accuracy.r2 * 1000) / 1000,
      accuracy_percentage: Math.round(accuracy.accuracy_percentage * 100) / 100
    }
  }
}

// 그룹별 예측 (점포별, 상품별, 점포+상품별)
async function performGroupedForecast(
  data: DataRow[],
  targetColumn: string,
  aggregationLevel: string,
  forecastDays: number,
  modelType: string
) {
  // 그룹 키 결정
  let groupKey: string
  switch (aggregationLevel) {
    case 'by-store':
      groupKey = 'Store ID'
      break
    case 'by-product':
      groupKey = 'Product ID'
      break
    case 'by-category':
      groupKey = 'Category'
      break
    case 'by-store-product':
      groupKey = 'Store ID,Product ID' // 조합 키
      break
    case 'by-store-category':
      groupKey = 'Store ID,Category' // 조합 키
      break
    default:
      throw new Error(`지원하지 않는 집계 레벨: ${aggregationLevel}`)
  }
  
  // 데이터를 그룹별로 분류
  const groups = new Map<string, DataRow[]>()
  
  data.forEach(row => {
    let groupValue: string
    if (aggregationLevel === 'by-store-product') {
      groupValue = `${row['Store ID']},${row['Product ID']}`
    } else if (aggregationLevel === 'by-store-category') {
      groupValue = `${row['Store ID']},${row['Category']}`
    } else {
      groupValue = String(row[groupKey] || '')
    }
    
    if (!groups.has(groupValue)) {
      groups.set(groupValue, [])
    }
    groups.get(groupValue)!.push(row)
  })
  
  // 각 그룹에 대해 개별 예측 수행
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupResults = new Map<string, any>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalTestForecasts: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalFutureForecasts: any[] = []
  
  for (const [groupValue, groupData] of groups.entries()) {
    // 그룹 데이터를 날짜별로 집계
    const aggregatedData = groupData.reduce((acc, row) => {
      const date = String(row.Date || '')
      if (!acc[date]) {
        acc[date] = { Date: date, [targetColumn]: 0 }
        // 그룹 정보 보존
        if (aggregationLevel === 'by-store') {
          acc[date]['Store ID'] = row['Store ID']
        } else if (aggregationLevel === 'by-product') {
          acc[date]['Product ID'] = row['Product ID']
        } else if (aggregationLevel === 'by-category') {
          acc[date]['Category'] = row['Category']
        } else if (aggregationLevel === 'by-store-product') {
          acc[date]['Store ID'] = row['Store ID']
          acc[date]['Product ID'] = row['Product ID']
        } else if (aggregationLevel === 'by-store-category') {
          acc[date]['Store ID'] = row['Store ID']
          acc[date]['Category'] = row['Category']
        }
      }
      acc[date][targetColumn] = (Number(acc[date][targetColumn]) || 0) + (Number(row[targetColumn]) || 0)
      return acc
    }, {} as Record<string, DataRow>)
    
    const targetData = Object.values(aggregatedData)
      .sort((a, b) => String(a.Date).localeCompare(String(b.Date)))
      .map((row, index) => ({
        value: Number(row[targetColumn]) || 0,
        index,
        date: String(row.Date || ''),
        groupInfo: aggregationLevel === 'by-store' ? { storeId: row['Store ID'] } :
                  aggregationLevel === 'by-product' ? { productId: row['Product ID'] } :
                  aggregationLevel === 'by-category' ? { category: row['Category'] } :
                  aggregationLevel === 'by-store-product' ? { storeId: row['Store ID'], productId: row['Product ID'] } :
                  aggregationLevel === 'by-store-category' ? { storeId: row['Store ID'], category: row['Category'] } :
                  {}
      }))
      .filter(item => !isNaN(item.value) && item.value >= 0)
    
    if (targetData.length >= 10) {
      try {
        const groupResult = await performSingleForecast(targetData, forecastDays, modelType)
        
        // 그룹 정보를 결과에 추가
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enhancedTestForecasts = groupResult.test_forecasts.map((forecast: any) => ({
          ...forecast,
          group: groupValue,
          groupInfo: targetData[0]?.groupInfo
        }))
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enhancedFutureForecasts = groupResult.future_forecasts.map((forecast: any) => ({
          ...forecast,
          group: groupValue,
          groupInfo: targetData[0]?.groupInfo
        }))
        
        groupResults.set(groupValue, {
          ...groupResult,
          test_forecasts: enhancedTestForecasts,
          future_forecasts: enhancedFutureForecasts,
          group: groupValue
        })
        
        totalTestForecasts.push(...enhancedTestForecasts)
        totalFutureForecasts.push(...enhancedFutureForecasts)
      } catch (error) {
        console.warn(`그룹 ${groupValue} 예측 실패:`, error)
      }
    }
  }
  
  // 전체 결과 집계
  const totalDataPoints = Array.from(groupResults.values()).reduce((sum, result) => sum + result.statistics.data_points, 0)
  const totalTrainSize = Array.from(groupResults.values()).reduce((sum, result) => sum + result.statistics.train_size, 0)
  const totalTestSize = Array.from(groupResults.values()).reduce((sum, result) => sum + result.statistics.test_size, 0)
  
  return {
    test_forecasts: totalTestForecasts,
    future_forecasts: totalFutureForecasts,
    groups: Object.fromEntries(groupResults),
    statistics: {
      data_points: totalDataPoints,
      train_size: totalTrainSize,
      test_size: totalTestSize,
      group_count: groupResults.size,
      algorithm: `${modelType.toUpperCase()} 모델 (그룹별)`,
      aggregation_level: aggregationLevel
    },
    accuracy: {
      // 그룹별 정확도는 개별로 계산됨
      group_accuracies: Object.fromEntries(
        Array.from(groupResults.entries()).map(([group, result]) => [group, result.accuracy])
      )
    }
  }
}

function getDateAfterDays(days: number): string {
  const today = new Date()
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  return futureDate.toISOString().split('T')[0]
}


