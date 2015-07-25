var express = require('express');
var handlebars = require('express-handlebars');
var path = require('path');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/flights')
var flights = require('./flights');

var app = express();

var localport = '3333';
var localhost = 'http://localhost';



app.host = app.set('host', process.env.HOST || localhost);
app.port = app.set('port', process.env.PORT || localport);

app.get('/', function(req, res) {
	res.send('hi! Try passing a query to /getAverages');
});

app.get('/getAverages', function(req, res) {
	getAveragesByIndex(req.query, function(err, result) {
		res.json({
			"numGroups": result.length,
			groups: result
		});
	});
});

app.get('/getRecords', function(req, res) {
	findRecords(req.query, function(err, result) {
		res.json(result);
	});
});

function cleanupParameters (parameters) {
	for (parameter in parameters) {
		var parsedValue = parseInt(parameters[parameter]);
		if (parsedValue) {
			parameters[parameter] = parsedValue;
		}
	}
	delete parameters['index'];
	return parameters;
}

function findRecords(parameters, callback) {
	flights.find(cleanupParameters(parameters)).exec(callback);
}

function getAveragesByIndex(parameters, callback) {
	var index = '$' + parameters['index'];

	var queryObject = flights.aggregate([
		{
			$match: cleanupParameters(parameters)
		},
		{
			$group: {
				_id: index,
				nReturned: { $sum: 1 },
				avgDelay: { $avg: "$DepDelayMinutes" },
				avgDistance: { $avg: "$Distance" },
				avgWeatherDelay: { $avg: "$WeatherDelay" },
				avgLateAircraftDelay: { $avg: "$LateAircraftDelay" },
				avgSecurityDelay: { $avg: "$SecurityDelay" },
				maxDelay: { $max: "$DepDelayMinutes" },
				minDelay: { $min: "$DepDelayMinutes" }
			}
		},
		{
			$sort: {
				_id: 1
			}
		}
	]);

	queryObject.exec(callback);
}

var server = app.listen(app.get('port'), function() {
	app.address = app.get('host') + ':' + server.address().port;
	console.log('Listening at ' + app.address);
});
