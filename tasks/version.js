module.exports = function (grunt) {
    grunt.registerTask('version', 'Get QICI Engine version', function () {
        var qc = require('../src/version.js').qc;
        grunt.config('version', qc.VERSION);
    });
};