var VERTEX_SHADER = [
    '#define MaxBone 20',
    ' #ifdef GL_ES',
    'precision highp float;',

    '  #endif',
    'attribute vec3 a_Position;',
    'attribute vec3 a_Normal;',
    'attribute vec3 a_BoneIds;',
    'attribute vec3 a_Weights;',

    'uniform mat4 u_ModelMatrix;',
    'uniform mat4 u_ViewMatrix;',
    'uniform mat4 u_ProjectionMatrix;',
    'uniform mat4 u_NormalMatrix;',
    'uniform mat4 u_Bones[MaxBone];',
    
    'varying vec3 v_Normal;',
    'varying vec3 v_FragPos;',
    
    'void main(){',
        'mat4 boneMatrix = u_Bones[int(a_BoneIds[0])] * a_Weights[0];',
        'boneMatrix += (u_Bones[int(a_BoneIds[1])]  * a_Weights[1]);',
        'boneMatrix += (u_Bones[int(a_BoneIds[2])]  * a_Weights[2]);',
        'vec4 newVertex = boneMatrix * vec4(a_Position, 1.0);',
        'gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * newVertex;',
        'v_FragPos = (u_ModelMatrix * newVertex).xyz;',
        'vec3 tmp = mat3(boneMatrix) * a_Normal;',
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
        //Ambient
        'float ambientStrenght = 0.1;',
        'vec3 ambient = ambientStrenght * u_lightColor;',
        //Diffuse
        'vec3 lightDirection = normalize(u_lightPos-v_FragPos);',
        'float diff = max(dot(lightDirection, norm), 0.0);',
        'vec3 diffuse = u_lightColor * diff;',
        //Specular
        'float specularStrength = 0.5;',
        'vec3 viewDir = normalize(u_viewPos - v_FragPos);',
        'vec3 reflectDir = reflect(-lightDirection, norm); ',
        'float spec = pow(max(dot(viewDir, reflectDir), 0.0),64.0);',
        'vec3 specular = specularStrength * spec * u_lightColor; ',
        //Mix
        'gl_FragColor = vec4(u_objectColor * (specular + ambient + diffuse ), 1);',
    '}',
].join("\n");


var ax = 10;
var ay = 20;

var kx=-6,ky=3,kz=-3;//light position

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

    loadJSONResource("models/human.json").then((mod) => {
        console.log(mod);
        var model = mod;
        model = new Model(model);
        
        var shad = new Shader(gl, ['u_ModelMatrix', 'u_ViewMatrix', 'u_ProjectionMatrix', 'u_NormalMatrix', 'u_Bones', 'u_objectColor', 'u_objectColor', 'u_lightColor', 'u_lightPos', 'u_viewPos']);    
        gl.enable(gl.DEPTH_TEST);
        
        var Lx=0,Ly=0,Lz=-50; //Camera position
        
        const loop = () => {
            gl.clearColor(0.4, 0.4, 0.4, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            shad.gl.uniform3fv(shad.u_lightPos, new Float32Array([kx, ky, kz]));
            shad.gl.uniform3fv(shad.u_viewPos, new Float32Array([Lx, Ly, Lz]));

            var viewMatrix = new Matrix4();
            viewMatrix.setLookAt(Lx, Ly, Lz, 0, 0, 0, 0, 1, 0);
            gl.uniformMatrix4fv(shad.u_ViewMatrix, false, viewMatrix.elements);
            
            var projectionMatrix = new Matrix4();
            projectionMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
            gl.uniformMatrix4fv(shad.u_ProjectionMatrix, false, projectionMatrix.elements);
            
            var modelMatrix = new Matrix4();
            modelMatrix.setIdentity();
            model.drawModel(model.root, shad, modelMatrix);
            
            var joint = model.getJointByName(model.root, "SolKol");
           // var joint2 = model.getJointByName(model.root, "Cone_002");
          //  joint.rotateJoint(270, 1, 0, 1);
            //joint2.rotateJoint(60, 1, 0, 0);
          
            //return;
            /*  //draw light
            modelMatrix.setIdentity();
            gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
            initArrayBuffer(new Float32Array([kx, ky, kz]), 'a_Position', 3, 0, 0);
            gl.drawArrays(gl.POINTS,0 ,1);*/

            requestAnimationFrame(loop);
        }  
        requestAnimationFrame(loop);


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

