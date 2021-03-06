
class Animator {
    constructor (Animations, model)
    {
        this.currentAnimation = -1;
        this.animationStartTime = 0;
        this.animations = Animations;
        this.Model = model;
        
    }

    playAnimation(id)
    {
        this.currentAnimation = this.animations[id];
        this.animationStartTime = Date.now();
    }

    getAnimationTime()
    {
        return (Date.now() - this.animationStartTime) % this.currentAnimation.duration;
    }

    loopinside(root, globaltranformation, m_GlobalInverseTransform, ATime)
    {
        
        
        glMatrix.mat4.multiply(globaltranformation, globaltranformation, root.transformation);

        var currentAnimChannel = this.currentAnimation.channels.getChannelbyName(root.name);
        
        if(currentAnimChannel != undefined)
        {
            if(root.name == "Kafa"  || root.name == "SolKalca" )
            {
                var ma = glMatrix.mat4.create();
                var quad = this.CalcInterpolatedRotation(currentAnimChannel.getRKey(ATime),currentAnimChannel.rotationkeys, ATime);
                glMatrix.mat4.fromQuat(ma, quad);
               
               // glMatrix.mat4.invert(ma, ma);
              // console.log(ma);
                glMatrix.mat4.mul(globaltranformation, globaltranformation, ma);
            }
                
               
            
                //console.log(currentAnimChannel.getPKey());
            /*if(root.name == "Kafa")
            {
                
                var ma = glMatrix.mat4.create();
                glMatrix.mat4.rotate(ma, ma, glMatrix.glMatrix.toRadian(testttt), [1,0,0]);
                glMatrix.mat4.invert(ma,ma);
                glMatrix.mat4.mul(globaltranformation, globaltranformation, ma);
            }*/
           
        }

        var bone = this.Model.getBoneByName(root.name);
        //console.log(bone + root.name);
        if(bone != undefined)
        {
            bone.calcFinaltransformation(m_GlobalInverseTransform, globaltranformation);
        }

        root.childs.forEach((child) => {
            this.loopinside(child, glMatrix.mat4.clone(globaltranformation),m_GlobalInverseTransform, ATime);
        });  
        
    }

    CalcInterpolatedRotation(index,RotationKeys, AnimationTime )
    {
        var q1= glMatrix.quat.fromValues(RotationKeys[index].arr[1], RotationKeys[index].arr[2], RotationKeys[index].arr[3] ,RotationKeys[index].arr[0]);
 
        
        if(RotationKeys.length == 1)
        {
            //console.log(index);
            return q1;
        }
         

        var nextIndex = index+1;
        var DeltaTime = RotationKeys[nextIndex].time - RotationKeys[index].time;
        var Factor = (AnimationTime - RotationKeys[index].time) / DeltaTime;

        var q2= glMatrix.quat.fromValues(RotationKeys[nextIndex].arr[1], RotationKeys[nextIndex].arr[2], RotationKeys[nextIndex].arr[3] ,RotationKeys[nextIndex].arr[0]);
        var q3 = glMatrix.quat.create();
        glMatrix.quat.lerp(q3, q1,q2, Factor);
        glMatrix.quat.normalize(q3, q3);
        return q3;
    }
   


   
}


class AnimationGL {
    constructor(AnimationFromJson)
    {
        this.name = AnimationFromJson.name;
        this.duration = AnimationFromJson.duration * 1000;
        this.tickspersecond = AnimationFromJson.tickspersecond;
        this.channels = new ChannelArrayclass();
        
        AnimationFromJson.channels.forEach((channel) => {
            this.channels.push(new Channel(channel.name, channel.positionkeys, channel.rotationkeys, channel.scalingkeys));
        });

    }

    getAnimationTime()
    {
        return
    }


   

    
}

class Channel {
    constructor(name, positionkeys, rotationkeys, scalingkeys)
    {
        this.name = name;
        this.positionkeys = [];
        this.rotationkeys = [];
        this.scalingkeys = [];
        positionkeys.forEach((pkey) => {
            this.positionkeys.push({"time": pkey[0] *1000, "arr": Object.assign([], pkey[1])});
        });
        rotationkeys.forEach((pkey) => {
            this.rotationkeys.push({"time": pkey[0]*1000, "arr": Object.assign([], pkey[1])});
        });
        scalingkeys.forEach((pkey) => {
            this.scalingkeys.push({"time": pkey[0]* 1000, "arr": Object.assign([], pkey[1])});
        });

    }

    getPKey(AnimationTime)
    {
        for(var i = this.positionkeys.length-1; i>=0;i--)
        {
            if(AnimationTime >= this.positionkeys[i].time)
                return i;
        }
    }
    getRKey(AnimationTime)
    {
        for(var i = this.rotationkeys.length-1; i>=0;i--)
        {
            if(AnimationTime >= this.rotationkeys[i].time)
                return i;
        }
    }
    getSKey(AnimationTime)
    {
        for(var i = this.scalingkeys.length-1; i>=0;i--)
        {
            if(AnimationTime >= this.scalingkeys[i].time)
                return i;
        }
    }

}

