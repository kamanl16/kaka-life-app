import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // need node-fetch if using Node < 18, but Node 18+ has native fetch

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const yelpApiKey = process.env.YELP_API_KEY;

if (!supabaseUrl || !supabaseKey || !yelpApiKey) {
  console.error("Missing environment variables (Supabase or Yelp API Key).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map Yelp categories to our UI categories
const mapCategory = (yelpCategories) => {
  const categoryAliases = yelpCategories.map(c => c.alias);
  
  if (categoryAliases.includes('dimsum') || categoryAliases.includes('chinese')) return '中式餐飲';
  if (categoryAliases.includes('japanese') || categoryAliases.includes('korean') || categoryAliases.includes('sushi')) return '日韓料理';
  if (categoryAliases.includes('bubbletea') || categoryAliases.includes('desserts') || categoryAliases.includes('coffee')) return '奶茶甜點';
  if (categoryAliases.includes('grocery') || categoryAliases.includes('supermarket')) return '超市購物';
  
  return '西式餐飲'; // Default fallback
};

async function fetchAndProcessPlaces() {
  console.log("Fetching places from Yelp Fusion API...");

  // Search parameters for Calgary
  const searchQueries = [
    'categories=chinese,dimsum&limit=10',
    'categories=japanese,sushi,korean&limit=10',
    'categories=bubbletea,desserts&limit=10',
    'categories=grocery,supermarket&limit=10',
    'categories=steak,newamerican&limit=10'
  ];

  let addedCount = 0;

  for (const query of searchQueries) {
    const url = `https://api.yelp.com/v3/businesses/search?location=Calgary&${query}&sort_by=rating`;
    
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${yelpApiKey}`,
          accept: 'application/json'
        }
      });
      
      const data = await response.json();

      if (!data.businesses) {
        console.error("Yelp API Error:", data);
        continue;
      }

      for (const business of data.businesses) {
        // Check if exists
        const { data: existingPlace } = await supabase
          .from('places')
          .select('id')
          .eq('yelp_id', business.id)
          .single();

        const uiCategory = mapCategory(business.categories);
        
        // Build description (Yelp doesn't provide long descriptions, so we construct a small one)
        const categoriesText = business.categories.map(c => c.title).join(', ');
        const description = `位於卡加利的${categoriesText}。`;

        const payload = {
          yelp_id: business.id,
          name: business.name,
          category: uiCategory,
          rating: business.rating,
          reviews_count: business.review_count,
          price_level: business.price || '$$',
          area: business.location.city,
          address: business.location.address1 || '',
          yelp_url: business.url,
          image_url: business.image_url,
          description: description,
          is_open: !business.is_closed
        };

        if (existingPlace) {
          const { error } = await supabase.from('places').update(payload).eq('id', existingPlace.id);
          if (error) {
            console.error(`Failed to update ${business.name}:`, error);
          } else {
            console.log(`Updated: ${business.name}`);
            addedCount++;
          }
        } else {
          const { error } = await supabase.from('places').insert([payload]);
          if (error) {
            console.error(`Failed to insert ${business.name}:`, error);
          } else {
            console.log(`Added: ${business.name} (${uiCategory})`);
            addedCount++;
          }
        }
      }
      
      // Delay between queries to respect API limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.error(`Error fetching query ${query}:`, err);
      // Log individual query error but continue
      await supabase.from('sync_logs').insert([{
        sync_type: 'PLACES',
        status: 'ERROR',
        message: `Query failed: ${query}. Error: ${err.message || 'Unknown error'}`,
        items_added: 0
      }]);
    }
  }

  console.log(`\nFinished! Added/Updated ${addedCount} places.`);
  
  // Log overall success
  await supabase.from('sync_logs').insert([{
    sync_type: 'PLACES',
    status: 'SUCCESS',
    message: `Processed 5 Yelp queries. Added/Updated ${addedCount} places.`,
    items_added: addedCount
  }]);
  
  process.exit(0);
}

fetchAndProcessPlaces();
