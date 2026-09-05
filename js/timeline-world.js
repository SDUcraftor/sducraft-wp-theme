// The rail, terrain, minecart and torches use the same orthographic camera.
// Chest thumbnails share a second renderer; the number of WebGL contexts is constant.
export async function createWorld(app) {
    const assets = window.sducraftTimelineAssets;
    const THREE = await import(new URL(assets.three, document.baseURI).href);
    const {GLTFLoader} = await import(new URL(assets.loader, document.baseURI).href);
    const canvas = app.querySelector('.mc-world-canvas');
    const coarsePointer = matchMedia('(pointer: coarse)').matches;
    const limitedHardware = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    const lowPower = coarsePointer || limitedHardware || innerWidth < 600;
    const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    app.dataset.worldQuality = lowPower ? 'mobile' : 'full';
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();
    scene.add(new THREE.HemisphereLight(0xfff0dd,0x283039,1.45));
    renderer.shadowMap.enabled=!lowPower; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const sun = new THREE.DirectionalLight(0xffeed0,2.5); sun.position.set(-300,600,100); scene.add(sun); scene.add(sun.target); sun.castShadow=true; sun.shadow.mapSize.set(innerWidth<900?1024:2048,innerWidth<900?1024:2048); sun.shadow.normalBias=1.2; sun.shadow.bias=-.0002;
    const textures = {}, owned = new Set();
    const own = resource => {owned.add(resource); return resource;};
    const names = ['rail','powered_rail_on','stone','moss_block','iron_ore','coal_ore','copper_ore','oak_log','oak_log_top','oak_planks','torch','crafting_table_top','crafting_table_side','crafting_table_front','oak_leaves','grass_block_top','grass_block_side','dirt','deepslate','deepslate_top','deepslate_diamond_ore','netherrack','blackstone','magma','lava_still','bedrock'];
    const loader = new THREE.TextureLoader();
    const models = new GLTFLoader();
    let chestAsset = null, cartAsset = null;
    try {
        await Promise.all(names.map(async name => {
            const texture = own(await loader.loadAsync(new URL(`${name}.png`, new URL(app.dataset.textures, document.baseURI)).href));
            texture.colorSpace = THREE.SRGBColorSpace; texture.magFilter = texture.minFilter = THREE.NearestFilter;
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping; textures[name] = texture;
            // Animated Minecraft textures are vertical strips: show one square frame.
            if(texture.image.height>texture.image.width) texture.repeat.y=texture.image.width/texture.image.height;
        }));
        [cartAsset, chestAsset] = await Promise.all([
            models.loadAsync(app.dataset.minecartModel).catch(() => null),
            models.loadAsync(app.dataset.chestModel).catch(() => null),
        ]);
    } catch(error) {owned.forEach(resource => resource.dispose()); renderer.dispose(); throw error;}
    for (const asset of [cartAsset,chestAsset]) asset?.scene.traverse(object => {
        if(object.geometry) own(object.geometry);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach(material => {own(material); if(material.map) {own(material.map);material.map.magFilter = material.map.minFilter = THREE.NearestFilter;}});
    });
    const cube = own(new THREE.BoxGeometry(1,1,1));
    const flatMaterials = {};
    function material(name, color = '#606a5d') {
        const key = name + color;
        return flatMaterials[key] ||= own(new THREE.MeshLambertMaterial({map:textures[name],color,emissive:name==='lava_still'?0xff6b12:name==='magma'?0x9b2d05:0,emissiveMap:['lava_still','magma'].includes(name)?textures[name]:null,emissiveIntensity:.65}));
    }
    const wood = material('oak_log','#9f8c68');
    const planks = material('oak_planks','#75694e');
    const emberMaterial = own(new THREE.MeshBasicMaterial({color:0xffcf6a}));
    const soulEmberMaterial = own(new THREE.MeshBasicMaterial({color:0x8ce8e4}));
    const routeMaterial = own(new THREE.MeshLambertMaterial({map:textures.rail,transparent:true,alphaTest:.2,side:THREE.DoubleSide,color:0xd8d0b3}));
    const poweredMaterial = own(new THREE.MeshBasicMaterial({map:textures.powered_rail_on,transparent:true,alphaTest:.2,side:THREE.DoubleSide,color:0xe4c585}));
    const bedMaterial = material('stone','#434b3d');
    let worldGroup = new THREE.Group(); scene.add(worldGroup);
    let points = [], curve, routeLength = 0, samples = [], torches = [], positions = [], lastWidth = 0, lastHeight = 0;
    let disposed = false, branchCurve=null, mergeY=Infinity, branchEndY=0;
    function onBranch(path,y) {
        let lo=0,hi=1;for(let i=0;i<24;i++) {const mid=(lo+hi)/2,p=path.getPoint(mid);if(p.z*.8-p.y*.6<y)lo=mid;else hi=mid;}
        return {position:path.getPoint((lo+hi)/2),tangent:path.getTangent((lo+hi)/2).normalize()};
    }
    const temporaryGeometry = new Set();
    const dummy = new THREE.Object3D();
    const BLOCK = 64;
    const hash = (x,z) => {const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n);};
    const toWorld = (x,y,h = 0) => new THREE.Vector3(x,h,(y + .6*h)/.8);
    function box(group,x,y,z,w,h,d,mat) {
        let geometry=cube;
        if(mat===wood || mat===planks) {
            geometry=new THREE.BoxGeometry(1,1,1);temporaryGeometry.add(geometry);
            const uv=geometry.attributes.uv;
            for(let face=0;face<6;face++) {
                const [u,v]=face<2?[d,h]:face<4?[w,d]:[w,h];
                for(let i=0;i<4;i++) {const index=face*4+i;uv.setXY(index,uv.getX(index)*u/BLOCK,uv.getY(index)*v/BLOCK);}
            }
        }
        const mesh = new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;
    }

    function makeRibbon(width, elevation, mat, from = 0, to = routeLength, path = curve, length = routeLength) {
        const verts=[],uvs=[],indices=[]; let count=0;
        const steps = Math.max(1,Math.ceil((to-from)/12));
        for(let i=0;i<=steps;i++) {
            const distance=from+(to-from)*i/steps,t=Math.max(0,Math.min(1,distance/length)),p=path.getPointAt(t),tangent=path.getTangentAt(t);
            const normal = new THREE.Vector3(tangent.z,0,-tangent.x).normalize().multiplyScalar(width/2);
            for(const sign of [-1,1]) verts.push(p.x+normal.x*sign,p.y+elevation,p.z+normal.z*sign);
            uvs.push(0,distance/40,1,distance/40);
            if(i<steps) {const n=count*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);} count++;
        }
        const geometry = new THREE.BufferGeometry();temporaryGeometry.add(geometry);
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry,mat);mesh.receiveShadow=true;worldGroup.add(mesh);return mesh;
    }
    function parameterAt(y) {
        let low=0,high=samples.length-1;
        while(high-low>1) {const mid=(low+high)>>1;if(samples[mid].y<y)low=mid;else high=mid;}
        const a=samples[low],b=samples[high];
        return Math.max(0,Math.min(1,a.t+(b.t-a.t)*Math.max(0,Math.min(1,(y-a.y)/(b.y-a.y||1)))));
    }
    function makeTorch(x,screenY,soul) {
        const group = new THREE.Group();group.position.copy(toWorld(x,screenY));worldGroup.add(group);
        box(group,0,17,0,9,45,9,wood);
        box(group,0,39,0,18,5,16,planks);
        // UVs from Minecraft's template_torch.json: [7,6,9,16] sides.
        const geo = new THREE.BoxGeometry(7,35,7);temporaryGeometry.add(geo);
        const uv=geo.attributes.uv;
        for(let face=0;face<6;face++) {
            const coords = face===2 ? [7,6,9,8] : face===3 ? [7,13,9,15] : [7,6,9,16];
            const [u0,v0,u1,v1]=coords.map(n=>n/16);
            [[u0,1-v0],[u1,1-v0],[u0,1-v1],[u1,1-v1]].forEach((pair,i)=>uv.setXY(face*4+i,...pair));
        }
        const stick = new THREE.Mesh(geo,material('torch','#ffffff'));
        stick.position.set(0,60,0);stick.rotation.z=-.12;group.add(stick);
        const ember=box(group,-2,81,0,5,5,5,soul?soulEmberMaterial:emberMaterial);
        torches.push({group,ember,baseY:81,soul});
    }
    function layout(stations,totalHeight) {
        if(disposed) return;
        positions=stations;
        const width=app.clientWidth,mobile=width<600;
        const bufferHeight=innerHeight+480;
        renderer.setSize(innerWidth,bufferHeight,false); canvas.style.height=`${bufferHeight}px`;
        camera.left=-innerWidth/2;camera.right=innerWidth/2;camera.top=bufferHeight/2;camera.bottom=-bufferHeight/2;camera.near=.1;camera.far=6000;camera.updateProjectionMatrix();
        // ResizeObserver may fire for unchanged layout; avoid rebuilding the world.
        const key=stations.map(p=>`${p.x},${p.y},${p.card.height},${p.photo?.y},${p.photo?.height}`).join(';');
        if(width===lastWidth && totalHeight===lastHeight && worldGroup.userData.layoutKey===key) return;
        lastWidth=width;lastHeight=totalHeight;
        scene.remove(worldGroup);worldGroup.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();});temporaryGeometry.forEach(g=>g.dispose());temporaryGeometry.clear();
        worldGroup = new THREE.Group();worldGroup.userData.layoutKey=key;scene.add(worldGroup);torches=[];
        points=[toWorld(width*(mobile?.86:.8),90,1),toWorld(width*(mobile?.9:.76),mobile?430:420,1)];
        const merge=stations.find(p=>p.origin==='merge'),vanilla=stations.find(p=>p.origin==='vanilla');
        branchCurve=null;mergeY=merge&&vanilla?merge.y:Infinity;
        const leftX=mobile?23:width/2-96,rightX=mobile?67:width/2+96;
        stations.forEach((p,i)=>{
            if(merge&&vanilla && p.origin==='vanilla')return;
            points.push(toWorld(p.origin==='restoration'&&merge&&vanilla?leftX:p.x+(mobile?(i%2?4:-4):(i%2?28:-28)),p.y,1));
        });
        points.push(toWorld(merge&&vanilla?leftX:mobile?width*.28:width*.63,merge&&vanilla?stations.at(-1).y+95:totalHeight-200,1));
        if(merge&&vanilla) {
            const junction=points.find(p=>Math.abs(p.z*.8-p.y*.6-merge.y)<.1);
            branchEndY=vanilla.y+95;
            branchCurve=new THREE.CatmullRomCurve3([junction.clone(),toWorld(rightX,merge.y+155,1),toWorld(rightX,vanilla.y,1),toWorld(rightX,branchEndY,1)],false,'centripetal');
        }
        curve = new THREE.CatmullRomCurve3(points,false,'centripetal');curve.arcLengthDivisions=Math.max(400,stations.length*50);curve.updateArcLengths();routeLength=curve.getLength();
        const sampleCount=Math.ceil(routeLength/8)+1;
        samples=Array.from({length:sampleCount},(_,i)=>{const t=i/(sampleCount-1),p=curve.getPointAt(t);return {t,y:p.z*.8-p.y*.6};});
        makeRibbon(mobile?48:68,-.4,bedMaterial);makeRibbon(mobile?30:40,0,routeMaterial);
        if(branchCurve) {const length=branchCurve.getLength();makeRibbon(mobile?40:60,-.4,bedMaterial,0,length,branchCurve,length);makeRibbon(mobile?26:40,0,routeMaterial,0,length,branchCurve,length);}
        stations.filter(p=>p.origin!=='vanilla'||!branchCurve).forEach(p=>{const s=parameterAt(p.y)*routeLength;makeRibbon(mobile?30:40,.18,poweredMaterial,Math.max(0,s-22),Math.min(routeLength,s+22));});
        // Full, continuous floor. Every terrain cell is a real cube, never a stretched slab.
        const batches = new Map();
        function block(x,y,z,type,color='#a0a09a') {
            // Spatial chunks let Three.js discard distant terrain. A single timeline-wide
            // InstancedMesh keeps every block on the GPU even when only one screen is visible.
            const key=type+color+':'+Math.floor(z/(BLOCK*12));
            if(!batches.has(key)) {
                const side=material(type==='grass_block_top'?'grass_block_side':type,color);
                const top=material(type==='deepslate'?'deepslate_top':type,type==='grass_block_top'?'#76a944':color);
                batches.set(key,{mat:[side,side,top,side,side,side],blocks:[]});
            }
            batches.get(key).blocks.push({x,y,z});
        }
        const bridges=stations.slice(0,-1).flatMap((p,i)=>i%7===4 && !p.origin && stations[i+1].card.y-p.card.y-p.card.height>100 ? [(p.card.y+p.card.height+stations[i+1].card.y)/2] : []);
        const rows=Math.ceil(totalHeight/(BLOCK*.8))+5;
        const columns=Math.ceil(width/BLOCK)+2;
        // Geological transitions follow world distance, independently of the year markers.
        for(let row=-3;row<rows;row++) {
            for(let col=-1;col<columns;col++) {
                const x=col*BLOCK+BLOCK/2,z=row*BLOCK,r=hash(col,row);
                const pageY=z*.8;
                const depth=pageY/totalHeight+(hash(col,Math.floor(row/4))-.5)*.085;
                const originGarden=pageY>mergeY+180;
                const type=originGarden?(r>.9?'moss_block':'grass_block_top'):depth<.16?'grass_block_top':depth<.22?'dirt':depth<.49?(r>.96?'iron_ore':r>.91?'coal_ore':'stone'):depth<.76?(r>.97?'deepslate_diamond_ore':'deepslate'):depth<.87?(r>.84?'magma':'blackstone'):'netherrack';
                const routePoint=curve.getPointAt(parameterAt(z*.8));
                const besideRoute=Math.abs(x-routePoint.x)>BLOCK*1.8;
                const awayFromStation=!stations.some(p=>pageY>p.card.y-90 && pageY<p.card.y+p.card.height+100 || p.photo && pageY>p.photo.y-90 && pageY<p.photo.y+p.photo.height+110);
                const basin=Math.sin(row*.22)+Math.cos(col*.74+row*.08);
                const ravine=bridges.some(y=>Math.abs(pageY-y)<45);
                const pool=!originGarden && depth>.73 && besideRoute && awayFromStation && basin>1.25;
                // Recesses retain full cube walls; the liquid surface is below the track bed.
                const recess=!originGarden && (ravine || pool || (depth>.24 && besideRoute && awayFromStation && basin>1));
                block(x,recess?-BLOCK*1.5:-BLOCK/2,z,type);
                if(recess && (pool||ravine))block(x,-BLOCK*2.5,z,type);
                if(!originGarden && awayFromStation && besideRoute && basin>.65 && basin<=1 && depth>.24)block(x,BLOCK/2,z,type);
                if(pool) {
                    const liquid=box(worldGroup,x,-38,z,BLOCK,1,BLOCK,material('lava_still','#ffffff'));
                    liquid.castShadow=false;
                }
                const edge=mobile?18:Math.max(80,(width-1120)/2)+(awayFromStation?64*(1+Math.sin(row*.16)):0);
                if(x<edge || x>width-edge) {
                    const tiers=originGarden?1:1+Math.floor(hash(col,Math.floor(row/5))*3);
                    for(let tier=0;tier<tiers;tier++) block(x,BLOCK/2+tier*BLOCK,z,type==='grass_block_top'&&tier<tiers-1?'dirt':type);
                    if((depth<.15||originGarden) && row%17===0 && (col===0 || col===columns-3)) {
                        for(let h=0;h<3;h++) block(x,(tiers+h+.5)*BLOCK,z,'oak_log','#a0a09a');
                        for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++) block(x+dx*BLOCK,(tiers+3.5)*BLOCK,z+dz*BLOCK,'oak_leaves','#628b3a');
                        block(x,(tiers+4.5)*BLOCK,z,'oak_leaves','#73994b');
                    }
                }
            }
        }
        // A few solid rock portals narrow the central passage without covering the cards.
        if(!mobile) stations.forEach((p,i)=>{
            if(i%10!==6 || p.origin || !stations[i+1])return;
            const y=(p.card.y+p.card.height+stations[i+1].card.y)/2;
            const center=curve.getPointAt(parameterAt(y)),type=y/totalHeight>.49?'deepslate':'stone';
            for(const side of [-1,1])for(let tier=0;tier<3;tier++)block(center.x+side*128,32+tier*64,center.z,type);
            for(let col=-2;col<=2;col++)block(center.x+col*64,224,center.z,type);
        });
        for(const {mat,blocks} of batches.values()) {
            const mesh=new THREE.InstancedMesh(cube,mat,blocks.length);
            blocks.forEach((b,i)=>{dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(BLOCK);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
            mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();worldGroup.add(mesh);
        }
        for(const y of bridges) {
            const distance=parameterAt(y)*routeLength;
            makeRibbon(mobile?52:76,-.15,planks,Math.max(0,distance-105),Math.min(routeLength,distance+105));
            const point=curve.getPointAt(parameterAt(y));
            for(const sign of [-1,1]) {
                box(worldGroup,point.x+sign*(mobile?29:42),10,point.z,7,8,180,wood);
                for(const end of [-1,1])box(worldGroup,point.x+sign*(mobile?29:42),-26,point.z+end*85,10,65,10,wood);
            }
        }
        stations.forEach((p,i)=>{
            const left=p.card.x+p.card.width/2<width/2;
            const torchX=mobile?(p.origin?p.card.x+p.card.width-12:p.card.x-18):left?p.card.x+p.card.width+23:p.card.x-23;
            makeTorch(torchX,p.y+50,p.y/totalHeight>.86 && !p.origin);
            const railP=p.origin==='vanilla'&&branchCurve?onBranch(branchCurve,p.y).position:curve.getPointAt(parameterAt(p.y));
            const edge=mobile?p.card.x:left?p.card.x+p.card.width:p.card.x;
            box(worldGroup,(edge+railP.x)/2,1,railP.z+30,Math.abs(edge-railP.x),2,32,planks);
            const deck=toWorld(p.card.x+p.card.width/2,p.card.y+p.card.height+8);
            box(worldGroup,deck.x,0,deck.z,p.card.width+16,8,38,planks);
            // Uprights visibly connect each display to its footing.
            for(const sign of [-1,1]) {
                box(worldGroup,deck.x+sign*(p.card.width/2-20),24,deck.z+25,10,48,10,wood);
                box(worldGroup,deck.x+sign*(p.card.width/2-20),2,deck.z+25,24,8,24,bedMaterial);
            }
            if(p.photo) {
                const bottom=p.photo.y+p.photo.height;
                const base=toWorld(p.photo.x+p.photo.width/2,bottom+42);
                // Uprights end exactly at the photograph frame in screen space.
                for(const side of [-1,1])box(worldGroup,base.x+side*(p.photo.width/2-24),35,base.z,10,70,10,wood);
                box(worldGroup,base.x,1,base.z,p.photo.width+30,6,50,planks);
            }
            if(!mobile && i%4===2 && !p.origin) {
                const z=railP.z+150;
                for(const side of [-1,1])box(worldGroup,railP.x+side*90,64,z,16,128,16,wood);
                box(worldGroup,railP.x,136,z,196,16,20,wood);
            }
        });
        if(branchCurve) {
            // A small platform marks the junction where both incoming carts become one.
            const parking=onBranch(branchCurve,mergeY+85).position;
            box(worldGroup,parking.x,-3,parking.z,mobile?40:64,5,90,planks);
            const end=onBranch(branchCurve,branchEndY).position;
            box(worldGroup,end.x,9,end.z,mobile?34:48,8,9,wood);
            const first=curve.getPointAt(1);
            box(worldGroup,first.x,9,first.z,mobile?34:48,8,9,wood);
        }
        if(branchCurve) {
            const first=curve.getPointAt(1),x=first.x+(mobile?70:100),z=first.z+50;
            const side=material('crafting_table_side','#d1b994'),front=material('crafting_table_front','#d1b994');
            box(worldGroup,x,20,z,40,40,40,[side,side,material('crafting_table_top','#d1b994'),planks,front,front]);
            makeTorch(x+45,(z*.8)+20,false);
        }
        const gantryX=width*(mobile?.85:.78),gantryZ=350/.8;
        for(const side of [-1,1])box(worldGroup,gantryX+side*(mobile?43:85),64,gantryZ,16,128,16,wood);
        box(worldGroup,gantryX,136,gantryZ,mobile?110:190,16,20,wood);

    }

    const cart = new THREE.Group();scene.add(cart);
    if(cartAsset) {
        const object=cartAsset.scene;object.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=mesh.receiveShadow=true;});const bounds=new THREE.Box3().setFromObject(object),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
        const scale=39/Math.max(size.x,size.z);object.scale.setScalar(scale);object.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);cart.add(object);
    } else {
        box(cart,0,12,0,35,24,42,material('stone','#b4b9b0'));
    }
    const branchCart=cart.clone(true);scene.add(branchCart);
    // Clone materials: fading the incoming cart must never fade the main cart.
    branchCart.traverse(mesh=>{if(mesh.isMesh) {
        const clone=mat=>own(mat.clone());
        mesh.material=Array.isArray(mesh.material)?mesh.material.map(clone):clone(mesh.material);
    }});
    const branchRider=new THREE.Group();branchCart.add(branchRider);branchRider.position.set(0,8,-3);branchRider.scale.setScalar(1.45);
    // A seated, articulated skin model shares the cart's transform and WebGL context.
    const rider = new THREE.Group(); cart.add(rider);
    rider.position.set(0,8,-3); rider.scale.setScalar(1.45);
    let riderConfig = {default:{skin:'skins/steve.png',model:'classic'},switches:[]};
    const configURL = new URL(app.dataset.riderConfig,document.baseURI);
    try {
        const response=await fetch(configURL,{cache:'no-cache'});
        if(response.ok) riderConfig={...riderConfig,...await response.json()};
    } catch(error) {console.warn('Timeline rider: using Steve.',error);}
    const normalize = value => typeof value==='string'?{skin:value,model:'classic'}:{skin:value?.skin||'none',model:value?.model==='slim'?'slim':'classic'};
    const defaultSkin=normalize(riderConfig.default);
    const switches=(Array.isArray(riderConfig.switches)?riderConfig.switches:[])
        .filter(rule=>Number.isInteger(rule.afterFromEnd)&&rule.afterFromEnd>=1)
        .map(rule=>({...normalize(rule),afterFromEnd:rule.afterFromEnd})).sort((a,b)=>b.afterFromEnd-a.afterFromEnd);
    const branchSkins={restoration:normalize(riderConfig.branches?.restoration||{skin:'skins/steve.png'}),vanilla:normalize(riderConfig.branches?.vanilla||{skin:'skins/alex.png',model:'slim'})};
    const skinTextures=new Map();
    await Promise.all([...new Set(['skins/steve.png',defaultSkin.skin,branchSkins.restoration.skin,branchSkins.vanilla.skin,...switches.map(rule=>rule.skin)])].filter(name=>name!=='none').map(async name=>{
        try {
            const texture=own(await loader.loadAsync(new URL(name,configURL).href));
            if(texture.image.width!==64 || texture.image.height!==64) {console.warn('Timeline rider: expected a 64×64 skin:',name);return;}
            texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=texture.minFilter=THREE.NearestFilter;skinTextures.set(name,texture);
        } catch(error) {console.warn('Timeline rider: skin unavailable:',name);}
    }));
    function setRider(setting, riderTarget=rider) {
        const rider=riderTarget;
        const riderResources=rider.userData.resources ||= [];
        const key=setting.skin+':'+setting.model;
        if(key===rider.userData.key)return;
        rider.userData.key=key;rider.clear();riderResources.splice(0).forEach(resource=>{resource.dispose();owned.delete(resource);});
        rider.visible=setting.skin!=='none';if(riderTarget!==branchRider)app.dataset.riderSkin=setting.skin;
        if(!rider.visible)return;
        const texture=skinTextures.get(setting.skin)||skinTextures.get('skins/steve.png');
        if(!texture) {rider.visible=false;return;}
        const mat=own(new THREE.MeshLambertMaterial({map:texture,alphaTest:.5,side:THREE.DoubleSide}));riderResources.push(mat);
        // Standard Minecraft 64×64 unfolded cuboid UVs, including the second skin layer.
        function part(parent,w,h,d,u,v,x,y,z,inflate=0) {
            const geo=own(new THREE.BoxGeometry(w+inflate,h+inflate,d+inflate));riderResources.push(geo);
            const rects=[[u+d+w,v+d,d,h],[u,v+d,d,h],[u+d,v,w,d],[u+d+w,v,w,d],[u+d,v+d,w,h],[u+2*d+w,v+d,w,h]];
            const uv=geo.attributes.uv;
            rects.forEach(([a,b,c,e],face)=>[[a,b],[a+c,b],[a,b+e],[a+c,b+e]].forEach(([px,py],i)=>uv.setXY(face*4+i,px/64,1-py/64)));
            const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
        }
        part(rider,8,12,4,16,16,0,10,0);part(rider,8,12,4,16,32,0,10,0,.5);
        part(rider,8,8,8,0,0,0,20,0);part(rider,8,8,8,32,0,0,20,0,.7);
        const armWidth=setting.model==='slim'?3:4;
        for(const side of [-1,1]) {
            const arm=new THREE.Group();arm.position.set(side*(4+armWidth/2),15,0);arm.rotation.x=-.42;rider.add(arm);
            const right=side===-1;
            part(arm,armWidth,12,4,right?40:32,right?16:48,0,-5,0);
            part(arm,armWidth,12,4,right?40:48,right?32:48,0,-5,0,.5);
            const leg=new THREE.Group();leg.position.set(side*2,4,0);leg.rotation.x=-Math.PI/2;leg.rotation.z=side*.08;rider.add(leg);
            part(leg,4,12,4,right?0:16,right?16:48,0,-6,0);
            part(leg,4,12,4,right?0:0,right?32:48,0,-6,0,.5);
        }
    }
    function updateRider(active,y) {
        let setting=defaultSkin;
        // Count from the oldest/end node: 1 is the final node. Switch AFTER crossing it.
        for(const rule of switches) if(rule.afterFromEnd<=positions.length && active>positions.length-rule.afterFromEnd) setting=rule;
        if(branchCurve && y>mergeY)setting=branchSkins.restoration;
        setRider(setting);setRider(branchSkins.vanilla,branchRider);
    }
    const particleCount=lowPower?24:70;
    const particleGeo=own(new THREE.BufferGeometry());
    const particlePositions=new Float32Array(particleCount*3);particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
    const particleMat=own(new THREE.PointsMaterial({color:0xe8d7a1,size:2,transparent:true,opacity:.45,sizeAttenuation:false,depthWrite:false}));
    const particles=new THREE.Points(particleGeo,particleMat);particles.frustumCulled=false;scene.add(particles);
    const warmLight=new THREE.PointLight(0xffb747,1700,180,2);scene.add(warmLight);

    let chestRenderer=null;
    const chestViews=new Map();
    if(chestAsset) {
        chestRenderer = new THREE.WebGLRenderer({alpha:true,antialias:false});chestRenderer.setSize(132,160,false);chestRenderer.setPixelRatio(1);chestRenderer.outputColorSpace=THREE.SRGBColorSpace;
        app.querySelectorAll('.mc-chest-btn').forEach(button=>{
            const object=chestAsset.scene.clone(true),viewScene=new THREE.Scene();viewScene.add(object);
            viewScene.add(new THREE.HemisphereLight(0xf1e5ff,0x4c5461,2.8));
            const light=new THREE.DirectionalLight(0xffe4ba,3.2);light.position.set(-3,5,-4);viewScene.add(light);
            const hinges=object.children.filter(part=>part.name==='lid'||part.name==='knob');const rests=hinges.map(part=>part.quaternion.clone());
            const rotation=new THREE.Quaternion(),axis=new THREE.Vector3(1,0,0);
            const pose=amount=>{hinges.forEach((part,i)=>part.quaternion.copy(rests[i]).multiply(rotation.setFromAxisAngle(axis,1.3*amount)));object.updateMatrixWorld(true);};
            // Union ALL poses, then project all box corners into the final camera.
            const union=new THREE.Box3();for(let step=0;step<=24;step++) {pose(step/24);union.union(new THREE.Box3().setFromObject(object));}pose(0);
            const center=union.getCenter(new THREE.Vector3()),viewCamera=new THREE.OrthographicCamera(-1,1,1,-1,.01,100);
            viewCamera.position.copy(center).add(new THREE.Vector3(2.5,2.1,-6));viewCamera.lookAt(center);viewCamera.updateMatrixWorld(true);
            let maxX=0,maxY=0;
            for(const x of [union.min.x,union.max.x])for(const y of [union.min.y,union.max.y])for(const z of [union.min.z,union.max.z]) {
                const p=new THREE.Vector3(x,y,z).applyMatrix4(viewCamera.matrixWorldInverse);maxX=Math.max(maxX,Math.abs(p.x));maxY=Math.max(maxY,Math.abs(p.y));
            }
            const half=Math.max(maxY,maxX/(132/160))*1.12;
            viewCamera.top=half;viewCamera.bottom=-half;viewCamera.left=-half*132/160;viewCamera.right=half*132/160;viewCamera.updateProjectionMatrix();
            const output=document.createElement('canvas');output.width=132;output.height=160;output.setAttribute('aria-hidden','true');button.prepend(output);button.classList.add('is-3d');
            chestViews.set(button,{button,object,scene:viewScene,camera:viewCamera,pose,output,context:output.getContext('2d'),amount:0,dirty:true});
        });
    }
    function drawChest(view) {
        view.pose(view.amount);chestRenderer.render(view.scene,view.camera);view.context.clearRect(0,0,132,160);view.context.drawImage(chestRenderer.domElement,0,0);view.dirty=false;
        view.button.dataset.openAmount=view.amount.toFixed(3);
    }
    let chestFrame=0,completeOpening=null;
    function openChest(button) {
        const view=chestViews.get(button);if(!view||disposed)return Promise.resolve();
        return new Promise(resolve=>{
            completeOpening=resolve;const start=performance.now();
            function animate(now) {
                if(disposed) {resolve();return;}
                const t=Math.min(1,(now-start)/650);view.amount=1-(1-t)**3;drawChest(view);
                if(t<1)chestFrame=requestAnimationFrame(animate);else {completeOpening=null;resolve();}
            }
            chestFrame=requestAnimationFrame(animate);
        });
    }
    function resetChests() {for(const view of chestViews.values()) {view.amount=0;view.dirty=true;}}
    const forward=new THREE.Vector3(0,0,1);
    let previousPageScroll=null, facingDown=false, riderTurn=0, previousTurnTime=null;
    function render(y,scrollY,time,reduce,active) {
        if(disposed||!curve)return;
        // Use actual page movement (also works with SmoothScroll), not cart easing or focus.
        const pageScroll=window.scrollY;
        if(previousPageScroll!==null && !app.querySelector('dialog').open) {
            if(pageScroll-previousPageScroll>1)facingDown=true;
            else if(pageScroll-previousPageScroll < -1)facingDown=false;
        }
        previousPageScroll=pageScroll;
        const turnTarget=facingDown?Math.PI:0;
        const elapsed=previousTurnTime===null?0:Math.max(0,time-previousTurnTime);
        previousTurnTime=time;
        riderTurn=reduce?turnTarget:riderTurn+(turnTarget-riderTurn)*(1-Math.exp(-elapsed/90));
        rider.rotation.y=branchRider.rotation.y=riderTurn;
        app.dataset.riderFacing=facingDown?'front':'back';
        const width=innerWidth,height=innerHeight;
        const origin=scrollY-240,centerZ=(origin+(height+480)/2)/.8;
        // Native scrolling moves this overscanned canvas and the cards in the same compositor frame.
        canvas.style.top=`${origin}px`;
        sun.position.set(width/2-350,700,centerZ-350);sun.target.position.set(width/2,0,centerZ);
        const extent=Math.max(width,height+480);
        Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:1,far:3000});sun.shadow.camera.updateProjectionMatrix();
        for(const name of ['lava_still','magma']) {const texture=textures[name],frames=texture.image.height/texture.image.width;texture.offset.y=(reduce?0:Math.floor(time/120)%frames)/frames;}
        camera.position.set(width/2,1200,centerZ+900);camera.lookAt(width/2,0,centerZ);camera.updateMatrixWorld();
        const t=parameterAt(y),position=curve.getPointAt(t),tangent=curve.getTangentAt(t).normalize();
        cart.position.copy(position);cart.position.y+=1;
        updateRider(active,y);
        const separation=branchCurve?Math.max(0,Math.min(1,(y-mergeY)/80)):0;
        const blend=separation*separation*(3-2*separation);
        branchCart.visible=Boolean(branchCurve)&&separation>0;
        if(branchCurve) {
            const branchY=Math.max(mergeY,Math.min(branchEndY-95,y));
            const branch=onBranch(branchCurve,branchY);
            branchCart.position.copy(branch.position);branchCart.position.y+=1;
            // Both carts approach the same position and heading before the second disappears.
            branchCart.position.lerp(cart.position,1-blend);
            branchCart.quaternion.setFromUnitVectors(forward,branch.tangent.negate());
            const sharedHeading=new THREE.Quaternion().setFromUnitVectors(forward,tangent.clone().negate());
            branchCart.quaternion.slerp(sharedHeading,1-blend);
            branchCart.traverse(mesh=>{if(mesh.isMesh) {
                for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]) {
                    const transparent=blend<1;
                    if(mat.transparent!==transparent) {mat.transparent=transparent;mat.needsUpdate=true;}
                    mat.opacity=blend;mat.depthWrite=!transparent;
                }
            }});
            app.dataset.branchCartY=branchY.toFixed(1);
        }
        app.dataset.mergeSeparation=separation.toFixed(3);
        app.dataset.routeMode=branchCurve&&y>mergeY?'origins':'shared';
        // The cart's long axis follows rail yaw AND grade in world coordinates.
        cart.quaternion.setFromUnitVectors(forward,tangent.clone().negate());
        app.dataset.cartYaw=Math.atan2(tangent.x,tangent.z).toFixed(4);
        app.dataset.cartPitch=Math.asin(tangent.y).toFixed(4);
        app.dataset.cartY=y.toFixed(1);
        torches.forEach((torch,i)=>{torch.ember.position.y=torch.baseY+(reduce?0:Math.sin(time*.009+i)*1.5);torch.ember.scale.y=reduce?5:4+Math.sin(time*.015+i)*1.2;});
        const nearest=torches[Math.min(active,torches.length-1)];
        if(nearest) {warmLight.position.copy(nearest.group.position);warmLight.position.y=80;warmLight.color.set(nearest.soul?0x71e4e5:0xffb747);warmLight.intensity=reduce?1200:1200+Math.sin(time*.009)*180;}
        for(let i=0;i<particleCount;i++) {
            const drift=reduce?0:time*.005;
            particlePositions[i*3]=hash(i,1)*width+Math.sin(time*.0005+i)*(!reduce?5:0);
            particlePositions[i*3+1]=25+hash(i,3)*50;
            particlePositions[i*3+2]=(scrollY+((hash(i,2)*height-drift)%height+height)%height)/.8;
        }
        particleGeo.attributes.position.needsUpdate=true;
        renderer.render(scene,camera);
        for(const view of chestViews.values()) {
            if(!view.dirty)continue;
            const box=view.button.getBoundingClientRect();
            if(box.bottom>-200&&box.top<height+200)drawChest(view);
        }
    }
    function dispose() {
        disposed=true;cancelAnimationFrame(chestFrame);completeOpening?.();
        worldGroup.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();});temporaryGeometry.forEach(g=>g.dispose());owned.forEach(resource=>resource.dispose());
        renderer.dispose();chestRenderer?.dispose();
        for(const view of chestViews.values()) {view.output.remove();view.button.classList.remove('is-3d');}
        chestViews.clear();
    }
    return {
        layout,render,openChest,resetChests,dispose,
        // Mobile renders on interaction and while the cart settles. Desktop keeps
        // ambient torch/lava animation running continuously.
        frameInterval:lowPower?40:32,
        continuous:!lowPower,
    };
}

