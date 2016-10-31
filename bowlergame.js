//'use strict'
var fetch = require('node-fetch');
var request = require("request")

const bowlergame = {
	
};
bowlergame.url = "http://37.139.2.74/api/points";
bowlergame.currentToken = "";
bowlergame.savedPoints = [];
bowlergame.currentPoints = [];
bowlergame.currentSums = [];
bowlergame.currentScores = [];
bowlergame.setSums = function setSums (currentSum) {
	var currentSums = bowlergame.currentSums;
	bowlergame.currentScores.push(currentSum);
	if(currentSums.length === 0){
		currentSums.push(currentSum);
		return;
	}
	currentSums.push(currentSums[ currentSums.length - 1 ] + currentSum);
}
bowlergame.isStrike = function isStrike (frame) { 
	if(!Boolean(frame)){return false;}
	return (frame[0] === 10); //frame[0] is 10 and frame[1] is other than 0 should not happen
							}

bowlergame.isSpare = function isSpare (frame) {
	if(!Boolean(frame)){return false;}
    return (frame[0] !== 10 && ( ( frame[0] + frame[1] ) === 10));
  }

bowlergame.readNextFrames = function readNextFrames (arr,num) {
	  //thus in order to do this we must pop element of array when the frame it represents is calculated finished.
	  return arr.slice(0,num);  
}

bowlergame.sumFrames = function sumFrames (arr){
	  return arr.reduce(scoreFrame,0);
	  
  }
bowlergame.scoreFrame = function scoreFrame (frame) {
	if(!Boolean(frame)){
		return 0;
	}
	if(typeof frame[1] !== 'undefined'){
    	return frame[0] + frame[1];
	}
	//A player who bowls a spare in the tenth (final) frame is awarded one extra ball to allow for the bonus points. So as I understand this from the wikipedia description of rules then your extra ball is used to calculate the bonus points for the spare, but the value of that ball is not used to score a frame, because there isn't a frame. Experiencing the api shows that instead it the second ball of s tenth frame strike as the extra ball, thus you can have [10,4] which is not how I would do it. Thus I have left this in just because of paranoia. TODO remove after confirmation will not occur. Perhaps it should be just return frame[0] but actually have not seen an occurence yet of either scenario. 
	return 0;
}
bowlergame.firstBall = function firstBall (frame){
	if(!Boolean(frame)){
		return 0;
	}
	return frame[0];
}
bowlergame.reportScores = function reportScores (err, res, body){
	console.log("request complete")
	console.log(err);
	console.log(res.statusCode + " " + res.statusMessage);
	console.log(body);
	console.log("saved Points " + bowlergame.savedPoints);
	console.log("Scores added up " + bowlergame.currentScores);
	console.log("Scores summed " + bowlergame.currentSums);
}
bowlergame.runSingleGame = function runSingleGame(json,cb){
	cb = (typeof cb !== "undefined")? cb : bowlergame.reportScores;
	bowlergame.currentToken = json.token;
	bowlergame.currentPoints = json.points;
	bowlergame.savedPoints = bowlergame.currentPoints.slice();
	
	//not async, no need to callback or otherwise handle, except for testing scenarios. 
	bowlergame.sumGame();
	cb();
	
}
bowlergame.run = function run (times) {
	var runCallback = function runCallback(){
		bowlergame.sendScores( function(err, res, body){
			bowlergame.reportScores(err, res, body);
			//closure allows us to run multiple times and get new games etc. 
			bowlergame.run(times);				
		}); 
	}
	console.log("Number of games left to run: " + times);
	if(times < 1){
		return;
	}
	times = times - 1;
	bowlergame.savedPoints = [];
	bowlergame.currentPoints = [];
	bowlergame.currentSums = [];
	bowlergame.currentScores = [];
	bowlergame.getGame(runCallback);
} 
bowlergame.getGame = function getGame (cb){
	cb = (typeof cb !== "undefined")? cb : function getGameCB() {
		bowlergame.sendScores(bowlergame.reportScores); 
	}	
	
	fetch(bowlergame.url)
    .then(function(res) {
        return res.json();
    }).then(function(json) {
		console.log("going to run single game");
		bowlergame.runSingleGame(json,cb);        
    });
}
bowlergame.sumStrikes = function sumStrikes (currentFrame) {
	var currentSum = 0,
		nextFrame;
	if(bowlergame.isStrike(currentFrame)){
			//the greatest points possible is 30 points, if you have a strike on the first, the second and the third. 
			nextFrame = bowlergame.currentPoints[0];
			//NEXTFRAME does not show up if you have a strike on the tenth frame, then the second ball of the tenth frame is evidently the extra ball you get. 
			currentSum = currentSum + bowlergame.scoreFrame(nextFrame);
			if(bowlergame.isStrike(nextFrame)){
					nextFrame = bowlergame.currentPoints[1];
					//if you have two subsequent strikes then you add the value of the firstball of the next frame to the score which if that is a strike you end up with a score of 30.
					currentSum = currentSum + bowlergame.firstBall(nextFrame);
				}
	 }
			
	    return currentSum;
}
bowlergame.sumGame = function sumGame (){
	var currentFrame,
		currentSum = 0,
		nextFrame,
		framescount = 0;
	while(bowlergame.currentPoints.length > 0){
		framescount = framescount + 1;
		currentFrame = bowlergame.currentPoints.shift();
		if(framescount > 10){
			//when the framescount is greater than 10 a full game has been played and the last frame represents the extra balls received because of a strike. 
			break;
		}
		currentSum = bowlergame.scoreFrame(currentFrame);
		currentSum = currentSum + bowlergame.sumStrikes(currentFrame);
		if(bowlergame.isSpare(currentFrame)){
			nextFrame = bowlergame.currentPoints[0];
			currentSum = currentSum + bowlergame.firstBall(nextFrame);
		}
		bowlergame.setSums(currentSum);
		
	}
	//we have scored all frames available.
}

bowlergame.sendScores = function sendScores (cb){
	request({
		url: bowlergame.url,
		method: "POST",
		json: {
				token: bowlergame.currentToken,
				points: bowlergame.currentSums
			}
	},function(err, res, body){
		cb(err,res,body);
	});
}

module.exports = bowlergame;