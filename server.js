const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let rooms = {};

// create empty board
function createBoard(){
  return ["","","","","","","","",""];
}

// check winner
function checkWinner(b){
  const w = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for(const [a,b1,c] of w){
    if(b[a] && b[a]===b[b1] && b[a]===b[c]) return b[a];
  }

  if(b.every(x=>x!=="")) return "draw";
  return null;
}

// ===== SOCKET CONNECTION =====
io.on('connection', socket=>{

  // JOIN ROOM
  socket.on('joinRoom', room=>{
    socket.join(room);

    if(!rooms[room]){
      rooms[room]={
        players:[],
        board:createBoard(),
        turn:'X',
        names:{},
        scores:{X:0,O:0}
      };
    }

    const game=rooms[room];

    if(game.players.length>=2){
      socket.emit('full');
      return;
    }

    const symbol=game.players.length===0?'X':'O';
    game.players.push({id:socket.id,symbol});

    socket.emit('symbol',symbol);
    io.to(room).emit('board',game.board);

    // start when 2 players join
    if(game.players.length===2){
      io.to(room).emit('startGame');
    }
  });

  // SET PLAYER NAME
  socket.on('setName',({room,name,symbol})=>{
    const game=rooms[room];
    if(!game) return;

    game.names[symbol]=name;
    io.to(room).emit('names',game.names);
  });

  // PLAYER MOVE
  socket.on('move',({room,index})=>{
    const game=rooms[room];
    if(!game) return;

    const player=game.players.find(p=>p.id===socket.id);
    if(!player || player.symbol!==game.turn) return;
    if(game.board[index]!=="") return;

    game.board[index]=player.symbol;
    game.turn=game.turn==='X'?'O':'X';

    const win=checkWinner(game.board);

    io.to(room).emit('board',game.board);

    if(win){

      let winnerName="Draw";

      if(win!=="draw"){
        game.scores[win]++;
        winnerName = game.names[win] ? game.names[win] : win;
      }

      io.to(room).emit('scores',game.scores);

      io.to(room).emit('gameover',{
        symbol:win,
        name:winnerName
      });

      game.board=createBoard();
      game.turn='X';
    }
  });

  // RESET GAME
  socket.on('reset',room=>{
    if(!rooms[room]) return;
    rooms[room].board=createBoard();
    io.to(room).emit('board',rooms[room].board);
  });

  // PLAYER DISCONNECT  ✅ (NOW CORRECT PLACE)
  socket.on('disconnect',()=>{

    for(const room in rooms){
      const game=rooms[room];

      // remove leaving player
      game.players=game.players.filter(p=>p.id!==socket.id);

      // delete empty room
      if(game.players.length===0){
        delete rooms[room];
        continue;
      }

      // notify remaining player
      if(game.players.length===1){
        io.to(room).emit('playerLeft');
      }
    }

    console.log("Player disconnected");
  });

});

// START SERVER
http.listen(3000,()=>console.log("Server running on port 3000"));
