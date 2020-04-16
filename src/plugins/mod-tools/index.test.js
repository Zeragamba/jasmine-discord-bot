describe('Plugin: ModTools', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
  });

  afterEach(async function () {
    if (this.jasmine.listening) {
      await this.jasmine.shutdown();
    }
  });

  it('can be loaded by Chaos', async function () {
    await this.jasmine.listen();
  });
});
