const pokemonList = document.getElementById('pokemonList')
const loadMoreButton = document.getElementById('loadMoreButton')

const maxRecords = 1025;
const limit = 10;
let offset = 0;
let allPokemonsNames = []; // Lista para busca rápida

// Função para buscar a lista de todos os nomes (roda isso ao iniciar o site)
async function fetchAllPokemonsNames() {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
    const data = await response.json();
    allPokemonsNames = data.results; // Guarda {name, url}
}

fetchAllPokemonsNames();

async function filterByType(type) {
    const pokemonList = document.getElementById('pokemonList');
    const spinner = document.getElementById('loading-spinner');
    const loadMoreButton = document.getElementById('loadMoreButton');
    
    if (type === 'all') {
       spinner.style.display = 'none';
        pokemonList.innerHTML = '';
        offset = 0;
        loadPokemonItens(offset, limit);
        loadMoreButton.style.display = 'block';
        return;
    }

// 2. INÍCIO DO FILTRO: Limpa a lista e MOSTRA A POKÉBOLA
    pokemonList.innerHTML = ''; 
    loadMoreButton.style.display = 'none';
    spinner.style.display = 'flex'; // A Pokébola começa a girar aqui

    // Busca todos os Pokémons desse tipo na API
    const url = `https://pokeapi.co/api/v2/type/${type}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // A API de tipos retorna uma lista de objetos 'pokemon'
        const pokemonsOfType = data.pokemon.map(p => p.pokemon);

        // Pega os detalhes dos primeiros 50 desse tipo (para não travar o celular)
        const detailRequests = pokemonsOfType.slice(0, 50).map(p => pokeApi.getPokemonDetail(p));
        const pokemonsDetails = await Promise.all(detailRequests);
        
         // 3. FIM DO FILTRO: Esconde a Pokébola e mostra os resultados
        spinner.style.display = 'none';
        const newHtml = pokemonsDetails.map(convertPokemonToLi).join('');
        pokemonList.innerHTML = newHtml;
        
    } catch (error) {
       // Em caso de erro, também precisamos esconder o spinner
        spinner.style.display = 'none';
        console.error("Erro ao filtrar tipo:", error);
        pokemonList.innerHTML = '<p>Erro ao carregar Pokémons deste tipo.</p>';
    }
}

function convertPokemonToLi(pokemon) {
    // Adicionamos o onclick passando o número do pokemon
    return `
        <li class="pokemon ${pokemon.type}" onclick="openPokemonModal(${pokemon.number})">
            <span class="number">#${pokemon.number}</span>
            <span class="name">${pokemon.name}</span>
            <div class="detail">
                <ol class="types">
                    ${pokemon.types.map((type) => `<li class="type ${type}">${type}</li>`).join('')}
                </ol>
                <img src="${pokemon.photo}" alt="${pokemon.name}">
            </div>
        </li>
    `
}

function loadPokemonItens(offset, limit) {
    pokeApi.getPokemons(offset, limit).then((pokemons = []) => {
        const newHtml = pokemons.map(convertPokemonToLi).join('')
        pokemonList.innerHTML += newHtml
    })
}

loadPokemonItens(offset, limit)

loadMoreButton.addEventListener('click', () => {
    offset += limit
    const qtdRecordsWithNexPage = offset + limit

    if (qtdRecordsWithNexPage >= maxRecords) {
        const newLimit = maxRecords - offset
        loadPokemonItens(offset, newLimit)

        loadMoreButton.parentElement.removeChild(loadMoreButton)
    } else {
        loadPokemonItens(offset, limit);
        
        // Pequeno truque: após carregar novos, re-aplica o filtro atual
    const currentType = document.getElementById('type-select').value;
    setTimeout(() => filterByType(currentType), 500); // Aguarda um pouco o carregamento da API
    }
})

const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

// Função para abrir o modal buscando detalhes específicos
function openPokemonModal(pokemonNumber) {
    const url = `https://pokeapi.co/api/v2/pokemon/${pokemonNumber}`;
    
    fetch(url)
        .then(res => res.json())
        .then(convertPokeApiDetailToPokemon)
        .then(pokemon => {
            modalBody.innerHTML = `
                <div class="pokemon-detail-header ${pokemon.type}">
                    <h2>${pokemon.name}</h2>
                    <span>#${pokemon.number}</span>
                    <img src="${pokemon.photo}" alt="${pokemon.name}">
                </div>
                <div class="pokemon-detail-stats">
                    <p><strong>Tipos:</strong> ${pokemon.types.join(', ')}</p>
                    
                    <div class="base-stats">
                <p>HP: ${pokemon.hp}</p>
                <div class="stats-bar">
                    <div class="bar-fill hp-bar" style="width: ${(pokemon.hp / 150) * 100}%"></div>
                </div>

                <p>Ataque: ${pokemon.attack}</p>
                <div class="stats-bar">
                    <div class="bar-fill atk-bar" style="width: ${(pokemon.attack / 150) * 100}%"></div>
                </div>

                <p>Defesa: ${pokemon.defense}</p>
                <div class="stats-bar">
                    <div class="bar-fill def-bar" style="width: ${(pokemon.defense / 150) * 100}%"></div>
                </div>
            </div>

            <hr>
                    
                    <p><strong>Habilidades:</strong> ${pokemon.abilities.join(', ')}</p>
                    <p><strong>Peso:</strong> ${pokemon.weight.toFixed(1)}kg | <strong>Altura:</strong> ${pokemon.height.toFixed(1)}m</p>
                </div>
            `;
            modalOverlay.style.display = 'flex';
            
            // Cria o objeto de áudio e toca o som
    const audio = new Audio(pokemon.cry);
    audio.volume = 0.1; // Volume em 10% para não ser muito alto
    audio.play();
        });
}
// Fechar modal ao clicar no X ou fora da caixa
closeModalBtn.onclick = () => modalOverlay.style.display = 'none';
window.onclick = (event) => {
    if (event.target == modalOverlay) modalOverlay.style.display = 'none';
};
const searchInput = document.getElementById('search-input');

const spinner = document.getElementById('loading-spinner');

searchInput.addEventListener('input', async () => {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm.length < 1) {
      
      spinner.style.display = 'none';
        // Se apagar tudo, volta para a lista inicial
        pokemonList.innerHTML = '';
        offset = 0;
        loadPokemonItens(offset, limit);
        loadMoreButton.style.display = 'block';
        return;
    }

    // Filtra a lista global pelos nomes que COMEÇAM ou CONTÊM o termo
    const filtered = allPokemonsNames.filter(p => p.name.startsWith(searchTerm));

    if (filtered.length > 0) {
        // MOSTRA o spinner e LIMPA a lista antiga para dar foco à busca
        spinner.style.display = 'flex';
        pokemonList.innerHTML = '';
        loadMoreButton.style.display = 'none'; // Esconde o botão durante a busca
        
        // Buscamos os detalhes apenas dos filtrados (limitando aos 10 primeiros para performance)
        try {
            const detailRequests = filtered.slice(0, 10).map(p => pokeApi.getPokemonDetail(p));
            const pokemonsDetails = await Promise.all(detailRequests);
            
            // ESCONDE o spinner quando os dados chegam
            spinner.style.display = 'none';
            pokemonList.innerHTML = pokemonsDetails.map(convertPokemonToLi).join('');
        } catch (error) {
            spinner.style.display = 'none';
            console.error("Erro ao buscar:", error);
        }
    }
});

            

        
    


