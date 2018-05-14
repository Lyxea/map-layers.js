// including plugins
var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');
var gutil = require('gulp-util');
var concatCss = require('gulp-concat-css');
var removeUseStrict = require("gulp-remove-use-strict");

//script paths
var jsFiles = 'js/*.js',
    jsDest = 'dist';
	
var fileName = "map-layer"
var version = "0.1"

var exportName = fileName + "-" + version

var header = "/*!\n" +
  " * " + fileName +".js\n" +
  " * https://github.com/Lyxea/map-layers.js\n" +
  " * Version: "+ version + "\n" +
  " *\n" +
  " * Copyright " + (new Date().getFullYear()) + " Map-layers.js Contributors\n" +
  " * Released under the Apache License 2.0\n" +
  " * https://github.com/Lyxea/map-layers.js/blob/master/LICENSE\n" +
  " */\n";

gulp.task('build', function() {
    return gulp.src(jsFiles)
        .pipe(concat(exportName + '.js'))
		.pipe(removeUseStrict())
		.pipe(insert.prepend(header))
		.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest(jsDest));
});

gulp.task('build-lib', function() {
    return gulp.src(["lib/jquery-3.1.1.min.js","lib/bootstrap-slider.js","lib/bootstrap.min.js", "lib/ol.js"])
        .pipe(concat('lib.js'))
		.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest(jsDest));
});

gulp.task('build-css', function () {
  return gulp.src(["lib/*.css", "lib/font-awesome/css/font-awesome.min.css"])
    .pipe(concatCss("style.css"))
	.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
    .pipe(gulp.dest(jsDest));
});

gulp.task('minify', function() {
    return gulp.src(jsFiles)
        .pipe(concat(exportName + '.min.js'))
		.pipe(removeUseStrict())
        .pipe(uglify())
		.pipe(insert.prepend(header))
		.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest(jsDest));
});


// Tâche "build-all" = build all
gulp.task('build-all', ['build',  'minify', 'build-lib', 'build-css']);
//gulp.task('buildCss', ['css']);

// Tâche "prod" = Build + minify
gulp.task('prod', ['build',  'minify']);

// Tâche par défaut
gulp.task('default', ['build']);