module.exports = function (grunt) {
    grunt.config('uglify.core', {
        src: 'build/qc-core-debug.js',
        dest: 'build/qc-core.js'
    });
};