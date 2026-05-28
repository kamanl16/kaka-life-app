import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env file
dotenv.config();

// 1. Initialize Supabase Client (Use Service Role Key for backend scripts to bypass RLS)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.");
  console.error("Please add them to your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/xhtml+xml, text/html;q=0.9, */*;q=0.8'
  }
});

// 2. Configure Gemini AI Service
if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY environment variable. Please add it to your .env file.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function processWithGemini(title, content) {
  if (!title && !content) return { translatedTitle: "", translatedSnippet: "" };
  
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
    // Clean up potential markdown formatting
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini AI error:", error.message);
    // Fallback to original text if AI fails
    return { 
      translatedTitle: title, 
      translatedSnippet: content ? content.substring(0, 150) + '...' : '' 
    };
  }
}

// 3. Fetch and Process RSS
async function fetchAndProcessNews() {
  const RSS_FEEDS = [
    { url: 'https://www.cbc.ca/cmlink/rss-canada-calgary', source: 'CBC Calgary', category: '本地' },
    { url: 'https://globalnews.ca/calgary/feed/', source: 'Global News', category: '本地' },
    { url: 'https://calgaryherald.com/feed/', source: 'Calgary Herald', category: '社區' },
    { url: 'https://www.cbc.ca/cmlink/rss-world', source: 'CBC World', category: '國際' },
    { url: 'https://www.trumba.com/calendars/map-feeds.rss', source: 'City Events', category: '活動' }
  ];

  let totalArticlesFound = 0;
  let totalNewArticlesAdded = 0;

  console.log(`Starting to fetch from ${RSS_FEEDS.length} RSS feeds...`);

  for (const feedConfig of RSS_FEEDS) {
    console.log(`\n--- Fetching: ${feedConfig.source} ---`);
    try {
      const feed = await parser.parseURL(feedConfig.url);
      
      // Limit to top 15 articles per feed to avoid checking too many records
      const recentItems = feed.items.slice(0, 15);
      totalArticlesFound += recentItems.length;
      
      console.log(`Found ${recentItems.length} recent articles. Checking database...`);

      for (const item of recentItems) {
        // 3a. Check if article already exists in Supabase
        const { data: existingArticle } = await supabase
          .from('news')
          .select('id')
          .eq('link', item.link)
          .single();

        if (existingArticle) continue;

        console.log(`New Article: ${item.title}`);
        
        // 3b. Translate and Summarize using Gemini AI
        console.log("Processing with Gemini AI (Translation & Summary)...");
        const { translatedTitle, translatedSnippet } = await processWithGemini(item.title, item.contentSnippet || item.content);

        // 3c. Extract Image
        let imageUrl = null;
        if (item.enclosure && item.enclosure.url && item.enclosure.type.startsWith('image/')) {
          imageUrl = item.enclosure.url;
        } else if (item.content) {
          const imgMatch = item.content.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }
        // Specific fallback for Global News / Calgary Herald 'media:content' if available
        if (!imageUrl && item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
          imageUrl = item['media:content']['$'].url;
        }

        // 3d. Insert into Supabase
        const { error } = await supabase
          .from('news')
          .insert([{
            title: translatedTitle,
            link: item.link,
            pub_date: new Date(item.pubDate || new Date()),
            content_snippet: translatedSnippet,
            image_url: imageUrl,
            source: feedConfig.source,
            category: feedConfig.category
          }]);

        if (error) {
          console.error(`Failed to insert article (${feedConfig.source}):`, error);
        } else {
          console.log(`Successfully translated and added to database!`);
          totalNewArticlesAdded++;
        }
        
        // Add a 5-second delay to comply with Gemini Free Tier rate limits (15 Requests Per Minute)
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`Error fetching RSS feed for ${feedConfig.source}:`, error.message);
      // Log individual feed error but continue to next feed
      await supabase.from('sync_logs').insert([{
        sync_type: 'NEWS',
        status: 'ERROR',
        message: `Error from ${feedConfig.source}: ${error.message || 'Unknown error'}`,
        items_added: 0
      }]);
    }
  }

  console.log(`\n==========================================`);
  console.log(`Finished ALL feeds! Total new articles added: ${totalNewArticlesAdded}`);
  
  // Log overall success
  await supabase.from('sync_logs').insert([{
    sync_type: 'NEWS',
    status: 'SUCCESS',
    message: `Processed ${RSS_FEEDS.length} sources. Found ${totalArticlesFound} articles. Added ${totalNewArticlesAdded} new translated articles.`,
    items_added: totalNewArticlesAdded
  }]);
  
  // Exit the process so the terminal doesn't hang
  process.exit(0);
}

// Run the function
fetchAndProcessNews();
