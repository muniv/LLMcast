import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, model = 'gpt-4o' } = await request.json();

    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    console.log('OpenAI API 호출 시작:', { model, messageLength: message.length });

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.1, // 일관된 예측을 위해 낮은 온도 설정
      }),
    });

    console.log('OpenAI API 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API 오류:', errorText);
      return NextResponse.json(
        { error: `OpenAI API 오류: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('OpenAI API 성공 응답:', {
      model: data.model,
      usage: data.usage,
      responseLength: data.choices?.[0]?.message?.content?.length
    });

    // 응답 반환
    return NextResponse.json({
      response: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('Chat API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
