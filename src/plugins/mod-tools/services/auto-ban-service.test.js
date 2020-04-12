describe('AutoBanService', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.service = this.jasmine.getService('modTools', 'AutoBanService');
  });

  describe('#memberNameMatches', function () {
    beforeEach(function () {
      this.member = {
        user: {username: 'exampleUsername'},
      };
    });

    it('returns true if the username matches', function () {
      expect(this.service.memberNameMatches(this.member, /Username/))
        .to.be.true;
    });

    it('returns false if the username does not match', function () {
      expect(this.service.memberNameMatches(this.member, /foobar/))
        .to.be.false;
    });

    context('when the member has a nickname', function () {
      beforeEach(function () {
        this.member.nickname = 'exampleNickname';
      });

      it('returns true if the nickname matches', function () {
        expect(this.service.memberNameMatches(this.member, /Nickname/))
          .to.be.true;
      });

      it('returns false if the nickname does not match', function () {
        expect(this.service.memberNameMatches(this.member, /foobar/))
          .to.be.false;
      });
    });
  });
});
