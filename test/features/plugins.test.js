describe('Feature: plugins', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
  });

  [
    "autoRoles",
    "modTools",
    "ow-info",
    "owMains",
    "streaming",
    "topics",
  ].forEach((plugin) => {
    it(`loads plugin ${plugin}`, function () {
      expect(this.jasmine.getPlugin(plugin).name).to.equal(plugin);
    });
  });
});