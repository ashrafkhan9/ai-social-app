// Test script to verify environment variable loading
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

console.log('\n=== Testing Environment Variable Loading ===\n')

// Method 1: Direct dotenv
dotenv.config()
console.log('Method 1 - dotenv.config():')
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `✓ Found (${process.env.GEMINI_API_KEY.substring(0, 15)}...)` : '✗ NOT FOUND')

// Method 2: Read file directly
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split('\n')
  const geminiLine = lines.find(l => l.trim().startsWith('GEMINI_API_KEY='))
  
  if (geminiLine) {
    const value = geminiLine.split('=')[1]?.trim().replace(/^["']|["']$/g, '')
    console.log('Method 2 - Direct file read:')
    console.log('  GEMINI_API_KEY:', value ? `✓ Found (${value.substring(0, 15)}...)` : '✗ NOT FOUND')
  }
}

console.log('\n=== Test Complete ===\n')




