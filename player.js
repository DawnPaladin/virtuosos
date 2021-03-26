const player = (function() {
	const traits = {};
	const changeTraits = function(traitChangesString) {
		console.log(traitChangesString);
		var traitChangeArrays = [...traitChangesString.matchAll(/(.*?) ([+-]\d*)/g)];
		var traitChangeObjects = traitChangeArrays.map(array => {
			var trait = array[1].trim() // sample: "Bold"
			var modifier = array[2].trim() // sample: "+1"
			return { trait, modifier };
		});
		traitChangeObjects.forEach(traitChange => {
			if (!traits[traitChange.trait]) {
				console.log("Initializing", traitChange.trait, "to 0");
				traits[traitChange.trait] = 0;
			}
			traits[traitChange.trait] += Number(traitChange.modifier);
			console.log(`Changing ${traitChange.trait} by ${traitChange.modifier}. New value: ${traits[traitChange.trait]}`);
		});
	}
	const exports = {
		changeTraits
	}
	return exports;
})();
export default player