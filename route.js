import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request) {
  try {
    const { prompt } = await request.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'API key not configured.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return Response.json({ result: text })
  } catch (error) {
    const message = error?.message || 'Unknown error'
    const status = error?.status || error?.code || 'no status'
    console.error('Gemini API error:', message, status)
    return Response.json({ error: `API Error: ${message} (status: ${status})` }, { status: 500 })
  }
}
