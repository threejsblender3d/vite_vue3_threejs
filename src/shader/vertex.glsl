uniform float time;
varying vec2 vUv;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

varying vec3 vWorldPosition;
attribute float aRandom;

void main()
{
    vUv = uv;

    float offset = aRandom + sin(time + 15.*aRandom);

     offset *= 0.2;
   

    vec4 mvPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);

    mvPosition.y += offset;

    mvPosition = viewMatrix * mvPosition;

    vViewPosition = -mvPosition.xyz;

    vNormal = normalMatrix * mat3(instanceMatrix) * normal;

    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
    worldPosition.y += offset;
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;

   
}