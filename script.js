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
            
            // >>> PŘIDEJ TYTO ŘÁDKY ZDE <<<
            if (targetId === 'upcoming-tbody') {
                initUpcomingToggle();
            }
            // >>> KONEC PŘIDANÝCH ŘÁDKŮ <<<
            
            if (isRecorded) {
                plyrInstances.forEach(p => p.destroy());
                plyrInstances = Plyr.setup('.js-player', {
                    controls: ['play', 'progress', 'mute', 'volume'],
                    settings: [],
                    tooltips: { controls: false, seek: false }
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

// --- POMOCNÁ FUNKCE PRO PARSOVÁNÍ DATA ---
function parsujDatum(datumString) {
    if (!datumString) return null;

    // Najde v textu 3 čísla oddělená tečkou (ignoruje jakékoliv mezery kolem)
    const match = datumString.match(/(\d+)\s*\.\s*(\d+)\s*\.\s*(\d+)/);
    
    // Pokud nenašel formát D.M.Y, vrátí null a řádek se normálně zobrazí
    if (!match) return null;
    
    const den = parseInt(match[1], 10);
    const mesic = parseInt(match[2], 10) - 1; // Měsíce jsou 0-11
    let rok = parseInt(match[3], 10);
    
    // Záchytná síť pro 2-ciferné roky
    if (rok < 100) rok += 2000;
    
    return new Date(rok, mesic, den);
}

function vykresli(data, targetId, jeToRecorded) {
    const tbody = document.getElementById(targetId);
    
    // Zjistíme dnešní datum (nastavíme čas na 00:00:00 pro správné porovnání)
    const dnes = new Date();
    dnes.setHours(0, 0, 0, 0);

    let radky = data.split('\n'); 
    radky.shift(); 
    if (jeToRecorded) {
        radky.reverse(); 
    }
    tbody.innerHTML = ''; 

    for (let i = 0; i < radky.length; i++) {
        const radek = radky[i].trim();
        if (!radek) continue;
        const col = radek.split('\t'); 
        
        // --- LOGIKA PRO SKRÝVÁNÍ PROBĚHLÝCH KONCERTŮ ---
        if (!jeToRecorded) {
            const datumKoncertu = parsujDatum(col[1]);
            // Pokud je datum koncertu starší než dnešek, přeskočíme tento řádek
            if (datumKoncertu && datumKoncertu < dnes) {
                continue;
            }
        }

        const tr = document.createElement('tr');
        tr.className = "md:border-b md:border-gray-800 md:hover:bg-gray-800/30 transition-colors";

        if (jeToRecorded) {
            const formatText = col[5] || '';
            const audioUrl = col[6] ? col[6].trim() : '';
            const imgUrl = col[7] ? col[7].trim() : '';

            tr.innerHTML = `
                <td class="px-4 py-3 font-semibold md:font-normal" data-label="Artist">${col[0] || ''}</td>
                <td class="px-4 py-3" data-label="Date">${col[1] || ''}</td>
                <td class="px-4 py-3" data-label="Venue"><a href="https://maps.google.com/?q=${encodeURIComponent(col[2] || '')}" target="_blank" class="map-link hover:text-red-500 transition-colors">${col[2] || ''}</a></td>
                <td class="px-4 py-3 text-right md:text-center" data-label="YT">
                    ${col[3]?.includes('http') ? `<a href="${col[3]}" target="_blank" class="text-white text-lg hover:text-red-500 transition-colors"><i class="fab fa-youtube"></i></a>` : '<i class="fa-solid fa-xmark text-red-600 text-base"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="IEM">
                    ${col[4] === 'Ano' ? '<i class="fa-solid fa-check text-green-400 text-base"></i>' : '<i class="fa-solid fa-xmark text-red-600 text-base"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="Format">        
                    ${imgUrl ? `<a data-fslightbox="gallery" href="${imgUrl}" class="hover:text-white underline decoration-gray-600 transition-colors">${formatText}</a>` : formatText}
                </td>
                <td class="px-2 py-3 md:table-cell" data-label="Audio">
                    <div class="audio-wrapper">
                        ${audioUrl.includes('http') ? `<audio class="js-player" controls src="${audioUrl}"></audio>` : ''}
                    </div>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td class="px-4 py-3 font-semibold md:font-normal" data-label="Artist">${col[0] || ''}</td>
                <td class="px-4 py-3" data-label="Date">${col[1] || ''}</td>
                <td class="px-4 py-3" data-label="Venue"><a href="https://maps.google.com/?q=${encodeURIComponent(col[2] || '')}" target="_blank" class="map-link hover:text-red-500 transition-colors"> ${col[2] || ''}</a></td>
            `;
        }
        tbody.appendChild(tr);
    }
}

nactiTabulky();

// --- SHOW MORE / SHOW LESS U UPCOMING SHOWS ---
function initUpcomingToggle() {
    const table = document.getElementById('upcoming-table');
    // Pokud na stránce id="upcoming-table" chybí, funkce se bezpečně ukončí
    if (!table) return; 
    
    const tbody = document.getElementById('upcoming-tbody');
    const rows = tbody.getElementsByTagName('tr');
    const btn = document.getElementById('toggle-upcoming');
    
    if (!btn) return;

    // Pokud je řádků víc než 5
    if (rows.length > 5) {
        // ZOBRAZÍME TLAČÍTKO (odstraníme Tailwind třídu 'hidden')
        btn.classList.remove('hidden');
        btn.style.display = 'inline-block';

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function() {
            table.classList.toggle('is-expanded');
            if (table.classList.contains('is-expanded')) {
                newBtn.textContent = 'Show less';
            } else {
                newBtn.textContent = 'Show all upcoming shows';
            }
        });
    } else {
        // Pokud je řádků 5 a méně, tlačítko natvrdo skryjeme
        btn.classList.add('hidden');
        btn.style.display = 'none';
    }
}
