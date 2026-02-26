const URL_RECORDED = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=0&single=true&output=tsv';
const URL_UPCOMING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=314502273&single=true&output=tsv';

async function nactiTabulky() {
    try {
        const [resRec, resUpc] = await Promise.all([fetch(URL_RECORDED), fetch(URL_UPCOMING)]);
        const [txtRec, txtUpc] = await Promise.all([resRec.text(), resUpc.text()]);
        
        vykresli(txtRec, 'recorded-tbody', true);
        vykresli(txtUpc, 'upcoming-tbody', false);

        // Inicializace Plyru - OPRAVENÁ SYNTAXE
        Plyr.setup('.js-player', {
            controls: ['play', 'progress', 'current-time', 'mute', 'volume']
        });

        if (window.refreshFsLightbox) refreshFsLightbox();
    } catch (e) { console.error("Chyba:", e); }
}

function vykresli(data, targetId, jeToRecorded) {
    const tbody = document.getElementById(targetId);
    let radky = data.split('\n').slice(1).reverse(); 
    tbody.innerHTML = ''; 

    radky.forEach(line => {
        const col = line.split('\t');
        if (!col[0]) return;
        const tr = document.createElement('tr');

        if (jeToRecorded) {
            tr.innerHTML = `
                <td data-label="Artist">${col[0] || ''}</td>
                <td data-label="Date">${col[1] || ''}</td>
                <td data-label="Venue">${col[2] || ''}</td>
                <td data-label="YT" class="text-center">
                    ${col[3]?.includes('http') ? `<a href="${col[3]}" target="_blank" class="text-white hover:text-red-500"><i class="fab fa-youtube"></i></a>` : '<i class="fa-solid fa-xmark text-red-600"></i>'}
                </td>
                <td data-label="IEM" class="text-center">
                    ${col[4] === 'Ano' ? '<i class="fa-solid fa-check text-green-400"></i>' : '<i class="fa-solid fa-xmark text-red-600"></i>'}
                </td>
                <td data-label="Format" class="text-center">
                    ${col[7]?.includes('http') ? `<a data-fslightbox="gallery" href="${col[7]}" class="underline">${col[5] || ''}</a>` : (col[5] || '')}
                </td>
                <td data-label="Audio">
                    <div class="audio-wrapper">
                        ${col[6]?.includes('http') ? `<audio class="js-player" controls src="${col[6]}"></audio>` : ''}
                    </div>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td data-label="Artist">${col[0] || ''}</td>
                <td data-label="Date">${col[1] || ''}</td>
                <td data-label="Venue">${col[2] || ''}</td>
            `;
        }
        tbody.appendChild(tr);
    });
}
nactiTabulky();
