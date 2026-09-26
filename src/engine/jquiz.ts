/**
 * Authentic Hot Potatoes 6.3 JQuiz core JavaScript runtime
 * Preserves the exact function signatures, state arrays, and Moodle HotPot/TaskChain interception points.
 */
export const RAW_JQUIZ_JS = `//<![CDATA[
<!--

function Client(){
	this.min = false; if (document.getElementById){this.min = true;};
	this.ua = navigator.userAgent;
	this.name = navigator.appName;
	this.ver = navigator.appVersion;  
	this.mac = (this.ver.indexOf('Mac') != -1);
	this.win = (this.ver.indexOf('Windows') != -1);
	this.gecko = (this.ua.indexOf('Gecko') > 1);
	if (this.gecko){
		this.geckoVer = parseInt(this.ua.substring(this.ua.indexOf('Gecko')+6, this.ua.length));
		if (this.geckoVer < 20020000){this.min = false;}
	}
	this.firebird = (this.ua.indexOf('Firebird') > 1);
	this.safari = (this.ua.indexOf('Safari') > 1);
	if (this.safari){ this.gecko = false; }
	this.ie = (this.ua.indexOf('MSIE') > 0);
	if (this.ie){
		this.ieVer = parseFloat(this.ua.substring(this.ua.indexOf('MSIE')+5, this.ua.length));
		if (this.ieVer < 5.5){this.min = false;}
	}
	this.opera = (this.ua.indexOf('Opera') > 0);
	if (this.opera){
		this.operaVer = parseFloat(this.ua.substring(this.ua.indexOf('Opera')+6, this.ua.length));
		if (this.operaVer < 7.04){this.min = false;}
	}
}

var C = new Client();

function NavBtnOver(Btn){ if (Btn.className != 'NavButtonDown'){Btn.className = 'NavButtonUp';} }
function NavBtnOut(Btn){ Btn.className = 'NavButton'; }
function NavBtnDown(Btn){ Btn.className = 'NavButtonDown'; }
function FuncBtnOver(Btn){ if (Btn.className != 'FuncButtonDown'){Btn.className = 'FuncButtonUp';} }
function FuncBtnOut(Btn){ Btn.className = 'FuncButton'; }
function FuncBtnDown(Btn){ Btn.className = 'FuncButtonDown'; }

function FocusAButton(){
	if (document.getElementById('CheckButton1') != null){ document.getElementById('CheckButton1').focus(); }
	else if (document.getElementById('CheckButton2') != null){ document.getElementById('CheckButton2').focus(); }
	else if (document.getElementsByTagName('button')[0]){ document.getElementsByTagName('button')[0].focus(); }
}

var topZ = 1000;

function ShowMessage(Feedback){
	var Output = Feedback + '<br /><br />';
	document.getElementById('FeedbackContent').innerHTML = Output;
	var FDiv = document.getElementById('FeedbackDiv');
	topZ++;
	FDiv.style.zIndex = topZ;
	FDiv.style.top = TopSettingWithScrollOffset(30) + 'px';
	FDiv.style.display = 'block';
	ShowElements(false, 'input');
	ShowElements(false, 'select');
	ShowElements(false, 'object');
	ShowElements(true, 'object', 'FeedbackContent');
	setTimeout("document.getElementById('FeedbackOKButton').focus()", 50);
}

function ShowElements(Show, TagName, ContainerToReverse){
	var TopNode = document.getElementById(ContainerToReverse);
	var Els = TopNode != null ? TopNode.getElementsByTagName(TagName) : document.getElementsByTagName(TagName);
	for (var i=0; i<Els.length; i++){
		if (TagName == "object") {
			Els[i].style.visibility = Show ? 'visible' : 'hidden';
			if (C.mac && C.gecko) {Els[i].style.display = Show ? '' : 'none';}
		} else if (C.ie && C.ieVer < 7) {
			Els[i].style.visibility = Show ? 'visible' : 'hidden';
		}
	}
}

function HideFeedback(){
	document.getElementById('FeedbackDiv').style.display = 'none';
	ShowElements(true, 'input');
	ShowElements(true, 'select');
	ShowElements(true, 'object');
	if (Finished == true){ Finish(); }
}

function GetScrollTop(){
	if (typeof(window.pageYOffset) == 'number'){ return window.pageYOffset; }
	if ((document.body)&&(document.body.scrollTop)){ return document.body.scrollTop; }
	if ((document.documentElement)&&(document.documentElement.scrollTop)){ return document.documentElement.scrollTop; }
	return 0;
}

function GetViewportHeight(){
	if (typeof window.innerHeight != 'undefined'){ return window.innerHeight; }
	if (((typeof document.documentElement != 'undefined')&&(typeof document.documentElement.clientHeight != 'undefined'))&&(document.documentElement.clientHeight != 0)){
		return document.documentElement.clientHeight;
	}
	return document.getElementsByTagName('body')[0].clientHeight;
}

function TopSettingWithScrollOffset(TopPercent){
	var T = Math.floor(GetViewportHeight() * (TopPercent/100));
	return GetScrollTop() + T; 
}

var InTextBox = false;

function Shuffle(InArray){
	var Temp = new Array();
	var Len = InArray.length;
	var j = Len;
	for (var i=0; i<Len; i++){ Temp[i] = InArray[i]; }
	for (var i=0; i<Len; i++){
		var Num = Math.floor(j * Math.random());
		InArray[i] = Temp[Num];
		for (var k=Num; k < (j-1); k++) { Temp[k] = Temp[k+1]; }
		j--;
	}
	return InArray;
}

function WriteToInstructions(Feedback) {
	var el = document.getElementById('InstructionsDiv');
	if (el) el.innerHTML = Feedback;
}

function ClearTextBoxes(){
	var NList = document.getElementsByTagName('input');
	for (var i=0; i<NList.length; i++){
		if ((NList[i].id.indexOf('Guess') > -1)||(NList[i].id.indexOf('Gap') > -1)){ NList[i].value = ''; }
		if (NList[i].id.indexOf('Chk') > -1){ NList[i].checked = ''; }
	}
}

function Array_IndexOf(Input){
	for (var i=0; i<this.length; i++){ if (this[i] == Input){ return i; } }
	return -1;
}

function RemoveBottomNavBarForIE(){
	if ((C.ie)&&(document.getElementById('Reading') != null)){
		if (document.getElementById('BottomNavBar') != null){
			document.getElementById('TheBody').removeChild(document.getElementById('BottomNavBar'));
		}
	}
}

var HPNStartTime = (new Date()).getTime();
var SubmissionTimeout = 30000;
var Detail = '';

function Finish(){
	if (document.store != null){
		var Frm = document.store;
		Frm.starttime.value = HPNStartTime;
		Frm.endtime.value = (new Date()).getTime();
		Frm.mark.value = Score;
		Frm.detail.value = Detail;
		Frm.submit();
	}
}

var CurrQNum = 0;
var CorrectIndicator = ':-)';
var IncorrectIndicator = 'X';
var YourScoreIs = 'Your score is ';
var CompletedSoFar = 'Questions completed so far: ';
var ExerciseCompleted = 'You have completed the exercise.';
var ShowCompletedSoFar = true;
var ContinuousScoring = true;
var CorrectFirstTime = 'Questions answered correctly first time: ';
var ShowCorrectFirstTime = true;
var ShuffleQs = false;
var ShuffleAs = false;
var DefaultRight = 'Correct!';
var DefaultWrong = 'Sorry! Try again.';
var QsToShow = 8;
var Score = 0;
var Finished = false;
var Qs = null;
var QArray = new Array();
var ShowingAllQuestions = false;
var ShowAllQuestionsCaption = 'Show all questions';
var ShowOneByOneCaption = 'Show questions one by one';
var State = new Array();
var Feedback = '';
var TimeOver = false;
var strInstructions = '';
var Locked = false;
var strQuestionFinished = '';

function CompleteEmptyFeedback(){
	for (var QNum=0; QNum<I.length; QNum++){
		if (I[QNum][2] != '3'){
  		for (var ANum = 0; ANum<I[QNum][3].length; ANum++){
  			if (I[QNum][3][ANum][1].length < 1){
  				I[QNum][3][ANum][1] = (I[QNum][3][ANum][2] > 0) ? DefaultRight : DefaultWrong;
  			}
  		}
		}
	}
}

function SetUpQuestions(){
	var AList = new Array(); 
	var QList = new Array();
	Qs = document.getElementById('Questions');
	while (Qs.getElementsByTagName('li').length > 0){
		QList.push(Qs.removeChild(Qs.getElementsByTagName('li')[0]));
	}
	if (QsToShow > QList.length){ QsToShow = QList.length; }
	while (QsToShow < QList.length){
		var DumpItem = Math.floor(QList.length*Math.random());
		for (var j=DumpItem; j<(QList.length-1); j++){ QList[j] = QList[j+1]; }
		QList.length = QList.length-1;
	}
	if (ShuffleQs == true){ QList = Shuffle(QList); }
	for (var i=0; i<QList.length; i++){
		Qs.appendChild(QList[i]);
		QArray[QArray.length] = QList[i];
	}
	QArray[0].style.display = '';
	for (var i=1; i<QArray.length; i++){ QArray[i].style.display = 'none'; }		
	SetQNumReadout();
}

function ChangeQ(ChangeBy){
	if (((CurrQNum + ChangeBy) < 0)||((CurrQNum + ChangeBy) >= QArray.length)){return;}
	QArray[CurrQNum].style.display = 'none';
	CurrQNum += ChangeBy;
	QArray[CurrQNum].style.display = '';
	SetQNumReadout();
}

function SetQNumReadout(){
	var el = document.getElementById('QNumReadout');
	if (el) el.innerHTML = (CurrQNum+1) + ' / ' + QArray.length;
	var next = document.getElementById('NextQButton');
	if (next) next.style.visibility = ((CurrQNum+1) >= QArray.length) ? 'hidden' : 'visible';
	var prev = document.getElementById('PrevQButton');
	if (prev) prev.style.visibility = (CurrQNum <= 0) ? 'hidden' : 'visible';
}

var I=new Array();

function StartUp(){
	RemoveBottomNavBarForIE();
	if (QsToShow < 2){
		var qnav = document.getElementById('QNav');
		if (qnav) qnav.style.display = 'none';
	}
	var instr = document.getElementById('InstructionsDiv');
	if (instr) strInstructions = instr.innerHTML;
	CompleteEmptyFeedback();
	SetUpQuestions();
	ClearTextBoxes();
	CreateStatusArray();
}

function ShowHideQuestions(){
	var btn = document.getElementById('ShowMethodButton');
	if (!btn) return;
	FuncBtnOut(btn);
	btn.style.display = 'none';
	if (ShowingAllQuestions == false){
		for (var i=0; i<QArray.length; i++){ QArray[i].style.display = ''; }
		document.getElementById('Questions').style.listStyleType = 'decimal';
		document.getElementById('OneByOneReadout').style.display = 'none';
		btn.innerHTML = ShowOneByOneCaption;
		ShowingAllQuestions = true;
	} else {
		for (var i=0; i<QArray.length; i++){ if (i != CurrQNum){ QArray[i].style.display = 'none'; } }
		document.getElementById('Questions').style.listStyleType = 'none';
		document.getElementById('OneByOneReadout').style.display = '';
		btn.innerHTML = ShowAllQuestionsCaption;
		ShowingAllQuestions = false;	
	}
	btn.style.display = 'inline';
}

function CreateStatusArray(){
	for (var QNum=0; QNum<I.length; QNum++){
		if (document.getElementById('Q_' + QNum) != null){
			State[QNum] = new Array();
			State[QNum][0] = -1;
			State[QNum][1] = new Array();
			for (var ANum = 0; ANum<I[QNum][3].length; ANum++){
				State[QNum][1][ANum] = 0;
			}
			State[QNum][2] = 0;
			State[QNum][3] = 0;
			State[QNum][4] = 0;
			State[QNum][5] = '';
		} else {
			State[QNum] = null;
		}
	}
}

function CheckMCAnswer(QNum, ANum, Btn){
	if (State[QNum].length < 1){return;}
	Feedback = I[QNum][3][ANum][1];
	if (State[QNum][0] > -1){
		if (strQuestionFinished.length > 0){Feedback += '<br />' + strQuestionFinished;}
		ShowMessage(Feedback);
		return;
	}
	Btn.style.display = 'none';
	State[QNum][2]++;
	State[QNum][3] += I[QNum][3][ANum][3];
	State[QNum][1][ANum] = State[QNum][2];
	if (State[QNum][5].length > 0){State[QNum][5] += ' | ';}
	State[QNum][5] += String.fromCharCode(65+ANum);
	
	if (I[QNum][3][ANum][2] < 1){
		Btn.innerHTML = IncorrectIndicator;
		if (Finished == false){ WriteToInstructions(strInstructions); }
		var RemainingAnswer = FinalAnswer(QNum);
		if (RemainingAnswer > -1){
			State[QNum][2]++;		
			CalculateMCQuestionScore(QNum);
			CalculateOverallScore();
			var QsDone = CheckQuestionsCompleted();
			if ((ContinuousScoring == true)||(Finished == true)){
				Feedback += '<br />' + YourScoreIs + ' ' + Score + '%.' + '<br />' + QsDone;
				WriteToInstructions(YourScoreIs + ' ' + Score + '%.' + '<br />' + QsDone);
			} else {
				WriteToInstructions(QsDone);
			}
		}
	} else {
		Btn.innerHTML = CorrectIndicator;
		CalculateMCQuestionScore(QNum);
		var QsDone = CheckQuestionsCompleted();
		if (ContinuousScoring == true){
			CalculateOverallScore();
			Feedback += '<br />' + YourScoreIs + ' ' + Score + '%.' + '<br />' + QsDone;
			WriteToInstructions(YourScoreIs + ' ' + Score + '%.' + '<br />' + QsDone);
		} else {
			WriteToInstructions(QsDone);
		}
	}
	Btn.style.display = 'inline';
	ShowMessage(Feedback);
	CheckFinished();
}

function CalculateMCQuestionScore(QNum){
	var Tries = State[QNum][2] + State[QNum][4];
	var PercentCorrect = State[QNum][3];
	var TotAns = GetTotalMCAnswers(QNum);
	var HintPenalties = State[QNum][4];
	if (State[QNum][0] < 0){
		if (HintPenalties >= 1){ State[QNum][0] = 0; }
		else {
			if (TotAns == 1){ State[QNum][0] = 1; }
			else { State[QNum][0] = ((TotAns-((Tries*100)/State[QNum][3]))/(TotAns-1)); }
		}
		if ((State[QNum][0] < 0)||(State[QNum][0] == Number.NEGATIVE_INFINITY)){ State[QNum][0] = 0; }
	}
}

function GetTotalMCAnswers(QNum){
	var Result = 0;
	for (var ANum=0; ANum<I[QNum][3].length; ANum++){
		if (I[QNum][3][ANum][4] == 1){ Result++; }
	}
	return Result;
}

function FinalAnswer(QNum){
	var UnchosenAnswers = 0;
	var FinalAnswer = -1;
	for (var ANum=0; ANum<I[QNum][3].length; ANum++){
		if (I[QNum][3][ANum][4] == 1){
			if (State[QNum][1][ANum] < 1){
				UnchosenAnswers++;
				FinalAnswer = ANum;
			}
		}
	}
	return (UnchosenAnswers == 1) ? FinalAnswer : -1;
}

function CalculateOverallScore(){
	var TotalWeighting = 0;
	var TotalScore = 0;
	for (var QNum=0; QNum<State.length; QNum++){
		if (State[QNum] != null){
			if (State[QNum][0] > -1){
				TotalWeighting += I[QNum][0];
				TotalScore += (I[QNum][0] * State[QNum][0]);
			}
		}
	}
	Score = TotalWeighting > 0 ? Math.floor((TotalScore/TotalWeighting)*100) : 100;
}

function CheckQuestionsCompleted(){
	if (ShowCompletedSoFar == false){return '';}
	var QsCompleted = 0;
	for (var QNum=0; QNum<State.length; QNum++){
		if (State[QNum] != null && State[QNum][0] >= 0){ QsCompleted++; }
	}
	return (QsCompleted >= QArray.length) ? ExerciseCompleted : (CompletedSoFar + ' ' + QsCompleted + '/' + QArray.length + '.');
}

function CheckFinished(){
	var FB = '';
	var AllDone = true;
	for (var QNum=0; QNum<State.length; QNum++){
		if (State[QNum] != null && State[QNum][0] < 0){ AllDone = false; }
	}
	if (AllDone == true){
		CalculateOverallScore();
		FB = YourScoreIs + ' ' + Score + '%.';
		if (ShowCorrectFirstTime == true){
			var CFT = 0;
			for (var QNum=0; QNum<State.length; QNum++){
				if (State[QNum] != null && State[QNum][0] >= 1){ CFT++; }
			}
			FB += '<br />' + CorrectFirstTime + ' ' + CFT + '/' + QsToShow;
		}
		FB += '<br />' + ExerciseCompleted;
		WriteToInstructions(FB);
		TimeOver = true;
		Locked = true;
		Finished = true;
		Detail = '<?xml version="1.0"?><hpnetresult><fields>';
		for (var QNum=0; QNum<State.length; QNum++){
			if (State[QNum] != null && State[QNum][5].length > 0){
				Detail += '<field><fieldname>Question #' + (QNum+1) + '</fieldname><fieldtype>question-tracking</fieldtype><fieldlabel>Q ' + (QNum+1) + '</fieldlabel><fieldlabelid>QuestionTrackingField</fieldlabelid><fielddata>' + State[QNum][5] + '</fielddata></field>';
			}
		}
		Detail += '</fields></hpnetresult>';
		setTimeout('Finish()', SubmissionTimeout);
	}
}
//-->
//]]>`;
