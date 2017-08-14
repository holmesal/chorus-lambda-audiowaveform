"use strict";

var request = require('request');
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var eq = require('./eq.js');

// See https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

var exec = require('child_process').exec;

const waveformPath = '/tmp/waveform.json';

// This is what Lambda will invoke to run this function
exports.handler = (event, context, callback) => {

	console.info('event: ', event);

	const id = event.id;
	const audioSource = event.audioSource;
	const dataPixelsPerSecond = event.dataPixelsPerSecond;
	const bucket = event.bucket;

	let start = Date.now();

	downloadEpisode(audioSource)
	.tap(() => logTime('download', start))
	.then(episodePath => generateWaveform(episodePath, dataPixelsPerSecond))
	.tap(() => logTime('generate', start))
	.then(() => applyEq(waveformPath))
	.tap(() => logTime('🌊 applyEqualization', start))
	.then(() => uploadWaveform(id, bucket))
	.tap(() => logTime('upload', start))
	.then(waveformUrl => {
		callback(null, {
			waveformUrl
		});
	})
	.catch(err => callback(err));

};

const logTime = (label, start) => {
	console.info(`[${label}] ${(Date.now() - start) / 1000} seconds`);
	start = Date.now();
};

const downloadEpisode = audioSource => new Promise((resolve, reject) => {
	// Download the episode
	console.info(`🌏 Downloading file from url: ${audioSource}`);

    // figure out the content type of this file
    const extension = path.extname(audioSource).split('?')[0];

    // Download
    const timestampBegin = Date.now();
    const episodePath = `/tmp/episode${extension}`;
    console.info({ extension, episodePath });
    request(audioSource)
        .on('err', reject)
        .on('end', res => {
            resolve(episodePath);
        })
        .pipe(fs.createWriteStream(episodePath));
});

const generateWaveform = (episodePath, dataPixelsPerSecond) => new Promise((resolve, reject) => {

	var cmd = `./audiowaveform -i ${episodePath} -o ${waveformPath} -b 8 --pixels-per-second 5`;
	console.info('running: ' + cmd);
	// Exec the command via node
	exec(cmd, function(error, stdout, stderr) {
	  // command output is in stdout
	  if (error) {
	  	console.error(error);
	  	reject(error);
	  } else {
	  	resolve();
	  }
	});
});

const applyEq = (waveformPath) => new Promise((resolve, reject) => {
	var waveform = JSON.parse(fs.readFileSync(waveformPath, 'utf8'))
	waveform.data = eq(waveform.data)
	fs.writeFileSync(waveformPath, JSON.stringify(waveform) )
	resolve()
});

const uploadWaveform = (id, Bucket) => new Promise((resolve, reject) => {
	const Key = `${id}/waveform.json`
	const Body = fs.createReadStream(waveformPath);
	const region = 'us-west-1';
	var s3 = new AWS.S3({
	    apiVersion: '2006-03-01',
	    region
	});

	console.info(`☝ Uploading ${waveformPath} ---> ${Key} in bucket ${Bucket}`);
	s3.putObject({
        Bucket,
        Key,
        Body,
        ContentType: 'application/json',
        ACL: 'public-read'
    }).promise()
    .then(res => {
	    console.info(`Uploaded ${Key} successfully to s3!`, res);
	    resolve(`http://s3-${region}.amazonaws.com/${Bucket}/${Key}`);
    })
    .catch(reject)
});


/**
To test locally, 
1. Uncomment the following
2. Change the state of the waveform generation command from './audiowaveform' to 'audiowaveform'
*/
// exports.handler({
// 	bucket: 'chorus-waveforms-dev',
// 	id: 'new-lambda-test',
// 	audioSource: 'http://feeds.99percentinvisible.org/~r/99percentinvisible/~5/Kw1oEF9iEdc/199-The-Yin-and-Yang-of-Basketball-rebroadcast.mp3', 
// 	dataPixelsPerSecond: 5
// }, null, (err, text) => {
// 	err ? console.error(err) : console.info(text)
// })