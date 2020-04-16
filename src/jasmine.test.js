describe('Jasmine', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
  });

  afterEach(async function () {
    if (this.jasmine.listening) {
      await this.jasmine.shutdown();
    }
  });

  [
    "modTools",
    "ow-info",
    "owMains",
    "streaming",
    "topics",
    "autoRoles",
    "userRoles",
  ].forEach((plugin) => {
    it(`loads ${plugin}`, function () {
      this.jasmine = stubJasmine();
      expect(this.jasmine.getPlugin(plugin)).not.to.be.undefined;
    });
  });

  it('is able to start', async function () {
    this.jasmine = stubJasmine();
    await this.jasmine.listen();
  });
});
