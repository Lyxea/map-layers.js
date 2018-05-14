// including plugins
var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');
var gutil = require('gulp-util');
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


gulp.task('minify', function() {
    return gulp.src(jsFiles)
        .pipe(concat(exportName + '.min.js'))
		.pipe(removeUseStrict())
        .pipe(uglify())
		.pipe(insert.prepend(header))
		.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest(jsDest));
});


// Tâche "build"
//gulp.task('buildCss', ['css']);

// Tâche "prod" = Build + minify
gulp.task('prod', ['build',  'minify']);

// Tâche par défaut
gulp.task('default', ['build']);