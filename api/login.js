// This checks the username and password you type against the ones
// YOU set in Vercel's Environment Variables — never written in the code itself.

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  const validUser = process.env.SITE_USERNAME;
  const validPass = process.env.SITE_PASSWORD;

  if (!validUser || !validPass) {
    return res.status(500).json({ ok: false, error: 'Login is not set up yet — add SITE_USERNAME and SITE_PASSWORD in Vercel.' });
  }

  if (username === validUser && password === validPass) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: 'Wrong username or password.' });
}
