import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // CSV 파일 경로
    const csvPath = path.join(process.cwd(), 'data', 'retail_store_inventory.csv')
    
    // 파일이 존재하는지 확인
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'CSV 파일을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // CSV 파일 읽기
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // CSV를 줄별로 분리
    const lines = csvContent.trim().split('\n')
    const headers = lines[0].split(',')
    
    // 처음 20줄만 미리보기로 제공 (헤더 포함)
    const previewLines = lines.slice(0, 21) // 헤더 + 20개 데이터
    
    // CSV 데이터를 객체 배열로 변환
    const data = previewLines.slice(1).map(line => {
      const values = line.split(',')
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || ''
      })
      return row
    })

    return NextResponse.json({
      success: true,
      headers: headers.map(h => h.trim()),
      data: data,
      totalRows: lines.length - 1, // 헤더 제외
      previewRows: data.length,
      message: `총 ${lines.length - 1}개 행 중 ${data.length}개 행을 미리보기로 표시합니다.`
    })

  } catch (error) {
    console.error('CSV 파일 읽기 오류:', error)
    return NextResponse.json(
      { 
        error: 'CSV 파일을 읽는 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
