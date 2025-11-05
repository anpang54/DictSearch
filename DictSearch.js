

/*
	DictSearch v0.1.4 (5 Nov 2025)
	See https://wiki.anpang.lol/misc/DictSearch
	By Anpang, MIT license
*/


// languages

const languages = {
	"fhn": {
		"name": "Fhaynofian",
		"letters": ["A", "Ae", "B", "Bp", "D", "Dt", "E", "Er", "F", "G", "Gh", "Gk", "H", "I", "K", "Kh", "M", "N", "Ng", "Ny", "O", "Or", "P", "Q", "R", "S", "Sh", "Sz", "T", "U", "Ue", "V", "Vb", "W", "Y", "Z", "Zh", "Zs"]
	},
	"oly": {
		"name": "Oluyek",
		"letters": ["A", "B", "C", "D", "E", "'", "F", "G", "H", "I", "J", "K", "L", "M", "N", "Ng", "Ny", "O", "P", "R", "S", "T", "Th", "U", "V", "W", "X", "Y", "Z"]
	}
}

const language = mw.config.get("wgPageName").split("/")[0];


// put search form

$("#dict-search").html(`
	<form id="dict-search-form">
		<input name="title" id="dict-search-input" class="mw-ui-input mw-ui-input-inline" placeholder="English or ${languages[language]["name"]} word" size="50" dir="ltr">
		<input type="submit" id="dict-search-button" value="Search" class="mw-ui-button mw-ui-progressive">
		<div id="dict-search-results"></div>
	</form>
	<p>
		See <a href="https://wiki.anpang.lol/misc/DictSearch#Usage">DictSearch#Usage</a> for help.
	</p>
`);

$("#dict-search-form").on("submit", dictSearch);


// put styles

$(document.head).append(`
    <style>
        #dict-search-input, #dict-search-button{ font-family: inherit; }
        #dict-search-results{ padding: 1em; }
    </style>
`);


// get data

let dataFetched = false;
let data;

async function getData() {

	// make url
	let url = "";
	const letters = languages[language]["letters"];
	for(const letter of letters) {
		url += `${language}%2FDictionary%2F${letter}`;
		if(letter !== letters[letters - 1]) {
			url += "|";
		}
	}
	url = `https://wiki.anpang.lol/w/api.php?action=query&prop=revisions&titles=${url}&rvprop=content&rvslots=*&format=json`;
	console.log(url);
	
	// fetch and get text
	await fetch(url).then((response) => {
		return response.json();
	}).then((json) => {
		
		// parse data
		let source, splitted;
		data = [];
		for(const pageData of Object.values(json["query"]["pages"])) {

			// page doesn't exist or is invalid, skip it
			if("missing" in pageData || "invalid" in pageData) {
				continue;
			}
			
			// parse page
			source = pageData["revisions"][0]["slots"]["main"]["*"].split("!Notes\n|-\n")[1].split("|}")[0];
			for(const row of source.split("|-")) {
				splitted = row.split("|");
				data.push([
					splitted[1].replaceAll("'''", "").trim(), splitted[2].trim(), splitted[3].trim(), pageData["title"].split("/")[2]
					//               word                           type               meaning                  origin page
				]);
			}

		}

		dataFetched = true;

	});

}


// search

async function dictSearch(event) {

	event.preventDefault();

	// get query
	const query = $("#dict-search-input").val().toLowerCase();
	if(query == "") {
		return;
	}

	$("#dict-search-results").text("Loading...");

	// fetch data if not fetched yet
	if(!dataFetched) {
		await getData();
	}

	// make results
	let results = [];
	for(const word of data) {

		// add if word or meaning contains query, or the query is the word type
		if(word[0].toLowerCase().includes(query) || word[2].toLowerCase().includes(query) || query === word[1].toLowerCase()) {
			results.push(`
				<li>
					<b><a href="/${language}/Dictionary/${word[3]}">${word[0]}</a></b> - ${word[1]} ${word[2]}
				</li>
			`);
		}
	}

	// show results
	if(results.length === 0) {
		// no results
		$("#dict-search-results").text("No results!");
	} else {
		$("#dict-search-results").html(`${results.length} results found:<ul>${results.join("")}</ul>`);
	}
	
}

