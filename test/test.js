var assert = require('assert');
var genesis = require('../genesis');

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

describe("sum", function() {
  var sum = genesis.sum;
  it('should add two numbers', () => {
    var total = sum(2,3);
    assert.equal(total, 5);
  })
})