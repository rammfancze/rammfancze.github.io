const URL_RECORDED = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=0&single=true&output=tsv';
const URL_UPCOMING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=314502273&single=true&output=tsv';

// Opraveno: Proměnná pro instance přehrávačů
let plyrInstances = [];

// Filtrování nahraných show
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

// Počítadlo odběratelů
async function fetchSubscribers() {
    const apiKey = 'AIzaSyDDXVwQNZmlOyHiZqQIUYgMZ-w0QgZIX5g';
    const channelId = 'UCRnSUbTJ-cS-ORYCEF9PEsQ';
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const count = data.items[0].statistics.subscriberCount;
            document.getElementById("subscriber-count").innerText = `${parseInt(count).toLocaleString()} subscribers`;
        }
    } catch (err) {
        document.getElementById("subscriber-count").innerText = 'YouTube channel';
    }
}

// Načítání dat z Google Sheets
async function nactiTabulky() {
    const stahni = async (url, targetId, isRecorded) => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Chyba sítě");
            const text = await res.text();
            vykresli(text, targetId, isRecorded);
            
            if (isRecorded) {
                // Opraveno: Správné čištění a inicializace
                plyrInstances.forEach(p => { if(p) p.destroy(); });
                
                plyrInstances = Plyr.setup('.js-player', {
                    controls: ['play', 'progress', 'current-time', 'mute', 'volume'],
                    i18n: {
                        currentTime: 'Uplynulý čas',
                        duration: 'Celkový čas',
                    },
                    invert: false,      // Vypne mínusový odpočet
                    toggleInvert: false // Zakáže přepnutí na mínus po kliknutí
                });

                if (typeof refreshFsLightbox === "function") {
                    refreshFsLightbox();
                }
            }
        } catch (e) {
            console.error(e);
            document.getElementById(targetId).innerHTML = '<tr><td colspan="7" class="p-4 text-red-400 text-center">Data nejsou dostupná.</td></tr>';
        }
    };
    stahni(URL_RECORDED, 'recorded-tbody', true);
    stahni(URL_UPCOMING, 'upcoming-tbody', false);
}

// Vykreslení řádků
function vykresli(data, targetId, jeToRecorded) {
    const tbody = document.getElementById(targetId);
    if (!tbody) return;
    
    let radky = data.split('\n'); 
    radky.shift(); 
    radky.reverse(); 
    tbody.innerHTML = ''; 

    for (let i = 0; i < radky.length; i++) {
        const radek = radky[i].trim();
        if (!radek) continue;
        const col = radek.split('\t'); 
        const tr = document.createElement('tr');
        tr.className = "md:border-b md:border-gray-800 md:hover:bg-gray-800/30 transition-colors";

        if (jeToRecorded) {
            const formatText = col[5] || '';
            const audioUrl = col[6] ? col[6].trim() : '';
            const imgUrl = col[7] ? col[7].trim() : '';

            tr.innerHTML = `
                <td class="px-4 py-3 font-semibold md:font-normal" data-label="Artist">${col[0] || ''}</td>
                <td class="px-4 py-3" data-label="Date">${col[1] || ''}</td>
                <td class="px-4 py-3" data-label="Venue">${col[2] || ''}</td>
                <td class="px-4 py-3 text-right md:text-center" data-label="YT">
                    ${col[3] && col[3].includes('http') ? `<a href="${col[3]}" target="_blank" class="text-white-600 text-lg hover:text-red-500"><i class="fab fa-youtube"></i></a>` : '<i class="fa-solid fa-xmark text-red-600 text-base"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="IEM">
                    ${col[4] === 'Ano' ? '<i class="fa-solid fa-check text-green-400 text-base"></i>' : '<i class="fa-solid fa-xmark text-red-600 text-base"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="Format">        
                    ${imgUrl ? `<a data-fslightbox="gallery" href="${imgUrl}" class="hover:text-white underline decoration-gray-600">${formatText}</a>` : formatText}
                </td>
                <td class="px-4 py-3 md:table-cell" data-label="Audio">
                    <div class="audio-container">
                        ${audioUrl && audioUrl.includes('http') ? `<audio class="js-player" controls src="${audioUrl
