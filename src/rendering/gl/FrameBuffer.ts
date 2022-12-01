class FrameBuffer {
  mp_context: WebGL2RenderingContext;
  m_frameBuffer: WebGLFramebuffer;
  m_outputTexture: WebGLTexture;
  m_depthRenderBuffer: WebGLRenderbuffer;
  m_width: number;
  m_height: number;
  m_devicePixelRatio: number;
  m_created: boolean;
  m_textureSlot: number;

  constructor(
    context: WebGL2RenderingContext,
    width: number,
    height: number,
    devicePixelRatio: number
  ) {
    this.mp_context = context;
    this.m_frameBuffer = -1;
    this.m_outputTexture = -1;
    this.m_depthRenderBuffer = -1;
    this.m_width = width;
    this.m_height = height;
    this.m_devicePixelRatio = devicePixelRatio;
    this.m_created = false;
  }

  resize(width: number, height: number, devicePixelRatio: number) {
    this.m_width = width;
    this.m_height = height;
    this.m_devicePixelRatio = devicePixelRatio;
  }

  create() {
    // Initialize the frame buffers and render textures
    this.m_frameBuffer = this.mp_context.createFramebuffer();
    this.m_outputTexture = this.mp_context.createTexture();
    this.m_depthRenderBuffer = this.mp_context.createRenderbuffer();

    this.mp_context.bindFramebuffer(
      this.mp_context.FRAMEBUFFER,
      this.m_frameBuffer
    );
    // Bind our texture so that all functions that deal with textures will interact with this one
    this.mp_context.bindTexture(
      this.mp_context.TEXTURE_2D,
      this.m_outputTexture
    );
    // Give an empty image to OpenGL ( the last "0" )
    this.mp_context.texImage2D(
      this.mp_context.TEXTURE_2D,
      0,
      this.mp_context.RGBA,
      this.m_width * this.m_devicePixelRatio,
      this.m_height * this.m_devicePixelRatio,
      0,
      this.mp_context.RGBA,
      this.mp_context.UNSIGNED_BYTE,
      null
    );

    // Set the render settings for the texture we've just created.
    // Essentially zero filtering on the "texture" so it appears exactly as rendered
    this.mp_context.texParameteri(
      this.mp_context.TEXTURE_2D,
      this.mp_context.TEXTURE_MAG_FILTER,
      this.mp_context.NEAREST
    );
    this.mp_context.texParameteri(
      this.mp_context.TEXTURE_2D,
      this.mp_context.TEXTURE_MIN_FILTER,
      this.mp_context.NEAREST
    );
    // Clamp the colors at the edge of our texture
    this.mp_context.texParameteri(
      this.mp_context.TEXTURE_2D,
      this.mp_context.TEXTURE_WRAP_S,
      this.mp_context.CLAMP_TO_EDGE
    );
    this.mp_context.texParameteri(
      this.mp_context.TEXTURE_2D,
      this.mp_context.TEXTURE_WRAP_T,
      this.mp_context.CLAMP_TO_EDGE
    );

    // Initialize our depth buffer
    this.mp_context.bindRenderbuffer(
      this.mp_context.RENDERBUFFER,
      this.m_depthRenderBuffer
    );
    this.mp_context.renderbufferStorage(
      this.mp_context.RENDERBUFFER,
      this.mp_context.DEPTH_COMPONENT16,
      this.m_width * this.m_devicePixelRatio,
      this.m_height * this.m_devicePixelRatio
    );
    this.mp_context.framebufferRenderbuffer(
      this.mp_context.FRAMEBUFFER,
      this.mp_context.DEPTH_ATTACHMENT,
      this.mp_context.RENDERBUFFER,
      this.m_depthRenderBuffer
    );

    // Set this.m_renderedTexture as the color output of our frame buffer
    this.mp_context.framebufferTexture2D(
      this.mp_context.FRAMEBUFFER,
      this.mp_context.COLOR_ATTACHMENT0,
      this.mp_context.TEXTURE_2D,
      this.m_outputTexture,
      0
    );

    // Sets the color output of the fragment shader to be stored in this.mp_context.COLOR_ATTACHMENT0,
    // which we previously set to this.m_renderedTexture
    this.mp_context.drawBuffers([this.mp_context.COLOR_ATTACHMENT0]); // "1" is the size of drawBuffers

    this.m_created = true;
    if (
      this.mp_context.checkFramebufferStatus(this.mp_context.FRAMEBUFFER) !=
      this.mp_context.FRAMEBUFFER_COMPLETE
    ) {
      this.m_created = false;
      console.log("Frame buffer did not initialize correctly...");
    }
  }

  destroy() {
    if (this.m_created) {
      this.m_created = false;
      this.mp_context.deleteFramebuffer(this.m_frameBuffer);
      this.mp_context.deleteTexture(this.m_outputTexture);
      this.mp_context.deleteRenderbuffer(this.m_depthRenderBuffer);
    }
  }

  bindFrameBuffer() {
    this.mp_context.bindFramebuffer(
      this.mp_context.FRAMEBUFFER,
      this.m_frameBuffer
    );
  }

  bindToTextureSlot(slot: number) {
    this.m_textureSlot = slot;
    this.mp_context.activeTexture(this.mp_context.TEXTURE0 + slot);
    this.mp_context.bindTexture(
      this.mp_context.TEXTURE_2D,
      this.m_outputTexture
    );
  }

  getTextureSlot() {
    return this.m_textureSlot;
  }
}
export default FrameBuffer;
