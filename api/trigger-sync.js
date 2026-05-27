import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS setup for Vercel (allow frontend to call this)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Verify Authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get user from JWT
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify Role is Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  // 2. Trigger GitHub Action
  const githubToken = process.env.GITHUB_PAT;
  if (!githubToken) {
    return res.status(500).json({ error: 'Missing GITHUB_PAT environment variable. Please add it to Vercel.' });
  }

  try {
    const { syncType } = req.body || {};
    
    // Call GitHub API to trigger workflow_dispatch
    const githubRepo = 'kamanl16/kaka-life-app';
    const workflowId = 'daily-sync.yml';

    const githubRes = await fetch(`https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          sync_type: syncType || 'all'
        }
      })
    });

    if (!githubRes.ok) {
      const errorText = await githubRes.text();
      console.error("GitHub API Error:", errorText);
      return res.status(500).json({ error: `GitHub API responded with ${githubRes.status}: ${errorText}` });
    }

    return res.status(200).json({ message: 'Sync triggered successfully! Check GitHub Actions tab for progress.' });
  } catch (error) {
    console.error("Trigger error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
