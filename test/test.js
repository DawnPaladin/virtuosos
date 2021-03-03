var assert = require('assert');
var { sum } = require('../genesis');

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

describe("sum", function() {
  it('should add two numbers', () => {
    var total = sum(2,3);
    assert.equal(total, 5);
  })
})
