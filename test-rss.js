import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
});

async function testFeeds() {
  const urls = [
    'https://www.trumba.com/calendars/map-feeds.rss',
    'https://globalnews.ca/calgary/feed/',
    'https://calgaryherald.com/feed/'
  ];

  for (const url of urls) {
    try {
      console.log(`\nTesting: ${url}`);
      const feed = await parser.parseURL(url);
      console.log(`Title: ${feed.title}`);
      if (feed.items.length > 0) {
        const item = feed.items[0];
        console.log(`First item title: ${item.title}`);
        console.log(`Has link? ${!!item.link}`);
        console.log(`Has pubDate? ${!!item.pubDate} (${item.pubDate})`);
        console.log(`Has contentSnippet? ${!!item.contentSnippet}`);
      } else {
        console.log('No items found.');
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

testFeeds();
