require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URI = process.env.FRONTEND_URI;

// Home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login
app.get('/login', (req, res) => {
    const scope = 'user-read-private user-read-email user-top-read user-read-recently-played';

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI
    });

    res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// Callback
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenRes = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization':
                        'Basic ' +
                        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
                }
            }
        );

        const accessToken = tokenRes.data.access_token;
        res.redirect(`${FRONTEND_URI}/?access_token=${accessToken}`);

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.send('Auth failed');
    }
});

// Analyze Personality
app.get('/analyze', async (req, res) => {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token' });
    }

    const token = auth.split(' ')[1];

    try {
        console.log('Fetching top tracks...');
        const topTracks = await axios.get(
            'https://api.spotify.com/v1/me/top/tracks?limit=20',
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        const tracks = topTracks.data.items;

        if (!tracks || tracks.length === 0) {
            return res.json({
                personality: 'Silent Listener',
                description: 'You don’t listen to enough music yet.',
                score: 50
            });
        }

        // Average popularity
        const avgPopularity = tracks.reduce((sum, t) => sum + t.popularity, 0) / tracks.length;

        // Explicit songs
        const explicitCount = tracks.filter(t => t.explicit).length;

        // Release years
        const years = tracks.map(t => parseInt(t.album.release_date.substring(0, 4)));
        const avgYear = years.reduce((a, b) => a + b, 0) / years.length;

        // Duration
        const avgDuration = tracks.reduce((a, t) => a + t.duration_ms, 0) / tracks.length;

        // Favorite artist
        const artists = tracks.flatMap(t => t.artists.map(a => a.name));
        const artistCount = {};
        artists.forEach(a => artistCount[a] = (artistCount[a] || 0) + 1);
        const favArtist = Object.keys(artistCount).sort((a, b) => artistCount[b] - artistCount[a])[0];

        // Personality Logic
        let personality = 'Balanced Listener';
        let description = 'You listen to a mix of everything.';

        if (avgPopularity > 75) {
            personality = 'Mainstream Listener';
            description = 'You listen to trending and popular music.';
        }

        if (avgPopularity < 40) {
            personality = 'Underground Explorer';
            description = 'You discover unique and less popular music.';
        }

        if (explicitCount > 10) {
            personality = 'Savage Listener';
            description = 'You like bold and explicit music.';
        }

        if (avgYear < 2015) {
            personality = 'Time Traveler';
            description = 'You enjoy older music.';
        }

        if (avgDuration > 240000) {
            personality = 'Chill Listener';
            description = 'You enjoy long and relaxing music.';
        }

        if (artistCount[favArtist] > 5) {
            personality = 'Super Fan';
            description = `You really love ${favArtist}.`;
        }

        const score = Math.floor(Math.random() * 40) + 60;

        res.json({
            personality,
            description,
            score,
            avgPopularity: Math.round(avgPopularity),
            explicitSongs: explicitCount,
            avgYear: Math.round(avgYear),
            favArtist
        });

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(8888, () => {
    console.log('Server running on http://127.0.0.1:8888');
});