const btn = document.getElementById('login');
const title = document.querySelector('h1');
const dis = document.querySelector('.dis');


btn.addEventListener('click', () => {
    // Redirect to local server login route
    window.location.href = 'http://127.0.0.1:8888/login';
});

// Check for access token in URL
const params = new URLSearchParams(window.location.search);
const token = params.get('access_token');

if (token) {
    // 1. Clean up URL immediately
    window.history.replaceState({}, document.title, window.location.pathname);

    // 2. Update UI to loading state
    btn.style.display = 'none';
    dis.style.display = 'none';
    title.innerText = 'Analyzing your vibe...';

    // 3. Fetch data from backend
    fetch('http://127.0.0.1:8888/analyze', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to fetch personality');
        return res.json();
    })
    .then(data => {
        // Update personality title
        title.innerText = data.personality;

        // Add vibe description
        const desc = document.createElement('p');
        desc.className = 'vibe-description';
        desc.style.fontSize = '1.2rem';
        desc.style.margin = '10px 0';
        desc.innerText = data.description;

        // Add vibe score description
        const p = document.createElement('p');
        p.className = 'vibe-score';
        p.style.opacity = '0.8';
        p.innerText = `Vibe Score: ${Math.round(data.score * 100)}%`;
        
        // Find or create a container for the result
        let container = document.querySelector('.container');
        container.appendChild(desc);
        container.appendChild(p);

        // Add a "Try Again" button
        const resetBtn = document.createElement('button');
        resetBtn.innerText = 'Analyze Again';
        resetBtn.style.marginTop = '20px';
        resetBtn.onclick = () => window.location.href = '/';
        container.appendChild(resetBtn);
    })
    .catch(err => {
        console.error('Analysis Error:', err);
        title.innerText = 'Something went wrong';
        dis.style.display = 'block';
        dis.innerHTML = `<p>Error: ${err.message}</p>
                       
                        <p>3. Try logging in again.</p>`;
        btn.style.display = 'inline-block';
    });
}