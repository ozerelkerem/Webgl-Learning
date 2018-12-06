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
        'vec3 specular = specularStrength * spec * u_lightColor; ',

        
        
        
    
        'gl_FragColor = vec4(u_objectColor * (specular + ambient + diffuse ), 1);',
    '}',
].join("\n");

var ax = 10;
var ay = 20;

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

    loadJSONResource("models/cube.json").then((mod) => {
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
        gl.clearColor(0.4, 0.4, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform3fv(u_lightPos, new Float32Array([kx, ky, kz]));
        gl.uniform3fv(u_viewPos, new Float32Array([Lx, Ly, Lz]));



        var viewMatrix = new Matrix4();
        viewMatrix.setLookAt(Lx, Ly, Lz, 0, 0, 0, 0, 1, 0);
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
        
        var projectionMatrix = new Matrix4();
        projectionMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
        gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
        
    
      

      
        
        var mesh = model.meshes[0];
        var modelMatrix = new Matrix4();
        
   
        modelMatrix.setRotate(ay,1,0,0);
        
        drawMesh(mesh, modelMatrix);

        modelMatrix.translate(0,2,0);
        modelMatrix.rotate(ax, 0,1,0);
        modelMatrix.scale(10,1,1);
        drawMesh(mesh, modelMatrix);
        
        

        //draw light
        modelMatrix.setIdentity();
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        initArrayBuffer(new Float32Array([kx, ky, kz]), 'a_Position', 3, 0, 0);
        gl.drawArrays(gl.POINTS,0 ,1);

        requestAnimationFrame(loop);
        }  
        requestAnimationFrame(loop);



        function initArrayBuffer(Data, AttribLoc, Size, Stribe, Offset)
        {
            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, Data, gl.STATIC_DRAW);
            var atrib = gl.getAttribLocation(gl.program, AttribLoc);
            if(atrib < 0 )
            {
                console.log("get attrib error");
                return;
            }
            gl.vertexAttribPointer(atrib, Size, gl.FLOAT, gl.FALSE, Stribe, Offset);
            gl.enableVertexAttribArray(atrib);
        }

        function drawMesh(Mesh, ModelMatrix)
        {
            gl.uniformMatrix4fv(u_ModelMatrix, false, ModelMatrix.elements);
            var Vertices = Float32Array.from(Mesh.vertices);
            var Indices = Uint16Array.from([].concat.apply([], Mesh.faces));
            var Normals = Float32Array.from(Mesh.normals);
             
            initArrayBuffer(Vertices, 'a_Position', 3, 0, 0);
            initArrayBuffer(Normals, 'a_Normal', 3, 0, 0);
    
            ModelMatrix.invert();
            ModelMatrix.transpose();
            gl.uniformMatrix4fv(u_NormalMatrix, false, ModelMatrix.elements);
            //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndicesBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Indices, gl.STATIC_DRAW);
            //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.
            gl.drawElements(gl.TRIANGLES, Indices.length, gl.UNSIGNED_SHORT, 0);
        }


        document.onkeydown = (event) => {
            switch(event.key)
            {
                case "ArrowRight":
                    ax++;
                break;
                case "ArrowLeft":
                    ax--;
                break;
                case "ArrowUp":
                    ay++;
                break;
                case "ArrowDown":
                    ay--;
                break;
            }
        };

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

