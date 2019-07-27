describe('Jasmine', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
  });

  afterEach(function (done) {
    if (this.jasmine.listening) {
      this.jasmine.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
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

  it('is able to start', function (done) {
    this.jasmine = stubJasmine();
    this.jasmine.listen()
      .subscribe(() => done(), (error) => done(error));
  });
});