var ChannelArrayclass =
   function() {
        this.channels = [];
        this.channelsnames = new Object();
        this.push = (channel) => {this.channels.push(channel); this.channelsnames[channel.name] = this.channels[this.channels.length-1]};
        this.getChannelbyName = (name) => { return this.channelsnames[name]};
    };
        

class Bone {
    constructor(name, offsetmatrixfromjson)
    {
        this.name = name;
        this.offsetmatrix = glMatrix.mat4.fromValues(...offsetmatrixfromjson);
        glMatrix.mat4.transpose(this.offsetmatrix, this.offsetmatrix);
        this.finaltransformation = glMatrix.mat4.create();
    }

    calcFinaltransformation(m_GlobalInverseTransform, GlobalTransformation)
    {
        glMatrix.mat4.mul(this.finaltransformation, m_GlobalInverseTransform, GlobalTransformation);
        glMatrix.mat4.mul(this.finaltransformation, this.finaltransformation, this.offsetmatrix);
        
    }
}
var BoneArrayClass =
   function() {
        this.bones = [];
        this.bonesnames = new Object();
        this.push = (bone) => {this.bones.push(bone); this.bonesnames[bone.name] = this.bones[this.bones.length-1]};
        this.getBoneByID = (id) => {return this.bones[id]};
        this.getBoneByName = (name) => { return this.bonesnames[name]};
        this.getBonesFinalFlat = () => {return this.bones.reduce((x,y) => x.concat(y.finaltransformation.reduce((a,b) => a.concat(b),[])), [])};
    };
        


class Mesh {
    constructor(MeshFromJson) {
        this.vertices = Float32Array.from(MeshFromJson.vertices);
        this.indices = Uint16Array.from([].concat.apply([], MeshFromJson.faces));
        this.normals = Float32Array.from(MeshFromJson.normals);
        
        this.bones = new BoneArrayClass(); 

        this.boneswithnames = new Object();
        this.WeightInfo = [];
        this.BoneIds = [];
        this.Weights = [];
        if (MeshFromJson.bones != undefined)
        {
            for(var i = 0; i<this.vertices.length / 3; i++)
            {
                this.WeightInfo.push([]);   
            }

            MeshFromJson.bones.forEach((bone, boneid) => {
                
                this.bones.push(new Bone(bone.name, bone.offsetmatrix));
                //this.boneswithnames[bone.name] = this.bones[boneid];

                bone.weights.forEach((aweight) => {
                this.pushWeight(boneid, aweight);
                });
            });
            
            this.sortWeights();
            this.clearWeights();

        }
      
    }
  
    pushWeight(boneid, aweight) {
        var vert = aweight[0];
        var impact = aweight[1];

        this.WeightInfo[vert].push({"boneid":boneid,"weight":impact});
    }

    sortWeights(){
        for(var i =0; i<this.vertices.length/3;i++)
            this.WeightInfo[i].sort(function(a, b){return b.weight - a.weight});
    }

    clearWeights(maxweight=3){
        for(var i =0; i<this.vertices.length/3;i++)
        {
            this.WeightInfo[i].splice(maxweight);
            var sum = 0;
            this.WeightInfo[i].forEach((val) => {
                sum += val.weight;
            });
            this.WeightInfo[i].forEach((val, index) => {
                this.WeightInfo[i][index].weight /= sum;
            });
        }
        
        this.WeightInfo.forEach((info)=>{
            for(var i =0; i<3;i++)
            {
                if(info[i] != undefined)
                {
                    this.BoneIds.push(info[i].boneid);
                    this.Weights.push(info[i].weight);
                }
                else
                {
                    this.BoneIds.push(0);
                    this.Weights.push(0);
                }
            }
        });
        this.BoneIds = Float32Array.from(this.BoneIds);
        this.Weights = Float32Array.from(this.Weights);
        
    }

    drawMesh(Shader, ModelMatrix)
    {   
        
        var flatBones = this.bones.getBonesFinalFlat();
      
        Shader.gl.uniformMatrix4fv(Shader.u_Bones, false, Float32Array.from(flatBones));
        Shader.gl.uniformMatrix4fv(Shader.u_ModelMatrix, false, ModelMatrix.elements);
        
        Shader.initArrayBuffer(this.vertices, 'a_Position', 3, 0, 0);
        Shader.initArrayBuffer(this.normals, 'a_Normal', 3, 0, 0);
        Shader.initArrayBuffer(this.BoneIds, 'a_BoneIds', 3, 0, 0);
        Shader.initArrayBuffer(this.Weights, 'a_Weights', 3, 0, 0);
    
        ModelMatrix.invert();
        ModelMatrix.transpose();
        Shader.gl.uniformMatrix4fv(Shader.u_NormalMatrix, false, ModelMatrix.elements);
        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.

        Shader.gl.bindBuffer(Shader.gl.ELEMENT_ARRAY_BUFFER, Shader.IndicesBuffer);
        Shader.gl.bufferData(Shader.gl.ELEMENT_ARRAY_BUFFER, this.indices, Shader.gl.STATIC_DRAW);
        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.
        Shader.gl.drawElements(Shader.gl.TRIANGLES, this.indices.length, Shader.gl.UNSIGNED_SHORT, 0);
    }

