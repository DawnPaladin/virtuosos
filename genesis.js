async function loadScene() {
	try {
		const response = await fetch('angel-encounter.scene');
		const data = await response.text();
		return data;
	} catch (err) {
		console.error(err);
	}
}

const passages = {};
const choiceShortcuts = {};

/**
 * Take the contents of a scene file and split it into an dict of Passage objects, organized by name.
 * @param {string} scene Contents of a scene file
 * @returns {Object}
 */
var processPassages = function(scene) {
	const names = [];
	scene
		.split('===')
		.forEach(passageText => {
			var name = "Start";
			const pieces = passageText.split("---");
			var paragraphs = pieces[0].split('\n\n');
			if (paragraphs[0].trim().substr(-1, 1) == ":") { // if first paragraph ends with :
				name = paragraphs.shift().slice(0, -1).replaceAll("\"", "").trim(); // give the passage a name
			}
			if (names.includes(name)) {
				if (name == "Start") {
					throw new Error("Only one passage name can be empty." + passageText)
				}
				throw new Error("Duplicate passage name" + name);
			} else {
				names.push(name);
			}
			const html = paragraphs
				.map(paragraph => paragraph.trim())
				.map(paragraph => "<p>" + paragraph + "</p>")
				.join('\n')
			;
			const choices = pieces.length > 1 ? processChoices(pieces[1]) : [];
			const passage = { name, html, choices, visited: false };
			passages[name] = passage;
		})
	;
	return passages;
}

/** 
 * @typedef {Object} Choice
 * @property {String} name
 * @property {String} target
 * @property {String} [shortcut]
 */
/**
 * Turn a string containing several choices into an array of Choice objects.
 * @param {string} choicesText Choices separated by newlines
 * @returns {Choice[]} Array of choices
 */
var processChoices = function(choicesText) {
	var choices = choicesText
		.split('\n')
		.filter(element => element != "")
		.map(choiceText => {
			var choiceObj = {};
			choiceText = choiceText.replaceAll("\"", "").trim(); // strip quotes
			if (choiceText[0] == ">") { // "> " means we're defining a new choice for the player
				var newChoiceString = choiceText.replace("> ", "");
				const choiceModifiers = [
					{ character: "=", name: "shortcut"},
					{ character: ":", name: "target"}
				]
				// if there are no modifiers, the choice's name and target default to newChoiceString
				choiceObj.name = "";
				choiceObj.target = "";
				// iterate through possible choice modifiers in order, breaking down the choice string from right to left
				(function breakdown() {
					// if (choiceText.includes("Who are you?")) debugger;
					choiceModifiers.forEach(modifier => {
						if (containsMultiple(newChoiceString, modifier.character)) {
							throw new Error(`Can't parse newChoiceString ${newChoiceString}: Contains multiple ${modifier.character}`);
						}
						if (newChoiceString.includes(modifier.character)) {
							var pieces = newChoiceString.split(modifier.character);
							choiceObj.name = pieces[0].trim();
							choiceObj[modifier.name] = pieces[1].trim();
							newChoiceString = pieces[0].trim(); // cut the modifier off the end of newChoiceString
							if (modifier.name == "shortcut") {
								choiceShortcuts[pieces[1].trim()] = choiceObj;
							}
							breakdown(); // and analyze it again
						}
					})
				})();
				if (choiceObj.name == "") choiceObj.name = newChoiceString;
				if (choiceObj.target == "") choiceObj.target = newChoiceString;
			} else if (choiceText[0] == "?") {
				// parse(choiceText, "?saw all of", function())
				// TODO
				choiceObj = { name: "conditional link", target: "Start" }
			} else { // choiceText is the name of a shortcut
				choiceObj = choiceShortcuts[choiceText];
			}
		return choiceObj;
	});
	return choices;
}

function parse(string, substring, callback) {
	if (string.startsWith(substring)) {
		var newString = string.slice(substring.length);
		return callback(newString);
	} else {
		return false;
	}
}

function containsMultiple(string, searchCharacter) {
	var index1 = string.indexOf(searchCharacter);
	var index2 = string.indexOf(searchCharacter, index1+1);
	if (index2 != -1) return true; else return false;
}

var currentPassage;

function populatePage(passage) {
	document.getElementById('current-passage').innerHTML = passage.html;
	document.getElementById('choices').innerHTML = passage.choices.map(passageLink).join("\n");
	currentPassage = passage; // for debugging
}

function passageLink(choice) {
	var className = choice.visited ? "visited" : "unvisited";
	if (!Object.keys(passages).includes(choice.target)) {
		throw new Error(choice.target + " is not a valid passage name");
	}
	return `<a href="#" data-target="${choice.target}" class="${className}">${choice.name}</a>`;
}

loadScene()
	.then(scene => processPassages(scene))
	.then(passages => {
		populatePage(passages.Start);
	})
;

const history = [];

module.exports = { 
	processPassages, 
	processChoices 
};
