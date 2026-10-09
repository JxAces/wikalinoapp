/** Shared geometry and gameplay coordinates: a clear promenade through each story. */
export const STORY_ROUTE_HALF_WIDTH = 1.7;
export const STORY_ROUTE_START_Z = 22.4;
export const STORY_ROUTE_END_Z = -15.2;
// The return gate is behind the initial chase camera (z=19.4), not between
// the camera and the player. Its wider paved landing leaves the stone rim clear.
export const STORY_ROUTE_RETURN = {x:0,z:21.4};
const BENDS = [[STORY_ROUTE_START_Z,0],[14.4,0],[8,-.45],[1,.7],[-6,-.65],[-12,.35],[-15.2,0]] as const;

export function storyRouteHalfWidth(z:number) {
  return STORY_ROUTE_HALF_WIDTH+Math.max(0,Math.min(1,(z-18.8)/1.8))*.65;
}

export function storyRouteX(z:number) {
  for(let i=1;i<BENDS.length;i++) {
    const [az,ax]=BENDS[i-1],[bz,bx]=BENDS[i];
    if(z>=bz) {
      const t=Math.max(0,Math.min(1,(az-z)/(az-bz)));
      return ax+(bx-ax)*t*t*(3-2*t);
    }
  }
  return 0;
}
export const STORY_ROUTE_SCROLLS = [8,0,-8].map(z=>({x:storyRouteX(z),z}));
export const STORY_ROUTE_CHEST = {x:storyRouteX(-14),z:-14};
export const STORY_ROUTE_SAMPLES = Array.from({length:100},(_,i)=>{
  const z=STORY_ROUTE_START_Z+(STORY_ROUTE_END_Z-STORY_ROUTE_START_Z)*i/99;
  return [storyRouteX(z),z] as const;
});
/** Scenic bays open the edging so the player can inspect props on either side. */
export const STORY_ROUTE_BAYS = [8,2,-5,-10.2];
export function storyRouteBay(z:number) {return STORY_ROUTE_BAYS.some(bay=>Math.abs(z-bay)<1.25);}
export function storyRouteDistance(x:number,z:number) {return Math.abs(x-storyRouteX(z));}

export const STORY_AVENUE_TREES = [-1,1].flatMap(side=>[
  // Trees occupy gaps between the roadside displays, within the forward view.
  ...[12.8,5.5,-1.5,-8.5,-15.8].map((z,i)=>({x:side*(4.65+(i%2)*.25),z,scale:1.05+(i%3)*.07})),
  ...[10,1,-8,-19].map((z,i)=>({x:side*10,z,scale:1.1+(i%2)*.08})),
]);
