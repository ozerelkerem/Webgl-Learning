var VERTEX_SHADER = [
    ' #ifdef GL_ES',
    'precision highp float;',
    '  #endif',
    'attribute vec3 a_Position;',
    'attribute vec3 a_Normal;',

   
    'uniform mat4 u_ModelMatrix;',
    'uniform mat4 u_ViewMatrix;',
    'uniform mat4 u_ProjectionMatrix;',
    'uniform mat4 u_NormalMatrix;',

    'varying vec3 v_Normal;',
    'varying vec3 v_FragPos;',
    
    'void main(){',
        'gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position,1.0);',
        'v_FragPos = (u_ModelMatrix * vec4(a_Position,1.0)).xyz;',
        'vec3 tmp = vec3(a_Normal.x, a_Normal.y, a_Normal.z);',
        'v_Normal =  mat3(u_NormalMatrix) * tmp;',
        'v_Normal = tmp;',
        'gl_PointSize = 10.0;',
    '}',
].join("\n");


var FRAGMENT_SHADER = [
    ' #ifdef GL_ES',
    'precision highp float;',
    '  #endif',
    
    'uniform vec3 u_objectColor;',
    'uniform vec3 u_lightColor;',
    'uniform vec3 u_lightPos;',
    'uniform vec3 u_viewPos;',
    'varying vec3 v_Normal;',
    'varying vec3 v_FragPos;',
    'void main(){',
      
        'vec3 norm = normalize(v_Normal);',
        //ambient
        'float ambientStrenght = 0.1;',
        'vec3 ambient = ambientStrenght * u_lightColor;',
        //diffuse
        'vec3 lightDirection = normalize(u_lightPos-v_FragPos);',
        'float diff = max(dot(lightDirection, norm), 0.0);',
        'vec3 diffuse = u_lightColor * diff;',
        //specular
        'float specularStrength = 0.5;',
        'vec3 viewDir = normalize(u_viewPos - v_FragPos);',
        'vec3 reflectDir = reflect(-lightDirection, norm); ',
        'float spec = pow(max(dot(viewDir, reflectDir), 0.0),64.0);',
        'vec3        = specularStrength * spec * u_lightColor; ',

        
        
        
    
        'gl_FragColor = vec4(u_objectColor * (specular + ambient + diffuse ), 1);',
    '}',
].join("\n");

var kx=2,ky=3,kz=-3;

