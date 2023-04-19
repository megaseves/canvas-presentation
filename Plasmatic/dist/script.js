(function() {
  var GLSL, error, gl, gui, nogl;

  GLSL = {
    // Vertex shader
    vert: `
#ifdef GL_ES
precision mediump float;
#endif

// Uniforms
uniform vec2 u_resolution;

// Attributes
attribute vec2 a_position;

void main() {
    gl_Position = vec4 (a_position, 0, 1);
}
`,
    // Fragment shader
    frag: `
#ifdef GL_ES
precision mediump float;
#endif

uniform bool u_scanlines;
uniform vec2 u_resolution;

uniform float u_brightness;
uniform float u_blobiness;
uniform float u_particles;
uniform float u_millis;
uniform float u_energy;

// https://goo.gl/LrCde
float noise( vec2 co ){
    return fract( sin( dot( co.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
}

void main( void ) {

    vec2 position = ( gl_FragCoord.xy / u_resolution.x );
    float t = u_millis * 0.001 * u_energy;
    
    float a = 0.0;
    float b = 0.0;
    float c = 0.0;

    vec2 pos, center = vec2( 0.5, 0.5 * (u_resolution.y / u_resolution.x) );
    
    float na, nb, nc, nd, d;
    float limit = u_particles / 40.0;
    float step = 1.0 / u_particles;
    float n = 0.0;
    
    for ( float i = 0.0; i <= 1.0; i += 0.025 ) {

        if ( i <= limit ) {

            vec2 np = vec2(n, 1-1);
            
            na = noise( np * 1.1 );
            nb = noise( np * 2.8 );
            nc = noise( np * 0.7 );
            nd = noise( np * 3.2 );

            pos = center;
            pos.x += sin(t*na) * cos(t*nb) * tan(t*na*0.15) * 0.3;
            pos.y += tan(t*nc) * sin(t*nd) * 0.1;
            
            d = pow( 1.6*na / length( pos - position ), u_blobiness );
            
            if ( i < limit * 0.3333 ) a += d;
            else if ( i < limit * 0.6666 ) b += d;
            else c += d;

            n += step;
        }
    }
    
    vec3 col = vec3(a*c,b*c,a*b) * 0.0001 * u_brightness;
    
    if ( u_scanlines ) {
        col -= mod( gl_FragCoord.y, 2.0 ) < 1.0 ? 0.5 : 0.0;
    }
    
    gl_FragColor = vec4( col, 1.0 );

}
`
  };

  try {
    gl = Sketch.create({
      // Sketch settings
      container: document.getElementById('container'),
      type: Sketch.WEB_GL,
      // Uniforms
      brightness: 0.8,
      blobiness: 1.5,
      particles: 40,
      energy: 1.01,
      scanlines: true
    });
  } catch (error1) {
    error = error1;
    nogl = document.getElementById('nogl');
    nogl.style.display = 'block';
  }

  if (gl) {
    gl.setup = function() {
      var frag, vert;
      this.clearColor(0.0, 0.0, 0.0, 1.0);
      // Setup shaders
      vert = this.createShader(this.VERTEX_SHADER);
      frag = this.createShader(this.FRAGMENT_SHADER);
      this.shaderSource(vert, GLSL.vert);
      this.shaderSource(frag, GLSL.frag);
      this.compileShader(vert);
      this.compileShader(frag);
      if (!this.getShaderParameter(vert, this.COMPILE_STATUS)) {
        throw this.getShaderInfoLog(vert);
      }
      if (!this.getShaderParameter(frag, this.COMPILE_STATUS)) {
        throw this.getShaderInfoLog(frag);
      }
      this.shaderProgram = this.createProgram();
      this.attachShader(this.shaderProgram, vert);
      this.attachShader(this.shaderProgram, frag);
      this.linkProgram(this.shaderProgram);
      if (!this.getProgramParameter(this.shaderProgram, this.LINK_STATUS)) {
        throw 'Failed to initialise shaders';
      }
      this.useProgram(this.shaderProgram);
      // Store attribute / uniform locations
      this.shaderProgram.attributes = {
        position: this.getAttribLocation(this.shaderProgram, 'a_position')
      };
      this.shaderProgram.uniforms = {
        resolution: this.getUniformLocation(this.shaderProgram, 'u_resolution'),
        brightness: this.getUniformLocation(this.shaderProgram, 'u_brightness'),
        blobiness: this.getUniformLocation(this.shaderProgram, 'u_blobiness'),
        particles: this.getUniformLocation(this.shaderProgram, 'u_particles'),
        scanlines: this.getUniformLocation(this.shaderProgram, 'u_scanlines'),
        energy: this.getUniformLocation(this.shaderProgram, 'u_energy'),
        millis: this.getUniformLocation(this.shaderProgram, 'u_millis')
      };
      // Create geometry
      this.geometry = this.createBuffer();
      this.geometry.vertexCount = 6;
      this.bindBuffer(this.ARRAY_BUFFER, this.geometry);
      this.bufferData(this.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), this.STATIC_DRAW);
      this.enableVertexAttribArray(this.shaderProgram.attributes.position);
      this.vertexAttribPointer(this.shaderProgram.attributes.position, 2, this.FLOAT, false, 0, 0);
      // Resize to window
      return this.resize();
    };
    gl.updateUniforms = function() {
      if (!this.shaderProgram) {
        return;
      }
      this.uniform2f(this.shaderProgram.uniforms.resolution, this.width, this.height);
      this.uniform1f(this.shaderProgram.uniforms.brightness, this.brightness);
      this.uniform1f(this.shaderProgram.uniforms.blobiness, this.blobiness);
      this.uniform1f(this.shaderProgram.uniforms.particles, this.particles);
      this.uniform1i(this.shaderProgram.uniforms.scanlines, this.scanlines);
      return this.uniform1f(this.shaderProgram.uniforms.energy, this.energy);
    };
    gl.draw = function() {
      // Update uniforms
      this.uniform1f(this.shaderProgram.uniforms.millis, this.millis + 5000);
      // Render
      this.clear(this.COLOR_BUFFER_BIT | this.DEPTH_BUFFER_BIT);
      this.bindBuffer(this.ARRAY_BUFFER, this.geometry);
      return this.drawArrays(this.TRIANGLES, 0, this.geometry.vertexCount);
    };
    gl.resize = function() {
      // Update resolution
      this.viewport(0, 0, this.width, this.height);
      // Update uniforms if the shader program is ready
      return this.updateUniforms();
    };
    // GUI
    gui = new dat.GUI();
    gui.add(gl, 'particles').step(1.0).min(8).max(40).onChange(function() {
      return gl.updateUniforms();
    });
    gui.add(gl, 'brightness').step(0.01).min(0.1).max(1.0).onChange(function() {
      return gl.updateUniforms();
    });
    gui.add(gl, 'blobiness').step(0.01).min(0.8).max(1.5).onChange(function() {
      return gl.updateUniforms();
    });
    gui.add(gl, 'energy').step(0.01).min(0.1).max(4.0).onChange(function() {
      return gl.updateUniforms();
    });
    gui.add(gl, 'scanlines').onChange(function() {
      return gl.updateUniforms();
    });
    gui.close();
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7QUFBQSxNQUFBLElBQUEsRUFBQSxLQUFBLEVBQUEsRUFBQSxFQUFBLEdBQUEsRUFBQTs7RUFBQSxJQUFBLEdBSUksQ0FBQTs7SUFBQSxJQUFBLEVBQU0sQ0FBQTs7Ozs7Ozs7Ozs7Ozs7QUFBQSxDQUFOOztJQW9CQSxJQUFBLEVBQU0sQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7RUFwQk47O0FBNkZKO0lBRUksRUFBQSxHQUFLLE1BQU0sQ0FBQyxNQUFQLENBSUQsQ0FBQTs7TUFBQSxTQUFBLEVBQVcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBWDtNQUNBLElBQUEsRUFBTSxNQUFNLENBQUMsTUFEYjs7TUFLQSxVQUFBLEVBQVksR0FMWjtNQU1BLFNBQUEsRUFBVyxHQU5YO01BT0EsU0FBQSxFQUFXLEVBUFg7TUFRQSxNQUFBLEVBQVEsSUFSUjtNQVNBLFNBQUEsRUFBVztJQVRYLENBSkMsRUFGVDtHQWlCQSxjQUFBO0lBQU07SUFFRixJQUFBLEdBQU8sUUFBUSxDQUFDLGNBQVQsQ0FBd0IsTUFBeEI7SUFDUCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsR0FBcUIsUUFIekI7OztFQUtBLElBQUcsRUFBSDtJQUVJLEVBQUUsQ0FBQyxLQUFILEdBQVcsUUFBQSxDQUFBLENBQUE7QUFFZixVQUFBLElBQUEsRUFBQTtNQUFRLElBQUksQ0FBQyxVQUFMLENBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLEVBQTBCLEdBQTFCLEVBQStCLEdBQS9CLEVBQVI7O01BSVEsSUFBQSxHQUFPLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBQyxDQUFBLGFBQWY7TUFDUCxJQUFBLEdBQU8sSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFDLENBQUEsZUFBZjtNQUVQLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxFQUFvQixJQUFJLENBQUMsSUFBekI7TUFDQSxJQUFDLENBQUEsWUFBRCxDQUFjLElBQWQsRUFBb0IsSUFBSSxDQUFDLElBQXpCO01BRUEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFmO01BQ0EsSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFmO01BRUEsSUFBZ0MsQ0FBSSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsRUFBMEIsSUFBQyxDQUFBLGNBQTNCLENBQXBDO1FBQUEsTUFBTSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEIsRUFBTjs7TUFDQSxJQUFnQyxDQUFJLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFwQixFQUEwQixJQUFDLENBQUEsY0FBM0IsQ0FBcEM7UUFBQSxNQUFNLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFsQixFQUFOOztNQUVBLElBQUMsQ0FBQSxhQUFELEdBQW9CLElBQUMsQ0FBQTtNQUNyQixJQUFDLENBQUMsWUFBRixDQUFlLElBQUMsQ0FBQSxhQUFoQixFQUErQixJQUEvQjtNQUNBLElBQUMsQ0FBQyxZQUFGLENBQWUsSUFBQyxDQUFBLGFBQWhCLEVBQStCLElBQS9CO01BQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsYUFBZDtNQUVBLElBQXdDLENBQUksSUFBQyxDQUFBLG1CQUFELENBQXFCLElBQUMsQ0FBQSxhQUF0QixFQUFxQyxJQUFDLENBQUEsV0FBdEMsQ0FBNUM7UUFBQSxNQUFNLCtCQUFOOztNQUVBLElBQUMsQ0FBQSxVQUFELENBQVksSUFBQyxDQUFBLGFBQWIsRUF2QlI7O01BMkJRLElBQUMsQ0FBQSxhQUFhLENBQUMsVUFBZixHQUNJO1FBQUEsUUFBQSxFQUFVLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFDLENBQUEsYUFBcEIsRUFBbUMsWUFBbkM7TUFBVjtNQUVKLElBQUMsQ0FBQSxhQUFhLENBQUMsUUFBZixHQUNJO1FBQUEsVUFBQSxFQUFZLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFDLENBQUEsYUFBckIsRUFBb0MsY0FBcEMsQ0FBWjtRQUNBLFVBQUEsRUFBWSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBQyxDQUFBLGFBQXJCLEVBQW9DLGNBQXBDLENBRFo7UUFFQSxTQUFBLEVBQVcsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSxhQUFyQixFQUFvQyxhQUFwQyxDQUZYO1FBR0EsU0FBQSxFQUFXLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFDLENBQUEsYUFBckIsRUFBb0MsYUFBcEMsQ0FIWDtRQUlBLFNBQUEsRUFBVyxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBQyxDQUFBLGFBQXJCLEVBQW9DLGFBQXBDLENBSlg7UUFLQSxNQUFBLEVBQVEsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSxhQUFyQixFQUFvQyxVQUFwQyxDQUxSO1FBTUEsTUFBQSxFQUFRLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFDLENBQUEsYUFBckIsRUFBb0MsVUFBcEM7TUFOUixFQS9CWjs7TUF5Q1EsSUFBQyxDQUFBLFFBQUQsR0FBZSxJQUFDLENBQUE7TUFDaEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxXQUFWLEdBQXdCO01BRXhCLElBQUMsQ0FBQSxVQUFELENBQVksSUFBQyxDQUFBLFlBQWIsRUFBMkIsSUFBQyxDQUFBLFFBQTVCO01BQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFDLENBQUEsWUFBYixFQUEyQixJQUFJLFlBQUosQ0FBaUIsQ0FDeEMsQ0FBQyxHQUR1QyxFQUNsQyxDQUFDLEdBRGlDLEVBRXZDLEdBRnVDLEVBRWxDLENBQUMsR0FGaUMsRUFHeEMsQ0FBQyxHQUh1QyxFQUdqQyxHQUhpQyxFQUl4QyxDQUFDLEdBSnVDLEVBSWpDLEdBSmlDLEVBS3ZDLEdBTHVDLEVBS2xDLENBQUMsR0FMaUMsRUFNdkMsR0FOdUMsRUFNakMsR0FOaUMsQ0FBakIsQ0FBM0IsRUFPSyxJQUFDLENBQUEsV0FQTjtNQVNBLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixJQUFDLENBQUEsYUFBYSxDQUFDLFVBQVUsQ0FBQyxRQUFuRDtNQUNBLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixJQUFDLENBQUEsYUFBYSxDQUFDLFVBQVUsQ0FBQyxRQUEvQyxFQUF5RCxDQUF6RCxFQUE0RCxJQUFDLENBQUEsS0FBN0QsRUFBb0UsS0FBcEUsRUFBd0UsQ0FBeEUsRUFBMkUsQ0FBM0UsRUF2RFI7O2FBMERXLElBQUMsQ0FBQTtJQTVERztJQThEWCxFQUFFLENBQUMsY0FBSCxHQUFvQixRQUFBLENBQUEsQ0FBQTtNQUVoQixJQUFVLENBQUksSUFBQyxDQUFBLGFBQWY7QUFBQSxlQUFBOztNQUVBLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBQyxDQUFBLGFBQWEsQ0FBQyxRQUFRLENBQUMsVUFBbkMsRUFBK0MsSUFBQyxDQUFBLEtBQWhELEVBQXVELElBQUMsQ0FBQSxNQUF4RDtNQUNBLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBQyxDQUFBLGFBQWEsQ0FBQyxRQUFRLENBQUMsVUFBbkMsRUFBK0MsSUFBQyxDQUFBLFVBQWhEO01BQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFDLENBQUEsYUFBYSxDQUFDLFFBQVEsQ0FBQyxTQUFuQyxFQUE4QyxJQUFDLENBQUEsU0FBL0M7TUFDQSxJQUFDLENBQUEsU0FBRCxDQUFXLElBQUMsQ0FBQSxhQUFhLENBQUMsUUFBUSxDQUFDLFNBQW5DLEVBQThDLElBQUMsQ0FBQSxTQUEvQztNQUNBLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBQyxDQUFBLGFBQWEsQ0FBQyxRQUFRLENBQUMsU0FBbkMsRUFBOEMsSUFBQyxDQUFBLFNBQS9DO2FBQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFDLENBQUEsYUFBYSxDQUFDLFFBQVEsQ0FBQyxNQUFuQyxFQUEyQyxJQUFDLENBQUEsTUFBNUM7SUFUZ0I7SUFXcEIsRUFBRSxDQUFDLElBQUgsR0FBVSxRQUFBLENBQUEsQ0FBQSxFQUFBOztNQUlOLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBQyxDQUFBLGFBQWEsQ0FBQyxRQUFRLENBQUMsTUFBbkMsRUFBMkMsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFyRCxFQUZSOztNQU1RLElBQUMsQ0FBQSxLQUFELENBQU8sSUFBQyxDQUFBLGdCQUFELEdBQW9CLElBQUMsQ0FBQSxnQkFBNUI7TUFDQSxJQUFDLENBQUEsVUFBRCxDQUFZLElBQUMsQ0FBQSxZQUFiLEVBQTJCLElBQUMsQ0FBQSxRQUE1QjthQUNBLElBQUMsQ0FBQSxVQUFELENBQVksSUFBQyxDQUFBLFNBQWIsRUFBd0IsQ0FBeEIsRUFBMkIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxXQUFyQztJQVZNO0lBWVYsRUFBRSxDQUFDLE1BQUgsR0FBWSxRQUFBLENBQUEsQ0FBQSxFQUFBOztNQUlSLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsSUFBQyxDQUFBLEtBQWpCLEVBQXdCLElBQUMsQ0FBQSxNQUF6QixFQUZSOzthQU1XLElBQUMsQ0FBQTtJQVJJLEVBckZoQjs7SUFnR0ksR0FBQSxHQUFNLElBQUksR0FBRyxDQUFDLEdBQVIsQ0FBQTtJQUNOLEdBQUcsQ0FBQyxHQUFKLENBQVMsRUFBVCxFQUFhLFdBQWIsQ0FBMEIsQ0FBQyxJQUEzQixDQUFpQyxHQUFqQyxDQUFzQyxDQUFDLEdBQXZDLENBQTRDLENBQTVDLENBQStDLENBQUMsR0FBaEQsQ0FBcUQsRUFBckQsQ0FBeUQsQ0FBQyxRQUExRCxDQUFtRSxRQUFBLENBQUEsQ0FBQTthQUFNLEVBQUUsQ0FBQztJQUFULENBQW5FO0lBQ0EsR0FBRyxDQUFDLEdBQUosQ0FBUyxFQUFULEVBQWEsWUFBYixDQUEyQixDQUFDLElBQTVCLENBQWtDLElBQWxDLENBQXdDLENBQUMsR0FBekMsQ0FBOEMsR0FBOUMsQ0FBbUQsQ0FBQyxHQUFwRCxDQUF5RCxHQUF6RCxDQUE4RCxDQUFDLFFBQS9ELENBQXdFLFFBQUEsQ0FBQSxDQUFBO2FBQU0sRUFBRSxDQUFDO0lBQVQsQ0FBeEU7SUFDQSxHQUFHLENBQUMsR0FBSixDQUFTLEVBQVQsRUFBYSxXQUFiLENBQTBCLENBQUMsSUFBM0IsQ0FBaUMsSUFBakMsQ0FBdUMsQ0FBQyxHQUF4QyxDQUE2QyxHQUE3QyxDQUFrRCxDQUFDLEdBQW5ELENBQXdELEdBQXhELENBQTZELENBQUMsUUFBOUQsQ0FBdUUsUUFBQSxDQUFBLENBQUE7YUFBTSxFQUFFLENBQUM7SUFBVCxDQUF2RTtJQUNBLEdBQUcsQ0FBQyxHQUFKLENBQVMsRUFBVCxFQUFhLFFBQWIsQ0FBdUIsQ0FBQyxJQUF4QixDQUE4QixJQUE5QixDQUFvQyxDQUFDLEdBQXJDLENBQTBDLEdBQTFDLENBQStDLENBQUMsR0FBaEQsQ0FBcUQsR0FBckQsQ0FBMEQsQ0FBQyxRQUEzRCxDQUFvRSxRQUFBLENBQUEsQ0FBQTthQUFNLEVBQUUsQ0FBQztJQUFULENBQXBFO0lBQ0EsR0FBRyxDQUFDLEdBQUosQ0FBUyxFQUFULEVBQWEsV0FBYixDQUEwQixDQUFDLFFBQTNCLENBQW9DLFFBQUEsQ0FBQSxDQUFBO2FBQU0sRUFBRSxDQUFDO0lBQVQsQ0FBcEM7SUFDQSxHQUFHLENBQUMsS0FBSixDQUFBLEVBeEdKOztBQXZIQSIsInNvdXJjZXNDb250ZW50IjpbIlxuR0xTTCA9XG5cbiAgICAjIFZlcnRleCBzaGFkZXJcblxuICAgIHZlcnQ6IFwiXCJcIlxuXG4gICAgI2lmZGVmIEdMX0VTXG4gICAgcHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XG4gICAgI2VuZGlmXG5cbiAgICAvLyBVbmlmb3Jtc1xuICAgIHVuaWZvcm0gdmVjMiB1X3Jlc29sdXRpb247XG5cbiAgICAvLyBBdHRyaWJ1dGVzXG4gICAgYXR0cmlidXRlIHZlYzIgYV9wb3NpdGlvbjtcblxuICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgZ2xfUG9zaXRpb24gPSB2ZWM0IChhX3Bvc2l0aW9uLCAwLCAxKTtcbiAgICB9XG5cbiAgICBcIlwiXCJcblxuICAgICMgRnJhZ21lbnQgc2hhZGVyXG5cbiAgICBmcmFnOiBcIlwiXCJcblxuICAgICNpZmRlZiBHTF9FU1xuICAgIHByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1xuICAgICNlbmRpZlxuXG4gICAgdW5pZm9ybSBib29sIHVfc2NhbmxpbmVzO1xuICAgIHVuaWZvcm0gdmVjMiB1X3Jlc29sdXRpb247XG4gICAgXG4gICAgdW5pZm9ybSBmbG9hdCB1X2JyaWdodG5lc3M7XG4gICAgdW5pZm9ybSBmbG9hdCB1X2Jsb2JpbmVzcztcbiAgICB1bmlmb3JtIGZsb2F0IHVfcGFydGljbGVzO1xuICAgIHVuaWZvcm0gZmxvYXQgdV9taWxsaXM7XG4gICAgdW5pZm9ybSBmbG9hdCB1X2VuZXJneTtcblxuICAgIC8vIGh0dHBzOi8vZ29vLmdsL0xyQ2RlXG4gICAgZmxvYXQgbm9pc2UoIHZlYzIgY28gKXtcbiAgICAgICAgcmV0dXJuIGZyYWN0KCBzaW4oIGRvdCggY28ueHksIHZlYzIoIDEyLjk4OTgsIDc4LjIzMyApICkgKSAqIDQzNzU4LjU0NTMgKTtcbiAgICB9XG5cbiAgICB2b2lkIG1haW4oIHZvaWQgKSB7XG5cbiAgICAgICAgdmVjMiBwb3NpdGlvbiA9ICggZ2xfRnJhZ0Nvb3JkLnh5IC8gdV9yZXNvbHV0aW9uLnggKTtcbiAgICAgICAgZmxvYXQgdCA9IHVfbWlsbGlzICogMC4wMDEgKiB1X2VuZXJneTtcbiAgICAgICAgXG4gICAgICAgIGZsb2F0IGEgPSAwLjA7XG4gICAgICAgIGZsb2F0IGIgPSAwLjA7XG4gICAgICAgIGZsb2F0IGMgPSAwLjA7XG5cbiAgICAgICAgdmVjMiBwb3MsIGNlbnRlciA9IHZlYzIoIDAuNSwgMC41ICogKHVfcmVzb2x1dGlvbi55IC8gdV9yZXNvbHV0aW9uLngpICk7XG4gICAgICAgIFxuICAgICAgICBmbG9hdCBuYSwgbmIsIG5jLCBuZCwgZDtcbiAgICAgICAgZmxvYXQgbGltaXQgPSB1X3BhcnRpY2xlcyAvIDQwLjA7XG4gICAgICAgIGZsb2F0IHN0ZXAgPSAxLjAgLyB1X3BhcnRpY2xlcztcbiAgICAgICAgZmxvYXQgbiA9IDAuMDtcbiAgICAgICAgXG4gICAgICAgIGZvciAoIGZsb2F0IGkgPSAwLjA7IGkgPD0gMS4wOyBpICs9IDAuMDI1ICkge1xuXG4gICAgICAgICAgICBpZiAoIGkgPD0gbGltaXQgKSB7XG5cbiAgICAgICAgICAgICAgICB2ZWMyIG5wID0gdmVjMihuLCAxLTEpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5hID0gbm9pc2UoIG5wICogMS4xICk7XG4gICAgICAgICAgICAgICAgbmIgPSBub2lzZSggbnAgKiAyLjggKTtcbiAgICAgICAgICAgICAgICBuYyA9IG5vaXNlKCBucCAqIDAuNyApO1xuICAgICAgICAgICAgICAgIG5kID0gbm9pc2UoIG5wICogMy4yICk7XG5cbiAgICAgICAgICAgICAgICBwb3MgPSBjZW50ZXI7XG4gICAgICAgICAgICAgICAgcG9zLnggKz0gc2luKHQqbmEpICogY29zKHQqbmIpICogdGFuKHQqbmEqMC4xNSkgKiAwLjM7XG4gICAgICAgICAgICAgICAgcG9zLnkgKz0gdGFuKHQqbmMpICogc2luKHQqbmQpICogMC4xO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGQgPSBwb3coIDEuNipuYSAvIGxlbmd0aCggcG9zIC0gcG9zaXRpb24gKSwgdV9ibG9iaW5lc3MgKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGkgPCBsaW1pdCAqIDAuMzMzMyApIGEgKz0gZDtcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggaSA8IGxpbWl0ICogMC42NjY2ICkgYiArPSBkO1xuICAgICAgICAgICAgICAgIGVsc2UgYyArPSBkO1xuXG4gICAgICAgICAgICAgICAgbiArPSBzdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2ZWMzIGNvbCA9IHZlYzMoYSpjLGIqYyxhKmIpICogMC4wMDAxICogdV9icmlnaHRuZXNzO1xuICAgICAgICBcbiAgICAgICAgaWYgKCB1X3NjYW5saW5lcyApIHtcbiAgICAgICAgICAgIGNvbCAtPSBtb2QoIGdsX0ZyYWdDb29yZC55LCAyLjAgKSA8IDEuMCA/IDAuNSA6IDAuMDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggY29sLCAxLjAgKTtcblxuICAgIH1cblxuICAgIFwiXCJcIlxuXG50cnlcbiAgICBcbiAgICBnbCA9IFNrZXRjaC5jcmVhdGVcblxuICAgICAgICAjIFNrZXRjaCBzZXR0aW5nc1xuXG4gICAgICAgIGNvbnRhaW5lcjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ2NvbnRhaW5lcidcbiAgICAgICAgdHlwZTogU2tldGNoLldFQl9HTFxuXG4gICAgICAgICMgVW5pZm9ybXNcblxuICAgICAgICBicmlnaHRuZXNzOiAwLjhcbiAgICAgICAgYmxvYmluZXNzOiAxLjVcbiAgICAgICAgcGFydGljbGVzOiA0MFxuICAgICAgICBlbmVyZ3k6IDEuMDFcbiAgICAgICAgc2NhbmxpbmVzOiB5ZXNcblxuY2F0Y2ggZXJyb3JcblxuICAgIG5vZ2wgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnbm9nbCdcbiAgICBub2dsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG5cbmlmIGdsXG5cbiAgICBnbC5zZXR1cCA9IC0+XG5cbiAgICAgICAgdGhpcy5jbGVhckNvbG9yIDAuMCwgMC4wLCAwLjAsIDEuMFxuXG4gICAgICAgICMgU2V0dXAgc2hhZGVyc1xuXG4gICAgICAgIHZlcnQgPSBAY3JlYXRlU2hhZGVyIEBWRVJURVhfU0hBREVSXG4gICAgICAgIGZyYWcgPSBAY3JlYXRlU2hhZGVyIEBGUkFHTUVOVF9TSEFERVJcblxuICAgICAgICBAc2hhZGVyU291cmNlIHZlcnQsIEdMU0wudmVydFxuICAgICAgICBAc2hhZGVyU291cmNlIGZyYWcsIEdMU0wuZnJhZ1xuXG4gICAgICAgIEBjb21waWxlU2hhZGVyIHZlcnRcbiAgICAgICAgQGNvbXBpbGVTaGFkZXIgZnJhZ1xuXG4gICAgICAgIHRocm93IEBnZXRTaGFkZXJJbmZvTG9nIHZlcnQgaWYgbm90IEBnZXRTaGFkZXJQYXJhbWV0ZXIgdmVydCwgQENPTVBJTEVfU1RBVFVTXG4gICAgICAgIHRocm93IEBnZXRTaGFkZXJJbmZvTG9nIGZyYWcgaWYgbm90IEBnZXRTaGFkZXJQYXJhbWV0ZXIgZnJhZywgQENPTVBJTEVfU1RBVFVTXG5cbiAgICAgICAgQHNoYWRlclByb2dyYW0gPSBkbyBAY3JlYXRlUHJvZ3JhbVxuICAgICAgICBALmF0dGFjaFNoYWRlciBAc2hhZGVyUHJvZ3JhbSwgdmVydFxuICAgICAgICBALmF0dGFjaFNoYWRlciBAc2hhZGVyUHJvZ3JhbSwgZnJhZ1xuICAgICAgICBAbGlua1Byb2dyYW0gQHNoYWRlclByb2dyYW1cblxuICAgICAgICB0aHJvdyAnRmFpbGVkIHRvIGluaXRpYWxpc2Ugc2hhZGVycycgaWYgbm90IEBnZXRQcm9ncmFtUGFyYW1ldGVyIEBzaGFkZXJQcm9ncmFtLCBATElOS19TVEFUVVNcblxuICAgICAgICBAdXNlUHJvZ3JhbSBAc2hhZGVyUHJvZ3JhbVxuXG4gICAgICAgICMgU3RvcmUgYXR0cmlidXRlIC8gdW5pZm9ybSBsb2NhdGlvbnNcblxuICAgICAgICBAc2hhZGVyUHJvZ3JhbS5hdHRyaWJ1dGVzID1cbiAgICAgICAgICAgIHBvc2l0aW9uOiBAZ2V0QXR0cmliTG9jYXRpb24gQHNoYWRlclByb2dyYW0sICdhX3Bvc2l0aW9uJ1xuXG4gICAgICAgIEBzaGFkZXJQcm9ncmFtLnVuaWZvcm1zID1cbiAgICAgICAgICAgIHJlc29sdXRpb246IEBnZXRVbmlmb3JtTG9jYXRpb24gQHNoYWRlclByb2dyYW0sICd1X3Jlc29sdXRpb24nXG4gICAgICAgICAgICBicmlnaHRuZXNzOiBAZ2V0VW5pZm9ybUxvY2F0aW9uIEBzaGFkZXJQcm9ncmFtLCAndV9icmlnaHRuZXNzJ1xuICAgICAgICAgICAgYmxvYmluZXNzOiBAZ2V0VW5pZm9ybUxvY2F0aW9uIEBzaGFkZXJQcm9ncmFtLCAndV9ibG9iaW5lc3MnXG4gICAgICAgICAgICBwYXJ0aWNsZXM6IEBnZXRVbmlmb3JtTG9jYXRpb24gQHNoYWRlclByb2dyYW0sICd1X3BhcnRpY2xlcydcbiAgICAgICAgICAgIHNjYW5saW5lczogQGdldFVuaWZvcm1Mb2NhdGlvbiBAc2hhZGVyUHJvZ3JhbSwgJ3Vfc2NhbmxpbmVzJ1xuICAgICAgICAgICAgZW5lcmd5OiBAZ2V0VW5pZm9ybUxvY2F0aW9uIEBzaGFkZXJQcm9ncmFtLCAndV9lbmVyZ3knXG4gICAgICAgICAgICBtaWxsaXM6IEBnZXRVbmlmb3JtTG9jYXRpb24gQHNoYWRlclByb2dyYW0sICd1X21pbGxpcydcblxuICAgICAgICAjIENyZWF0ZSBnZW9tZXRyeVxuXG4gICAgICAgIEBnZW9tZXRyeSA9IGRvIEBjcmVhdGVCdWZmZXJcbiAgICAgICAgQGdlb21ldHJ5LnZlcnRleENvdW50ID0gNlxuXG4gICAgICAgIEBiaW5kQnVmZmVyIEBBUlJBWV9CVUZGRVIsIEBnZW9tZXRyeVxuICAgICAgICBAYnVmZmVyRGF0YSBAQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgICAgICAgIC0xLjAsIC0xLjAsIFxuICAgICAgICAgICAgIDEuMCwgLTEuMCwgXG4gICAgICAgICAgICAtMS4wLCAgMS4wLCBcbiAgICAgICAgICAgIC0xLjAsICAxLjAsIFxuICAgICAgICAgICAgIDEuMCwgLTEuMCwgXG4gICAgICAgICAgICAgMS4wLCAgMS4wXSksXG4gICAgICAgICAgICAgQFNUQVRJQ19EUkFXXG5cbiAgICAgICAgQGVuYWJsZVZlcnRleEF0dHJpYkFycmF5IEBzaGFkZXJQcm9ncmFtLmF0dHJpYnV0ZXMucG9zaXRpb25cbiAgICAgICAgQHZlcnRleEF0dHJpYlBvaW50ZXIgQHNoYWRlclByb2dyYW0uYXR0cmlidXRlcy5wb3NpdGlvbiwgMiwgQEZMT0FULCBubywgMCwgMFxuXG4gICAgICAgICMgUmVzaXplIHRvIHdpbmRvd1xuICAgICAgICBkbyBAcmVzaXplXG5cbiAgICBnbC51cGRhdGVVbmlmb3JtcyA9IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBzaGFkZXJQcm9ncmFtXG5cbiAgICAgICAgQHVuaWZvcm0yZiBAc2hhZGVyUHJvZ3JhbS51bmlmb3Jtcy5yZXNvbHV0aW9uLCBAd2lkdGgsIEBoZWlnaHRcbiAgICAgICAgQHVuaWZvcm0xZiBAc2hhZGVyUHJvZ3JhbS51bmlmb3Jtcy5icmlnaHRuZXNzLCBAYnJpZ2h0bmVzc1xuICAgICAgICBAdW5pZm9ybTFmIEBzaGFkZXJQcm9ncmFtLnVuaWZvcm1zLmJsb2JpbmVzcywgQGJsb2JpbmVzc1xuICAgICAgICBAdW5pZm9ybTFmIEBzaGFkZXJQcm9ncmFtLnVuaWZvcm1zLnBhcnRpY2xlcywgQHBhcnRpY2xlc1xuICAgICAgICBAdW5pZm9ybTFpIEBzaGFkZXJQcm9ncmFtLnVuaWZvcm1zLnNjYW5saW5lcywgQHNjYW5saW5lc1xuICAgICAgICBAdW5pZm9ybTFmIEBzaGFkZXJQcm9ncmFtLnVuaWZvcm1zLmVuZXJneSwgQGVuZXJneVxuXG4gICAgZ2wuZHJhdyA9IC0+XG5cbiAgICAgICAgIyBVcGRhdGUgdW5pZm9ybXNcblxuICAgICAgICBAdW5pZm9ybTFmIEBzaGFkZXJQcm9ncmFtLnVuaWZvcm1zLm1pbGxpcywgQG1pbGxpcyArIDUwMDBcblxuICAgICAgICAjIFJlbmRlclxuXG4gICAgICAgIEBjbGVhciBAQ09MT1JfQlVGRkVSX0JJVCB8IEBERVBUSF9CVUZGRVJfQklUXG4gICAgICAgIEBiaW5kQnVmZmVyIEBBUlJBWV9CVUZGRVIsIEBnZW9tZXRyeVxuICAgICAgICBAZHJhd0FycmF5cyBAVFJJQU5HTEVTLCAwLCBAZ2VvbWV0cnkudmVydGV4Q291bnRcblxuICAgIGdsLnJlc2l6ZSA9IC0+XG5cbiAgICAgICAgIyBVcGRhdGUgcmVzb2x1dGlvblxuXG4gICAgICAgIEB2aWV3cG9ydCAwLCAwLCBAd2lkdGgsIEBoZWlnaHRcblxuICAgICAgICAjIFVwZGF0ZSB1bmlmb3JtcyBpZiB0aGUgc2hhZGVyIHByb2dyYW0gaXMgcmVhZHlcblxuICAgICAgICBkbyBAdXBkYXRlVW5pZm9ybXNcblxuICAgICMgR1VJXG4gICAgZ3VpID0gbmV3IGRhdC5HVUkoKVxuICAgIGd1aS5hZGQoIGdsLCAncGFydGljbGVzJyApLnN0ZXAoIDEuMCApLm1pbiggOCApLm1heCggNDAgKS5vbkNoYW5nZSAtPiBkbyBnbC51cGRhdGVVbmlmb3Jtc1xuICAgIGd1aS5hZGQoIGdsLCAnYnJpZ2h0bmVzcycgKS5zdGVwKCAwLjAxICkubWluKCAwLjEgKS5tYXgoIDEuMCApLm9uQ2hhbmdlIC0+IGRvIGdsLnVwZGF0ZVVuaWZvcm1zXG4gICAgZ3VpLmFkZCggZ2wsICdibG9iaW5lc3MnICkuc3RlcCggMC4wMSApLm1pbiggMC44ICkubWF4KCAxLjUgKS5vbkNoYW5nZSAtPiBkbyBnbC51cGRhdGVVbmlmb3Jtc1xuICAgIGd1aS5hZGQoIGdsLCAnZW5lcmd5JyApLnN0ZXAoIDAuMDEgKS5taW4oIDAuMSApLm1heCggNC4wICkub25DaGFuZ2UgLT4gZG8gZ2wudXBkYXRlVW5pZm9ybXNcbiAgICBndWkuYWRkKCBnbCwgJ3NjYW5saW5lcycgKS5vbkNoYW5nZSAtPiBkbyBnbC51cGRhdGVVbmlmb3Jtc1xuICAgIGd1aS5jbG9zZSgpXG4iXX0=
//# sourceURL=coffeescript