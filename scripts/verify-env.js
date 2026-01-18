// Quick script to verify environment variables are accessible
require('dotenv').config()

console.log('\n=== Environment Variables Check ===\n')
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `✓ Found (${process.env.GEMINI_API_KEY.substring(0, 15)}...)` : '✗ NOT FOUND')
console.log('HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? `✓ Found (${process.env.HUGGINGFACE_API_KEY.substring(0, 15)}...)` : '✗ NOT FOUND')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `✓ Found (${process.env.OPENAI_API_KEY.substring(0, 15)}...)` : '✗ NOT FOUND')
console.log('\n===================================\n')

if (!process.env.GEMINI_API_KEY && !process.env.HUGGINGFACE_API_KEY && !process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: No AI API keys found!')
  console.error('Please add at least one key to your .env file:')
  console.error('  GEMINI_API_KEY=your-key-here')
  process.exit(1)
} else {
  console.log('✅ At least one AI service is configured!')
  process.exit(0)
}




