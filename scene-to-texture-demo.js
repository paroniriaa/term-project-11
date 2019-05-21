import {tiny, defs} from './common.js';
                                                  // Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Material, Shader, Texture, Scene } = tiny;

export class Scene_To_Texture_Demo extends Scene
  { constructor()     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super();
        this.shapes = { box:   new defs.Cube(),
                        box_2: new defs.Cube(),
                        axis:  new defs.Axis_Arrows()
                      }
        this.shapes.box_2.arrays.texture_coord = this.shapes.box_2.arrays.texture_coord.map( p => p.times( 2 ) );

        this.scratchpad = document.createElement('canvas');
        this.scratchpad_context = this.scratchpad.getContext('2d');     // A hidden canvas for re-sizing the real canvas to be square.
        this.scratchpad.width   = 256;
        this.scratchpad.height  = 256;                // Initial image source: Blank gif file:
        this.texture = new Texture( "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" );

        const bump = new defs.Fake_Bump_Map( 1 );
        this.materials =
          {  a: new Material( bump, { ambient: .5, texture: new Texture( "assets/rgb.jpg" ) }),
             b: new Material( bump, { ambient:  1, texture: this.texture })
          }

        this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];

        this.spin = 0;
        this.cube_1 = Mat4.translation([ -2,0,0 ]);
        this.cube_2 = Mat4.translation([  2,0,0 ]);
      }
    make_control_panel()
      { this.key_triggered_button( "Cube rotation",  [ "c" ], () => this.spin ^= 1 );

        this.live_string( box => { box.textContent = this.spin } );  this.new_line();

        this.result_img = this.control_panel.appendChild( Object.assign( document.createElement( "img" ), 
                { style:"width:200px; height:" + 200 * this.aspect_ratio + "px" } ) );
      }
    display( context, program_state )
      { program_state.lights = this.lights;        // Use the lights stored in this.lights.
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        if( !context.scratchpad.controls ) 
        { this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 
          program_state.set_camera( Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, .5, 500 );
        }

            // Update persistent matrix state:
        this.cube_1.post_multiply( Mat4.rotation( this.spin * dt * 30 / 60 * 2*Math.PI, [ 1,0,0 ] ) );
        this.cube_2.post_multiply( Mat4.rotation( this.spin * dt * 20 / 60 * 2*Math.PI, [ 0,1,0 ] ) );

                      // Perform two rendering passes.  The first one we erase and don't display after using to it generate our texture.
            // Draw Scene 1:
        this.shapes.box.draw( context, program_state, this.cube_1, this.materials.a );

        this.scratchpad_context.drawImage( context.canvas, 0, 0, 256, 256 );
        this.texture.image.src = this.result_img.src = this.scratchpad.toDataURL("image/png");
        if( this.skipped_first_frame )  // Don't call copy to GPU until the event loop has had a chance to act on our SRC setting once.            
            this.texture.copy_onto_graphics_card( context.context, false );     // Update the texture with the current scene.
        this.skipped_first_frame = true;
        context.context.clear( context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

            // Draw Scene 2:
        this.shapes.box  .draw( context, program_state, this.cube_1, this.materials.a );
        this.shapes.box_2.draw( context, program_state, this.cube_2, this.materials.b );
      }
  }