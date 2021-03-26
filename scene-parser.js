async function loadScene() {
	try {
		const response = await fetch('scenes/angel-encounter.scene');
		const data = await response.text();
		return data;
	} catch (err) {
		console.error(err);
	}
}

import player from './player.js';

const passages = {};

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
			var oneWay = false;
			if (paragraphs[0].trim().substr(-1, 1) == ":") { // if first paragraph ends with :
				name = generateSlug(paragraphs.shift().slice(0, -1)); // give the passage a name
			}
			if (names.includes(name)) { // if name is a duplicate
				if (name == "Start") {
					throw new Error("Only one passage name can be empty." + passageText)
				}
				throw new Error("Duplicate passage name" + name);
			} else {
				if (name[0] == "!") {
					oneWay = true;
					name = name.slice(1);
				}
				names.push(name);
			}
			const html = paragraphs
				.map(paragraph => paragraph.trim())
				.map(paragraph => "<p>" + paragraph + "</p>")
				.map(paragraph => paragraph.replace(/\*(.*)\*/g, "<strong>$1</strong>"))
				.map(paragraph => paragraph.replace(/_(.*)_/g, "<em>$1</em>"))
				.map(paragraph => paragraph.replace("--", "&mdash;"))
				.join('\n')
			;
			const choices = pieces.length > 1 ? processChoices(pieces[1]) : [];
			const passage = { name, html, choices, visited: false, oneWay };
			passages[name] = passage;
		})
	;
	return passages;
}

class Choice {
	constructor() {
		this.text = "";
		this.target = "";
		this.requirements = [];
		this.traitChangeStr = "";
	}
}
const choiceShortcuts = {};
const passageHistory = [];

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
			choiceText = choiceText.trim();
			var choiceObj = new Choice();
			if (choiceText[0] == ">") { // "> " means we're defining a new choice for the player
				choiceObj = breakdownNewChoiceString(choiceText.replace("> ", ""))
			} else if (choiceText[0] == "?") {
				choiceObj = conditionalChoice(choiceText);
			} else { // choiceText is the name of a shortcut
				choiceObj = choiceShortcuts[generateSlug(choiceText)];
			}
			if (typeof choiceObj == "undefined") throw new Error("Undefined choice");
			return choiceObj;
		})
	;
	return choices;
}

/**
 * @param {*} choiceText 
 * @return {Choice} 
 */
function conditionalChoice(choiceText) {
	var choiceObj = parseForward(choiceText, "?saw all of", function(stringAfterThat) {
		var beforeBetweenAndAfterSquareBrackets = /(.*)\[(.*)\](.*)/g;
		var matches = beforeBetweenAndAfterSquareBrackets.exec(stringAfterThat);
		var before = matches[1].trim();
		var between = matches[2].trim();
		var after = matches[3].trim();
		var choiceText = parseForward(after, ":", text => text);
		var requirements = between.split(',').map(generateSlug);
		var choiceObj = breakdownNewChoiceString(choiceText);
		choiceObj.requirements = requirements;
		return choiceObj;
	})
	return choiceObj;
}

/**
 * @param {String} choiceString
 * @return {Choice} Choice
 */
function breakdownNewChoiceString(choiceString) {
	const choiceModifiers = [
		{ character: "=", name: "shortcut"},
		{ character: ":", name: "target"}
	]
	var choiceObj = new Choice();

	// sample input: "> Refuse to back down: Fight the bully (Bold +1 Heart +1) = Fight"
	var extractFromParens = /(.*)\((.*)\)(.*)/;
	if (extractFromParens.test(choiceString)) {
		var matches = extractFromParens.exec(choiceString);
		var beforeParens = matches[1].trim();  // sample: "> Refuse to back down: Fight the bully"
		var betweenParens = matches[2].trim(); // sample: "Bold +1 Heart +1"
		var afterParens = matches[3].trim();   // sample: "= Fight"
		choiceString = beforeParens + ' ' + afterParens; // sample: > Refuse to back down: Fight the bully = Fight
		choiceObj.traitChangeStr = betweenParens;
	}

	// iterate through possible choice modifiers in order, breaking down the choice string from right to left
	(function breakdown() {
		choiceModifiers.forEach(modifier => {
			if (choiceString.includes(modifier.character)) {
				// Sample input: "Choice name": Choice target
				// Desired output:
				/* choiceObj = {
					text: "Choice text",
					target: "choice-target",
				} */

				if (containsMultiple(choiceString, modifier.character)) {
					throw new Error(`Can't parse choiceString ${choiceString}: Contains multiple ${modifier.character}`);
				}
				
				var pieces = choiceString.split(modifier.character);
				var text = pieces[0].trim();
				var slug = generateSlug(pieces[1]);
				choiceObj.text = text;
				choiceObj[modifier.name] = slug;
				choiceString = text; // cut the modifier off the end of newChoiceString
				if (modifier.name == "shortcut") {
					choiceShortcuts[slug] = choiceObj;
				}
				breakdown(); // and analyze it again
			}
		})
	})();
	if (choiceObj.text == "") choiceObj.text = choiceString;
	if (choiceObj.target == "") choiceObj.target = generateSlug(choiceString);
	return choiceObj;
}

