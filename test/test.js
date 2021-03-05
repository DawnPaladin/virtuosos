var expect = require('chai').expect;
var { processPassages, processChoices } = require('../genesis');

describe("processPassages", () => {
  var input = `
First scene
---
> Choice

===
Scene two:

Second scene
---
> Other choice`
  var passages = processPassages(input);
  it("should return a dict of two passage objects, one named 'Start' and one named 'Scene two'", () => {
    expect(passages).to.have.property("Start");
    expect(passages).to.have.property("Scene two");
    expect(passages.Start).to.eql({
      name: "Start",
      html: "<p>First scene</p>",
      choices: processChoices("> Choice"),
      visited: false,
      oneWay: false
    })
    expect(passages["Scene two"]).to.eql({
      name: "Scene two",
      html: "<p>Second scene</p>",
      choices: processChoices("> Other choice"),
      visited: false,
      oneWay: false
    })
  })
})

describe("processChoices", () => {
  var input = `
    > Simple choice
    > "It was a simple choice, she said."
    > "I had only one chance to hit the target.": Target
    > "This will come in handy later.": Sneaky tool = ShortcutName
    ShortcutName
    ?saw all of ["Simple choice"]: "Only one option": Target
  `;
  var choices = processChoices(input);
  it("should define a simple choice", () => {
    expect(choices[0]).to.have.property("name", "Simple choice")
    expect(choices[0]).to.have.property("target", "Simple choice")
  });
  it("should strip quotes", () => {
    expect(choices[1]).to.have.property("name", "It was a simple choice, she said.")
  });
  it("should be able to target a named passage", () => {
    expect(choices[2]).to.have.property("name", "I had only one chance to hit the target.")
    expect(choices[2]).to.have.property("target", "Target")
  });
  it("should set a shortcut name", () => {
    expect(choices[3]).to.have.property("name", "This will come in handy later.")
    expect(choices[3]).to.have.property("target", "Sneaky tool")
    expect(choices[3]).to.have.property("shortcut", "ShortcutName")
  })
  it("should retrieve choices saved with shortcut names", () => {
    expect(choices[4]).to.have.property("name", "This will come in handy later.")
    expect(choices[4]).to.have.property("target", "Sneaky tool")
    expect(choices[4]).to.have.property("shortcut", "ShortcutName")
  })
})