function main(){

    var canvas = document.getElementById("mycanvas");

    var gl = getWebGLContext(canvas);

    if(!gl)
    {
        console.log("Gl Error");
        return;
    }
        

    if(!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER))
    {
        console.log("Shader Error");
        return;
    }

    loadJSONResource("models/gun.json").then((mod) => {
        var model = mod;
        console.log(model);
        
        var VertexBuffer = gl.createBuffer();
        var TextureBuffer = gl.createBuffer();
        var IndicesBuffer = gl.createBuffer();
        var NormalBuffer = gl.createBuffer();

  
        var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
        var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
        var u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
        var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

        
        var u_objectColor = gl.getUniformLocation(gl.program, 'u_objectColor');
        var u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
        var u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
        var u_viewPos = gl.getUniformLocation(gl.program, 'u_viewPos');

        gl.uniform3fv(u_objectColor, new Float32Array([0, 1, 1]));
        gl.uniform3fv(u_lightColor, new Float32Array([1, 1, 1]));
       
        

        if (!VertexBuffer || !TextureBuffer || !u_ModelMatrix || !u_NormalMatrix || !u_ViewMatrix || !u_ProjectionMatrix || !u_objectColor || !u_lightColor || !NormalBuffer)
        {
            console.log("Buffer error" + u_NormalMatrix);
            return;
        }
    
	gl.enable(gl.DEPTH_TEST);
	
    var Lx=0,Ly=0,Lz=-50;
    const loop = () => {
        gl.uniform3fv(u_lightPos, new Float32Array([kx, ky, kz]));
        gl.uniform3fv(u_viewPos, new Float32Array([Lx, Ly, Lz]));
        var modelMatrix = new Matrix4();
        modelMatrix.setRotate(0,1,0,0);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 
      //  gl.uniformMatrix4fv(u_ModelMatrix2, false, modelMatrix.elements);

        var viewMatrix = new Matrix4();
        viewMatrix.setLookAt(Lx, Ly, Lz, 0, 0, 0, 0, 1, 0);
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
        
        var projectionMatrix = new Matrix4();
        projectionMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
       // projectionMatrix.setIdentity();
        gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
        
        
        modelMatrix.invert();
        modelMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, modelMatrix.elements);

        var mesh = model.meshes[0];
       
        var Vertices = Float32Array.from(mesh.vertices);
        var Indices = Uint16Array.from([].concat.apply([], mesh.faces));
        var Normals = Float32Array.from(mesh.normals);
        //var Normals = Float32Array.from(utils.calculateNormals(Vertices, Indices));
       
        
     
         //ÜÇGENLERİN NOKTALARINI AKTARIYORUZ
        gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, Vertices, gl.STATIC_DRAW);
        var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if(a_Position < 0 )
        {
            console.log("get attrib error");
            return;
        }
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, gl.FALSE, 0, 0);
        gl.enableVertexAttribArray(a_Position);
         //ÜÇGENLERİN NOKTALARINI AKTARIYORUZ

        //ÜÇGENLERİN Normallerini AKTARIYORUZ
        gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, Normals, gl.STATIC_DRAW);
        var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
        if(a_Normal < 0 )
        {
            console.log("get attrib error");
            return;
        }
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, gl.FALSE, 0, 0);
        gl.enableVertexAttribArray(a_Normal);
         //ÜÇGENLERİN Normallerini AKTARIYORUZ

        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Indices, gl.STATIC_DRAW);
        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.
        
       
        gl.clearColor(0.4, 0.4, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawElements(gl.TRIANGLES, Indices.length, gl.UNSIGNED_SHORT, 0);
        
        
      
        
         gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([kx, ky, kz]), gl.STATIC_DRAW);
         var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
         if(a_Position < 0 )
         {
             console.log("get attrib error");
             return;
         }
         gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, gl.FALSE, 0, 0);
         gl.enableVertexAttribArray(a_Position);
                  //ÜÇGENLERİN NOKTALARINI AKTARIYORUZ
        gl.drawArrays(gl.POINTS,0 ,1);
        requestAnimationFrame(loop);
        }  
        requestAnimationFrame(loop);




        canvas.onmousedown = (event) => {;
            var x = event.clientX, y = event.clientY;
            var difx = 0;
            var dify = 0;
            
            canvas.onmousemove = (event2) => {
                difx = event2.clientX - x;
                dify = event2.clientY - y;
                var rMatrix =  new Matrix4();
                rMatrix.setRotate(dify, -1, 0 ,0);
                rMatrix.rotate(difx, 0, -1 ,0);
                var pp = new Vector4([Lx, Ly, Lz, 1]);
                var np = rMatrix.multiplyVector4(pp);
                Lx = np.elements[0]; Ly = np.elements[1]; Lz = np.elements[2];

                x = event2.clientX;
                y = event2.clientY;
            };
        };
        canvas.onmouseup = (event) => {
            canvas.onmousemove = null;
        };
        canvas.onmousewheel = (event) => {
            rate  = Lx*Lx + Ly*Ly + Lz*Lz;
            rate = Math.sqrt(rate)*event.deltaY/-100;

            Lx -= Lx/rate;
            Ly -= Ly/rate;
            Lz -= Lz/rate;
            console.log(rate);
            //Lz += event.deltaY/100*-1;
        };
    }

    ).catch((err) => {
        console.log("model not loaded error :" + err);
    })

}

function is(){
	kx--;
}

function iss(){
	kx++;
}
function ia(){
	ky--;
}
function iy(){
	ky++;
}
function ig(){
	kz--;
}
function ii(){
	kz++;
}

