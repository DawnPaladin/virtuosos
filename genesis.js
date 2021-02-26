async function loadScene() {
	try {
		const response = await fetch('angel-encounter.scene');
		const data = await response.text();
		console.log(data);
	} catch (err) {
		console.error(err);
	}
}

loadScene();