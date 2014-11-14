
(function ($) {
  var numBoids = 300;

  // Dimensions
  var maxVelocity = 3.4;
  var startRadius = 300;
  var startFishYOffset = 100;
  var fishYOffset = startFishYOffset;
  var startFishZOffset = 800;
  var fishZOffset = startFishZOffset;
  var maxClumpRatio = .02;
  var clumpRatio = 0;

  var seperationDistance = 40, // minimum distance apart from another
      alignmentDistance = 20, // after minimum separation distance, this make fish swim together
      cohesionDistance = 40; // moves closer to center if within this distance

  var delta = .016;
  var PI = 3.141592653589793;
  var PI_2 = PI * 2.0;

  var maxLightDist = 1000;
  var dimLights = true;

  var boids = [];
  var largeFish;
  var fishColor = 0x0071c5;
  var colorTransition = 0;
  var colorTransitionLength = 400;
  var transitionPeriod = 0;
  var transitionPeriodLength = 150;
  var colorRatio = 0.4;

  var renderer, scene, camera, stats;
  var light1, light2, light3, light4, light5, light6;

  var clock = new THREE.Clock();
  var controls, oculusEffect, oculusControl;

  // parameters to changes scene
  var showLargeFish = false;
  var animateLights = false;
  var animateColor = true;
  var showStats = true;

  var env = {
    init : function(){
      var WIN_WIDTH = window.innerWidth,
        WIN_HEIGHT = window.innerHeight,
        VIEW_ANGLE = 50,
        ASPECT = WIN_WIDTH / WIN_HEIGHT,
        NEAR = 1,
        FAR = 3000;

      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x040306, 10, FAR);

      camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
      camera.position.set(0, 0, 200);

      renderer = new THREE.WebGLRenderer({antialias: false});
      renderer.setClearColor( scene.fog.color, 1 );

      renderer.setSize(WIN_WIDTH, WIN_HEIGHT);
      renderer.gammaInput = true;
      renderer.gammaOutput = true;

      oculusEffect = new THREE.OculusRiftEffect(renderer, { worldScale: 1 });
      oculusEffect.setSize(window.innerWidth, window.innerHeight);

      controls = new THREE.FirstPersonControls(camera);
      controls.movementSpeed = 4000;
      controls.lookSpeed = 3.0;
      controls.lookVertical = true;

      oculusControl = new THREE.OculusControls(camera);

      document.body.appendChild(renderer.domElement);

      if(showStats){
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);
      }

      scene.add(camera);

      //skybox
      var urlPrefix = "img/textures/space1.jpg";
      var urls = [ 
        urlPrefix, urlPrefix,
        urlPrefix, urlPrefix,
        urlPrefix, urlPrefix 
      ];
      var skyboxTextureCube = THREE.ImageUtils.loadTextureCube(urls);
      
      var skyboxShader = THREE.ShaderLib["cube"];
      skyboxShader.uniforms['tCube'].value = skyboxTextureCube;

      var skyboxMaterial = new THREE.ShaderMaterial({
        fragmentShader : skyboxShader.fragmentShader,
        vertexShader : skyboxShader.vertexShader,
        uniforms : skyboxShader.uniforms,
        depthWrite : false,
        side : THREE.BackSide
      });

      // build the skybox Mesh 
      var skyboxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2000, 2000, 2000),
        skyboxMaterial 
      );


      scene.add(skyboxMesh);

      // add plane
      // var texture = THREE.ImageUtils.loadTexture( "img/textures/disturb4.jpg" );
      // texture.repeat.set( 20, 10 );
      // texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      // texture.format = THREE.RGBFormat;

      // var groundMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, ambient: 0x444444, map: texture } );

      // var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 3000, 3000, 2, 2 ), groundMaterial );
      // mesh.position.y = -200;
      // mesh.rotation.x = -Math.PI / 2;
      // scene.add(mesh);
    },
    render : function(){
      requestAnimationFrame(env.render);        

      var t = clock.getElapsedTime();

      lights.render();
      fish.render();

      if(stats){
        stats.update();
      }

      controls.update(clock.getDelta());
      oculusControl.update(clock.getDelta());
      oculusEffect.render(scene, camera);
    }
  };

  var lights = {
    init : function(){
      var intensity = 2.5;
      var distance = 100;
      var color = 0xf2f2f2;
      var colorOpposite = 0xff9200;
      var colorLeft = 0xffbf00;
      var colorRight = 0xff4900;

      light1 = new THREE.PointLight(color, intensity, distance);
      light1.position.x = -distance * 3;
      light1.position.y = -125;
      light1.position.z = -distance - distance*2;
      scene.add( light1 );
      light2 = new THREE.PointLight(color, intensity, distance);
      light2.position.x = distance * 3;
      light2.position.y = -125;
      light2.position.z = -distance*6;
      scene.add( light2 );
      light3 = new THREE.PointLight(color, intensity, distance);
      light3.position.x = -distance * 3;
      light3.position.y = -125;
      light3.position.z = -distance*11;
      scene.add(light3 );
      light4 = new THREE.PointLight(color, intensity, distance);
      light4.position.x = 0;
      light4.position.y = 300;
      light4.position.z = 100;
      scene.add(light4);
      light5 = new THREE.PointLight(color, intensity, distance);
      light5.position.x = distance * 3;
      light5.position.y = -125;
      light5.position.z = distance * 8;
      scene.add( light5 );
      light6 = new THREE.PointLight(color, intensity, distance);
      light6.position.x = -distance * 3;
      light6.position.y = -125;
      light6.position.z = distance * 10;
      scene.add( light6 );

      var dlight = new THREE.DirectionalLight(0xffffff, 0.1);
      dlight.position.set(0.5, -1, 0).normalize();
      scene.add(dlight);

      scene.add(new THREE.AmbientLight(0x111111));

      if(animateLights){
        var sphere = new THREE.SphereGeometry(1, 43, 21);
        var l1 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
        l1.position = light1.position;
        scene.add(l1);
        var l2 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
        l2.position = light2.position;
        scene.add(l2);
        var l3 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
        l3.position = light3.position;
        scene.add(l3);
        var l5 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
        l5.position = light5.position;
        scene.add(l5);
        var l6 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
        l6.position = light6.position;
        scene.add(l6);
      }
    },
    set : function(intensity){
      intensity = (maxLightDist - 100) * intensity + 100;
      var speed = 50;

      if(light1.distance < intensity){
        light1.distance = Math.min(light1.distance + speed, intensity);
      } else {
        light1.distance = Math.max(light1.distance - speed, intensity);
      }

      light2.distance = light1.distance;
      light3.distance = light1.distance;
      light4.distance = light1.distance;
      light5.distance = light1.distance;
      light6.distance = light1.distance;
    },
    position : function(){
      var time = Date.now() * 0.00025;
      var d = 100;

      light1.position.x = Math.sin( time * 1.7 ) * d * 3;
      light1.position.z = Math.cos( time * 0.3 ) * d - d*2;

      light2.position.x = Math.cos( time * 1.3 ) * d * 3;
      light2.position.z = Math.sin( time * 0.7 ) * d - d*6;

      light3.position.x = Math.sin( time * 1.5 ) * d * 3;
      light3.position.z = Math.sin( time * 0.5 ) * d - d*10;

      light5.position.x = Math.cos( time*1.0 ) * d * 12+1;
      light5.position.z = Math.sin( time*1.0 ) * d * 8+1;

      light6.position.x = Math.cos( time*1.2 ) * d * 14+1;
      light6.position.z = Math.sin( time*1.2 ) * d * 10+1;
    },
    render : function(){
      if(animateLights){
        lights.position();

        if(dimLights){
          light1.distance = Math.max(light1.distance - maxLightDist/120, 100);
          light2.distance = Math.max(light2.distance - maxLightDist/120, 100);
          light3.distance = Math.max(light3.distance - maxLightDist/120, 100);
          light4.distance = Math.max(light4.distance - maxLightDist/120, 100);
          light5.distance = Math.max(light5.distance - maxLightDist/120, 100);
          light6.distance = Math.max(light6.distance - maxLightDist/120, 100);
        } else {
          light1.distance = Math.min(light1.distance + maxLightDist/15, maxLightDist);
          light2.distance = Math.min(light2.distance + maxLightDist/15, maxLightDist);
          light3.distance = Math.min(light3.distance + maxLightDist/15, maxLightDist);
          light4.distance = Math.min(light4.distance + maxLightDist/15, maxLightDist);
          light5.distance = Math.min(light5.distance + maxLightDist/15, maxLightDist);
          light6.distance = Math.min(light6.distance + maxLightDist/15, maxLightDist);
        }
      } else {
        light1.distance = maxLightDist;
        light2.distance = maxLightDist;
        light3.distance = maxLightDist;
        light4.distance = maxLightDist;
        light5.distance = maxLightDist;
        light6.distance = maxLightDist;
      }
    },
  };

  var fish = {
    init : function(callback){
      for (var i = 0; i < numBoids; i += 1) {
        var randRadius = Math.random()*startRadius;
        var randAngle = Math.random()*360*Math.PI/180;

        boids[boids.length] = {
            n: i,
            x: randRadius*Math.cos(randAngle),
            y: randRadius*Math.sin(randAngle)+fishYOffset,
            z: Math.random()*startRadius*2-startRadius+fishZOffset,
            xVelocity: Math.random()*maxVelocity*2 - maxVelocity,
            yVelocity: Math.random()*maxVelocity*2 - maxVelocity,
            zVelocity: Math.random()*maxVelocity*2 - maxVelocity
        };
      }

      var loader = new THREE.JSONLoader();
      loader.load('models/clownfish.js', function (geometry, materials) {
        for(var i=0; i<numBoids; i++){
          var material = new THREE.MeshPhongMaterial({
            color: fishColor,
            shininess: 1000,
            shading: THREE.FlatShading
          });

          boids[i].geometry = new THREE.Mesh(geometry, material);

          boids[i].geometry.receiveShadow = true;
          boids[i].geometry.castShadow = true;
          boids[i].geometry.position.x = boids[i].x;
          boids[i].geometry.position.y = boids[i].y;
          boids[i].geometry.position.z = boids[i].z;
          boids[i].geometry.material.transparent = true;
          boids[i].geometry.scale.set(.825, .825, .825);

          scene.add(boids[i].geometry);
        }

        if(showLargeFish){
          largeFish = new THREE.Mesh(geometry, material);
          largeFish.receiveShadow = true;
          largeFish.castShadow = true;
          largeFish.position.x = 0;
          largeFish.position.y = 100;
          largeFish.position.z = 300;
          largeFish.material.transparent = true;
          largeFish.scale.set(5, 5, 5);

          scene.add(largeFish);
        }

        callback();
      });
    },
    render : function(){
      var separationScale = clumpRatio * 3 + 1;
      var centerPullScale = clumpRatio * 50 + 1;

      var seperationDistanceScaled = seperationDistance / separationScale;
      var alignmentDistanceScaled = alignmentDistance / separationScale;
      var cohesionDistanceScaled = cohesionDistance / separationScale;

      var zoneRadius = seperationDistanceScaled + alignmentDistanceScaled + cohesionDistanceScaled;
      var separationThresh = seperationDistanceScaled / zoneRadius;
      var alignmentThresh = (seperationDistanceScaled + alignmentDistanceScaled)  / zoneRadius;
      var zoneRadiusSquared = zoneRadius * zoneRadius;

      var dist;
      var distSquared;

      var seperationSquared = seperationDistanceScaled * seperationDistanceScaled;
      var cohesionSquared = cohesionDistance * cohesionDistance;

      var f;
      var percent;

      for (var i=0; i<numBoids; i++) {
        var selfBoid = boids[i];
        var central = {x:0, y:fishYOffset, z:fishZOffset};
        //var central = {x:0, y:0, z:0};
        var dir = {
          x : selfBoid.x - central.x,
          y : selfBoid.y - central.y,
          z : selfBoid.z - central.z
        };
        dist = calc.distance(dir.x, dir.y, dir.z);
        dir.y *= 2.5;

        var normalizeDir = calc.normalize(dir);
        selfBoid.xVelocity -= normalizeDir.x * delta * 5 * centerPullScale;
        selfBoid.yVelocity -= normalizeDir.y * delta * 5 * centerPullScale;
        selfBoid.zVelocity -= normalizeDir.z * delta * 5 * centerPullScale;

        for (var j=0; j<numBoids; j++) {
          var otherBoid = boids[j];

          dir = {
            x : otherBoid.x - selfBoid.x,
            y : otherBoid.y - selfBoid.y,
            z : otherBoid.z - selfBoid.z
          };

          dist = calc.distance(dir.x, dir.y, dir.z);
          distSquared = dist * dist;

          if (dist > 0 && distSquared < zoneRadiusSquared){
            percent = distSquared / zoneRadiusSquared;

            if (percent < separationThresh){ // low
              // Separation - Move apart for comfort
              f = (separationThresh / percent - 1.0) * delta;

              normalizeDir = calc.normalize(dir);
              selfBoid.xVelocity -= normalizeDir.x * f;
              selfBoid.yVelocity -= normalizeDir.y * f;
              selfBoid.zVelocity -= normalizeDir.z * f;
            } else if (percent < alignmentThresh){ // high
              // Alignment - fly the same direction
              var threshDelta = alignmentThresh - separationThresh;
              var adjustedPercent = (percent - separationThresh) / threshDelta;
              var otherBirdVel = {
                x:otherBoid.xVelocity,
                y:otherBoid.yVelocity,
                z:otherBoid.zVelocity
              };
              
              f = (0.5 - Math.cos(adjustedPercent * PI_2) * 0.5 + 0.5) * delta;

              var normalizeOtherVel = calc.normalize(otherBirdVel);
              selfBoid.xVelocity += normalizeOtherVel.x * f;
              selfBoid.yVelocity += normalizeOtherVel.y * f;
              selfBoid.zVelocity += normalizeOtherVel.z * f;
            } else {
              // Attraction / Cohesion - move closer
              var threshDelta = 1.0 - alignmentThresh;
              var adjustedPercent = (percent - alignmentThresh) / threshDelta;

              f = (0.5 - (Math.cos(adjustedPercent * PI_2) * -0.5 + 0.5)) * delta;

              normalizeDir = calc.normalize(dir);
              selfBoid.xVelocity += normalizeDir.x * f;
              selfBoid.yVelocity += normalizeDir.y * f;
              selfBoid.zVelocity += normalizeDir.z * f;
            }
          }
        }

        if(calc.distance(selfBoid.xVelocity, selfBoid.yVelocity, selfBoid.zVelocity) > maxVelocity){
          var normalizedVel = calc.normalize({x: selfBoid.xVelocity, y: selfBoid.yVelocity, z:selfBoid.zVelocity});

          selfBoid.xVelocity = normalizedVel.x * maxVelocity;
          selfBoid.yVelocity = normalizedVel.y * maxVelocity;
          selfBoid.zVelocity = normalizedVel.z * maxVelocity;
        }
      }

      var time = Date.now();
      colorTransition++;
      transitionPeriod--;

      for (i=0; i<numBoids; i++) {
        var boid = boids[i];
        var oldPos = {
          x: boid.x,
          y: boid.y,
          z: boid.z
        };
        boid.x += boid.xVelocity;
        boid.y += boid.yVelocity;
        boid.z += boid.zVelocity;

        boid.geometry.position.x = boid.x;
        boid.geometry.position.y = boid.y;
        boid.geometry.position.z = boid.z;
        boid.geometry.lookAt({x:oldPos.x, y:oldPos.y, z:oldPos.z});

        var r, g, b;
        if(animateColor){
          var xPerc = Math.max(Math.min(boid.x+500, 1000), 0) / 1000;

          xPerc += colorTransition/colorTransitionLength;
          xPerc = (xPerc % 1) * 1.5;

          if(xPerc <= 0.5){
            r = (1-xPerc/0.5); // 1 to 0
            g = 1-r; // 0 to 1
            b = 0;
          } else if(xPerc <= 1) {
            r = 0;
            g = (1-(xPerc-0.5)/0.5); //1 to 0
            b = 1-g;
          } else {
            g = 0;
            b = (1-(xPerc-1)/0.5);
            r = 1-b;
          }
        } else {
          r = 0;
          g = 113/255;
          b = 197/255;
        }

        r = r - r*colorRatio;
        g = g - (g-113/255)*colorRatio;
        b = b - (b-197/255)*colorRatio;

        if(transitionPeriod > 0){
          var transitionPerc = 1 - transitionPeriod / transitionPeriodLength;
          var bColor = boid.geometry.material.color;
          var currR = bColor.r;
          var currG = bColor.g;
          var currB = bColor.b;

          boid.geometry.material.color = new THREE.Color(
            currR - (currR - r)*transitionPerc,
            currG - (currG - g)*transitionPerc,
            currB - (currB - b)*transitionPerc
          );
        } else {
          boid.geometry.material.color = new THREE.Color(r, g, b);
        }

        // if(i==0){
        //   console.log(boid.geometry.material.color.r, boid.geometry.material.color.g, boid.geometry.material.color.b, r, g, b);
        // }
      }

      if(showLargeFish){
        time *= 0.00025;
        var oldPos = {
          x: largeFish.position.x,
          y: largeFish.position.y,
          z: largeFish.position.z
        };
        largeFish.position.x = Math.cos(time) * 400+1;
        largeFish.position.z = Math.sin(time) * 400+1;
        largeFish.lookAt(oldPos);
      }
    },
    reactToSensors : function(data){
      if(typeof data.sound === 'undefined'){
        data.sound = 0.3;
      }

      if(data.state == 0){
        percClose = 0;
      } else if(data.state == 1){
        if(data.distance < 200){
          percClose = .33;
        } else {
          percClose = .67;
        }
      } else if(data.state == 2){
        percClose = 1;
      }

      colorRatio = Math.min(1-data.sound*2, .9);
      fishYOffset = startFishYOffset * (1-percClose);
      fishZOffset = startFishZOffset * (1-percClose);
      clumpRatio = maxClumpRatio * percClose;
    }
  };

  var calc = {
    distance : function(dX, dY, dZ) {
      return Math.sqrt((dX * dX) + (dY * dY) + (dZ * dZ)) * 1.0;
    },
    distanceBetween : function(boidA, boidB) {
      return calc.distance(
          boidA.x - boidB.x,
          boidA.y - boidB.y,
          boidA.z - boidB.z
      );
    },
    normalize : function(v3){
      var dist = calc.distance(v3.x, v3.y, v3.z);
      return {x:v3.x/dist, y:v3.y/dist, z:v3.z/dist};
    }
  };
  
  var init = function(){
    env.init();
    lights.init();
    fish.init(function(){
      oculusControl.connect();
      env.render();
    });

    window.addEventListener('resize', function(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      oculusEffect.setSize( window.innerWidth, window.innerHeight );
      controls.handleResize();
    }, false);

    window.sendSensorData = function(data){
      fish.reactToSensors(data);
    };
  };

  init();
})(jQuery);


