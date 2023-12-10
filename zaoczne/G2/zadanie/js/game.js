
class GameObject{
    constructor(game,img, x, y, vx, vy, scale = 1){
        this.game=game;
        this.img = img;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.scale= scale;
        this.memento = {};
    }

    boundingBox(){
        return {'x1':this.x, 'y1':this.y, 'x2':this.x+this.img.width*this.scale, 'y2':this.y+this.img.height*this.scale}
    }

    update(){
        this.memento = {
            'x':this.x,
            'y':this.y, 
            'xv':this.vx, 
            'vy':this.vy 
        }
        this.x+=this.vx;
        this.y+=this.vy;
    }

    getBackToLastPostion(){
        this.x=this.memento.x;
        this.y=this.memento.y;
    }

    reactOnEvent(event){}
}

class Ship extends GameObject{
    constructor(game,img, x,y,vx,vy,scale){
        super(game,img, x,y,vx,vy,scale);
        this.points = 0 ;
        this.damge = -3;
    }

    reactOnEvent(event){
        //console.log(event);
        switch (event.constructor.name){
            case 'CollisionWithWall' : this.wallColision(event.target); return;
            case 'CollisionWithAsteroid': this.hitByAsteroid();
        }
    }

    wallColision(w){
        if (w.horizontal){
            this.vy=-this.vy;
        }
        else {
            this.vx=-this.vx;
        }
    }

    hitByAsteroid(){
        this.damge+=1;
        console.log("Ship is damaged, shields power "+Math.abs(this.damge));
        if (this.damge>=0){
            this.game.TheEnd();
        }
    }

    destroy(){
        this.game.endGame();
    }

    AsteroidIsDestroyed(){
        console.log("Asteroid is destroyed");
        this.points+=1;
    }
}

class Asteroid extends GameObject{
    constructor(game,img, x,y,vx,vy,scale){
        super(game,img, x,y,vx,vy,scale);
    }

    reactOnEvent(event){
        switch (event.constructor.name){
            case 'CollisionWithWall' : this.wallColision(event.target); return;
            case 'CollisionWithBullet' : this.destroy(); return;
            case 'CollisionWithAsteroid': this.asteroidColision(event.target); return;
        }
        //console.log(event);
    }

    wallColision(w){
        if (w.horizontal){
            this.vy=-this.vy;
        }
        else {
            this.vx=-this.vx;
        }
    }

    asteroidColision(target){
        this.destroy();
        if (target.constructor.name == "Ship"){
            this.game.createNewAsteroid(null);
        }
        else{
            this.game.createNewAsteroid(this);
        }

    }
    destroy(){
        this.game.forget(this);
    }

}

class Wall extends GameObject{
    constructor(game,x1,y1,x2, y2,horizontal){
        super(game,null, x1,y1,0,0,1);
        this.horizontal = horizontal;
        this.x2=x2;
        this.y2=y2;
    }

    boundingBox(){
        return {'x1':this.x, 'y1':this.y, 'x2':this.x2, 'y2':this.y2}
    }

    destroy(){
        this.game.forget(this);
    }
}

class Bullet extends GameObject{
    constructor(game,img, x,y,vx,vy){
        super(game,img, x,y,vx,vy,1);
    }

    reactOnEvent(event){

    }

    destroy(){
        this.game.forget(this);
    }
}

class Renderer {
    constructor(id_element){
        let el = document.getElementById(id_element)
        this.ctx = el.getContext("2d"); 
    }

    render(gameObject){
        if (gameObject.img){
            this.ctx.drawImage(gameObject.img,
            gameObject.x, 
            gameObject.y,
            gameObject.img.width*gameObject.scale,
            gameObject.img.height*gameObject.scale);
        }
    }

    clear(){
        this.ctx.clearRect(0,0,800,800);
    }
}

class Event{
    constructor (o){
        this.target=o;
    }
}
class DestroyEvent extends Event{
    constructor (o){
        super(o);
    } 
}
class ShootEvent extends Event{
    constructor (o){
        super(o);
    }
}
class RotateEvent extends Event{
    constructor (o){
        super(o);
    }
}
class CollisionWithWall extends Event{
    constructor (o){
        super(o);
    }
}
class CollisionWithAsteroid extends Event{
    constructor (o){
        super(o);
    }
}
class CollisionWithBullet extends Event{
    constructor (o){
        super(o);
    }
}

class Game{
    constructor(){
        this.gObjects = [];
        this.player = {};
        this.timeDelay = 30;
        this.renderer = {};
        this.detector = {};
        this.continue = true;
    }

    gameLoop(){
        //Update elements
        for (let go in this.gObjects){
            this.gObjects[go].update();
        }
        this.player.update();
        //Colisions
        for (let i=0; i<this.gObjects.length; i++){
            this.detector.checkColisions(this.player, this.gObjects[i]);
            for (let j=i+1; j<this.gObjects.length; j++){
                this.detector.checkColisions(this.gObjects[i],this.gObjects[j]);
            }
        }

        this.renderer.clear();
        //Render
        for (let go in this.gObjects){
            this.renderer.render(this.gObjects[go]);
        }
        this.renderer.render(this.player);
        if (this.continue)
            setTimeout(this.gameLoop.bind(this),this.timeDelay);
    }

