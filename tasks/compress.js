module.exports = function (grunt) {    
    grunt.config('compress', {
        release: {
            options: {
                archive: 'build/qc-core-<%= version %>.zip'
            },
            files: [
                {
                    expand: true,
                    cwd: 'build/',
                    src: ['**'],
                    dest: '',
                    filter: function (filepath) {
                        return filepath.indexOf('.DS_Store') < 0 &&
                            filepath.indexOf('__MACOSX') < 0 &&
                            filepath.indexOf('debug') < 0;
                    }
                }
            ]
        }
    });          
};


