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
var jsFiles = 'src/js/*.js',
    jsDest = 'dist/';
	
var fileName = "map-layer"
var version = "0.2"

var header = "/*!\n" +
  " * " + fileName +".js\n" +
  " * https://github.com/Lyxea/map-layers.js\n" +
  " * Version: "+ version + "\n" +
  " *\n" +
  " * Copyright " + (new Date().getFullYear()) + " Map-layers.js Contributors\n" +
  " * Released under the Apache License 2.0\n" +
  " * https://github.com/Lyxea/map-layers.js/blob/master/LICENSE\n" +
  " */\n";
  
var headerLib = "/*!\n" +
  " Compiled lib'z : " +
  " jquery-3.1.1 + bootstrap-slider  9.8.1 + bootstrap 3.3.7 + OpenLayers 4.0.1" +
  " */\n";
  
var faSourceFiles = ['src/css/font-awesome/fonts/*'];
var langSourceFiles = ['src/localization/*'];

gulp.task('build', function() {
    gulp.src(jsFiles)
        .pipe(concat(fileName + '.js'))
		.pipe(removeUseStrict())
		.pipe(insert.prepend(header))
		.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest(jsDest + "js"));
	gulp.src(langSourceFiles)
		.pipe(gulp.dest(jsDest + "/localization/"));
});

gulp.task('build-lib', function() {
    gulp.src(["src/lib/jquery-3.1.1.min.js","src/lib/bootstrap-slider.js","src/lib/bootstrap.min.js", "src/lib/ol.js"])
        .pipe(concat('lib.js'))
		.pipe(insert.prepend(headerLib))
		.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest(jsDest + "js"));
});

gulp.task('build-css', function () {
    gulp.src(["src/css/*.css", "src/css/font-awesome/css/font-awesome.min.css"])
		.pipe(concatCss("style.css"))
		.pipe(insert.prepend(headerLib))
		.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
		.pipe(gulp.dest(jsDest + "css"))
	gulp.src(faSourceFiles)
		.pipe(gulp.dest(jsDest + "/css/font-awesome/fonts/"));
	
});


gulp.task('minify', function() {
    gulp.src(jsFiles)
        .pipe(concat(fileName + '.min.js'))
		.pipe(removeUseStrict())
        .pipe(uglify())
		.pipe(insert.prepend(header))
		.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest(jsDest + "js"));
});


gulp.task('build-js', ['build',  'minify', 'build-lib']);

// Tâche par défaut
gulp.task('default', ['build',  'minify', 'build-lib', 'build-css']);