var bowlergame = require('./bowlergame');
var expect = require('expect');
//add more expected results, points indicates the starting points that would be sent by the service, scores what is expected to come out.
var expectedScores = [ 
	{ "points": [[9,0],[1,9],[2,8],[9,1],[7,2],[4,5],[5,1],[6,4]], "scores":  [ 9, 21, 40, 57, 66, 75, 81, 91 ]},
	{ "points": [[6,2],[2,1],[8,2],[2,0],[4,5],[3,5],[9,1]], "scores":  [ 8, 11, 23, 25, 34, 42, 52 ]},
	{ "points": [ [ 6, 3 ], [ 4, 3 ], [ 7, 2 ], [ 6, 4 ] ], "scores":   [ 9, 16, 25, 35 ] },
	{ "points": [[10,0],[10,0],[10,0],[10,0],[10,0],[10,0],[10,0],[10,0],[10,0],[10,0],[10,10] ], "scores":   [ 30, 60, 90, 120, 150, 180, 210, 240, 270, 300 ] }
					 ];
var x = 0;

var expectation = function expectation (expected){
	var testcb = function testcb (){
		console.log("================TEST======================");
		console.log("Our Points were " + bowlergame.savedPoints);
		console.log("Scores added up " + bowlergame.currentScores);
		console.log("Scores summed " + bowlergame.currentSums);
		console.log("expected scores sum " + expected.scores);
		expect(bowlergame.currentSums).toEqual(expected.scores);
		console.log("================ENDED TEST======================");
	}
	bowlergame.savedPoints = [];
	bowlergame.currentPoints = [];
	bowlergame.currentSums = [];
	bowlergame.currentScores = [];
	
	bowlergame.runSingleGame(expected,testcb); 
}
for(;x < expectedScores.length; x++){
	expectation(expectedScores[x]);
}