/**
 * Snip off a specific part of a string and perform a function on the rest.
 * @param {boolean} forward Parse from the left instead of the right
 * @param {*} string Input string to process
 * @param {*} substring Substring to search for. If forward is true, we'll look at the start of the string; otherwise we'll look at the end.
 * @param {*} successCallback Callback to run if substring is found. It will be passed the input string, minus the substring. 
 * @param {function} failureCallback Callback to run if substring isn't found.
 * @return {*} 
 */
function parse(forward, string, substring, successCallback, failureCallback) {
	if (forward ? string.startsWith(substring) : string.endsWith(substring)) {
		var newString = string.slice(substring.length);
		return successCallback(newString);
	} else {
		if (failureCallback) {
			return failureCallback(string);
		} else {
			throw new Error(`Couldn't parse "${substring}" out of "${string}"`);
		}
	}
}
// Syntactic sugar for parse()
function parseForward(string, substring, successCallback, failureCallback) {
	return parse(true, string, substring, successCallback, failureCallback);
}
function parseBackward(string, substring, successCallback, failureCallback) {
	return parse(false, string, substring, successCallback, failureCallback);
}

function containsMultiple(string, searchCharacter) {
	var index1 = string.indexOf(searchCharacter);
	var index2 = string.indexOf(searchCharacter, index1+1);
	if (index2 != -1) return true; else return false;
}

function generateSlug(string) {
	return string.trim().toLowerCase().replaceAll(" ", "-").replaceAll("\"", "");
}

var currentPassage;

function populatePage(passage, choiceText, traitChanges) {
	if (!passage) throw new Error("Passage is "+passage)
	if (choiceText) {
		if (traitChanges) {
			choiceText += ` <small>(${traitChanges})</small>`;
		}
		document.getElementById('last-choice').innerHTML = choiceText;
	}
	document.getElementById('current-passage').innerHTML = passage.html;
	document.getElementById('choices').innerHTML = passage.choices.map(passageLink).join("\n");
	currentPassage = passage; // for debugging
	passageHistory.push(passage.name);
	passages[passage.name].visited = true;
}

function passageLink(choice) {
	var passageName = choice.target;
	if (!Object.keys(passages).includes(passageName)) {
		throw new Error(choice.target + " is not a valid passage name");
	}
	var passage = passages[passageName];
	var className = passageHistory.includes(passageName) ? "visited" : "unvisited";
	if (passage.oneWay) {
		className += " one-way";
	}

	var meetsRequirements = choice.requirements.every(requirement => passageHistory.includes(requirement));
	if (meetsRequirements == true) {
		return `<a href="#" data-target="${choice.target}" data-trait-changes="${choice.traitChangeStr}" class="${className}">${choice.text}</a>`;
	} else {
		return "";
	}
}

var handleLinkClick = event => {
	const choiceText = event.target.innerHTML;
	const targetName = event.target.dataset.target;
	const traitChanges = event.target.dataset.traitChanges;
	player.changeTraits(traitChanges);
	populatePage(passages[targetName], choiceText, traitChanges);
}

var jump = passageSlug => {
	if (!passageSlug) {
		return Object.keys(passages);
	} else {
		populatePage(passages[passageSlug]);
	}
}

if (typeof window !== "undefined") { // if in browser
	loadScene()
		.then(scene => processPassages(scene))
		.then(passages => {
			populatePage(passages.Start);
		})
	;
	document.getElementById('choices').addEventListener('click', handleLinkClick);
	// @ts-ignore
	window.jump = jump;
} else { // if in NodeJS
	try {
		module.exports = { // export for testing
			processPassages, 
			processChoices 
		};
	} catch (err) {
		console.error(err);
	}
}
