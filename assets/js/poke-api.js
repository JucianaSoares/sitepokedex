const pokeApi = {}

function convertPokeApiDetailToPokemon(pokeDetail) {
    const pokemon = new Pokemon()
    pokemon.number = pokeDetail.id
    pokemon.name = pokeDetail.name

    const types = pokeDetail.types.map((typeSlot) => typeSlot.type.name)
    const [type] = types

    pokemon.types = types
    pokemon.type = type

    // Tenta pegar a arte 'dream_world', se não tiver, pega a 'official-artwork'
pokemon.photo = pokeDetail.sprites.other.dream_world.front_default || 
                pokeDetail.sprites.other['official-artwork'].front_default;

// Adicionei isso para o Modal:
pokemon.abilities = pokeDetail.abilities.map((slot) => slot.ability.name)
    pokemon.hp = pokeDetail.stats[0].base_stat // HP
    pokemon.attack = pokeDetail.stats[1].base_stat // Attack
    pokemon.defense = pokeDetail.stats[2].base_stat // Defense
    pokemon.height = pokeDetail.height / 10
    pokemon.weight = pokeDetail.weight / 10

   pokemon.cry = pokeDetail.cries.latest; 

    return pokemon
}

pokeApi.getPokemonDetail = (pokemon) => {
    return fetch(pokemon.url)
        .then((response) => response.json())
        .then(convertPokeApiDetailToPokemon)
}

pokeApi.getPokemons = (offset = 0, limit = 5) => {
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`

    return fetch(url)
        .then((response) => response.json())
        .then((jsonBody) => jsonBody.results)
        .then((pokemons) => pokemons.map(pokeApi.getPokemonDetail))
        .then((detailRequests) => Promise.all(detailRequests))
        .then((pokemonsDetails) => pokemonsDetails)
}