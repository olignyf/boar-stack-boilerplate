'use strict';

var sinon = require('sinon');
var renderSpy = require('./lib/app/render.mock');


before(function() {
  var chai = require('chai');
  var sinonChai = require('sinon-chai');
  var chaiSubset = require('chai-subset');
  var chaiAsPromised = require('chai-as-promised');

  chai.use(chaiAsPromised);
  chai.use(chaiSubset);
  chai.use(sinonChai);

  sinon.stub.returnsWithResolve = function(data) {
    return this.returns(Promise.resolve(data));
  };

  sinon.stub.returnsWithReject = function(error) {
    return this.returns(Promise.reject(error));
  };

});


beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
  this.renderSpy = renderSpy;
  this.renderSpy.attach();
});


afterEach(function() {
  this.sandbox.restore();
  this.renderSpy.restore();
});