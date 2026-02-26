// Konfigurace URL
const URL_RECORDED = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=0&single=true&output=tsv';
const URL_UPCOMING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=314502273&single=true&output=tsv';

// Globální proměnná pro přehrávače
let plyrInstances = [];

// 1. Vyhledávání v tabulce
function filterTable() {
    const input = document.getElementById('recorded-search');
    if (!input) return;
    const filter = input.value.toLowerCase();
    const rows = document.querySelectorAll('#recorded-tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
}

// 2. Počítadlo odběratelů (s ochranou proti chybě)
async function fetchSubscribers() {
    const apiKey = 'AIzaSyDDXVwQNZmlOyHiZqQIUYgMZ-w0QgZIX5g';
    const channelId = 'UCRnSUbTJ-cS-ORYCEF9PEsQ';
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const count = data.items[0].statistics.subscriberCount;
            const el = document.getElementById("subscriber-count");
            if (el) el.innerText = `${parseInt(count).toLocaleString()} subscribers`;
        }
    } catch (err) {
        console.warn("YouTube API error");
    }
}

// 3. Hlavní funkce pro načtení dat
async function nactiTabulky() {
    const stahni = async (url, targetId, isRecorded) => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Fetch failed");
            const text = await res.text();
            vykresli(text, targetId, isRecorded);
            
            if (isRecorded) {
                // Zničit staré instance, pokud existují
                if (plyrInstances.length > 0) {
                    plyrInstances.forEach(p => { if (p && typeof p.destroy === 'function') p.destroy(); });
                }
                
                // Nastavení Plyr (fix času bez mínusu)
                plyrInstances = Plyr.setup('.js-player', {
                    controls: ['play', 'progress', 'current-time', 'mute', 'volume'],
                    invert: false,
                    toggleInvert: false,
                    displayDuration: false
                });

                if (window.refreshFsLightbox) { refreshFsLightbox(); }
            }
        } catch (e) {
            console.error("Chyba při stahování dat:", e);
            const el = document.getElementById(targetId);
            if (el) el.innerHTML = '<tr><td colspan="7" class="p-4 text-red-400 text-center">Data nejsou dostupná.</td></tr>';
        }
    };

    stahni(URL_RECORDED, 'recorded-tbody', true);
    stahni(URL_UPCOMING, 'upcoming-tbody', false);
}

// 4. Vykreslení dat do HTML
function vykresli(data, targetId, jeToRecorded) {
    const tbody = document.getElementById(targetId);
    if (!tbody) return;
    
    const radky = data.split('\n'); 
    radky.shift(); // Smazat hlavičku
    radky.reverse(); // Nejnovější nahoru
    
    tbody.innerHTML = ''; 

    radky.forEach(line => {
        const radek = line.trim();
        if (!radek) return;
        
        const col = radek.split('\t'); 
        const tr = document.createElement('tr');
        tr.className = "md:border-b md:border-gray-800 md:hover:bg-gray-800/30 transition-colors";

        if (jeToRecorded) {
            const ytUrl = col[3] || '';
            const iemAno = col[4] === 'Ano';
            const format = col[5] || '';
            const audioUrl = col[6] ? col[6].trim() : '';
            const imgUrl = col[7] ? col[7].trim() : '';

            tr.innerHTML = `
                <td class="px-4 py-3 font-semibold md:font-normal" data-label="Artist">${col[0] || ''}</td>
                <td class="px-4 py-3" data-label="Date">${col[1] || ''}</td>
                <td class="px-4 py-3" data-label="Venue">${col[2] || ''}</td>
                <td class="px-4 py-3 text-right md:text-center" data-label="YT">
                    ${ytUrl.includes('http') ? `<a href="${ytUrl}" target="_blank" class="text-white hover:text-red-500"><i class="fab fa-youtube"></i></a>` : '<i class="fa-solid fa-xmark text-red-600"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="IEM">
                    ${iemAno ? '<i class="fa-solid fa-check text-green-400"></i>' : '<i class="fa-solid fa-xmark text-red-600"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="Format">        
                    ${imgUrl ? `<a data-fslightbox="gallery" href="${imgUrl}" class="hover:text-white underline decoration-gray-600">${format}</a>` : format}
                </td>
                <td class="px-4 py-3" data-label="Audio">
                    <div class="audio-wrapper">
                        ${audioUrl.includes('http') ? `<audio class="js-player" controls src="${audioUrl}"></audio>` : ''}
                    </div>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td class="px-4 py-3 font-semibold md:font-normal" data-label="Artist">${col[0] || ''}</td>
                <td class="px-4 py-3" data-label="Date">${col[1] || ''}</td>
                <td class="px-4 py-3" data-label="Venue">${col[2] || ''}</td>
            `;
        }
        tbody.appendChild(tr);
    });
}

// Spuštění
fetchSubscribers();
nactiTabulky();