    sendEventToGameObject(go, event){
        go.reactOnEvent(event);
    }

    createNewAsteroid(oldAsteroid){
        console.log("Create new Asteroid");
        let asteroid ={}
        if (oldAsteroid !=null && oldAsteroid.scale >.25) {
            oldAsteroid.scale*=.5;
            oldAsteroid.vx = - 1.5*oldAsteroid.vx
            oldAsteroid.vy = - 1.5*oldAsteroid.vy
            asteroid = oldAsteroid;
        }
        else{
            let x = Math.floor(Math.random() * 500);
            let y = Math.floor(Math.random() * 500);
            let vx = Math.floor(Math.random() * 5)-2;
            let vy = Math.floor(Math.random() * 5)-2;
            asteroid = new Asteroid(this,asteroidImg,x,y,vx,vy,1);
        }
        this.gObjects.push(asteroid);
    }

    forget(obj){
        console.log("remove from gObjects", obj);
        let index = this.gObjects.indexOf(obj);
        this.gObjects.splice(index, 1);
    }

    reactOnEvent(event){
    }

    TheEnd(){
        this.continue = false;
        window.alert("End of the Game You have "+this.player.points+" points");
        
    }
}

class CollisionDetector{
    constructor(game){
        this.game = game;
    }

    checkColisions(o1,o2){
        let o1_class = o1.constructor.name;
        let o2_class = o2.constructor.name;
        if (o1_class == 'Wall' || o2_class == 'Wall'){
            if (o1_class == o2_class) return; //Two walls cannot hit each other
            this.checkColisionWallObject(o1,o2);
            return;
        }
        if (o1_class == 'Bullet' || o2_class == 'Bullet'){
            this.checkColisionBulletObject(o1,o2)
            if (o1_class == 'Asteroid' || o2_class == 'Asteroid'){
                this.player.AsteroidIsDestroyed();
            }
        }
        if (o1_class == 'Asteroid' || o2_class == 'Asteroid'){
            this.checkColisionAsteroidObject(o1,o2)
        }
    }

    chackBBoxColisiion(b1,b2){
        if (b1.x1 <= b2.x2 &&       // 
            b2.x1 <= b1.x2 &&       // 
            b1.y1 <= b2.y2 &&       // 
            b2.y1 <= b1.y2)         // 
            return true;
        return false;
    }

    checkColisionWallObject(o1,o2){
        let b1 = o1.boundingBox();
        let b2 = o2.boundingBox();
        if (this.chackBBoxColisiion(b1,b2)){
                o1.reactOnEvent(new CollisionWithWall(o2));
                o2.reactOnEvent(new CollisionWithWall(o1));
          }  
    }

    checkColisionAsteroidObject(o1,o2){
        let b1 = o1.boundingBox();
        let b2 = o2.boundingBox();
        if (this.chackBBoxColisiion(b1,b2)){
                o1.reactOnEvent(new CollisionWithAsteroid(o2));
                o2.reactOnEvent(new CollisionWithAsteroid(o1));
          }  
    }

    checkColisionBulletObject(o1,o2){
        let b1 = o1.boundingBox();
        let b2 = o2.boundingBox();
        if (this.chackBBoxColisiion(b1,b2)){
                o1.reactOnEvent(new CollisionWithBullet(o1));
                o2.reactOnEvent(new CollisionWithBullet(o2));
          }  
    }
}

function buildGame(){
    g = new Game();
    g.player = new Ship(g,shipImg,20,30,-1,-1,.5);
    g.gObjects.push(new Asteroid(g,asteroidImg,200,60,1,1,1));
    g.gObjects.push(new Asteroid(g,asteroidImg,300,160,-1,-1,1)); 
    g.gObjects.push(new Wall(g,-10,0,0,500,false));
    g.gObjects.push(new Wall(g,500,0,510,500,false));
    g.gObjects.push(new Wall(g,0,-10,500,0,true));
    g.gObjects.push(new Wall(g,0,500,500,510,true));
    g.renderer = new Renderer("game_canvas");
    g.detector = new CollisionDetector(g);
    return g;
}

// var bulletImg = new Image();
// bulletImg.src = "img/bullet.png";
var shipImg = new Image();
shipImg.src = "img/ship.png";
var asteroidImg = new Image();
asteroidImg.src = "img/asteroid.png";
var game ={}

window.onload = function(){
    game = buildGame();
    game.gameLoop();
}

document.addEventListener(
    "keydown",
    (event) => {
      const keyName = event.key;
      switch (keyName){
          case 'ArrowUp': game.player.vy+=-1; return ;
          case 'ArrowDown': game.player.vy+=1; return ;
          case 'ArrowLeft': game.player.vx+=-1; return ;
          case 'ArrowRight': game.player.vx+=1; return ;
      }
    },
    false,
  );