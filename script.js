const URL_RECORDED = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=0&single=true&output=tsv';
const URL_UPCOMING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=314502273&single=true&output=tsv';

let plyrInstances = [];

async function nactiTabulky() {
    const stahni = async (url, targetId, isRecorded) => {
        try {
            const res = await fetch(url);
            const text = await res.text();
            vykresli(text, targetId, isRecorded);
            
            if (isRecorded) {
                plyrInstances.forEach(p => { if(p) p.destroy(); });
                plyrInstances = Plyr.setup('.js-player', {
                    controls: ['play', 'progress', 'current-time', 'mute', 'volume'],
                    invert: false,
                    toggleInvert: false
                });
                if (window.refreshFsLightbox) { refreshFsLightbox(); }
            }
        } catch (e) { console.error(e); }
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

    radky.forEach(line => {
        const radek = line.trim();
        if (!radek) return;
        const col = radek.split('\t'); 
        const tr = document.createElement('tr');
        tr.className = "md:border-b md:border-gray-800 md:hover:bg-gray-800/30 transition-colors";

        if (jeToRecorded) {
            const audioUrl = col[6] ? col[6].trim() : '';
            const imgUrl = col[7] ? col[7].trim() : '';
            tr.innerHTML = `
                <td class="px-4 py-3 font-semibold md:font-normal" data-label="Artist">${col[0] || ''}</td>
                <td class="px-4 py-3" data-label="Date">${col[1] || ''}</td>
                <td class="px-4 py-3" data-label="Venue">${col[2] || ''}</td>
                <td class="px-4 py-3 text-right md:text-center" data-label="YT">
                    ${col[3]?.includes('http') ? `<a href="${col[3]}" target="_blank" class="text-white hover:text-red-500"><i class="fab fa-youtube"></i></a>` : '<i class="fa-solid fa-xmark text-red-600"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="IEM">
                    ${col[4] === 'Ano' ? '<i class="fa-solid fa-check text-green-400"></i>' : '<i class="fa-solid fa-xmark text-red-600"></i>'}
                </td>
                <td class="px-4 py-3 text-right md:text-center" data-label="Format">        
                    ${imgUrl ? `<a data-fslightbox="gallery" href="${imgUrl}" class="hover:text-white underline decoration-gray-600">${col[5] || ''}</a>` : (col[5] || '')}
                </td>
                <td class="px-4 py-3" data-label="Audio">
                    <div class="audio-wrapper">
                        ${audioUrl.includes('http') ? `<audio class="js-player" controls src="${audioUrl}"></audio>` : ''}
                    </div>
                </td>
            `;
        } else {
            tr.innerHTML = `<td class="px-4 py-3">${col[0] || ''}</td><td class="px-4 py-3">${col[1] || ''}</td><td class="px-4 py-3">${col[2] || ''}</td>`;
        }
        tbody.appendChild(tr);
    });
}

nactiTabulky();
