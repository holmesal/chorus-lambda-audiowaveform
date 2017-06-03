// See https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

var exec = require('child_process').exec;

// This is what Lambda will invoke to run this function
exports.handler = (event, context, callback) => {

	// First, just try to see if the thing runs
	var cmd = './audiowaveform/audiowaveform';

	// Exec the command via node
	exec(cmd, function(error, stdout, stderr) {
	  // command output is in stdout
	  if (error) {
	  	console.error(error);
	  	callback(error);
	  } else {
		console.log(stdout);
		callback(null, stdout);
	  }
	});
};