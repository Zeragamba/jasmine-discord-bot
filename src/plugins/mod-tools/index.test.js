describe('Plugin: ModTools', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
  });

  afterEach(function (done) {
    if (this.jasmine.listening) {
      this.jasmine.shutdown()
        .subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  it('can be loaded by Chaos', function (done) {
    this.jasmine.listen()
      .subscribe(() => done(), (error) => done(error));
  });
});
