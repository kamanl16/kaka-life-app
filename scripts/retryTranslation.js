import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY environment variable.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function processWithGemini(title, content) {
  if (!title && !content) return { translatedTitle: "", translatedSnippet: "", success: false };
  
  const prompt = `
You are an expert news translator and summarizer.
Please process the following news article:

Title: ${title}
Content: ${content || 'No content provided.'}

Please output ONLY valid JSON format with exactly these two keys:
1. "translatedTitle": The title translated smoothly into Traditional Chinese (zh-TW).
2. "translatedSnippet": A concise, engaging 1-2 sentence summary of the content in Traditional Chinese (zh-TW).
Do not include markdown blocks like \`\`\`json, just output the raw JSON string.
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    return { ...parsed, success: true };
  } catch (error) {
    console.error("Gemini AI error:", error.message);
    return { success: false };
  }
}

async function retryTranslations() {
  console.log("Looking for news articles that failed translation...");

  // 1. Fetch untranslated articles
  const { data: failedArticles, error: fetchError } = await supabase
    .from('news')
    .select('id, title, content_snippet')
    .eq('is_translated', false)
    .limit(20); // Process in batches of 20 to avoid timeouts

  if (fetchError) {
    console.error("Failed to fetch articles:", fetchError);
    process.exit(1);
  }

  if (!failedArticles || failedArticles.length === 0) {
    console.log("No untranslated articles found. Everything is up to date!");
    await supabase.from('sync_logs').insert([{
      sync_type: 'RETRY-NEWS',
      status: 'SUCCESS',
      message: 'No untranslated articles found.',
      items_added: 0
    }]);
    process.exit(0);
  }

  console.log(`Found ${failedArticles.length} untranslated articles. Processing...`);

  let successfullyRetried = 0;

  for (const article of failedArticles) {
    console.log(`\nRetrying Article ID: ${article.id}`);
    console.log(`Original Title: ${article.title}`);

    // Since we only saved the English title and snippet (fallback), we pass them back to Gemini
    const { translatedTitle, translatedSnippet, success } = await processWithGemini(article.title, article.content_snippet);

    if (success) {
      // 2. Update the record
      const { error: updateError } = await supabase
        .from('news')
        .update({
          title: translatedTitle,
          content_snippet: translatedSnippet,
          is_translated: true
        })
        .eq('id', article.id);

      if (updateError) {
        console.error("Failed to update article in database:", updateError);
      } else {
        console.log("Successfully translated and updated!");
        successfullyRetried++;
      }
    } else {
      console.log("Translation failed again. Will retry next time.");
    }

    // Rate limit pause
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log(`\nFinished retrying! Successfully translated ${successfullyRetried} articles.`);

  // 3. Log the outcome
  await supabase.from('sync_logs').insert([{
    sync_type: 'RETRY-NEWS',
    status: 'SUCCESS',
    message: `Attempted ${failedArticles.length} retries. Successfully translated ${successfullyRetried} articles.`,
    items_added: successfullyRetried
  }]);

  process.exit(0);
}

retryTranslations();
