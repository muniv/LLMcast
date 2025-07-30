import { NextResponse } from 'next/server'

export async function GET() {
  // 여기서 나중에 ChatGPT API 키를 환경변수로 안전하게 사용할 수 있습니다
  // const apiKey = process.env.OPENAI_API_KEY
  
  return NextResponse.json({
    message: '🎉 API 라우트가 성공적으로 작동합니다! 서버사이드에서 안전하게 API 키를 사용할 수 있어요.',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul'
    })
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // 여기서 ChatGPT API 호출 예시:
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-3.5-turbo',
    //     messages: [{ role: 'user', content: body.message }],
    //   }),
    // })
    
    return NextResponse.json({
      message: `서버에서 받은 메시지: ${body.message || '메시지 없음'}`,
      echo: body,
      processed: true
    })
  } catch {
    return NextResponse.json(
      { error: 'API 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
