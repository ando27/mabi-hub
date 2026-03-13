import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request) {
  try {
    const { prompt } = await request.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro-exp-03-25' })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return Response.json({ result: text })
  } catch (error) {
    console.error('Gemini API error:', error)
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
