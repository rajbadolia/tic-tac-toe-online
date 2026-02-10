let playerName="";
const socket=io();
const boardDiv=document.getElementById('board');
const statusText=document.getElementById('status');
const music=document.getElementById('bgMusic');
const musicBtn=document.getElementById('musicBtn');
const clickSound=document.getElementById('clickSound');
const winSound=document.getElementById('winSound');
const gameStatus=document.getElementById('gameStatus');

let room="";
let mySymbol="";
let myTurn=false;

function drawBoard(board){
boardDiv.innerHTML="";
board.forEach((val,i)=>{
  const cell=document.createElement('div');
  cell.className='cell';
  cell.innerText=val;

 cell.onclick=()=>{
  if(!myTurn||val!=="")return;
  clickSound.currentTime=0;
  clickSound.play();
  socket.emit('move',{room,index:i});
};


  boardDiv.appendChild(cell);
});
}
function createEmptyBoard(){
  const empty=["","","","","","","","",""];
  drawBoard(empty);
}


function joinRoom(){
room=document.getElementById('roomInput').value.trim();
if(!room)return;
socket.emit('joinRoom',room);
}

socket.on('symbol',sym=>{
mySymbol=sym;
myTurn=sym==='X';
statusText.innerText="You are "+sym;

// if player already typed name → auto send
const enteredName=document.getElementById('nameInput').value.trim();
if(enteredName){
  socket.emit('setName',{room,name:enteredName,symbol:mySymbol});
}
});


socket.on('board',board=>{
drawBoard(board);
highlightWin(board);

const x=board.filter(v=>v==='X').length;
const o=board.filter(v=>v==='O').length;
myTurn=mySymbol==='X'?x===o:x>o;
});


socket.on('gameover',data=>{

if(data.symbol === "draw"){
  statusText.innerText = "It's a Draw!";
  return;
}

gameStatus.innerText = data.name + " wins! 🎉";

// play victory sound
winSound.currentTime = 0;
winSound.play();
heartBlast();
});



function resetGame(){
  socket.emit('reset',room);

  // clear hearts
  document.getElementById('celebration').innerHTML='';

  // remove win glow
  document.querySelectorAll('.cell').forEach(c=>{
    c.classList.remove('win');
  });

  gameStatus.innerText="New Round!";
}


function toggleMusic(){
if(music.paused){
music.volume=0.4;
music.play();
musicBtn.innerText="🔊 Music";
}else{
music.pause();
musicBtn.innerText="🔇 Music";
}
}
function highlightWin(board){
const combos=[
[0,1,2],[3,4,5],[6,7,8],
[0,3,6],[1,4,7],[2,5,8],
[0,4,8],[2,4,6]
];

const cells=document.querySelectorAll('.cell');

combos.forEach(combo=>{
const [a,b,c]=combo;
if(board[a] && board[a]===board[b] && board[a]===board[c]){
  cells[a].classList.add('win');
  cells[b].classList.add('win');
  cells[c].classList.add('win');
}
});
}
function setName(){
playerName=document.getElementById('nameInput').value.trim();

if(!room){
  alert("Join a room first!");
  return;
}

if(!mySymbol){
  alert("Wait until the game assigns you X or O");
  return;
}

if(!playerName){
  alert("Enter your name!");
  return;
}

socket.emit('setName',{room,name:playerName,symbol:mySymbol});
}
socket.on('names',names=>{
if(names.X)document.getElementById('playerX').innerText=names.X+" (X)";
if(names.O)document.getElementById('playerO').innerText=names.O+" (O)";
});
socket.on('scores',scores=>{
document.getElementById('scoreX').innerText=scores.X;
document.getElementById('scoreO').innerText=scores.O;
});
function toggleTheme(){
  document.body.classList.toggle("love");

  // save theme
  if(document.body.classList.contains("love")){
    localStorage.setItem("theme","love");
  }else{
    localStorage.setItem("theme","default");
  }
}

function heartBlast(){
  const container = document.getElementById('celebration');

  if(!container) return;

  for(let i=0;i<35;i++){

    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = '💖';

    // random horizontal position
    heart.style.left = Math.random()*100 + 'vw';

    // start from bottom
    heart.style.top = '100vh';

    // random size
    heart.style.fontSize = (18 + Math.random()*30)+'px';

    // random animation speed
    heart.style.animationDuration = (2 + Math.random()*2)+'s';

    container.appendChild(heart);

    setTimeout(()=>{
      heart.remove();
    },4000);
  }
}
window.addEventListener("DOMContentLoaded", ()=>{

  // load saved theme
  const saved=localStorage.getItem("theme");
  if(saved==="love"){
    document.body.classList.add("love");
  }

  // create empty grid immediately
  createEmptyBoard();

});
socket.on('startGame',()=>{
  document.getElementById('setupUI').style.display='none';
  document.getElementById('gameUI').style.display='block';
  gameStatus.innerText="Match Started!";
});
socket.on('playerLeft',()=>{
  alert("Other player left the game");

  document.getElementById('setupUI').style.display='block';
  document.getElementById('gameUI').style.display='none';

  gameStatus.innerText="Waiting for players...";
});


