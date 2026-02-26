const URL_RECORDED = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=0&single=true&output=tsv';
const URL_UPCOMING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=314502273&single=true&output=tsv';

let plyrInstances = [];

// Funkce pro načtení YouTube subscriberů
async function fetchSubscribers() {
    const apiKey = 'AIzaSyDDXVwQNZmlOyHiZqQIUYgMZ-w0QgZIX5g';
    const channelId = 'UCRnSUbTJ-cS-ORYCEF9PEsQ';
    const subElement = document.getElementById("subscriber-count");

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const count = data.items[0].statistics.subscriberCount;
            subElement.innerText = `${parseInt(count).toLocaleString()} subscribers`;
        } else {
            subElement.innerText = 'YouTube channel';
        }
    } catch (err) {
        console.error("YouTube API error:", err);
        subElement.innerText = 'YouTube channel';
    }
}

// Vyhledávání v tabulce
function filterTable() {
    const input = document.getElementById('recorded-search');
    const filter = input.value.toLowerCase();
    const tbody = document.getElementById('recorded-tbody');
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const text = rows[i].textContent.toLowerCase();
        rows[i].style.display = text.includes(filter) ? "" : "none";
    }
}

// Hlavní funkce pro stažení dat z Google Sheets
async function nactiTabulky() {
    const stahni = async (url, targetId, isRecorded) => {
        try {
            const res = await fetch(url);
            const text = await res.text();
            vykresli(text, targetId, isRecorded);
            
            if (isRecorded) {
                // Reinicializace přehrávačů po vykreslení
                plyrInstances.forEach(p => p.destroy());
                plyrInstances = Plyr.setup('.js-player', {
                    controls: ['play', 'progress', 'current-time', 'mute', 'volume'],
                    settings: []
                });
                if (typeof refreshFsLightbox === "function") refreshFsLightbox();
            }
        } catch (e) {
            console.error("Chyba při načítání tabulky:", e);
            document.getElementById(targetId).innerHTML = '<tr><td colspan="7" class="p-4 text-center">Data nejsou dostupná.</td></tr>';
        }
    };

    stahni(URL_RECORDED, 'recorded-tbody', true);
    stahni(URL_UPCOMING, 'upcoming-tbody', false);
}

// Vykreslení řádků tabulky
function vykresli(data, targetId, jeToRecorded) {
    const tbody = document.getElementById(targetId);
    let radky = data.split('\n');
    
    // Odstranění hlavičky a otočení pořadí (nejnovější nahoře)
    radky.shift();
    radky.reverse();
    
    tbody.innerHTML = ''; 

    for (let i = 0; i < radky.length; i++) {
        const radek = radky[i].trim();
        if (!radek) continue;
        
        const col = radek.split('\t'); 
        const tr = document.createElement('tr');
        tr.className = "transition-colors";

        if (jeToRecorded) {
            const ytLink = col[3]?.trim();
            const isIem = col[4]?.trim() === 'Ano';
            const formatText = col[5]?.trim() || '';
            const audioUrl = col[6]?.trim() || '';
            const imgUrl = col[7]?.trim() || '';

            tr.innerHTML = `
                <td data-label="Artist" class="font-semibold md:font-normal">${col[0] || ''}</td>
                <td data-label="Date">${col[1] || ''}</td>
                <td data-label="Venue">${col[2] || ''}</td>
                <td data-label="YT" class="md:text-center">
                    ${ytLink?.includes('http') ? `<a href="${ytLink}" target="_blank" class="text-white hover:text-red-500"><i class="fab fa-youtube"></i></a>` : '<i class="fa-solid fa-xmark text-red-600/50"></i>'}
                </td>
                <td data-label="IEM" class="md:text-center">
                    ${isIem ? '<i class="fa-solid fa-check text-green-400"></i>' : '<i class="fa-solid fa-xmark text-red-600/50"></i>'}
                </td>
                <td data-label="Format" class="md:text-center">        
                    ${imgUrl ? `<a data-fslightbox="gallery" href="${imgUrl}" class="underline decoration-gray-600 hover:text-white">${formatText}</a>` : formatText}
                </td>
                <td data-label="Audio">
                    <div class="plyr-wrapper">
                        ${audioUrl.includes('http') ? `<audio class="js-player" controls src="${audioUrl}"></audio>` : ''}
                    </div>
                </td>
            `;
        } else {
            // Pro tabulku Upcoming shows
            tr.innerHTML = `
                <td data-label="Artist / Event" class="font-semibold md:font-normal">${col[0] || ''}</td>
                <td data-label="Date">${col[1] || ''}</td>
                <td data-label="Venue">${col[2] || ''}</td>
            `;
        }
        tbody.appendChild(tr);
    }
}

// Spuštění po načtení
fetchSubscribers();
nactiTabulky();
