/**
 * Authentic Hot Potatoes 6.3 JCloze core JavaScript runtime
 * Preserves the exact function signatures, state arrays, and Moodle HotPot/TaskChain interception points.
 */
export const RAW_JCLOZE_JS = `//<![CDATA[
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
	if (this.safari){this.gecko = false;}
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

function WriteToInstructions(Feedback) {
	var el = document.getElementById('InstructionsDiv');
	if (el) el.innerHTML = Feedback;
}

function TrimString(InString){
    var x = 0;
    if (InString.length != 0) {
        while ((InString.charAt(InString.length - 1) == '\\u0020') || (InString.charAt(InString.length - 1) == '\\u000A') || (InString.charAt(InString.length - 1) == '\\u000D')){
            InString = InString.substring(0, InString.length - 1);
        }
        while ((InString.charAt(0) == '\\u0020') || (InString.charAt(0) == '\\u000A') || (InString.charAt(0) == '\\u000D')){
            InString = InString.substring(1, InString.length);
        }
        while (InString.indexOf('  ') != -1) {
            x = InString.indexOf('  ');
            InString = InString.substring(0, x) + InString.substring(x+1, InString.length);
        }
        return InString;
    }
    return '';
}

function FindLongest(InArray){
	if (InArray.length < 1){return -1;}
	var Longest = 0;
	for (var i=1; i<InArray.length; i++){
		if (InArray[i].length > InArray[Longest].length){ Longest = i; }
	}
	return Longest;
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

function ItemState(){
	this.ClueGiven = false;
	this.HintsAndChecks = 0;
	this.MatchedAnswerLength = 0;
	this.ItemScore = 0;
	this.AnsweredCorrectly = false;
	this.Guesses = new Array();
	return this;
}

var Feedback = '';
var Correct = 'Correct! Well done.';
var Incorrect = 'Some of your answers are incorrect. Incorrect answers have been left in place for you to change.'; 
var GiveHint = 'The next correct letter has been added to the answer.';
var CaseSensitive = false;
var YourScoreIs = 'Your score is ';
var Finished = false;
var Locked = false;
var Score = 0;
var CurrentWord = 0;
var Guesses = '';
var TimeOver = false;

var I = new Array();
var State = new Array();

function StartUp(){
	RemoveBottomNavBarForIE();
	if (document.getElementById('CharacterKeypad') != null){
		document.getElementById('CharacterKeypad').style.display = 'block';
	}
	State.length = 0;
	for (var i=0; i<I.length; i++){
		State[i] = new ItemState();
	}
	ClearTextBoxes();
}

function ShowClue(ItemNum){
	if (Locked == true){return;}
	State[ItemNum].ClueGiven = true;
	ShowMessage(I[ItemNum][2]);
}

function SaveCurrentAnswers(){
	var Ans = '';
	for (var i=0; i<I.length; i++){
		Ans = GetGapValue(i);
		if ((Ans.length > 0)&&(Ans != State[i].Guesses[State[i].Guesses.length-1])){
			State[i].Guesses[State[i].Guesses.length] = Ans;
		}
	}
}

function CompileGuesses(){
	var F = document.getElementById('store');
	if (F != null){
		var Temp = '<?xml version="1.0"?><hpnetresult><fields>';
		var GapLabel = '';
		for (var i=0; i<State.length; i++){
			GapLabel = 'Gap ' + (i+1).toString();
			Temp += '<field><fieldname>' + GapLabel + '</fieldname>';
			Temp += '<fieldtype>student-responses</fieldtype><fieldlabel>' + GapLabel + '</fieldlabel>';
			Temp += '<fieldlabelid>JClozeStudentResponses</fieldlabelid><fielddata>';
			for (var j=0; j<State[i].Guesses.length; j++){
				if (j>0){Temp += '| ';}
				Temp += State[i].Guesses[j] + ' ';	
			}	
  		Temp += '</fielddata></field>';
		}
		Temp += '</fields></hpnetresult>';
		Detail = Temp;
	}
}

function CheckAnswers(){
	if (Locked == true){return;}
	SaveCurrentAnswers();
	var AllCorrect = true;

	for (var i = 0; i<I.length; i++){
		if (State[i].AnsweredCorrectly == false){
			if (CheckAnswer(i, true) > -1){
				var TotalChars = GetGapValue(i).length;
				State[i].ItemScore = (TotalChars-State[i].HintsAndChecks)/TotalChars;
				if (State[i].ClueGiven == true){State[i].ItemScore /= 2;}
				if (State[i].ItemScore <0 ){State[i].ItemScore = 0;}
				State[i].AnsweredCorrectly = true;
				SetCorrectAnswer(i, GetGapValue(i));
			}
			else{
				State[i].HintsAndChecks++;
				AllCorrect = false;
			}
		}
	}

	var TotalScore = 0;
	for (var i=0; i<State.length; i++){
		TotalScore += State[i].ItemScore;
	}
	TotalScore = Math.floor((TotalScore * 100)/I.length);

	var Output = '';
	if (AllCorrect == true){
		Output = Correct + '<br />';
	}
	Output += YourScoreIs + ' ' + TotalScore + '%.<br />';
	if (AllCorrect == false){
		Output += Incorrect;
	}
	ShowMessage(Output);
	setTimeout('WriteToInstructions(Output)', 50);
	
	Score = TotalScore;
	CompileGuesses();
	
	if ((AllCorrect == true)||(Finished == true)){
		TimeOver = true;
		Locked = true;
		Finished = true;
		setTimeout('Finish()', SubmissionTimeout);
	}
}

function TrackFocus(BoxNumber){
	CurrentWord = BoxNumber;
	InTextBox = true;
}

function LeaveGap(){
	InTextBox = false;
}

function CheckBeginning(Guess, Answer){
	var OutString = '';
	var i = 0;
	var UpperGuess = CaseSensitive ? Guess : Guess.toUpperCase();
	var UpperAnswer = CaseSensitive ? Answer : Answer.toUpperCase();

	while (UpperGuess.charAt(i) == UpperAnswer.charAt(i)) {
		OutString += Guess.charAt(i);
		i++;
	}
	OutString += Answer.charAt(i);
	return OutString;
}

function GetGapValue(GNum){
	var RetVal = '';
	if ((GNum<0)||(GNum>=I.length)){return RetVal;}
	if (document.getElementById('Gap' + GNum) != null){
		RetVal = document.getElementById('Gap' + GNum).value;
		RetVal = TrimString(RetVal);
	}
	else{
		RetVal = State[GNum].Guesses[State[GNum].Guesses.length-1] || '';
	}
	return RetVal;
}

function SetGapValue(GNum, Val){
	if ((GNum<0)||(GNum>=I.length)){return;}
	if (document.getElementById('Gap' + GNum) != null){
		document.getElementById('Gap' + GNum).value = Val;
		document.getElementById('Gap' + GNum).focus();
	}
}

function SetCorrectAnswer(GNum, Val){
	if ((GNum<0)||(GNum>=I.length)){return;}
	if (document.getElementById('GapSpan' + GNum) != null){
		document.getElementById('GapSpan' + GNum).innerHTML = Val;
	}
}

function FindCurrent() {
	var x = 0;
	if (State[CurrentWord].AnsweredCorrectly == false){
		if (CheckAnswer(CurrentWord, false) < 0){
			return CurrentWord;
		}
	}
	x = CurrentWord + 1;
	while (x<I.length){
		if (State[x].AnsweredCorrectly == false){
			if (CheckAnswer(x, false) < 0){ return x; }
		}
		x++;	
	}
	x = 0;
	while (x<CurrentWord){
		if (State[x].AnsweredCorrectly == false){
			if (CheckAnswer(x, false) < 0){ return x; }
		}
		x++;	
	}
	return -1;
}

function CheckAnswer(GapNum, MarkAnswer){
	var Guess = GetGapValue(GapNum);
	var UpperGuess = CaseSensitive ? Guess : Guess.toUpperCase();
	var Match = -1;
	for (var i = 0; i<I[GapNum][1].length; i++){
		var UpperAnswer = CaseSensitive ? I[GapNum][1][i][0] : I[GapNum][1][i][0].toUpperCase();
		if (TrimString(UpperGuess) == UpperAnswer){
			Match = i;
			if (MarkAnswer == true){
				State[GapNum].AnsweredCorrectly = true;
			}
		}
	}
	return Match;
}

function GetHint(GapNum){
	var Guess = GetGapValue(GapNum);
	if (CheckAnswer(GapNum, false) > -1){return ''}
	var RightBits = new Array();
	for (var i=0; i<I[GapNum][1].length; i++){
		RightBits[i] = CheckBeginning(Guess, I[GapNum][1][i][0]);
	}
	var RightOne = FindLongest(RightBits);
	var Result = I[GapNum][1][RightOne][0].substring(0,RightBits[RightOne].length);
	if (Result.charAt(Result.length-1) == ' '){
		Result = I[GapNum][1][RightOne][0].substring(0,RightBits[RightOne].length+1);
	}
	return Result;
}

function ShowHint(){
	if (document.getElementById('FeedbackDiv').style.display == 'block'){return;}
	if (Locked == true){return;}
	var CurrGap = FindCurrent();
	if (CurrGap < 0){return;}
	var HintString = GetHint(CurrGap);
	if (HintString.length > 0){
		SetGapValue(CurrGap, HintString);
		State[CurrGap].HintsAndChecks += 1;
	}
	ShowMessage(GiveHint);
}

function TypeChars(Chars){
	var CurrGap = FindCurrent();
	if (CurrGap < 0){return;}
	if (document.getElementById('Gap' + CurrGap) != null){
		SetGapValue(CurrGap, document.getElementById('Gap' + CurrGap).value + Chars);
	}
}
//-->
//]]>`;
