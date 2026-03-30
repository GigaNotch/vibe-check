const btn = document.getElementById('login');
const title = document.querySelector('h1');
const dis = document.querySelector('.dis');

const BACKEND_URL = 'https://vibe-check-bkuq.onrender.com';

btn.addEventListener('click', () => {
    window.location.href = `${BACKEND_URL}/login`;
});

// Check for access token in URL
const params = new URLSearchParams(window.location.search);
const token = params.get('access_token');

if (token) {
    window.history.replaceState({}, document.title, window.location.pathname);

    btn.style.display = 'none';
    dis.style.display = 'none';
    title.innerText = 'Analyzing your vibe...';

    fetch(`${BACKEND_URL}/analyze`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to fetch personality');
        return res.json();
    })
    .then(data => {
        title.innerText = data.personality;

        const desc = document.createElement('p');
        desc.className = 'vibe-description';
        desc.innerText = data.description;

        const p = document.createElement('p');
        p.className = 'vibe-score';
        p.innerText = `Vibe Score: ${Math.round(data.score * 100)}%`;
        
        let container = document.querySelector('.container');
        container.appendChild(desc);
        container.appendChild(p);

        const resetBtn = document.createElement('button');
        resetBtn.innerText = 'Analyze Again';
        resetBtn.onclick = () => window.location.href = '/';
        container.appendChild(resetBtn);
    })
    .catch(err => {
        console.error('Analysis Error:', err);
        title.innerText = 'Something went wrong';
        dis.style.display = 'block';
        btn.style.display = 'inline-block';
    });
}