import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// OpenAI 클라이언트 초기화 (서버사이드에서만 실행됨)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 환경변수에서 안전하게 가져옴
})

export async function POST(request: Request) {
  try {
    // API 키가 설정되어 있는지 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API 키가 설정되지 않았습니다.',
          message: '환경변수 OPENAI_API_KEY를 설정해주세요.'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('🤖 ChatGPT API 호출 시작:', message)

    // ChatGPT API 호출 (서버사이드에서만 실행됨)
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 한국어로 답변해주세요.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content || '응답을 생성할 수 없습니다.'

    console.log('✅ ChatGPT 응답 완료')

    return NextResponse.json({
      success: true,
      message: aiResponse,
      timestamp: new Date().toISOString(),
      model: 'gpt-3.5-turbo',
      usage: completion.usage
    })

  } catch (error: unknown) {
    console.error('❌ ChatGPT API 오류:', error)
    
    // OpenAI API 에러 처리
    const isOpenAIError = error && typeof error === 'object' && 'error' in error
    
    if (isOpenAIError) {
      const openAIError = error as { error: { code?: string } }
      
      // API 키 관련 오류 처리
      if (openAIError.error?.code === 'invalid_api_key') {
        return NextResponse.json(
          { 
            error: 'OpenAI API 키가 유효하지 않습니다.',
            message: 'API 키를 확인해주세요.'
          },
          { status: 401 }
        )
      }

      // 할당량 초과 오류 처리
      if (openAIError.error?.code === 'insufficient_quota') {
        return NextResponse.json(
          { 
            error: 'OpenAI API 할당량이 초과되었습니다.',
            message: '결제 정보를 확인해주세요.'
          },
          { status: 429 }
        )
      }
    }

    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { 
        error: 'ChatGPT API 호출 중 오류가 발생했습니다.',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