    rotateMeshByWeight(bone)
    {

    }
}

class Joint {
    constructor(name, transformation, mesh=-1) {
        this.childs = [];
        this.name = name;
        this.transformation = glMatrix.mat4.fromValues(...transformation);
        glMatrix.mat4.transpose(this.transformation, this.transformation);
        this.finaltransformation = glMatrix.mat4.create();
        this.mesh = mesh;
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

    rotateJoint(angle, x,y,z)
    {
      
      //  this.finaltransformation = new Matrix4(this.transformation);
      glMatrix.mat4.rotate(this.finaltransformation, this.transformation, glMatrix.glMatrix.toRadian(angle), [x,y,z]);
       /* this.childs.forEach((child) => {
            child.rotateJoint(angle,x,y,z);
            if(child.mesh != -1)
            {
            }
        });*/
    }

    getTransformation()
    {
        
        return this.finaltransformation;
    }
}

class Model {
    constructor(ModelFromJson) {
        this.meshes = [];
        ModelFromJson.meshes.forEach((mesh) => {
            this.meshes.push(new Mesh(mesh));
        });

        this.m_GlobalInverseTransform = glMatrix.mat4.fromValues(...ModelFromJson.rootnode.transformation);
        glMatrix.mat4.transpose(this.m_GlobalInverseTransform, this.m_GlobalInverseTransform);
        this.root = this.loopinside(ModelFromJson.rootnode, glMatrix.mat4.create());

        this.animations = [];
        ModelFromJson.animations.forEach((animation)=> {
            this.animations.push(new AnimationGL(animation));
        });

        
        
        this.animator = new Animator(this.animations, this);
        
        
    }

    getBoneByName(name)
    {
        var bone;
        this.meshes.forEach((mesh) => {
           
            if(mesh.bones != undefined)
            {
                var tmp = mesh.bones.getBoneByName(name);
                
                if(tmp != undefined)
                {
                    bone = tmp;
                }
                   

            }
      
        });
        return bone;
    }

    loopinside(root, globaltranformation)
    {

        if (root.meshes == undefined)
            var tmp = new Joint(root.name, root.transformation);
        else
            var tmp = new Joint(root.name, root.transformation,root.meshes[0]);
        
        glMatrix.mat4.multiply(globaltranformation, globaltranformation, tmp.transformation);
        var bone = this.getBoneByName(root.name);
        
        if(bone != undefined)
        {
            bone.calcFinaltransformation(this.m_GlobalInverseTransform, globaltranformation);
        }
      
        if(root.children != undefined)
        {
            root.children.forEach((child) => {
                tmp.addChild(this.loopinside(child, glMatrix.mat4.clone(globaltranformation)));
            });  
        }

        return tmp;
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

    callAnimator()
    {
        this.animator.loopinside(this.root,  glMatrix.mat4.create(),this.m_GlobalInverseTransform, this.animator.getAnimationTime());
    }

    drawModel(root, Shader, ModelMatrix)
    {

        ModelMatrix.multiply(new Matrix4(root.getTransformation()));
        
        if(root.mesh != -1)
        {
            this.meshes[root.mesh].drawMesh(Shader, new Matrix4(ModelMatrix));
        }
       
        root.childs.forEach((child)=> { 
           this.drawModel(child, Shader, new Matrix4(ModelMatrix));
        });
    }

    getJointByName(node, searchingName)
    {
        if(node.name == searchingName)
            return node;

        var tmp;
        var i = 0;
        var flag = false;
        while(node.childs[i] && !flag)
        {
            tmp = this.getJointByName(node.childs[i], searchingName);
            if(tmp)
                flag = true;
            else
                i++;
        }
        return tmp;
    }
}

class Shader {
    constructor(gl, uniforms)
    {
        this.gl = gl;    
    
        this.IndicesBuffer = gl.createBuffer();
        
        uniforms.forEach((uniform)=>{
            this[uniform] = gl.getUniformLocation(gl.program, uniform);
            if(!this[uniform]);
        });
        
        this.gl.uniform3fv(this.u_objectColor, new Float32Array([0, 1, 1]));
        this.gl.uniform3fv(this.u_lightColor, new Float32Array([1, 1, 1]));
        if ( !this.u_ModelMatrix || !this.u_NormalMatrix || !this.u_Bones || !this.u_ViewMatrix || !this.u_ProjectionMatrix || !this.u_objectColor || !this.u_lightColor )
        {
            console.log("Buffer error");
            return;
        }
    }

    initArrayBuffer(Data, AttribLoc, Size, Stribe, Offset)
    {
        var buf = this.gl.createBuffer();
        if ( !buf )
        {
            console.log("Buffer error");
            return;
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, Data, this.gl.STATIC_DRAW);
        var atrib = this.gl.getAttribLocation(this.gl.program, AttribLoc);
        if(atrib < 0 )
        {
            console.log("get attrib error");
            return;
        }
        this.gl.vertexAttribPointer(atrib, Size, this.gl.FLOAT, this.gl.FALSE, Stribe, Offset);
        this.gl.enableVertexAttribArray(atrib);
    }
}