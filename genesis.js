async function loadScene() {
	try {
		const response = await fetch('angel-encounter.scene');
		const data = await response.text();
		return data;
	} catch (err) {
		console.error(err);
	}
}

function processPassages(scene) {
	window.choiceShortcuts = {};
	const passages = scene
		.split('===')
		.map(passage => {
			var name = "";
			const pieces = passage.split("---");
			var paragraphs = pieces[0].split('\n\n');
			if (paragraphs[0].trim().substr(-1, 1) == ":") { // if first paragraph ends with :
				name = paragraphs.shift().slice(0, -1); // give the passage a name
			}
			paragraphs = paragraphs
				.map(paragraph => "<p>" + paragraph + "</p>")
				.join('\n')
			;
			const choices = pieces.length > 1 ? processChoices(pieces[1]) : [];
			return { name, paragraphs, choices };
		})
	;
	console.log(passages);
	return passages;
}

function processChoices(choicesText) {
	var choices = choicesText
		.split('\n')
		.filter(element => element != "")
		.map(choiceText => {
			var choiceObj = {};
			if (choiceText[0] == ">") { // "> " means we're defining a new choice for the player
				var newChoiceString = choiceText.replace("> ", "");
				const choiceModifiers = [
					{ character: "=", name: "shortcut"},
					{ character: ":", name: "target"}
				]
				// if there are no modifiers, the choice's name and target default to newChoiceString
				choiceObj.name = newChoiceString;
				choiceObj.target = newChoiceString;
				// iterate through possible choice modifiers in order, breaking down the choice string from right to left
				(function breakdown() {
					choiceModifiers.forEach(modifier => {
						if (containsMultiple(newChoiceString, modifier.character)) {
							throw new Error(`Can't parse newChoiceString ${newChoiceString}: Contains multiple ${controlCharacter}`);
						}
						if (newChoiceString.includes(modifier.character)) {
							var pieces = newChoiceString.split(modifier.character);
							choiceObj.name = pieces[0].trim();
							choiceObj[modifier.name] = pieces[1].trim();
							newChoiceString = pieces[0].trim(); // cut the modifier off the end of newChoiceString
							breakdown(); // and analyze it again
						}
					})
				})();
			} else if (choiceText[0] == "?") {
				// TODO
			} else { // choiceText is the name of a shortcut
				// TODO
				// choiceObj = window.choiceShortcuts[choiceText];
			}
		return choiceObj;
	});
	console.log(choices);
	return choices;
}

function containsMultiple(string, searchCharacter) {
	var index1 = string.indexOf(searchCharacter);
	var index2 = string.indexOf(searchCharacter, index1+1);
	if (index2 != -1) return true; else return false;
}

function populatePage(passage) {
	document.getElementById('current-passage').innerHTML = passage.paragraphs;
	document.getElementById('choices').innerHTML = passage.choices.map(choice => {
		console.log(choice)
		return `<a href="#" data-target="${choice.target}">${choice.name}</a>`
	});
}

function passageLink(choice) {
	var className = choice.visited ? "visited" : "unvisited";
	return `<a href="#" data-passage=${choice.passage} class=${className}>${choice.text}</a>`;
}

loadScene()
	.then(scene => processPassages(scene))
	.then(passages => populatePage(passages[0]))
;