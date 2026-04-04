const URL_RECORDED = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=0&single=true&output=tsv';
const URL_UPCOMING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=314502273&single=true&output=tsv';

let plyrInstances = [];

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

async function fetchSubscribers() {
    const apiKey = 'AIzaSyDDXVwQNZmlOyHiZqQIUYgMZ-w0QgZIX5g';
    const channelId = 'UCRnSUbTJ-cS-ORYCEF9PEsQ';
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
        const data = await response.json();
        const count = data.items[0].statistics.subscriberCount;
        document.getElementById("subscriber-count").innerText = `${parseInt(count).toLocaleString()} subscribers`;
    } catch (err) {
        document.getElementById("subscriber-count").innerText = 'YouTube channel';
    }
}

async function nactiTabulky() {
    // --- POMOCNÁ FUNKCE PRO GENEROVÁNÍ SKELETONŮ ---
    const vytvorSkeletony = (pocetRadku, pocetSloupcu, labels) => {
        let html = '';
        for (let i = 0; i < pocetRadku; i++) {
            html += '<tr class="animate-skeleton">';
            labels.forEach(label => {
                // Na mobilu se použije data-label, uvnitř je animovaný div
                html += `<td class="px-4 py-3" data-label="${label}"><div class="skeleton-bar"></div></td>`;
            });
            html += '</tr>';
        }
        return html;
    };

    // Vložíme skeletony do obou tabulek IHNED
    const labelsUpcoming = ["Artist", "Date", "Venue"];
    const labelsRecorded = ["Artist", "Date", "Venue", "YT", "IEM", "Format", "Audio"];
    
    document.getElementById('upcoming-tbody').innerHTML = vytvorSkeletony(5, 3, labelsUpcoming);
    document.getElementById('recorded-tbody').innerHTML = vytvorSkeletony(8, 7, labelsRecorded);

    // --- SAMOTNÉ STAHOVÁNÍ DAT ---
    const stahni = async (url, targetId, isRecorded) => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Chyba");
            const text = await res.text();
            
            // Jakmile jsou data, skeletony zmizí a nahradí se daty
            vykresli(text, targetId, isRecorded);
            
            if (isRecorded) {
                plyrInstances.forEach(p => p.destroy());
                plyrInstances = Plyr.setup('.js-player', {
                    controls: ['play', 'progress', 'mute', 'volume'],
                    settings: []
                });
                if (typeof refreshFsLightbox === "function") refreshFsLightbox();
            }
        } catch (e) {
            console.error(e);
            document.getElementById(targetId).innerHTML = '<tr><td colspan="7" class="p-4 text-red-400 text-center">Data nedostupná.</td></tr>';
        }
    };

    stahni(URL_RECORDED, 'recorded-tbody', true);
    stahni(URL_UPCOMING, 'upcoming-tbody', false);
}

function vykresli(data, targetId, jeToRecorded) {
    const tbody = document.getElementById(targetId);
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
                    ${col[3]?.includes('http') ? `<a href="${col[3]}" target="_blank" class="text-white-600 text-lg hover:text-red-500"><i class="fab fa-youtube"></i></a>` : '<i class="fa-solid fa-xmark text-red-600 text-base"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="IEM">
                    ${col[4] === 'Ano' ? '<i class="fa-solid fa-check text-green-400 text-base"></i>' : '<i class="fa-solid fa-xmark text-red-600 text-base"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="Format">        
                    ${imgUrl ? `<a data-fslightbox="gallery" href="${imgUrl}" class="hover:text-white underline decoration-gray-600">${formatText}</a>` : formatText}
                </td>
                <td class="px-4 py-3 md:table-cell" data-label="Audio">
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
    }
}

fetchSubscribers();
nactiTabulky();

// --- SHOW MORE / SHOW LESS U UPCOMING SHOWS ---
function initUpcomingToggle() {
    const table = document.getElementById('upcoming-table');
    const tbody = document.getElementById('upcoming-tbody');
    const rows = tbody.getElementsByTagName('tr');
    const wrapper = document.getElementById('show-more-wrapper');
    const btn = document.getElementById('toggle-upcoming');

    // Zkontrolujeme, jestli je řádků víc než 5
    if (rows.length > 5) {
        // --- POJISTKA: Odstraníme třídu 'hidden' a natvrdo vnutíme zobrazení ---
        wrapper.classList.remove('hidden'); 
        wrapper.style.display = 'block';

        // Odstraníme starý listener (pokud by se funkce volala víckrát)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function() {
            table.classList.toggle('is-expanded');
            
            if (table.classList.contains('is-expanded')) {
                newBtn.textContent = 'Show less';
            } else {
                newBtn.textContent = 'Show all upcoming shows';
                // Jemné odskrolování zpět nahoru k tabulce
                table.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    } else {
        wrapper.classList.add('hidden');
        wrapper.style.display = 'none';
    }
}
