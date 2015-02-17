'use strict';

var gulpif = require('gulp-if');
var stylus = require('gulp-stylus');
var argv = require('yargs').argv;
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var nib = require('nib');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var transform = require('vinyl-transform');
var karma = require('karma').server;
var through2 = require('through2');
var concat = require('gulp-concat');
var jade = require('gulp-jade');
var jshint = require('gulp-jshint');
var templateCache = require('gulp-angular-templatecache');

var config = require('./config');
var vendors = require('../client/vendors');

var isProduction = argv.production;

module.exports = function (gulp) {
  return {
    copyStatic: function () {
      return gulp.src(config.client.static.copyPattern)
        .pipe(gulp.dest(config.client.static.target));
    },

    buildStylesheets: function () {
      return gulp.src(config.client.stylesheets.buildPattern)
        .pipe(plumber())
        .pipe(gulpif(!isProduction, sourcemaps.init()))
        .pipe(stylus({
          use: nib(),
          compress: isProduction
        }))
        .pipe(gulpif(
          !isProduction,
          sourcemaps.write(config.client.externalSourceMap ? '.' : null)
        ))
        .pipe(plumber.stop())
        .pipe(gulp.dest(config.client.stylesheets.target));
    },

    buildViews: function () {
      return gulp.src(config.client.app.viewPattern)
        .pipe(jade({
          pretty: true
        }))
        .pipe(templateCache(
          'templates.js',
          {
            root: 'views/',
            standalone: true
          }
        ))
        .pipe(gulp.dest(config.client.app.target));
    },

    buildScripts: function () {
      var browserified = transform(function (filename) {
        var b = browserify({
          entries: [filename],
          debug: !isProduction
        });
        return b.bundle();
      });

      return gulp.src([config.client.app.buildPattern])
        .pipe(plumber())
        .pipe(browserified)
        .pipe(gulpif(isProduction, uglify({mangle: false})))
        .pipe(gulp.dest(config.client.app.target));
    },

    buildVendors: function () {
      return gulp.src([config.client.app.vendorPattern])
        .pipe(plumber())
        .pipe(through2.obj(function (file, enc, next) {
          browserify(file.path)
            .transform('browserify-shim')
            .require(vendors)
            .bundle(function (err, res) {
              file.contents = res;
              next(null, file);
            });
        }))
        .pipe(gulp.dest(config.client.app.target));
    },

    concatVendors: function () {
      return gulp.src(config.client.vendors)
        .pipe(plumber())
        .pipe(concat('vendors.js'))
        .pipe(gulpif(isProduction, uglify({mangle: false})))
        .pipe(gulp.dest(config.client.app.target));
    },

    test: function (done) {
      karma.start({
        configFile: __dirname + '/../karma.conf.js',
        singleRun: true
      }, done);
    },

    jshint: function() {
      return gulp.src(config.client.app.watchPattern)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
    }
  };
};
