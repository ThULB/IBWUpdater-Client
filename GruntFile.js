module.exports = function(grunt) {
	var path = require("path");
	var fs = require("fs");

	// Project configuration.
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		banner : '/*!\n' + ' * <%= pkg.name %> v<%= pkg.version %> (<%= pkg.revision %>)\n' + ' * Homepage: <%= pkg.homepage %>\n'
				+ ' * (c) 2013-<%= grunt.template.today("yyyy") %> <%= pkg.author %> and others. All rights reserved.\n'
				+ ' * Licensed under <%= pkg.license %>\n' + ' */\n',
		clean : {
			build : {
				src : [ "build", "dist" ]
			}
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
			setup : {
				expand : true,
				cwd : 'setup/',
				src : '**',
				dest : 'build/setup'
			}
		},
		gitinfo : {
			options : {
				cwd : "./"
			}
		},
		replace : {
			build : {
				options : {
					patterns : [ {
						match : 'Version',
						replacement : '<%= pkg.version %>'
					}, {
						match : 'Revision',
						replacement : '<%= gitinfo.local.branch.current.shortSHA %>'
					} ]
				},
				files : [ {
					expand : true,
					flatten : false,
					cwd : 'build/',
					src : [ '**' ],
					dest : 'build/'
				} ]
			}
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
		},
		curl : {
			innounp : {
				src : 'https://downloads.sourceforge.net/project/innounp/innounp/innounp%200.45/innounp045.rar?r=&ts=1439566551&use_mirror=skylineservers',
				dest : 'build/setup/innosetup/innounp.rar'
			},
			innosetup : {
				src : 'http://files.jrsoftware.org/is/5/isetup-5.5.8-unicode.exe',
				dest : 'build/setup/innosetup/is-unicode.exe'
			}
		},
		exec : {
			innounp : {
				command : 'unrar -y e innounp.rar',
				cwd : 'build/setup/innosetup/'
			},
			innosetup : {
				command : 'wine ./innounp.exe -e ./is-unicode.exe',
				cwd : 'build/setup/innosetup/'
			},
			installer : {
				command : 'wine ./innosetup/ISCC.exe IBWUpdater.iss /Dsources=..\\\\<%= pkg.name %>\\\\ /O..\\\\..\\\\dist\\\\',
				cwd : 'build/setup/'
			}
		}
	});

	// Build Tasks
	grunt.loadNpmTasks('grunt-curl');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks("grunt-gitinfo");
	grunt.loadNpmTasks('grunt-replace');

	grunt.registerTask('build', [ 'gitinfo', 'copy', 'uglify', 'replace', 'compress' ]);
	grunt.registerTask('setup', [ 'clean', 'build', 'curl', 'exec' ]);

	grunt.registerTask('default', [ 'clean', 'build' ]);
};