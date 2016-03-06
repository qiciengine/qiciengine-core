module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.loadTasks('tasks');

    grunt.registerTask('default', ['clean', 'concat']);
    grunt.registerTask('min', ['default', 'uglify']);
};


