const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const eslint = require('gulp-eslint');

gulp.task('lint', function () {
    return gulp.src(['wingman.js', '!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('ref', function () {
    nodemon({
        script: 'wingman.js'
        , ext: 'js html'
        , env: { 'NODE_ENV': 'development' }
    });
});

gulp.task('default', function () {
    var stream = nodemon({
        script: 'wingman.js'
        , ext: 'html js'
        , ignore: ['ignored.js']
        , tasks: ['lint']
    });

    stream
        .on('restart', function () {
            console.log('restarted!')
        })
        .on('crash', function () {
            console.error('Application has crashed!\n')
            stream.emit('restart', 10)  // restart the server in 10 seconds 
        });
});
