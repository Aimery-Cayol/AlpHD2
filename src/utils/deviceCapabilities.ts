/**
 * Utilitaire de détection des capacités 3D et matérielles du client
 */

export interface DeviceCapabilities {
  deviceMemory?: number; // RAM approximative en GB
  gpuInfo?: {
    vendor?: string;
    renderer?: string;
  };
  browser: {
    name: string;
    version: string;
    userAgent: string;
  };
  webgl: {
    supported: boolean;
    version?: string;
    maxTextureSize?: number;
    maxVertexAttributes?: number;
    maxVertexUniforms?: number;
    maxVaryingVectors?: number;
    maxFragmentUniforms?: number;
    maxCombinedTextureUnits?: number;
    maxViewportDims?: [number, number];
    maxRenderbufferSize?: number;
    maxVertIdsPerDraw?: number; // Firefox spécifique
    extensions?: string[];
  };
  webgpu: {
    supported: boolean;
    adapterInfo?: {
      vendor?: string;
      architecture?: string;
      device?: string;
      description?: string;
    };
  };
}

/**
 * Détecte le navigateur
 */
function detectBrowser(): { name: string; version: string; userAgent: string } {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';
  
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Edg')) {
    name = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Firefox')) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  return { name, version, userAgent: ua };
}

/**
 * Teste les capacités WebGL
 */
function detectWebGL(): DeviceCapabilities['webgl'] {
  const canvas = document.createElement('canvas');
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let version: string | undefined;
  
  gl = canvas.getContext('webgl2');
  if (gl) {
    version = '2.0';
  } else {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (gl) {
      version = '1.0';
    }
  }
  
  if (!gl) {
    return { supported: false };
  }
  
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  const maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
  const maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);
  const maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
  const maxCombinedTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
  const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
  const extensions = gl.getSupportedExtensions() || [];
  
  // Firefox spécifique : webgl.max-vert-ids-per-draw
  // Accessible via about:config dans Firefox
  let maxVertIdsPerDraw: number | undefined;
  try {
    // Cette valeur n'est pas directement accessible via WebGL API
    // mais on peut tester la limite pratique
    const isFirefox = navigator.userAgent.includes('Firefox');
    if (isFirefox) {
      // Firefox a une limite par défaut de 30 000 000 vertices par draw call
      // modifiable via about:config (webgl.max-vert-ids-per-draw)
      maxVertIdsPerDraw = 30_000_000; // valeur par défaut Firefox
    }
  } catch (e) {
    // Non disponible
  }
  
  return {
    supported: true,
    version,
    maxTextureSize,
    maxVertexAttributes,
    maxVertexUniforms,
    maxVaryingVectors,
    maxFragmentUniforms,
    maxCombinedTextureUnits,
    maxViewportDims,
    maxRenderbufferSize,
    maxVertIdsPerDraw,
    extensions,
  };
}

/**
 * Teste les capacités WebGPU
 */
async function detectWebGPU(): Promise<DeviceCapabilities['webgpu']> {
  if (!('gpu' in navigator)) {
    return { supported: false };
  }
  
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { supported: false };
    }
    
    let adapterInfo;
    if ('requestAdapterInfo' in adapter) {
      try {
        const info = await (adapter as any).requestAdapterInfo();
        adapterInfo = {
          vendor: info.vendor,
          architecture: info.architecture,
          device: info.device,
          description: info.description,
        };
      } catch (e) {
        // Info non disponible
      }
    }
    
    return {
      supported: true,
      adapterInfo,
    };
  } catch (error) {
    return { supported: false };
  }
}

/**
 * Détecte toutes les capacités et les affiche en console
 */
export async function detectAndLogCapabilities(): Promise<DeviceCapabilities> {
  const deviceMemory = (navigator as any).deviceMemory as number | undefined;
  const browser = detectBrowser();
  const webgl = detectWebGL();
  const webgpu = await detectWebGPU();
  
  // Info GPU depuis WebGL
  const gpuInfo: DeviceCapabilities['gpuInfo'] = {};
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      gpuInfo.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      gpuInfo.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
  }
  
  const capabilities: DeviceCapabilities = {
    deviceMemory,
    gpuInfo,
    browser,
    webgl,
    webgpu,
  };
  
  // Affichage en console
  console.group('🖥️ CAPACITÉS 3D DU CLIENT');
  
  console.log('\n📊 MÉMOIRE RAM:', deviceMemory ? `~${deviceMemory} GB` : '❓ Inconnue (API non supportée)');
  
  console.log('\n🎮 CARTE GRAPHIQUE:');
  if (gpuInfo.renderer || gpuInfo.vendor) {
    console.log('  • GPU:', gpuInfo.renderer || 'Inconnu');
    console.log('  • Fabricant:', gpuInfo.vendor || 'Inconnu');
  } else {
    console.log('  ❓ Informations non disponibles');
  }
  
  console.log('\n🌐 NAVIGATEUR:');
  console.log('  • Nom:', browser.name);
  console.log('  • Version:', browser.version);
  console.log('  • User Agent:', browser.userAgent);
  
  console.log('\n🔷 WEBGL:');
  if (webgl.supported) {
    console.log('  ✅ Supporté - Version', webgl.version);
    console.log('  • Max Texture Size:', webgl.maxTextureSize);
    console.log('  • Max Vertex Attributes:', webgl.maxVertexAttributes);
    console.log('  • Max Vertex Uniforms:', webgl.maxVertexUniforms);
    console.log('  • Max Varying Vectors:', webgl.maxVaryingVectors);
    console.log('  • Max Fragment Uniforms:', webgl.maxFragmentUniforms);
    console.log('  • Max Combined Texture Units:', webgl.maxCombinedTextureUnits);
    console.log('  • Max Viewport Dimensions:', webgl.maxViewportDims);
    console.log('  • Max Renderbuffer Size:', webgl.maxRenderbufferSize);
    if (webgl.maxVertIdsPerDraw) {
      console.log('  • Max Vert IDs per Draw (Firefox):', webgl.maxVertIdsPerDraw.toLocaleString());
    }
    console.log('  • Extensions supportées:', webgl.extensions?.length || 0);
    
    // Estimation du nombre max de vertices
    const estimatedMaxVertices = webgl.maxVertIdsPerDraw || Math.floor((webgl.maxVertexAttributes || 8) * 500_000);
    console.log('  • Max Vertices par Draw Call:', estimatedMaxVertices.toLocaleString());
  } else {
    console.log('  ❌ Non supporté');
  }
  
  console.log('\n🔶 WEBGPU:');
  if (webgpu.supported) {
    console.log('  ✅ Supporté');
    if (webgpu.adapterInfo) {
      console.log('  • Vendor:', webgpu.adapterInfo.vendor || 'N/A');
      console.log('  • Architecture:', webgpu.adapterInfo.architecture || 'N/A');
      console.log('  • Device:', webgpu.adapterInfo.device || 'N/A');
      console.log('  • Description:', webgpu.adapterInfo.description || 'N/A');
    }
  } else {
    console.log('  ❌ Non supporté');
  }
  
  console.groupEnd();
  
  return capabilities;
}
