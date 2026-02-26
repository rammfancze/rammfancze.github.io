const URL_RECORDED = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=0&single=true&output=tsv';
const URL_UPCOMING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmAtJ5MvHpsloemXUHYkD-0S0jAyP9RoQLMaOXF-LLUCnW5XlnXE5AAZ2SX3H8SsV7i-RTxx7ZacvI/pub?gid=314502273&single=true&output=tsv';

let plyrInstances = [];

function filterTable() {
    const val = document.getElementById('recorded-search').value.toLowerCase();
    const rows = document.getElementById('recorded-tbody').getElementsByTagName('tr');
    for (let r of rows) { r.style.display = r.textContent.toLowerCase().includes(val) ? "" : "none"; }
}

async function load() {
    const draw = async (url, id, isRec) => {
        const res = await fetch(url);
        const data = (await res.text()).split('\n').slice(1).reverse();
        const tbody = document.getElementById(id);
        tbody.innerHTML = '';

        data.forEach(line => {
            if (!line.trim()) return;
            const c = line.split('\t');
            const tr = document.createElement('tr');
            if (isRec) {
                tr.innerHTML = `
                    <td data-label="Artist">${c[0]||''}</td>
                    <td data-label="Date">${c[1]||''}</td>
                    <td data-label="Venue">${c[2]||''}</td>
                    <td data-label="YT">${c[3]?.includes('http') ? `<a href="${c[3]}" target="_blank" class="text-red-500"><i class="fab fa-youtube"></i></a>` : '❌'}</td>
                    <td data-label="IEM">${c[4]==='Ano' ? '✅' : '❌'}</td>
                    <td data-label="Format">${c[7] ? `<a data-fslightbox href="${c[7]}" class="underline font-bold">${c[5]||''}</a>` : c[5]||''}</td>
                    <td data-label="Audio"><div class="plyr-container">${c[6]?.includes('http') ? `<audio class="js-player" src="${c[6]}"></audio>` : ''}</div></td>`;
            } else {
                tr.innerHTML = `<td data-label="Artist">${c[0]||''}</td><td data-label="Date">${c[1]||''}</td><td data-label="Venue">${c[2]||''}</td>`;
            }
            tbody.appendChild(tr);
        });

        if (isRec) {
            plyrInstances.forEach(p => p.destroy());
            plyrInstances = Plyr.setup('.js-player', { 
                controls: ['play', 'progress', 'current-time', 'mute', 'volume'],
                tooltips: { controls: false }
            });
            if (window.refreshFsLightbox) refreshFsLightbox();
        }
    };
    draw(URL_UPCOMING, 'upcoming-tbody', false);
    draw(URL_RECORDED, 'recorded-tbody', true);
}
load();
