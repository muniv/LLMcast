import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface ForecastRequest {
  targetColumn: string
  featureColumns: string[]
  forecastDays: number
}

interface DataRow {
  [key: string]: string | number
}

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
    const forecastResult = performSimpleForecast(data, targetColumn, featureColumns, forecastDays)

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

function performSimpleForecast(
  data: DataRow[], 
  targetColumn: string, 
  featureColumns: string[], 
  forecastDays: number
) {
  // 타겟 컬럼의 숫자 값만 추출
  const targetValues = data
    .map(row => Number(row[targetColumn]))
    .filter(val => !isNaN(val))

  if (targetValues.length === 0) {
    throw new Error('타겟 컬럼에 유효한 숫자 데이터가 없습니다.')
  }

  // 기본 통계 계산
  const mean = targetValues.reduce((sum, val) => sum + val, 0) / targetValues.length
  const variance = targetValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / targetValues.length
  const stdDev = Math.sqrt(variance)

  // 최근 N개 값의 이동평균 (N = 최소 3, 최대 10)
  const windowSize = Math.min(Math.max(3, Math.floor(targetValues.length / 10)), 10)
  const recentValues = targetValues.slice(-windowSize)
  const movingAverage = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length

  // 트렌드 계산 (최근 값들의 기울기)
  let trend = 0
  if (recentValues.length >= 2) {
    const firstHalf = recentValues.slice(0, Math.floor(recentValues.length / 2))
    const secondHalf = recentValues.slice(Math.floor(recentValues.length / 2))
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    trend = (secondAvg - firstAvg) / firstHalf.length
  }

  // 계절성 요인 (간단한 주기 패턴 감지)
  const seasonalityFactor = detectSeasonality(targetValues)

  // 예측 생성
  const forecasts = []
  for (let day = 1; day <= forecastDays; day++) {
    // 기본 예측값 = 이동평균 + (트렌드 * 일수)
    let forecastValue = movingAverage + (trend * day)
    
    // 계절성 적용
    const seasonalAdjustment = seasonalityFactor * Math.sin((day / 7) * 2 * Math.PI) * 0.1
    forecastValue += seasonalAdjustment * forecastValue
    
    // 불확실성 범위 (표준편차 기반)
    const uncertainty = stdDev * Math.sqrt(day) * 0.5
    
    forecasts.push({
      day: day,
      date: getDateAfterDays(day),
      predicted_value: Math.max(0, Math.round(forecastValue * 100) / 100),
      confidence_lower: Math.max(0, Math.round((forecastValue - uncertainty) * 100) / 100),
      confidence_upper: Math.round((forecastValue + uncertainty) * 100) / 100,
      confidence_level: Math.max(0.6, Math.min(0.95, 1 - (day * 0.05))) // 시간이 지날수록 신뢰도 감소
    })
  }

  return {
    forecasts,
    statistics: {
      historical_mean: Math.round(mean * 100) / 100,
      historical_std: Math.round(stdDev * 100) / 100,
      recent_average: Math.round(movingAverage * 100) / 100,
      trend_per_day: Math.round(trend * 100) / 100,
      data_points: targetValues.length,
      window_size: windowSize
    }
  }
}

function detectSeasonality(values: number[]): number {
  // 간단한 계절성 감지 (주간 패턴)
  if (values.length < 14) return 0
  
  const weeklyPattern = []
  for (let i = 0; i < 7; i++) {
    const dayValues = values.filter((_, index) => index % 7 === i)
    if (dayValues.length > 0) {
      weeklyPattern.push(dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length)
    }
  }
  
  if (weeklyPattern.length === 0) return 0
  
  const patternMean = weeklyPattern.reduce((sum, val) => sum + val, 0) / weeklyPattern.length
  const variance = weeklyPattern.reduce((sum, val) => sum + Math.pow(val - patternMean, 2), 0) / weeklyPattern.length
  
  return Math.sqrt(variance) / patternMean // 변동계수
}

function getDateAfterDays(days: number): string {
  const today = new Date()
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  return futureDate.toISOString().split('T')[0]
}
