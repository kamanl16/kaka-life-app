import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { translate } from '@vitalets/google-translate-api';

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

// 2. Configure Translation Service (Free Unofficial Google Translate API)
async function translateToTraditionalChinese(text, retries = 3) {
  if (!text) return "";
  
  try {
    const { text: translatedText } = await translate(text, { to: 'zh-TW' });
    return translatedText;
  } catch (error) {
    if (error.name === 'TooManyRequestsError' && retries > 0) {
      console.log(`Rate limited. Waiting 5 seconds before retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return translateToTraditionalChinese(text, retries - 1);
    }
    console.error("Translation error:", error.message);
    return text; // Fallback to original text on error
  }
}

// 3. Fetch and Process RSS
async function fetchAndProcessNews() {
  const RSS_FEED_URL = 'https://www.cbc.ca/cmlink/rss-canada-calgary'; // CBC Calgary RSS
  
  console.log(`Fetching RSS feed from: ${RSS_FEED_URL}`);
  
  try {
    const feed = await parser.parseURL(RSS_FEED_URL);
    console.log(`Found ${feed.items.length} articles. Processing...`);

    let newArticlesAdded = 0;

    for (const item of feed.items) {
      // 3a. Check if article already exists in Supabase to avoid redundant translation API calls
      const { data: existingArticle } = await supabase
        .from('news')
        .select('id')
        .eq('link', item.link)
        .single();

      if (existingArticle) {
        // Article already exists, skip
        continue;
      }

      console.log(`\nNew Article Found: ${item.title}`);
      
      // 3b. Translate Title and Snippet
      console.log("Translating to Traditional Chinese...");
      const translatedTitle = await translateToTraditionalChinese(item.title);
      // Snippets often contain HTML tags in RSS, but we'll try to translate the plain text version
      const translatedSnippet = await translateToTraditionalChinese(item.contentSnippet || item.content);

      // 3c. Extract Image
      // CBC sometimes includes an image enclosure, OR embeds an <img> tag in the description/content
      let imageUrl = null;
      if (item.enclosure && item.enclosure.url && item.enclosure.type.startsWith('image/')) {
        imageUrl = item.enclosure.url;
      } else if (item.content) {
        // Regex to find <img src='...'> or <img src="...">
        const imgMatch = item.content.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }
      }

      // 3d. Insert into Supabase
      const { error } = await supabase
        .from('news')
        .insert([{
          title: translatedTitle,
          link: item.link,
          pub_date: new Date(item.pubDate),
          content_snippet: translatedSnippet,
          image_url: imageUrl,
          source: 'CBC Calgary',
          category: '本地'
        }]);

      if (error) {
        console.error("Failed to insert article:", error);
      } else {
        console.log("Successfully translated and added to database!");
        newArticlesAdded++;
      }
      
      // Add a longer delay to avoid hitting rate limits on the free Google translate API
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`\nFinished processing! Added ${newArticlesAdded} new translated articles.`);
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
  }
  
  // Exit the process so the terminal doesn't hang
  process.exit(0);
}

// Run the function
fetchAndProcessNews();
