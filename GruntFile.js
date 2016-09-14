module.exports = function(grunt) {
	var path = require("path");
	var fs = require("fs");

	// Project configuration.
	grunt
			.initConfig({
				pkg : grunt.file.readJSON('package.json'),
				banner : '/*!\n'
						+ ' * <%= pkg.name %> v${project.version}\n'
						+ ' * Homepage: <%= pkg.homepage %>\n'
						+ ' * (c) 2013-<%= grunt.template.today("yyyy") %> <%= pkg.author %> and others. All rights reserved.\n'
						+ ' * Licensed under <%= pkg.license %>\n' + ' */\n',
				clean : {
					build : {
						src : [ "build", "dist" ]
					},
				},
				uglify : {
					build : {
						options : {
							banner : '<%= banner %>',
							preserveComments : 'some',
							sourceMap : false,
							screwIE8 : true
						},
						files : [ {
							expand : true,
							cwd : 'resources/',
							src : '**/*.js',
							dest : 'build/<%= pkg.name %>/'
						} ]
					}
				},
				copy : {
					build : {
						expand : true,
						cwd : 'resources/',
						src : '**',
						dest : 'build/<%= pkg.name %>'
					},
				},
				compress : {
					dist : {
						options : {
							archive : 'dist/<%= pkg.name %>.zip'
						},
						files : [ {
							expand : true,
							cwd : 'build/<%= pkg.name %>/chrome',
							src : [ 'content/**/*', 'lib/**/*', 'locale/**/*' ],
							dest : 'chrome/ibw'
						}, {
							expand : true,
							cwd : 'build/<%= pkg.name %>',
							src : [ 'scripts/*' ],
							dest : ''
						} ]
					}
				}
			});

	// Build Tasks
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('build', [ 'copy', 'uglify' ]);

	grunt.registerTask('default', [ 'clean', 'build', 'compress' ]);
};