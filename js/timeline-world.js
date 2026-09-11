// Longitudinal orthographic scrolling with transverse perspective for inward-facing sides.
// Chest thumbnails share a second renderer; the number of WebGL contexts is constant.
export async function createWorld(app) {
    const assets = window.sducraftTimelineAssets;
    const THREE = await import(new URL(assets.three, document.baseURI).href);
    const {GLTFLoader} = await import(new URL(assets.loader, document.baseURI).href);
    const canvas = app.querySelector('.mc-world-canvas');
    const coarsePointer = matchMedia('(pointer: coarse)').matches;
    const limitedHardware = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    const profile = app.timelineQuality || {};
    const quality = profile.name || app.dataset.quality || 'auto';
    const lowPower = quality === 'low' || (quality === 'auto' && (coarsePointer || limitedHardware || innerWidth < 600));
    const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio, profile.ratio ?? (lowPower ? 1 : quality === 'high' ? 2 : 1.5)));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    app.dataset.worldQuality = lowPower ? 'mobile' : 'full';
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();
    scene.add(new THREE.HemisphereLight(0xfff0dd,0x283039,1.45));
    renderer.shadowMap.enabled=profile.shadows ?? !lowPower; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const sun = new THREE.DirectionalLight(0xffeed0,2.5); sun.position.set(-300,600,100); scene.add(sun); scene.add(sun.target); sun.castShadow=true; sun.shadow.mapSize.set(innerWidth<900?1024:2048,innerWidth<900?1024:2048); sun.shadow.normalBias=1.2; sun.shadow.bias=-.0002;
    const textures = {}, owned = new Set();
    const transverseDepth={value:0};
    const own = resource => {
        owned.add(resource);
        if(resource.isMaterial) {
            resource.onBeforeCompile=shader=>{
                shader.uniforms.transverseDepth=transverseDepth;
                shader.vertexShader='uniform float transverseDepth;\n'+shader.vertexShader;
                shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
                    vec4 terrainPosition=vec4(transformed,1.0);
                    #ifdef USE_INSTANCING
                        terrainPosition=instanceMatrix*terrainPosition;
                    #endif
                    terrainPosition=modelMatrix*terrainPosition;
                    gl_Position.x/=max(0.65,1.0-terrainPosition.y*transverseDepth);
                `);
            };
            resource.customProgramCacheKey=()=> 'timeline-transverse-v1';
        }
        return resource;
    };
    const names = ['rail','powered_rail_on','stone','moss_block','iron_ore','coal_ore','copper_ore','oak_log','oak_log_top','oak_planks','torch','crafting_table_top','crafting_table_side','crafting_table_front','oak_leaves','grass_block_top','grass_block_side','dirt','deepslate','deepslate_top','deepslate_diamond_ore','netherrack','blackstone','magma','lava_still','bedrock'];
    const loader = new THREE.TextureLoader();
    names.push('cherry_log','cherry_log_top','cherry_leaves','cherry_planks','pink_petals');
    names.push('dripstone_block','pointed_dripstone_up_base','pointed_dripstone_up_tip','amethyst_block','amethyst_cluster','calcite','smooth_basalt','flowering_azalea_leaves','cave_vines_lit','cave_vines_plant_lit','water_still');
    names.push('../particle/cherry_0','../particle/cherry_5','../particle/cherry_9');
    names.push('pointed_dripstone_up_middle','pointed_dripstone_up_frustum','sculk','sculk_sensor_bottom','sculk_sensor_side','sculk_sensor_top','sculk_sensor_tendril_inactive','sculk_catalyst_bottom','sculk_catalyst_side','sculk_catalyst_top','deepslate_bricks','cracked_deepslate_bricks');
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
        textures.cherry_leaves.userData.cutout=true;
        textures.flowering_azalea_leaves.userData.cutout=true;
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
        return flatMaterials[key] ||= own(new THREE.MeshLambertMaterial({map:textures[name],color,alphaTest:textures[name]?.userData.cutout ? .5:0,emissive:name==='lava_still'?0xff6b12:name==='magma'?0x9b2d05:0,emissiveMap:['lava_still','magma'].includes(name)?textures[name]:null,emissiveIntensity:.65}));
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
    let cherryTrees=[];
    function onBranch(path,y) {
        let lo=0,hi=1;for(let i=0;i<24;i++) {const mid=(lo+hi)/2,p=path.getPoint(mid);if(p.z*.8-p.y*.6<y)lo=mid;else hi=mid;}
        return {position:path.getPoint((lo+hi)/2),tangent:path.getTangent((lo+hi)/2).normalize()};
    }
    const temporaryGeometry = new Set();
    const dummy = new THREE.Object3D();
    const BLOCK = 64;
    // Vanilla flower_amount adds one quadrant at a time, rather than a full atlas tile.
    const petalGeometries=[[0,0,2.99],[0,1,1],[1,1,2],[1,0,2]].map(([x,z,h])=>{
        const geometry=own(new THREE.PlaneGeometry(BLOCK/2,BLOCK/2)),uv=geometry.attributes.uv;
        for(let i=0;i<uv.count;i++)uv.setXY(i,(x+uv.getX(i))/2,(1-z+uv.getY(i))/2);
        geometry.rotateX(-Math.PI/2);geometry.translate((x-.5)*BLOCK/2,h*4,(z-.5)*BLOCK/2);return geometry;
    });
    const petalMaterial=own(new THREE.MeshLambertMaterial({map:textures.pink_petals,alphaTest:.5,side:THREE.DoubleSide}));
    // Crossed, cutout planes preserve the vanilla silhouettes of vines and crystals.
    const caveCross=own(new THREE.BufferGeometry());
    {
        const vertices=[],uvs=[],indices=[];
        for(const angle of [Math.PI/4,-Math.PI/4]) {
            const x=Math.cos(angle)*32,z=Math.sin(angle)*32,n=vertices.length/3;
            vertices.push(-x,0,-z,x,0,z,-x,64,-z,x,64,z);
            uvs.push(0,0,1,0,0,1,1,1);indices.push(n,n+1,n+2,n+1,n+3,n+2);
        }
        caveCross.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
        caveCross.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
        caveCross.setIndex(indices);caveCross.computeVertexNormals();
    }
    const sensorTendril=own(caveCross.clone());
    for(let i=0;i<sensorTendril.attributes.uv.count;i++) {
        const uv=sensorTendril.attributes.uv;uv.setXY(i,.25+uv.getX(i)*.5,uv.getY(i)*.5);
    }
    const sensorBody=own(new THREE.BoxGeometry(64,32,64));
    for(const face of [0,1,4,5])for(let i=0;i<4;i++) {
        const uv=sensorBody.attributes.uv,n=face*4+i;uv.setY(n,uv.getY(n)*.5);
    }
    const caveMaterials={};
    function caveMaterial(name) {
        return caveMaterials[name] ||= own(new THREE.MeshLambertMaterial({map:textures[name],side:THREE.DoubleSide,alphaTest:.5,
            emissive:name.includes('vines')?0x8f7130:name==='amethyst_cluster'?0x75519b:0,
            emissiveMap:textures[name],emissiveIntensity:.3}));
    }
    // Vanilla fence_post: a 4×16×4 post using the central strip of oak planks.
    const fenceGeometry=own(new THREE.BoxGeometry(16,64,16));
    for(let face=0;face<6;face++) {
        const uv=fenceGeometry.attributes.uv,cap=face===2||face===3;
        for(let i=0;i<4;i++) {const n=face*4+i;uv.setXY(n,(6+uv.getX(n)*4)/16,cap?(6+uv.getY(n)*4)/16:uv.getY(n));}
    }
    function fencePost(group,x,y,z) {
        const mesh=new THREE.Mesh(fenceGeometry,material('oak_planks','#ffffff'));
        mesh.position.set(x,y+32,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
    }
    // Vanilla fence_side: two 2×3×9 rails, meeting the adjacent post halfway.
    const fenceArms=[{height:54,v:1},{height:30,v:7}].map(({height,v})=>{
        const geometry=own(new THREE.BoxGeometry(8,12,36)),uv=geometry.attributes.uv;
        for(let face=0;face<6;face++) {
            const rect=face<2?[0,v,9,v+3]:face<4?[7,0,9,9]:[7,v,9,v+3];
            for(let i=0;i<4;i++){const n=face*4+i,u=uv.getX(n),w=uv.getY(n);uv.setXY(n,(rect[0]+u*(rect[2]-rect[0]))/16,1-(rect[3]-w*(rect[3]-rect[1]))/16);}
        }
        geometry.translate(0,height,-14);return geometry;
    });
    function fenceArm(group,x,y,z,angle) {
        for(const geometry of fenceArms) {
            const mesh=new THREE.Mesh(geometry,material('oak_planks','#ffffff'));
            mesh.position.set(x,y,z);mesh.rotation.y=angle;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
        }
    }
    const hash = (x,z) => {const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n);};
    const toWorld = (x,y,h = 0) => new THREE.Vector3(x,h,(y + .6*h)/.8);
    let routeElevation=()=>0;
    function surfaceWorld(x,y,offset=0) {
        const height=routeElevation(y)+offset,width=app.clientWidth,distance=Math.max(1400,width*1.25);
        return toWorld(width/2+(x-width/2)*(1-height/distance),y,height);
    }
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
        const distances=[...new Set([...Array.from({length:steps+1},(_,i)=>from+(to-from)*i/steps),...(path.railBreaks||[]).filter(d=>d>from&&d<to)])].sort((a,b)=>a-b);
        for(let i=0;i<distances.length;i++) {
            const distance=distances[i],t=Math.max(0,Math.min(1,distance/length)),p=path.getPointAt(t),tangent=path.getTangentAt(t);
            const normal = new THREE.Vector3(tangent.z,0,-tangent.x).normalize().multiplyScalar(width/2);
            for(const sign of [-1,1]) verts.push(p.x+normal.x*sign,p.y+elevation,p.z+normal.z*sign);
            uvs.push(0,distance/40,1,distance/40);
            if(i<distances.length-1) {const n=count*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);} count++;
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
        const group = new THREE.Group();group.position.copy(surfaceWorld(x,screenY));worldGroup.add(group);
        fencePost(group,0,-24,0);
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
        worldGroup = new THREE.Group();worldGroup.userData.layoutKey=key;scene.add(worldGroup);torches=[];cherryTrees=[];
        points=[toWorld(width*(mobile?.7:.8),90,1),toWorld(width*(mobile?.7:.76),mobile?430:420,1)];
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
        const planar=new THREE.CatmullRomCurve3(points,false,'centripetal');
        const eligible=stations.slice(0,-1).map((p,i)=>({p,next:stations[i+1],i})).filter(({p,next})=>!p.origin&&!next.origin);
        const ramps=[];let currentHeight=0;
        const count=Math.min(6,Math.floor(eligible.length/3));
        const chosen=new Map();
        for(let i=0;i<count;i++) {
            chosen.set(Math.round((i+1)/(count+1)*eligible.length*.48),-1);
            chosen.set(Math.round(eligible.length*(.6+.36*(i+1)/(count+1))),1);
        }
        eligible.forEach(({p,next},i)=>{
            if(!chosen.has(i))return;
            const direction=chosen.get(i),from=currentHeight,to=from+direction*BLOCK;
            const center=(p.card.y+p.card.height+next.card.y)/2;
            const duration=direction<0?BLOCK*1.4:BLOCK*.2;
            const z=Math.round(((center-duration/2+.6*(from+1))/.8+32)/BLOCK)*BLOCK-32;
            const start=z*.8-.6*(from+1),end=(z+BLOCK)*.8-.6*(to+1);
            ramps.push({start,end,from,to,z,boundaryZ:direction<0?z:z+BLOCK});currentHeight=to;
        });
        routeElevation=y=>{
            let height=0;
            for(const r of ramps){if(y<r.start)break;if(y<r.end)return r.from+(r.to-r.from)*(y-r.start)/(r.end-r.start);height=r.to;}
            return height;
        };
        function pointAtScreen(y) {
            let lo=0,hi=1;for(let i=0;i<26;i++){const mid=(lo+hi)/2,p=planar.getPoint(mid);if(p.z*.8-p.y*.6<y)lo=mid;else hi=mid;}
            const p=planar.getPoint((lo+hi)/2);
            return surfaceWorld(p.x,y,1);
        }
        const firstY=points[0].z*.8-.6,lastY=points.at(-1).z*.8-.6;
        const screenSteps=[...new Set([...Array.from({length:Math.ceil((lastY-firstY)/8)+1},(_,i)=>Math.min(lastY,firstY+i*8)),lastY,...ramps.flatMap(r=>[r.start,r.end])])].sort((a,b)=>a-b);
        curve=new THREE.CurvePath();
        for(let i=1;i<screenSteps.length;i++)curve.add(new THREE.LineCurve3(pointAtScreen(screenSteps[i-1]),pointAtScreen(screenSteps[i])));
        // CurvePath.getPoint already uses distance; preserve exact ramp corners.
        curve.getPointAt=curve.getPoint.bind(curve);
        curve.railBreaks=curve.getCurveLengths();routeLength=curve.getLength();
        app.dataset.railRamps=JSON.stringify(ramps);
        const sampleCount=Math.ceil(routeLength/8)+1;
        samples=Array.from({length:sampleCount},(_,i)=>{const t=i/(sampleCount-1),p=curve.getPointAt(t);return {t,x:width/2+(p.x-width/2)/(1-p.y/Math.max(1400,width*1.25)),y:p.z*.8-p.y*.6};});
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
                const side=material(type==='sculk_catalyst'?'sculk_catalyst_side':type==='grass_block_top'?'grass_block_side':type,color);
                const top=material(type==='sculk_catalyst'?'sculk_catalyst_top':type==='deepslate'?'deepslate_top':type.endsWith('_log')?type+'_top':type,type==='grass_block_top'?'#76a944':color);
                const bottom=type==='sculk_catalyst'?material('sculk_catalyst_bottom',color):side;
                batches.set(key,{mat:[side,side,top,bottom,side,side],blocks:[]});
            }
            batches.get(key).blocks.push({x,y,z});
        }
        const rows=Math.ceil(totalHeight/(BLOCK*.8))+5;
        const entranceY=350,entrance=curve.getPointAt(parameterAt(entranceY));
        const flowers=new Map();
        const perspectiveDistance=Math.max(1400,width*1.25);
        function railX(y) {
            let lo=0,hi=samples.length-1;
            while(hi-lo>1){const mid=(lo+hi)>>1;if(samples[mid].y<y)lo=mid;else hi=mid;}
            const a=samples[lo],b=samples[hi],f=Math.max(0,Math.min(1,(y-a.y)/(b.y-a.y||1)));
            return a.x+(b.x-a.x)*f;
        }
        function clearTrack(x,z,bottom,top) {
            const project=(v,h)=>width/2+(v-width/2)/Math.max(.65,1-h/perspectiveDistance);
            const edges=[project(x-32,bottom),project(x+32,bottom),project(x-32,top),project(x+32,top)];
            const left=Math.min(...edges)-46,right=Math.max(...edges)+46;
            // Include the physical footprint and the full projected volume, plus rider height.
            const start=z*.8-32-top*.6,end=z*.8+64-bottom*.6;
            for(let y=start;y<=end;y+=16) {
                const main=railX(y);
                if(main>left && main<right)return false;
                if(branchCurve && y>=mergeY && y<=branchEndY) {
                    const other=onBranch(branchCurve,y).position.x;
                    if(other>left && other<right)return false;
                }
            }
            return true;
        }
        function clearDisplay(x,z,bottom,top,radius=32,includeSupports=false) {
            const edges=[bottom,top].flatMap(h=>[-radius,radius].map(dx=>width/2+(x+dx-width/2)/Math.max(.65,1-h/perspectiveDistance)));
            const left=Math.min(...edges),right=Math.max(...edges),start=(z-radius)*.8-top*.6,end=(z+radius)*.8-bottom*.6;
            // Photo feet sit 42px below the frame and extend another 20px in projection.
            // Reserve the complete base and fence area when planting ground flowers.
            const below=includeSupports?70:32;
            return !stations.some(p=>[p.card,p.photo].filter(Boolean).some(rect=>left<rect.x+rect.width+16 && right>rect.x-16 && start<rect.y+rect.height+below && end>rect.y-24));
        }
        const caveSprites=new Map();
        function caveSprite(name,x,y,z,scale=1) {
            const key=name+':'+Math.floor(z/(BLOCK*12));
            if(!caveSprites.has(key))caveSprites.set(key,{name,items:[]});
            caveSprites.get(key).items.push({x,y,z,scale});
        }
        // A handful of broad pockets, separated by ordinary rock. Centers follow gaps
        // between displays, so each pocket has an unobstructed view on narrow screens too.
        const markedGaps=eligible.filter(({p})=>p.scenery);
        const caveRegions=[['lush',.28,620],['deepdark',.43,580],['geode',.54,180],['lush',.65,500],['dripstone',.76,520]].map(([kind,fraction,radius],index)=>{
            const gaps=eligible.map(({p,next})=>(Math.max(p.card.y+p.card.height,p.photo?p.photo.y+p.photo.height:0)+next.card.y)/2);
            const marked=markedGaps[index];
            const center=marked?(Math.max(marked.p.card.y+marked.p.card.height,marked.p.photo?marked.p.photo.y+marked.p.photo.height:0)+marked.next.card.y)/2:gaps.reduce((best,y)=>Math.abs(y-totalHeight*fraction)<Math.abs(best-totalHeight*fraction)?y:best,gaps[0]||totalHeight*fraction);
            const anchor=surfaceWorld(width*(mobile?.64:.76),center);
            return {kind:marked?.p.scenery||kind,center,radius,x:Math.round((anchor.x-32)/BLOCK)*BLOCK+32,z:Math.round(anchor.z/BLOCK)*BLOCK};
        });
        const caveStats={lush:0,dripstone:0,deepdark:0,geode:0,raised:0,lowered:0};
        const dripstoneHeights=[];
        for(const region of caveRegions.filter(p=>p.kind==='geode')) {
            let best=-1,anchor={x:region.x,z:region.z};
            for(let x=32;x<width;x+=BLOCK)for(let dz=-3;dz<=3;dz++) {
                const z=region.z+dz*BLOCK;
                let ground=0;for(const ramp of ramps){if(z<ramp.boundaryZ)break;ground=ramp.to;}
                let score=0;
                for(let dx=-2;dx<=2;dx++)for(let dr=-2;dr<=2;dr++) {
                    if(Math.hypot(dx,dr)>2.6)continue;
                    const px=x+dx*BLOCK,pz=z+dr*BLOCK;
                    if(px>0 && px<width && clearTrack(px,pz,ground,ground+BLOCK*2) && clearDisplay(px,pz,ground,ground+BLOCK*2))score++;
                }
                if(score>best){best=score;anchor={x,z};}
            }
            Object.assign(region,anchor);
            region.center=region.z*.8-routeElevation(region.center)*.6;
            region.radius=240;
        }
        const columns=Math.ceil(width*1.35/BLOCK)+2;
        // Geological transitions follow world distance, independently of the year markers.
        for(let row=-3;row<rows;row++) {
            for(let col=-Math.ceil(width*.35/BLOCK);col<columns;col++) {
                const x=col*BLOCK+BLOCK/2,z=row*BLOCK,r=hash(col,row);
                let baseHeight=0;
                for(const ramp of ramps){if(z<ramp.boundaryZ)break;baseHeight=ramp.to/BLOCK;}
                const pageY=z*.8-baseHeight*BLOCK*.6;
                // The mine returns to daylight before the founding clearing.
                // Blend geology by distance so the workbench is not adjacent to a Nether biome.
                const returnDepth=Number.isFinite(mergeY)?Math.max(0,(mergeY+180-pageY)/(BLOCK*24)):1;
                const depth=(count ? -baseHeight/count*.65 : Math.min(pageY/totalHeight,returnDepth))+(hash(col,Math.floor(row/4))-.5)*.085;
                const originGarden=returnDepth<.16;
                const cherryGrove=pageY<totalHeight*.16 && !originGarden;
                let type=depth<.16?(r>.9?'moss_block':'grass_block_top'):depth<.22?'dirt':depth<.49?(r>.96?'iron_ore':r>.91?'coal_ore':'stone'):(r>.97?'deepslate_diamond_ore':'deepslate');
                const awayFromStation=!stations.some(p=>pageY>p.card.y-90 && pageY<p.card.y+p.card.height+100 || p.photo && pageY>p.photo.y-90 && pageY<p.photo.y+p.photo.height+110);
                const relief=Math.sin(col*.53+Math.sin(row*.075))*.8+Math.cos(row*.17-col*.24)*.65;
                // Broad, connected terraces reach into the scene; track and display
                // footprints stay at the original elevation, including their supports.
                let localHeight=originGarden?Math.max(0,Math.round(relief*.5)):Math.max(-1,Math.min(2,Math.round(relief)));
                const region=depth>.22&&!originGarden?caveRegions.find(p=>Math.abs(pageY-p.center)<p.radius*(.82+.18*Math.sin(col*.7+row*.11))):null;
                if(region?.kind==='lush')type=r>.88?'dirt':'moss_block';
                if(region?.kind==='dripstone' && r>.18)type='dripstone_block';
                if(region?.kind==='deepdark') {
                    const cover=1-Math.abs(pageY-region.center)/region.radius;
                    type=hash(col+11,Math.floor(row/2))<.35+cover*.6?'sculk':'deepslate';
                }
                const scenicPool=region?.kind!=='deepdark' && !originGarden && depth>.55 && awayFromStation && Math.sin(row*.027+col*.21)>.98 && Math.cos(col*.38-row*.016)>.94;
                const lushPool=region?.kind==='lush' && relief<-.75 && Math.cos(row*.35+col*.3)>.35;
                if(scenicPool||lushPool)localHeight=-1;
                if(region?.kind==='geode' && Math.hypot((x-region.x)/BLOCK,(z-region.z)/BLOCK)<2.6)localHeight=0;
                let height=baseHeight+localHeight;
                // One contiguous height field serves every biome; tracks have a reserved corridor.
                if(!clearTrack(x,z,(baseHeight-1)*BLOCK,height*BLOCK))height=baseHeight;
                if(!clearDisplay(x,z,(baseHeight-1)*BLOCK,(Math.max(baseHeight,height)+1)*BLOCK))height=baseHeight;
                if(Math.abs(pageY-entranceY)<180 && Math.abs(x-entrance.x)<200)height=0;
                const pool=height<baseHeight && (scenicPool||lushPool);
                if(height>baseHeight)caveStats.raised++;
                if(height<baseHeight)caveStats.lowered++;
                for(let layer=baseHeight-2;layer<height;layer++) {
                    const surface=layer===height-1;
                    const cellType=!surface && type==='sculk'?'deepslate':!surface && (type==='grass_block_top'||type==='moss_block')?'dirt':type;
                    block(x,(layer+.5)*BLOCK,z,cellType);
                }
                if(pool) {
                    const liquid=box(worldGroup,x,height*BLOCK+8,z,BLOCK,1,BLOCK,material(lushPool?'water_still':'lava_still',lushPool?'#4c9dba':'#ffffff'));
                    liquid.castShadow=false;
                }
                const scenicTop=height+(region?.kind==='dripstone'?1:region?.kind==='deepdark'?2:mobile?2:4);
                const scenicClear=!pool && x>0 && x<width && clearTrack(x,z,height*BLOCK,scenicTop*BLOCK) && clearDisplay(x,z,height*BLOCK,scenicTop*BLOCK,42);
                if(region && scenicClear && row%(mobile?2:3)===0 && hash(col+3,row)>(mobile?.25:.48)) {
                    if(region.kind==='lush') {
                        // Mossy rock shelves support hanging vines; bushes stay near the floor.
                        block(x,(height+.5)*BLOCK,z,'moss_block','#9cb777');
                        block(x,(height+1.5)*BLOCK,z,'flowering_azalea_leaves','#d4dfa6');
                        if(mobile) {
                            caveSprite('cave_vines_lit',x,height*BLOCK,z+33);
                        } else if(hash(col,row+7)>.45) {
                            // A solid column behind the greenery holds the overhanging lip.
                            for(let tier=2;tier<4;tier++)block(x,(height+tier+.5)*BLOCK,z,'moss_block','#9cb777');
                            caveSprite('cave_vines_plant_lit',x,height*BLOCK+128,z+33);
                            caveSprite('cave_vines_lit',x,height*BLOCK+64,z+33);
                        }
                        caveStats.lush++;
                    } else if(region.kind==='dripstone') {
                        let segments=1+Math.floor(hash(col+29,row-13)*(mobile?3:4));
                        while(segments>1 && (!clearTrack(x,z,height*BLOCK,(height+segments)*BLOCK) || !clearDisplay(x,z,height*BLOCK,(height+segments)*BLOCK,42)))segments--;
                        // Vanilla thickness progression: broad base/middle, taper, then tip.
                        for(let segment=0;segment<segments;segment++) {
                            const thickness=segment===segments-1?'tip':segment===segments-2?'frustum':segment===0?'base':'middle';
                            caveSprite('pointed_dripstone_up_'+thickness,x,(height+segment)*BLOCK,z);
                        }
                        dripstoneHeights.push(segments);
                        caveStats.dripstone++;
                    } else if(region.kind==='deepdark') {
                        const feature=hash(col-17,row+5);
                        if(feature<.45) {
                            // Vanilla sensor: half-block body and four eight-pixel tendrils.
                            const side=material('sculk_sensor_side','#b8d4ce');
                            const sensor=new THREE.Mesh(sensorBody,[side,side,material('sculk_sensor_top','#b8d4ce'),material('sculk_sensor_bottom','#b8d4ce'),side,side]);
                            sensor.position.set(x,height*BLOCK+16,z);sensor.castShadow=sensor.receiveShadow=true;worldGroup.add(sensor);
                            for(const dx of [-20,20])for(const dz of [-20,20])caveSprite('sculk_sensor_tendril_inactive',x+dx,height*BLOCK+32,z+dz,.5);
                        } else if(feature<.7)block(x,(height+.5)*BLOCK,z,'sculk_catalyst','#d0dcd6');
                        else {
                            const tiers=mobile?1:hash(col,row+4)>.6?2:1;
                            for(let tier=0;tier<tiers;tier++)block(x,(height+tier+.5)*BLOCK,z,tier?'cracked_deepslate_bricks':'deepslate_bricks','#819695');
                        }
                        caveStats.deepdark++;
                    }
                }
                if(region?.kind==='geode' && x>0 && x<width && clearTrack(x,z,height*BLOCK,(height+2)*BLOCK) && clearDisplay(x,z,height*BLOCK,(height+2)*BLOCK)) {
                    // Open, stepped geode: basalt shell, pale calcite rim, purple interior.
                    const distance=Math.hypot((x-region.x)/BLOCK,(z-region.z)/BLOCK);
                    if(distance<2.6) {
                        const shell=distance>1.8, rim=distance>1.1;
                        block(x,(height+.5)*BLOCK,z,shell?'smooth_basalt':rim?'calcite':'amethyst_block',shell?'#aaaaaa':'#eee4ff');
                        if(shell && z<region.z)block(x,(height+1.5)*BLOCK,z,'calcite','#eee4ff');
                        if(!shell && r>.25)caveSprite('amethyst_cluster',x,(height+1)*BLOCK,z,.5+.4*r);
                        caveStats.geode++;
                    }
                }
                // Flowers inherit terrain height, but must not grow through display supports.
                const patch=(Math.sin(col*.62+Math.sin(row*.23))+Math.cos(row*.39-col*.18)+2)/4;
                const flowerChance=.04+.38*patch*patch;
                if(cherryGrove && depth<.16 && r>1-flowerChance && clearTrack(x,z,height*BLOCK,height*BLOCK+12) && clearDisplay(x,z,height*BLOCK,height*BLOCK+12,32,true)) {
                    const chunk=Math.floor(row/12);
                    if(!flowers.has(chunk))flowers.set(chunk,[]);
                    const density=hash(col+19,row-7),amount=density<.45?1:density<.8?2:density<.96?3:4;
                    flowers.get(chunk).push({x,z,y:height*BLOCK,amount,rotation:Math.floor(hash(row,col)*4)*Math.PI/2});
                }
                if((depth<.15||originGarden) && row%(cherryGrove?11:17)===0 && (col===0 || col===Math.floor(width/BLOCK)-1)) {
                    const radius=cherryGrove && !mobile?2:1;
                    const treeClear=[-radius,0,radius].every(dx=>[-radius,0,radius].every(dz=>clearTrack(x+dx*BLOCK,z+dz*BLOCK,height*BLOCK,(height+5)*BLOCK)));
                    if(treeClear) {
                        if(cherryGrove)cherryTrees.push({x,z,ground:height*BLOCK,radius:radius*BLOCK});
                        for(let h=0;h<3;h++)block(x,(height+h+.5)*BLOCK,z,cherryGrove?'cherry_log':'oak_log',cherryGrove?'#ffffff':'#a0a09a');
                        for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++) {
                            if(cherryGrove && Math.abs(dx)===2 && Math.abs(dz)===2)continue;
                            block(x+dx*BLOCK,(height+3.5)*BLOCK,z+dz*BLOCK,cherryGrove?'cherry_leaves':'oak_leaves',cherryGrove?'#fff0f5':'#628b3a');
                        }
                        for(let dx=-1;dx<=1;dx++)block(x+dx*BLOCK,(height+4.5)*BLOCK,z,cherryGrove?'cherry_leaves':'oak_leaves',cherryGrove?'#ffffff':'#73994b');
                    }
                }
            }
        }
        // A few solid rock portals narrow the central passage without covering the cards.
        if(!mobile) stations.forEach((p,i)=>{
            if(i%10!==6 || p.origin || !stations[i+1])return;
            const y=(p.card.y+p.card.height+stations[i+1].card.y)/2;
            const center=curve.getPointAt(parameterAt(y)),type=y/totalHeight>.49?'deepslate':'stone';
            const ground=routeElevation(y);
            for(const side of [-1,1])for(let tier=0;tier<3;tier++)block(center.x+side*128,ground+32+tier*64,center.z,type);
            for(let col=-2;col<=2;col++)block(center.x+col*64,ground+224,center.z,type);
        });
        // Entrance and trackside supports share the terrain's exact block grid.
        const entranceZ=Math.round(entrance.z/BLOCK)*BLOCK;
        const entranceX=Math.round(entrance.x/BLOCK)*BLOCK;
        if(!mobile) {
            for(const sign of [-1,1])for(let tier=0;tier<2;tier++)block(entranceX+sign*96,32+tier*64,entranceZ,'cherry_log','#ffffff');
            for(let col=-1;col<=2;col++)block(entranceX+(col-.5)*64,160,entranceZ,'cherry_planks','#ffffff');
        } else {
            for(const sign of [-1,1])fencePost(worldGroup,entranceX+sign*32,0,entranceZ);
        }
        for(const {mat,blocks} of batches.values()) {
            const mesh=new THREE.InstancedMesh(cube,mat,blocks.length);
            blocks.forEach((b,i)=>{dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(BLOCK);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
            mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();worldGroup.add(mesh);
        }
        for(const {name,items} of caveSprites.values()) {
            const mesh=new THREE.InstancedMesh(name==='sculk_sensor_tendril_inactive'?sensorTendril:caveCross,caveMaterial(name),items.length);
            items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,name==='amethyst_cluster'?hash(p.x,p.z)*Math.PI:0,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
            mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();worldGroup.add(mesh);
        }
        app.dataset.caveRegions=JSON.stringify(caveRegions.map(({kind,center,radius})=>({kind,center,radius})));
        app.dataset.caveFeatures=JSON.stringify(caveStats);
        app.dataset.dripstoneHeights=JSON.stringify(dripstoneHeights);
        // Connected fence lintel above the raised track; feet stand on terrain blocks.
        for(const [index,ramp] of ramps.entries()) {
            if(index%3!==0)continue;
            const center=pointAtScreen(ramp.end+30);
            const gridX=Math.round(center.x/BLOCK)*BLOCK,z=ramp.z+BLOCK*1.5;
            for(const sign of [-1,1])for(let level=0;level<2;level++)fencePost(worldGroup,gridX+sign*96,ramp.to+level*BLOCK,z);
            for(let i=0;i<4;i++) {
                const x=gridX+(i-1.5)*BLOCK,y=ramp.to+BLOCK*2;
                fencePost(worldGroup,x,y,z);
                if(i>0)fenceArm(worldGroup,x,y,z,Math.PI/2);
                if(i<3)fenceArm(worldGroup,x,y,z,-Math.PI/2);
            }
        }
        for(const allPetals of flowers.values()) for(let quadrant=0;quadrant<4;quadrant++) {
            const petals=allPetals.filter(p=>p.amount>quadrant);if(!petals.length)continue;
            const mesh=new THREE.InstancedMesh(petalGeometries[quadrant],petalMaterial,petals.length);
            petals.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.rotation,0);dummy.scale.setScalar(1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
            mesh.receiveShadow=true;mesh.computeBoundingSphere();worldGroup.add(mesh);
        }
        stations.forEach((p,i)=>{
            const left=p.card.x+p.card.width/2<width/2;
            const torchX=mobile?(p.origin?p.card.x+p.card.width-12:p.card.x-18):left?p.card.x+p.card.width+23:p.card.x-23;
            makeTorch(torchX,p.y+50,false);
            const railP=p.origin==='vanilla'&&branchCurve?onBranch(branchCurve,p.y).position:curve.getPointAt(parameterAt(p.y));
            const edge=surfaceWorld(mobile?p.card.x:left?p.card.x+p.card.width:p.card.x,p.y).x;
            box(worldGroup,(edge+railP.x)/2,railP.y,railP.z+30,Math.abs(edge-railP.x),2,32,planks);
            const deck=surfaceWorld(p.card.x+p.card.width/2,p.card.y+p.card.height+8);
            const deckWidth=(p.card.width+16)*(1-deck.y/Math.max(1400,width*1.25));
            box(worldGroup,deck.x,deck.y,deck.z,deckWidth,8,38,planks);
            // Uprights visibly connect each display to its footing.
            for(const sign of [-1,1]) {
                fencePost(worldGroup,deck.x+sign*(deckWidth/2-28),deck.y,deck.z+25);
                box(worldGroup,deck.x+sign*(deckWidth/2-28),deck.y+2,deck.z+25,24,8,24,bedMaterial);
            }
            if(p.photo) {
                const bottom=p.photo.y+p.photo.height;
                const base=surfaceWorld(p.photo.x+p.photo.width/2,bottom+42);
                const photoWidth=p.photo.width*(1-base.y/Math.max(1400,width*1.25));
                // Uprights end exactly at the photograph frame in screen space.
                for(const side of [-1,1])fencePost(worldGroup,base.x+side*(photoWidth/2-24),base.y,base.z);
                box(worldGroup,base.x,base.y+1,base.z,photoWidth+30,6,50,planks);
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

    }

    const cart = new THREE.Group();scene.add(cart);
    if(cartAsset) {
        const object=cartAsset.scene;object.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=mesh.receiveShadow=true;});const bounds=new THREE.Box3().setFromObject(object),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
        const scale=39/Math.max(size.x,size.z);object.scale.setScalar(scale);object.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);cart.add(object);
    } else {
        box(cart,0,12,0,35,24,42,material('stone','#b4b9b0'));
    }
    const branchCart=cart.clone(true);scene.add(branchCart);
    // Keep each cart's materials independent, including its rider's skin.
    branchCart.traverse(mesh=>{if(mesh.isMesh) {
        const clone=mat=>own(mat.clone());
        mesh.material=Array.isArray(mesh.material)?mesh.material.map(clone):clone(mesh.material);
    }});
    const branchRider=new THREE.Group();branchCart.add(branchRider);branchRider.position.set(0,8,-3);branchRider.scale.setScalar(1.45);
    // A seated, articulated skin model shares the cart's transform and WebGL context.
    const rider = new THREE.Group(); cart.add(rider);
    rider.position.set(0,8,-3); rider.scale.setScalar(1.45);
    let riderConfig = {default:{skin:'steve.png',model:'classic'},switches:[]};
    const skinBaseURL = new URL(assets.base.replace(/\/$/, '') + '/assets/skin/', document.baseURI);
    try {
        const settings=JSON.parse(app.dataset.riderSettings || 'null');
        if(settings) riderConfig={...riderConfig,...settings};
    } catch(error) {console.warn('Timeline rider: using Steve.',error);}
    const normalize = value => typeof value==='string'?{skin:value,model:'classic'}:{skin:value?.skin||'none',model:value?.model==='slim'?'slim':'classic'};
    const defaultSkin=normalize(riderConfig.default);
    const switches=(Array.isArray(riderConfig.switches)?riderConfig.switches:[])
        .filter(rule=>Number.isInteger(rule.afterFromEnd)&&rule.afterFromEnd>=1)
        .map(rule=>({...normalize(rule),afterFromEnd:rule.afterFromEnd})).sort((a,b)=>b.afterFromEnd-a.afterFromEnd);
    const branchSkins={restoration:normalize(riderConfig.branches?.restoration||{skin:'steve.png'}),vanilla:normalize(riderConfig.branches?.vanilla||{skin:'alex.png',model:'slim'})};
    const skinTextures=new Map();
    await Promise.all([...new Set(['steve.png',defaultSkin.skin,branchSkins.restoration.skin,branchSkins.vanilla.skin,...switches.map(rule=>rule.skin)])].filter(name=>name!=='none').map(async name=>{
        try {
            const texture=own(await loader.loadAsync(new URL(name,skinBaseURL).href));
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
        const texture=skinTextures.get(setting.skin)||skinTextures.get('steve.png');
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
    const particleCount=profile.particles ?? (lowPower?24:quality==='high'?100:70);
    const particleGeo=own(new THREE.BufferGeometry());
    const particlePositions=new Float32Array(particleCount*3);particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
    const particleMat=own(new THREE.PointsMaterial({color:0xe8d7a1,size:2,transparent:true,opacity:.45,sizeAttenuation:false,depthWrite:false}));
    const particles=new THREE.Points(particleGeo,particleMat);particles.frustumCulled=false;scene.add(particles);
    const cherryCapacity=profile.petals ?? (lowPower?12:32),petalsPerTree=lowPower?6:15;
    const cherryParticles=[0,5,9].map(frame=>{
        const geometry=own(new THREE.BufferGeometry()),positions=new Float32Array(cherryCapacity*3);
        geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setDrawRange(0,0);
        const mat=own(new THREE.PointsMaterial({map:textures[`../particle/cherry_${frame}`],size:lowPower?7:9,
            color:0xffe4ef,transparent:true,opacity:.85,alphaTest:.1,sizeAttenuation:false,depthWrite:false}));
        const mesh=new THREE.Points(geometry,mat);mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);
        return {mesh,geometry,positions,count:0};
    });
    let visibleCherryPetals=0;
    function updateCherryPetals(scrollY,height,time,reduce) {
        cherryParticles.forEach(batch=>{batch.count=0;});
        if(!reduce)cherryTrees.forEach((tree,index)=>{
            const top=(tree.z-tree.radius)*.8-(tree.ground+220)*.6;
            const bottom=(tree.z+tree.radius+40)*.8-tree.ground*.6;
            if(bottom<scrollY || top>scrollY+height)return;
            for(let i=0;i<petalsPerTree;i++) {
                const batch=cherryParticles[i%3];if(batch.count>=cherryCapacity)continue;
                // Stable world-space seeds keep petals attached to their tree while scrolling.
                const seed=index*31+i,life=(time/(11000+hash(seed,8)*5000)+hash(seed,2))%1;
                const sway=Math.sin(time*.001+seed)*12+Math.sin(time*.00043+seed)*7;
                const n=batch.count++*3;
                batch.positions[n]=tree.x+(hash(seed,3)-.5)*tree.radius*1.8+sway+life*24;
                batch.positions[n+1]=tree.ground+12+(1-life)*178;
                batch.positions[n+2]=tree.z+(hash(seed,4)-.5)*tree.radius*1.8+life*35;
            }
        });
        visibleCherryPetals=0;
        for(const batch of cherryParticles) {
            batch.geometry.setDrawRange(0,batch.count);batch.mesh.visible=batch.count>0;
            batch.geometry.attributes.position.needsUpdate=true;visibleCherryPetals+=batch.count;
        }
        app.dataset.cherryPetals=String(visibleCherryPetals);
    }
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
        transverseDepth.value=0;
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
    const worldUp=new THREE.Vector3(0,1,0),headingOrigin=new THREE.Vector3(),headingMatrix=new THREE.Matrix4();
    function setCartHeading(quaternion,tangent) {
        // Local +Z faces newer history (-tangent). Constrain up as well as forward:
        // a shortest-arc rotation alone can roll the cart upside down near -Z.
        headingMatrix.lookAt(headingOrigin,tangent,worldUp);
        return quaternion.setFromRotationMatrix(headingMatrix);
    }
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
        const branchOpacity=separation*separation*(3-2*separation);
        branchCart.visible=Boolean(branchCurve)&&separation>0;
        if(branchCurve) {
            const branchY=Math.max(mergeY,Math.min(branchEndY-95,y));
            const branch=onBranch(branchCurve,branchY);
            branchCart.position.copy(branch.position);branchCart.position.y+=1;
            // Fade on the actual branch, without pulling the cart across the rails.
            setCartHeading(branchCart.quaternion,branch.tangent);
            branchCart.traverse(mesh=>{if(mesh.isMesh) {
                // Rails are transparent too. Draw the fading cart after them, retaining
                // depth testing/writes so a nearer rail cannot paint over its body.
                mesh.renderOrder=1;
                for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]) {
                    const transparent=branchOpacity<1;
                    if(mat.transparent!==transparent){mat.transparent=transparent;mat.needsUpdate=true;}
                    mat.opacity=branchOpacity;mat.depthTest=true;mat.depthWrite=true;
                }
            }});
            app.dataset.branchCartY=branchY.toFixed(1);
        }
        app.dataset.mergeSeparation=separation.toFixed(3);
        app.dataset.routeMode=branchCurve&&y>mergeY?'origins':'shared';
        // The cart's long axis follows rail yaw AND grade in world coordinates.
        setCartHeading(cart.quaternion,tangent);
        app.dataset.cartYaw=Math.atan2(tangent.x,tangent.z).toFixed(4);
        app.dataset.cartPitch=Math.asin(tangent.y).toFixed(4);
        app.dataset.cartElevation=cart.position.y.toFixed(2);
        app.dataset.cartY=y.toFixed(1);
        torches.forEach((torch,i)=>{torch.ember.position.y=torch.baseY+(reduce?0:Math.sin(time*.009+i)*1.5);torch.ember.scale.y=reduce?5:4+Math.sin(time*.015+i)*1.2;});
        const nearest=torches[Math.min(active,torches.length-1)];
        if(nearest) {warmLight.position.copy(nearest.group.position);warmLight.position.y+=80;warmLight.color.set(nearest.soul?0x71e4e5:0xffb747);warmLight.intensity=reduce?1200:1200+Math.sin(time*.009)*180;}
        for(let i=0;i<particleCount;i++) {
            const drift=reduce?0:time*.005;
            particlePositions[i*3]=hash(i,1)*width+Math.sin(time*.0005+i)*(!reduce?5:0);
            particlePositions[i*3+1]=25+hash(i,3)*50;
            particlePositions[i*3+2]=(scrollY+((hash(i,2)*height-drift)%height+height)%height)/.8;
        }
        particleGeo.attributes.position.needsUpdate=true;
        updateCherryPetals(scrollY,height,time,reduce);
        transverseDepth.value=1/Math.max(1400,width*1.25);
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
        // Phones animate only while a cherry canopy is visible; other settled scenes idle.
        frameInterval:1000 / (profile.fps || (lowPower?25:30)),
        get continuous() {return !lowPower || visibleCherryPetals>0;},
    };
}

