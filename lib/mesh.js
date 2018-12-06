class Mesh {
    constructor(MeshFromJson) {
        this.vertices = Float32Array.from(MeshFromJson.vertices);
        this.indices = Uint16Array.from([].concat.apply([], MeshFromJson.faces));
        this.normals = Float32Array.from(MeshFromJson.normals);
        this.bones = [];
        this.bonesfinals = [];
        this.boneswithnames = new Object();
        this.bonestransformations = [];
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
                
                var tm4 = new Matrix4();
                tm4.setFromArray(bone.offsetmatrix);
                tm4.transpose();
                //tm4.invert();
                this.bones.push(tm4);
                this.bonesfinals.push(tm4);
                this.boneswithnames[bone.name] = boneid;

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
        
        var newArr = [];
        this.bonesfinals.forEach((bone) => {
 
            bone.elements.forEach((element) => {
                newArr.push(element);
            });
        });
  
        Shader.gl.uniformMatrix4fv(Shader.u_Bones, false, Float32Array.from(newArr));
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
        this.transformation = new Matrix4();
        this.transformation.setFromArray(transformation);
        this.transformation.transpose();
        this.finaltransformation = new Matrix4();
        this.mesh = mesh;
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

    rotateJoint(angle, x,y,z)
    {
      
      //  this.finaltransformation = new Matrix4(this.transformation);
        this.finaltransformation.setRotate(angle,x,y,z);
       /* this.childs.forEach((child) => {
            child.rotateJoint(angle,x,y,z);
            if(child.mesh != -1)
            {

            }
        });*/
    }

    getTransformation()
    {
        var tmp = new Matrix4();
        tmp.multiply(this.transformation);
        tmp.multiply(this.finaltransformation);
        return tmp;
    }
}

class Model {
    constructor(ModelFromJson) {
        this.meshes = [];
        ModelFromJson.meshes.forEach((mesh) => {
            this.meshes.push(new Mesh(mesh));
        });
        this.m_GlobalInverseTransform = new Matrix4();
        this.m_GlobalInverseTransform.setFromArray(ModelFromJson.rootnode.transformation);
        this.m_GlobalInverseTransform.invert();
        this.root = this.loopinside(ModelFromJson.rootnode, new Matrix4());
        
        console.log(this.m_GlobalInverseTransform);
        console.log(this);
    }

    loopinside(root, globaltranformation)
    {
        
        console.log(root);
        if (root.meshes == undefined)
            var tmp = new Joint(root.name, root.transformation);
        else
            var tmp = new Joint(root.name, root.transformation,root.meshes[0]);
        if(this.meshes[0].boneswithnames[root.name] != undefined)
        {
            var boneid = this.meshes[0].boneswithnames[root.name];
            var ma = glMatrix.mat4.create();
            var ma2 = glMatrix.mat4.create();
            var ma3 = new Matrix4();
            var ma4 = new Matrix4();
            
            if(root.name == "SagKol")
            {
                ma4.setRotate(30,1,1,1);
                glMatrix.mat4.multiply(ma2, ma4.elements, tmp.transformation.elements);
                 glMatrix.mat4.multiply(ma2, globaltranformation.elements, ma2);
                 console.log("kafa döndü");
            }
            else
            {
                glMatrix.mat4.multiply(ma2, globaltranformation.elements, tmp.transformation.elements);
            }
           
            ma3.setFromArray(ma2);
            globaltranformation.multiply(tmp.transformation);
            glMatrix.mat4.multiply(ma, this.m_GlobalInverseTransform.elements, ma3.elements);
            glMatrix.mat4.multiply(ma, ma, this.meshes[0].bones[boneid].elements);
            
            this.meshes[0].bonesfinals[boneid] = new Matrix4();
            this.meshes[0].bonesfinals[boneid].setFromArray(ma);
            //this.meshes[0].boneswithnames[root.name].transpose();
           // this.meshes[0].boneswithnames[root.name].invert();
        }
        if(root.children != undefined)
        {
            root.children.forEach((child) => {
                tmp.addChild(this.loopinside(child, new Matrix4(ma3)));
            });  
        }

        return tmp;
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
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
    constructor(gl)
    {
        this.gl = gl;    
    
        this.IndicesBuffer = gl.createBuffer();
  
        this.u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
        this.u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
        this.u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
        this.u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        this.u_Bones = gl.getUniformLocation(gl.program, 'u_Bones');


        this.u_objectColor = gl.getUniformLocation(gl.program, 'u_objectColor');
        this.u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
        this.u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
        this.u_viewPos = gl.getUniformLocation(gl.program, 'u_viewPos');

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