import User from '../models/User.js';

const GITHUB_API = 'https://api.github.com';

// ── POST /api/github/sync  — sync a GitHub username
export async function syncGithub(req, res) {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'GitHub username is required' });

    // Fetch user info
    const userRes = await fetch(`${GITHUB_API}/users/${username}`, {
      headers: { 'User-Agent': 'CleanCoder-App', Accept: 'application/vnd.github+json' },
    });

    if (!userRes.ok) {
      return res.status(404).json({ success: false, message: 'GitHub user not found' });
    }
    const githubUser = await userRes.json();

    // Fetch top repos
    const reposRes = await fetch(
      `${GITHUB_API}/users/${username}/repos?sort=stars&direction=desc&per_page=10`,
      { headers: { 'User-Agent': 'CleanCoder-App', Accept: 'application/vnd.github+json' } }
    );
    const repos = await reposRes.json();

    const repoData = Array.isArray(repos)
      ? repos.slice(0, 10).map(r => ({
          name:        r.name,
          url:         r.html_url,
          language:    r.language || 'Unknown',
          stars:       r.stargazers_count,
          description: r.description || '',
        }))
      : [];

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      githubUsername: username,
      githubSynced:   true,
      githubRepos:    repoData,
    });

    res.json({
      success: true,
      data: {
        username,
        name:          githubUser.name,
        bio:           githubUser.bio,
        avatar:        githubUser.avatar_url,
        followers:     githubUser.followers,
        following:     githubUser.following,
        publicRepos:   githubUser.public_repos,
        repos:         repoData,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/github/profile  — fetch synced github data
export async function getGithubProfile(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select('githubUsername githubSynced githubRepos');

    if (!user.githubSynced || !user.githubUsername) {
      return res.json({ success: true, data: null, synced: false });
    }

    // Fetch fresh from GitHub API
    const userRes = await fetch(`${GITHUB_API}/users/${user.githubUsername}`, {
      headers: { 'User-Agent': 'CleanCoder-App' },
    });

    const githubUser = userRes.ok ? await userRes.json() : {};

    res.json({
      success: true,
      synced: true,
      data: {
        username:   user.githubUsername,
        name:       githubUser.name,
        bio:        githubUser.bio,
        avatar:     githubUser.avatar_url,
        followers:  githubUser.followers,
        following:  githubUser.following,
        publicRepos:githubUser.public_repos,
        repos:      user.githubRepos,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── DELETE /api/github/disconnect
export async function disconnectGithub(req, res) {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      githubUsername: null,
      githubSynced: false,
      githubRepos: [],
    });
    res.json({ success: true, message: 'GitHub disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
