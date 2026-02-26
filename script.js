const URL_RECORDED = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=0&single=true&output=tsv';
const URL_UPCOMING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=314502273&single=true&output=tsv';

let plyrInstances = [];

function filterTable() {
    const input = document.getElementById('recorded-search');
    const filter = input.value.toLowerCase();
    const rows = document.getElementById('recorded-tbody').getElementsByTagName('tr');
    for (let row of rows) {
        row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
    }
}

async function fetchSubscribers() {
    const apiKey = 'AIzaSyDDXVwQNZmlOyHiZqQIUYgMZ-w0QgZIX5g';
    const channelId = 'UCRnSUbTJ-cS-ORYCEF9PEsQ';
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
        const data = await res.json();
        document.getElementById("subscriber-count").innerText = `${parseInt(data.items[0].statistics.subscriberCount).toLocaleString()} subscribers`;
    } catch { document.getElementById("subscriber-count").innerText = 'YouTube channel'; }
}

async function nactiTabulky() {
    const stahni = async (url, targetId, isRecorded) => {
        try {
            const res = await fetch(url);
            const text = await res.text();
            vykresli(text, targetId, isRecorded);
            if (isRecorded) {
                plyrInstances.forEach(p => p.destroy());
                plyrInstances = Plyr.setup('.js-player', { controls: ['play', 'progress', 'current-time', 'mute', 'volume'] });
                if (typeof refreshFsLightbox === "function") refreshFsLightbox();
            }
        } catch { document.getElementById(targetId).innerHTML = '<tr><td colspan="7" class="text-center text-red-400 p-4">Data nedostupná.</td></tr>'; }
    };
    stahni(URL_RECORDED, 'recorded-tbody', true);
    stahni(URL_UPCOMING, 'upcoming-tbody', false);
}

function vykresli(data, targetId, jeToRecorded) {
    const tbody = document.getElementById(targetId);
    let radky = data.split('\n'); radky.shift(); radky.reverse();
    tbody.innerHTML = '';
    for (let radek of radky) {
        if (!radek.trim()) continue;
        const col = radek.split('\t');
        const tr = document.createElement('tr');
        tr.className = "md:border-b md:border-gray-800 md:hover:bg-gray-800/30 transition-colors";
        if (jeToRecorded) {
            tr.innerHTML = `
                <td class="px-4 py-3 font-semibold md:font-normal" data-label="Artist">${col[0] || ''}</td>
                <td class="px-4 py-3" data-label="Date">${col[1] || ''}</td>
                <td class="px-4 py-3" data-label="Venue">${col[2] || ''}</td>
                <td class="px-4 py-3 text-right md:text-center" data-label="YT">${col[3]?.includes('http') ? `<a href="${col[3]}" target="_blank" class="text-gray-300 text-lg hover:text-red-500"><i class="fab fa-youtube"></i></a>` : '<i class="fa-solid fa-xmark text-gray-500 text-base"></i>'}</td>
                <td class="px-4 py-3 text-right md:text-center" data-label="IEM">${col[4] === 'Ano' ? '<i class="fa-solid fa-check text-green-400 text-base"></i>' : '<i class="fa-solid fa-xmark text-gray-500 text-base"></i>'}</td>
                <td class="px-4 py-3 text-right md:text-center" data-label="Format">${col[7] ? `<a data-fslightbox="gallery" href="${col[7]}" class="hover:text-white underline decoration-gray-600">${col[5] || ''}</a>` : col[5] || ''}</td>
                <td class="px-4 py-3" data-label="Audio"><div style="width: 250px; margin-left: auto;">${col[6]?.includes('http') ? `<audio class="js-player" controls src="${col[6]}"></audio>` : ''}</div></td>`;
        } else {
            tr.innerHTML = `<td class="px-4 py-3 font-semibold md:font-normal" data-label="Artist">${col[0] || ''}</td><td class="px-4 py-3" data-label="Date">${col[1] || ''}</td><td class="px-4 py-3" data-label="Venue">${col[2] || ''}</td>`;
        }
        tbody.appendChild(tr);
    }
}
fetchSubscribers(); nactiTabulky();