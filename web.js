var express = require("express");
var mongo = require('mongodb');

var path = require('path');

var mongoUri = process.env.MONGOHQ_URL ||
  process.env.MONGOHQ_URL ||
  'mongodb://crimes:theendhasnoend@paulo.mongohq.com:10029/app17982596';

var app = express();
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.engine('html', require('ejs').renderFile);

  app.use(express.static(path.join(__dirname, 'js')));
  app.use(express.static(path.join(__dirname, 'img')));
  app.use(express.favicon(__dirname + '/images/favicon.ico'));

  app.use(express.logger());

  //app.use(express.bodyParser());
  //app.use(express.methodOverride());
});

var crimeTypes = {'THEFT FROM VEHICLE':0, 'THEFT OF VEHICLE': 1, 'BREAK AND ENTER':2, 'ASSAULT': 3, 'ROBBERY': 4};
app.get('/', function(req, res) {
	res.header("Content-Type", "text/html; charset=utf-8");

	var serverData = {};
	serverData.year = null;
	mongo.Db.connect(mongoUri, function (err, db) {
	  db.collection('crimes', function(er, collection) {
	  	var crimes = [];
		
		collection.find().sort({"date":1}, function(err, cursor) {
			cursor.each(function(err, crime) {
				//when our cusor is exhausted then render template
				if(crime === null) {
					serverData.crimes = crimes;
					serverData.years = [2013];
					res.render('index.html', { data: serverData });
					return;
				}
				
				var crimeDate = new Date(crime.date);
				if(!serverData.year)
					serverData.year = crimeDate.getFullYear();

				crimes.push([crime.latitude, crime.longitude, crimeTypes[crime.type], crimeDate.getMonth(), crimeDate.getDate()]);
				//COMPRESSED: crimes.push(compressCoord(crime.latitude) + compressCoord(crime.longitude) + crimeTypes[crime.type] + compress4Digits((crimeDate.getMonth() * 100) + crimeDate.getDate()));
			});
		});

	  });
	});
});

function compressCoord(digits) {
	digits *= 1000;

	if(digits < 0)
		digits = Math.abs(digits + 60000);
	else
		digits -= 40000;

	return compress4Digits(digits);
}

function compress4Digits(digits) {
	return '' + String.fromCharCode(Math.floor(digits/100) + 65) + String.fromCharCode((digits % 100) + 65);
}


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});