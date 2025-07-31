import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ModelFactory, TrainingData, ForecastModel } from './models'

interface ForecastRequest {
  targetColumn: string
  featureColumns: string[]
  forecastDays: number
  modelType?: string // 새로 추가: 모델 선택
}

type DataRow = Record<string, string | number>

export async function POST(request: NextRequest) {
  try {
    const body: ForecastRequest = await request.json()
    const { targetColumn, featureColumns, forecastDays } = body

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

    // 간단한 수요예측 알고리즘 (이동평균 + 트렌드 분석)
    const forecastResult = performModularForecast(data, targetColumn, featureColumns, forecastDays, body.modelType || 'arima')

    return NextResponse.json({
      success: true,
      forecast: forecastResult,
      metadata: {
        targetColumn,
        featureColumns,
        forecastDays,
        dataRows: data.length,
        algorithm: 'Moving Average with Trend Analysis'
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

function performModularForecast(
  data: DataRow[], 
  targetColumn: string, 
  featureColumns: string[], 
  forecastDays: number,
  modelType: string = 'arima'
) {
  // 대상 데이터 추출 및 정리
  const targetData = data.map((row, index) => ({
    value: Number(row[targetColumn]) || 0,
    index,
    date: String(row.Date || '')
  })).filter(item => !isNaN(item.value) && item.value >= 0)
  
  if (targetData.length < 10) {
    throw new Error('예측을 위한 충분한 데이터가 없습니다. (최소 10개 필요)')
  }
  
  // Train/Test 분할 (80/20)
  const splitIndex = Math.floor(targetData.length * 0.8)
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
  
  model.fit(trainingData)
  
  // 1단계: 테스트 데이터로 정확도 검증
  const testPredictions = model.predict(actualForecastDays)
  const testForecasts = testPredictions.forecasts.map((forecast, index) => ({
    ...forecast,
    date: testData[index]?.date || getDateAfterDays(index + 1),
    actual_value: testValues[index] || 0,
    error: Math.abs(forecast.predicted_value - (testValues[index] || 0)),
    error_percentage: testValues[index] > 0 ? 
      Math.abs((forecast.predicted_value - testValues[index]) / testValues[index]) * 100 : 0
  }))
  
  // 2단계: 실제 미래 예측
  const futurePredictions = model.predict(forecastDays)
  const futureForecasts = futurePredictions.forecasts.map((forecast, index) => ({
    ...forecast,
    date: getDateAfterDays(index + 1) // 실제 오늘 날짜 기준 미래
  }))
  
  // 정확도 메트릭 계산
  const accuracy = model.validateFit(testValues.slice(0, actualForecastDays))
  
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

function getDateAfterDays(days: number): string {
  const today = new Date()
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  return futureDate.toISOString().split('T')[0]
}


