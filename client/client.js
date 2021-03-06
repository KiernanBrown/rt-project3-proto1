let canvas;
let chatCanvas;
let ctx;
let chatCtx;

// our websocket connection
let socket;
let hash;
let user = '';
let prevTime;
let chatting = false;
let userChat = '';
let chatMessages = [];
let newMessages = [];
let roomName = '';
let tokens = [];
let players = {};

let inGame = false;
let sleeping = false;
let sleepObj = { x: 0, y: -600 , prevX: 0, prevY: -600, destX: 0, destY: -600, alpha: 1.0 };

let screenMessage = {};

const lerp = (v0, v1, alpha) => ((1 - alpha) * v0) + (alpha * v1);

const wrapText = (chat, text, x, startY, width, lineHeight) => {
  // Code based on this tutorial:
  // https://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
  const words = text.split(' ');
  let line = '';
  let y = startY;

  // Loop through each word in our message
  // Check if the line's width goes over when adding the line
  for (let i = 0; i < words.length; i++) {
    const testLine = `${line}${words[i]} `;
    const lineWidth = chat.measureText(testLine).width;
    if (lineWidth > width && i > 0) {
      chat.fillText(line, x, y);
      line = `${words[i]} `;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  chat.fillText(line, x, y);
  return y;
};

// Draw chat messages to the screen
const drawChat = () => {
  // Draw the message the user is typing
  const messageText = `${user}: ${userChat}`;
  ctx.fillStyle = 'black';
  ctx.font = '18px Helvetica';
  ctx.fillText(messageText, 20, 20);

  // Draw all chat messages on the side
  chatCtx.fillStyle = 'black';
  chatCtx.font = '18px Helvetica';
  let currentY = 20;
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    currentY = wrapText(chatCtx, chatMessages[i], 0, currentY, 200, 20) + 30;
  }
};

// Draw any newly posted messages to the screen
// Newly sent messages stay on screen for 5 seconds
const drawNewMessages = () => {
  chatCtx.fillStyle = 'black';
  chatCtx.font = '18px Helvetica';
  let currentY = 20;
  for (let i = newMessages.length - 1; i >= 0; i--) {
    currentY = wrapText(chatCtx, newMessages[i], 0, currentY, 200, 20) + 30;
  }
};

const drawPlayer = (pHash, x, y) => {
  const p = players[pHash];

  // Draw the player
  // This will be updated to display in the player's color or their icon
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.beginPath();
  ctx.arc(x - 15, y - 15, 30, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Write the player's name under them
  ctx.fillStyle = 'black';
  ctx.font = '18px Helvetica';
  ctx.fillText(p.name, x - (ctx.measureText(p.name).width / 2) - 15, y + 40);
};

const drawPlayers = () => {
  const keys = Object.keys(players);
  const playerNum = keys.length;
  switch (playerNum) {
    case 1: drawPlayer(hash, canvas.width / 2.0, canvas.height / 2.0);
      break;
    case 2: drawPlayer(keys[0], canvas.width / 2.0, (canvas.height / 2.0) - 150);
      drawPlayer(keys[1], canvas.width / 2.0, (canvas.height / 2.0) + 150);
      break;
    case 3: drawPlayer(keys[0], canvas.width / 2.0, (canvas.height / 2.0) - 150);
      drawPlayer(keys[1], (canvas.width / 2.0) + 150, (canvas.height / 2.0) + 150);
      drawPlayer(keys[2], (canvas.width / 2.0) - 150, (canvas.height / 2.0) + 150);
      break;
    case 4: drawPlayer(keys[0], (canvas.width / 2.0) - 150, (canvas.height / 2.0) - 150);
      drawPlayer(keys[1], (canvas.width / 2.0) + 150, (canvas.height / 2.0) - 150);
      drawPlayer(keys[2], (canvas.width / 2.0) + 150, (canvas.height / 2.0) + 150);
      drawPlayer(keys[3], (canvas.width / 2.0) - 150, (canvas.height / 2.0) + 150);
      break;
    case 5: drawPlayer(keys[0], canvas.width / 2.0, (canvas.height / 2.0) - 150);
      drawPlayer(keys[1], (canvas.width / 2.0) + 150, (canvas.height / 2.0));
      drawPlayer(keys[2], (canvas.width / 2.0) + 80, (canvas.height / 2.0) + 150);
      drawPlayer(keys[3], (canvas.width / 2.0) - 80, (canvas.height / 2.0) + 150);
      drawPlayer(keys[4], (canvas.width / 2.0) - 150, (canvas.height / 2.0));
      break;
    case 6: drawPlayer(keys[0], (canvas.width / 2.0) - 80, (canvas.height / 2.0) - 150);
      drawPlayer(keys[1], (canvas.width / 2.0) + 80, (canvas.height / 2.0) - 150);
      drawPlayer(keys[2], (canvas.width / 2.0) + 150, (canvas.height / 2.0));
      drawPlayer(keys[3], (canvas.width / 2.0) + 80, (canvas.height / 2.0) + 150);
      drawPlayer(keys[4], (canvas.width / 2.0) - 80, (canvas.height / 2.0) + 150);
      drawPlayer(keys[5], (canvas.width / 2.0) - 150, (canvas.height / 2.0));
      break;
    case 7: drawPlayer(keys[0], (canvas.width / 2.0), (canvas.height / 2.0) - 190);
      drawPlayer(keys[1], (canvas.width / 2.0) + 130, (canvas.height / 2.0) - 100);
      drawPlayer(keys[2], (canvas.width / 2.0) + 200, (canvas.height / 2.0) + 50);
      drawPlayer(keys[3], (canvas.width / 2.0) + 80, (canvas.height / 2.0) + 190);
      drawPlayer(keys[4], (canvas.width / 2.0) - 80, (canvas.height / 2.0) + 190);
      drawPlayer(keys[5], (canvas.width / 2.0) - 200, (canvas.height / 2.0) + 50);
      drawPlayer(keys[6], (canvas.width / 2.0) - 130, (canvas.height / 2.0) - 100);
      break;
    case 8: drawPlayer(keys[0], (canvas.width / 2.0) - 75, (canvas.height / 2.0) - 200);
      drawPlayer(keys[1], (canvas.width / 2.0) + 75, (canvas.height / 2.0) - 200);
      drawPlayer(keys[2], (canvas.width / 2.0) + 200, (canvas.height / 2.0) - 75);
      drawPlayer(keys[3], (canvas.width / 2.0) + 200, (canvas.height / 2.0) + 75);
      drawPlayer(keys[4], (canvas.width / 2.0) + 75, (canvas.height / 2.0) + 200);
      drawPlayer(keys[5], (canvas.width / 2.0) - 75, (canvas.height / 2.0) + 200);
      drawPlayer(keys[6], (canvas.width / 2.0) - 200, (canvas.height / 2.0) + 75);
      drawPlayer(keys[7], (canvas.width / 2.0) - 200, (canvas.height / 2.0) - 75);
      break;
  }
};

const drawGame = (deltaTime) => {
  // Draw all the players in the game
  drawPlayers();
  
  // Draw add/remove player buttons
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
  if (Object.keys(players).length > 1) {
    ctx.fillRect(0, 550, 80, 50);
    ctx.strokeRect(0, 550, 80, 50);
    ctx.font = '48px Helvetica';
    ctx.fillStyle = 'black';
    ctx.fillText('-', 40 - (ctx.measureText('-').width / 2), 585);
  }

  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
  if (Object.keys(players).length < 8) {
    ctx.fillRect(80, 550, 80, 50);
    ctx.strokeRect(80, 550, 80, 50);
    ctx.font = '48px Helvetica';
    ctx.fillStyle = 'black';
    ctx.fillText('+', 120 - (ctx.measureText('+').width / 2), 590);
  }

  ctx.fillStyle = 'black';
  ctx.font = '18px Helvetica';
  ctx.fillText('Change Players:', 80 - (ctx.measureText('Change Players:').width / 2), 540);

  // Draw our sleepObj
  if (sleepObj.alpha < 1) sleepObj.alpha += deltaTime / 10;
  sleepObj.y = lerp(sleepObj.prevY, sleepObj.destY, sleepObj.alpha);
  ctx.fillStyle = 'black';
  ctx.fillRect(sleepObj.x, sleepObj.y, 600, 600);

  if (chatting) drawChat();
  else if (newMessages.length > 0) drawNewMessages();

  // Sleep/Wake Up buttons
  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.fillRect(520, 550, 80, 50);
  ctx.strokeRect(520, 550, 80, 50);
  ctx.font = '24px Helvetica';
  if (sleeping) {
    ctx.fillStyle = 'white';
    ctx.fillText('Wake', 560 - (ctx.measureText('Wake').width / 2), 585);
  } else {
    ctx.fillStyle = 'black';
    ctx.fillText('Sleep', 560 - (ctx.measureText('Wake').width / 2), 585);
  }
};

const drawMenu = () => {
  // Draw objects for our top 3 players

  // Draw our play button
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 5;
  ctx.fillStyle = 'green';
  ctx.fillRect(200, 200, 200, 140);
  ctx.strokeRect(200, 200, 200, 140);
  ctx.font = '32px Helvetica';
  ctx.fillStyle = 'black';
  ctx.fillText('Play', 300 - (ctx.measureText('Play').width / 2), 270);
};

const redraw = (time) => {  
  const deltaTime = (time - prevTime) / 100;
  prevTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  chatCtx.clearRect(0, 0, chatCanvas.width, chatCanvas.height);

  if (inGame) {
    drawGame(deltaTime);
  } else {
    drawMenu();
  }

  if (screenMessage) {
    if (screenMessage.alpha > 0) {
      if (screenMessage.disappear) {
        // Reduce the alpha if this message disappears
        screenMessage.alpha -= 0.005;
      }

      // Draw the message to the screen
      // https://www.w3schools.com/tags/canvas_measuretext.asp
      ctx.font = '32px Helvetica';
      ctx.fillStyle = `rgba(0, 0, 0, ${screenMessage.alpha})`;
      const textX = 300 - (ctx.measureText(screenMessage.message).width / 2);
      ctx.fillText(screenMessage.message, textX, 270);

      if (screenMessage.submessage) {
        ctx.font = '24px Helvetica';
        ctx.fillStyle = `rgba(0, 0, 0, ${screenMessage.alpha})`;
        const subtextX = 300 - (ctx.measureText(screenMessage.submessage).width / 2);
        ctx.fillText(screenMessage.submessage, subtextX, 320);
      }
    }
  }

  requestAnimationFrame(redraw);
};

const setUser = (data) => {
  roomName = data.roomName;
  const h = data.hash;
  hash = h;
  players[hash] = { name: data.name };
};

const addUser = (data) => {
  players[data.hash] = { name: data.name };
};

const removeUser = (rHash) => {
  if (players[rHash]) {
    delete players[rHash];
  }
};

const keyPressHandler = (e) => {
  if (chatting) {
    e.preventDefault();
    const keyPressed = e.which;

    userChat = `${userChat}${String.fromCharCode(keyPressed)}`;
  }
};

const keyDownHandler = (e) => {
  if (inGame) {
    const keyPressed = e.which;
    if (chatting) {
      if ((keyPressed === 8 || keyPressed === 46) && userChat.length > 0) {
        e.preventDefault();
        userChat = userChat.substr(0, userChat.length - 1);
        return;
      }
    }

    if (keyPressed === 13) {
      e.preventDefault();
      // Enter starts or ends chat
      if (chatting) {
        // Send the message to the server
        if (userChat !== '') {
          socket.emit('message', { sender: user, message: userChat, roomName });
        }
        userChat = '';
        chatting = false;
      } else {
        chatting = true;
      }
    }
  }
};

const mouseMoveHandler = (e) => {
  /* square.mouseX = e.pageX - canvas.offsetLeft;
  square.mouseY = e.pageY - canvas.offsetTop; */
};

const addScreenMessage = (data) => {
  screenMessage = {
    message: data.message,
    submessage: data.submessage,
    disappear: data.disappear,
    alpha: 1.0,
  };
};

// Add a chat message to the client
const addChatMessage = (data) => {
  chatMessages.push(data);
  newMessages.push(data);
  setTimeout(() => { newMessages.splice(newMessages.indexOf(data), 1); }, 5000);
};

const connect = () => {
  
  socket = io.connect();
  
  socket.on('connect', () => {
    user = document.querySelector("#username").value;
                
    if(!user) {
      user = 'unknown';
    }
                
    socket.emit('join', { name: user });
  });

  socket.on('joined', setUser);

  socket.on('left', removeUser);

  socket.on('screenMessage', addScreenMessage);

  socket.on('addPlayer', addUser);
  
  socket.on('addMessage', addChatMessage);
};

const mouseClickHandler = (e) => {
  const mouseX = e.pageX - canvas.offsetLeft;
  const mouseY = e.pageY - canvas.offsetTop;

  if (!inGame) {
    if (mouseX >= 200 && mouseX <= 400) {
      if (mouseY >= 200 && mouseY <= 340) {
        inGame = true;
        connect();
      }
    }
  } else {
    if (mouseX >= 0 && mouseX < 80) {
      if (mouseY >= 550 && mouseY <= 600) {
        socket.emit('removePlayer', { roomName });
      }
    }
    if (mouseX >= 80 && mouseX < 160) {
      if (mouseY >= 550 && mouseY <= 600) {
        if (Object.keys(players).length < 8) socket.emit('createPlayer', { roomName });
      }
    }
    if (mouseX >= 520 && mouseX < 600) {
      if (mouseY >= 550 && mouseY <= 600) {
        if (!sleeping) {
          sleeping = true;
          sleepObj.alpha = 0;
          sleepObj.destY = 0;
          sleepObj.prevY = -600;
        } else {
          sleeping = false;
          sleepObj.alpha = 0;
          sleepObj.destY = -600;
          sleepObj.prevY = 0;
        }
      }
    }
  }
};

const init = () => {
  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');
  chatCanvas = document.querySelector('#chatCanvas');
  chatCtx = chatCanvas.getContext('2d');

  document.body.addEventListener('keydown', keyDownHandler);
  document.body.addEventListener('keypress', keyPressHandler);
  canvas.addEventListener('mousemove', mouseMoveHandler);
  canvas.addEventListener('click', mouseClickHandler);
  chatCanvas.addEventListener('mousemove', mouseMoveHandler);
  chatCanvas.addEventListener('click', mouseClickHandler);
  
  requestAnimationFrame(redraw);
};

window.onload = init;
