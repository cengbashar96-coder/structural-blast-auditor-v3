import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const PAGES_DIR = '/home/z/my-project/upload/pdf_pages_reduced';
const OUTPUT_FILE = '/home/z/my-project/upload/vlm_full_extraction.txt';
const START_PAGE = parseInt(process.argv[2] || '1');
const END_PAGE = parseInt(process.argv[3] || '46');

async function processPage(zai, pageNum) {
  const imgPath = path.join(PAGES_DIR, `page-${String(pageNum).padStart(2, '0')}_small.jpg`);
  if (!fs.existsSync(imgPath)) {
    return `[PAGE ${pageNum}] - Image file not found`;
  }
  
  const imageBuffer = fs.readFileSync(imgPath);
  const base64Image = imageBuffer.toString('base64');
  const imageUrl = `data:image/jpeg;base64,${base64Image}`;
  
  const prompt = `أنت تقرأ صفحة من أطروحة هندسية عربية عن المنشآت التحصينية وتحليل الانفجارات الديناميكية.
استخرج كل نص عربي وكل معادلة رياضية وكل قيمة عددية من هذه الصفحة.
اكتب المعادلات بتدوين LaTeX.
لا تختصر - انقل كل شيء حرفياً.
إذا كانت هناك رسوم بيانية أو منحنيات، صفها بالتفصيل واذكر القيم المقروءة منها.
إذا كانت هناك جداول، انقلها بالكامل.`;

  try {
    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });
    
    return response.choices[0]?.message?.content || '[No content]';
  } catch (error) {
    return `[ERROR: ${error.message}]`;
  }
}

async function main() {
  const zai = await ZAI.create();
  const results = [];
  
  for (let i = START_PAGE; i <= END_PAGE; i++) {
    console.error(`Processing page ${i}...`);
    const result = await processPage(zai, i);
    results.push(`\n=== PAGE ${i} ===\n${result}`);
    console.error(`Page ${i}: done (${result.length} chars)`);
  }
  
  fs.writeFileSync(OUTPUT_FILE, results.join('\n'), 'utf-8');
  console.error(`\nAll results saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
